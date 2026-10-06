-- Curadoria pela Squad UGC: a empresa não vê a base nem escolhe creators.
-- * Convidar, contratar, recusar e enviar o produto: só admin (a marca manda os produtos para a Squad).
-- * A marca só enxerga os creators já contratados da campanha dela (função brand_squad, sem endereço/mensagem).
-- * Entrega passa primeiro pela Squad (squad_screen); só o que ela encaminha chega à marca para aprovar.
-- * Base de creators e métricas: só admin e o próprio creator.

-- ---------- avisos para o time Squad ----------
CREATE OR REPLACE FUNCTION public.squad_notify_admins(p_title text, p_body text, p_link text, p_campaign uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a uuid;
BEGIN
  FOR a IN SELECT auth_user_id FROM public.profiles WHERE role IN ('admin_master', 'admin') AND auth_user_id IS NOT NULL LOOP
    PERFORM public.squad_notify(a, p_title, p_body, p_link, p_campaign);
  END LOOP;
END $$;

-- ---------- base de creators fechada ----------
DROP POLICY IF EXISTS "Allow public read creators" ON public.creators;
DROP POLICY IF EXISTS "creators_read" ON public.creators;
CREATE POLICY "creators_read" ON public.creators FOR SELECT
  USING (public.squad_is_admin() OR (user_id IS NOT NULL AND user_id = public.squad_profile_id()));

DROP POLICY IF EXISTS "creator_metrics_read" ON public.creator_metrics;
CREATE POLICY "creator_metrics_read" ON public.creator_metrics FOR SELECT TO authenticated
  USING (public.squad_is_admin() OR creator_id = public.my_creator_id());

-- ---------- participantes: tabela só admin e o próprio creator ----------
DROP POLICY IF EXISTS "cc_read" ON public.campaign_creators;
DROP POLICY IF EXISTS "cc_owner_insert" ON public.campaign_creators;
DROP POLICY IF EXISTS "cc_owner_update" ON public.campaign_creators;
DROP POLICY IF EXISTS "cc_owner_delete" ON public.campaign_creators;
CREATE POLICY "cc_read" ON public.campaign_creators FOR SELECT TO authenticated
  USING (public.squad_is_admin() OR creator_id = public.my_creator_id());
CREATE POLICY "cc_owner_insert" ON public.campaign_creators FOR INSERT TO authenticated
  WITH CHECK (public.squad_is_admin() AND stage IN ('discovery', 'invited', 'screening'));
CREATE POLICY "cc_owner_update" ON public.campaign_creators FOR UPDATE TO authenticated
  USING (public.squad_is_admin()) WITH CHECK (public.squad_is_admin());
CREATE POLICY "cc_owner_delete" ON public.campaign_creators FOR DELETE TO authenticated
  USING (public.squad_is_admin() AND terms_accepted_at IS NULL);

-- a marca vê só os contratados da própria campanha, sem endereço, mensagem nem dados do repasse
CREATE OR REPLACE FUNCTION public.brand_squad(p_campaign uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', cc.id, 'campaign_id', cc.campaign_id, 'creator_id', cc.creator_id, 'stage', cc.stage, 'fee', cc.fee, 'hired_at', cc.hired_at,
      'payment_status', cc.payment_status, 'payment_amount', cc.payment_amount, 'squad_fee_amount', cc.squad_fee_amount,
      'brand_total', cc.brand_total, 'brand_due_at', cc.brand_due_at, 'brand_reported_at', cc.brand_reported_at,
      'brand_payment_note', cc.brand_payment_note, 'brand_proof_path', cc.brand_proof_path, 'brand_paid_at', cc.brand_paid_at,
      'payout_due_at', cc.payout_due_at, 'paid_at', cc.paid_at,
      'creator', jsonb_build_object('id', c.id, 'professional_name', c.professional_name, 'instagram', c.instagram, 'tiktok', c.tiktok,
        'instagram_followers', c.instagram_followers, 'tiktok_followers', c.tiktok_followers, 'engagement_rate', c.engagement_rate,
        'specialties', c.specialties, 'tags', c.tags, 'city', c.city, 'state', c.state)
    ) ORDER BY cc.hired_at), '[]'::jsonb)
  FROM public.campaign_creators cc JOIN public.creators c ON c.id = cc.creator_id
  WHERE cc.campaign_id = p_campaign AND public.can_manage_campaign(p_campaign)
    AND cc.hired_at IS NOT NULL AND cc.stage NOT IN ('rejected', 'cancelled');
$$;

-- ---------- seleção e envio: só a Squad ----------
CREATE OR REPLACE FUNCTION public.brand_invite(p_campaign uuid, p_creators uuid[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer; c public.campaigns;
BEGIN
  IF NOT public.squad_is_admin() THEN RAISE EXCEPTION 'A seleção de creators é feita pela Squad UGC.'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign;
  IF c.status NOT IN ('open', 'selecting', 'in_progress') THEN RAISE EXCEPTION 'Publique a campanha antes de convidar.'; END IF;
  WITH ins AS (
    INSERT INTO public.campaign_creators (campaign_id, creator_id, stage, status, invited_at, fee)
    SELECT p_campaign, x, 'invited', 'invited', now(), (c.compensation ->> 'fee')::numeric FROM unnest(p_creators) x
    ON CONFLICT (campaign_id, creator_id) DO NOTHING RETURNING creator_id)
  SELECT count(*) INTO n FROM (SELECT public.squad_notify(public.creator_auth_id(creator_id), 'Convite para campanha',
      c.title || ': veja as condições e responda.', '/creator/oportunidades', p_campaign) FROM ins) z;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.brand_participant(p_cc uuid, p_action text, p_note text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.campaign_creators; c public.campaigns; hired integer; nxt text;
BEGIN
  IF NOT public.squad_is_admin() THEN RAISE EXCEPTION 'A seleção de creators é feita pela Squad UGC.'; END IF;
  SELECT * INTO r FROM public.campaign_creators WHERE id = p_cc FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Participação não encontrada.'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = r.campaign_id;
  IF p_action = 'hire' THEN
    IF r.stage <> 'applied' THEN RETURN r.stage; END IF;
    IF r.terms_accepted_at IS NULL THEN RAISE EXCEPTION 'O creator ainda não aceitou as condições.'; END IF;
    SELECT count(*) INTO hired FROM public.campaign_creators WHERE campaign_id = r.campaign_id AND hired_at IS NOT NULL AND stage NOT IN ('rejected', 'cancelled');
    IF hired >= c.creator_slots THEN RAISE EXCEPTION 'Todas as % vagas já estão preenchidas.', c.creator_slots; END IF;
    nxt := CASE WHEN coalesce((c.compensation ->> 'product')::boolean, false) THEN 'shipping' ELSE 'producing' END;
    UPDATE public.campaign_creators SET stage = nxt, status = 'hired', hired_at = now(), updated_at = now() WHERE id = p_cc;
    UPDATE public.campaigns SET status = 'in_progress' WHERE id = c.id AND status IN ('open', 'selecting');
    PERFORM public.squad_notify(public.creator_auth_id(r.creator_id), 'Você foi contratado(a)!',
      c.title || CASE WHEN nxt = 'shipping' THEN ': informe o endereço para receber o produto.' ELSE ': já pode produzir o conteúdo.' END, '/creator/minhas-campanhas', c.id);
    PERFORM public.squad_notify(c.owner_id, 'Creator contratado pela Squad', c.title || ': mais um creator na sua campanha.', '/painel/campanhas', c.id);
    RETURN nxt;
  ELSIF p_action = 'reject' THEN
    IF r.hired_at IS NOT NULL THEN RAISE EXCEPTION 'Creator já contratado: use cancelar.'; END IF;
    UPDATE public.campaign_creators SET stage = 'rejected', status = 'rejected', updated_at = now() WHERE id = p_cc;
    PERFORM public.squad_notify(public.creator_auth_id(r.creator_id), 'Candidatura não selecionada', c.title, '/creator/minhas-campanhas', c.id);
    RETURN 'rejected';
  ELSIF p_action = 'shipped' THEN
    IF r.stage <> 'shipping' THEN RAISE EXCEPTION 'Este creator não está aguardando envio.'; END IF;
    UPDATE public.campaign_creators SET stage = 'producing', shipping_note = p_note, updated_at = now() WHERE id = p_cc;
    PERFORM public.squad_notify(public.creator_auth_id(r.creator_id), 'Produto enviado', coalesce('Rastreio: ' || p_note, c.title), '/creator/minhas-campanhas', c.id);
    RETURN 'producing';
  END IF;
  RAISE EXCEPTION 'Ação desconhecida: %', p_action;
END $$;

-- candidatura e endereço avisam a Squad (não a marca)
CREATE OR REPLACE FUNCTION public.creator_apply(p_campaign uuid, p_terms_version integer, p_message text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := public.my_creator_id(); c public.campaigns; cur public.campaign_creators;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Entre com sua conta de creator para se candidatar.'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign;
  IF c.id IS NULL OR c.status NOT IN ('open', 'selecting') THEN RAISE EXCEPTION 'Esta campanha não está recebendo candidaturas.'; END IF;
  IF p_terms_version IS DISTINCT FROM c.terms_version THEN RAISE EXCEPTION 'As condições foram atualizadas. Leia a versão nova antes de aceitar.'; END IF;
  SELECT * INTO cur FROM public.campaign_creators WHERE campaign_id = p_campaign AND creator_id = me;
  IF cur.id IS NOT NULL AND cur.stage NOT IN ('invited', 'discovery', 'screening') THEN RETURN cur.stage; END IF; -- já respondeu
  INSERT INTO public.campaign_creators (campaign_id, creator_id, stage, status, message, applied_at, fee,
      terms_version, terms_snapshot, terms_accepted_at, terms_accepted_by)
  VALUES (p_campaign, me, 'applied', 'applied', p_message, now(), (c.compensation ->> 'fee')::numeric,
      c.terms_version, public.campaign_terms(c), now(), auth.uid())
  ON CONFLICT (campaign_id, creator_id) DO UPDATE SET stage = 'applied', status = 'applied', message = excluded.message,
      applied_at = now(), terms_version = excluded.terms_version, terms_snapshot = excluded.terms_snapshot,
      terms_accepted_at = now(), terms_accepted_by = auth.uid(), updated_at = now();
  PERFORM public.squad_notify_admins('Nova candidatura', c.title || ': um creator aceitou as condições e quer participar.', '/painel/campanhas', p_campaign);
  RETURN 'applied';
END $$;

CREATE OR REPLACE FUNCTION public.creator_set_shipping(p_campaign uuid, p_shipping jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := public.my_creator_id(); c public.campaigns;
BEGIN
  UPDATE public.campaign_creators SET shipping = p_shipping, updated_at = now()
  WHERE campaign_id = p_campaign AND creator_id = me AND stage = 'shipping';
  IF NOT FOUND THEN RAISE EXCEPTION 'Nada a enviar nesta campanha.'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign;
  PERFORM public.squad_notify_admins('Endereço recebido', c.title || ': envie o produto ao creator.', '/painel/campanhas', p_campaign);
END $$;

-- ---------- entrega: Squad filtra antes da marca ----------
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS forwarded_at timestamptz; -- quando a Squad encaminhou à marca

CREATE OR REPLACE FUNCTION public.creator_submit(p_campaign uuid, p_file_path text, p_file_name text, p_mime text,
  p_post_url text DEFAULT NULL, p_caption text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := public.my_creator_id(); r public.campaign_creators; c public.campaigns; v integer;
BEGIN
  SELECT * INTO r FROM public.campaign_creators WHERE campaign_id = p_campaign AND creator_id = me FOR UPDATE;
  IF r.id IS NULL OR r.stage NOT IN ('producing', 'revision') THEN RAISE EXCEPTION 'Esta campanha não está aguardando entrega sua.'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign;
  IF coalesce(p_file_path, '') = '' AND coalesce(p_post_url, '') = '' THEN RAISE EXCEPTION 'Envie o arquivo do vídeo.'; END IF;
  IF coalesce((c.deliverables ->> 'must_publish')::boolean, false) AND coalesce(p_post_url, '') = '' AND c.intent <> 'conteudo_marca' THEN
    RAISE EXCEPTION 'Esta campanha exige o link do post publicado.';
  END IF;
  IF p_file_path IS NOT NULL AND split_part(p_file_path, '/', 1) <> p_campaign::text OR p_file_path IS NOT NULL AND split_part(p_file_path, '/', 2) <> me::text THEN
    RAISE EXCEPTION 'Arquivo fora da pasta desta campanha.';
  END IF;
  SELECT coalesce(max(version), 0) + 1 INTO v FROM public.contents WHERE campaign_id = p_campaign AND creator_id = me;
  -- sem prazo de aprovação automática até a Squad encaminhar à marca
  INSERT INTO public.contents (campaign_id, creator_id, content_type, media_url, published_url, caption, status, version, file_path, file_name, mime)
  VALUES (p_campaign, me, CASE WHEN p_file_path IS NULL THEN 'post' ELSE 'ugc' END, p_file_path, nullif(p_post_url, ''), p_caption, 'squad_review', v, p_file_path, p_file_name, p_mime);
  UPDATE public.campaign_creators SET stage = 'submitted', updated_at = now() WHERE id = r.id;
  PERFORM public.squad_notify_admins('Entrega para filtrar', c.title || ': versão ' || v || ' enviada. Encaminhe à marca ou peça ajuste.', '/painel/campanhas', p_campaign);
  RETURN v;
END $$;

-- Squad: encaminhar à marca (abre o prazo de revisão) ou pedir ajuste antes (não gasta as revisões da marca)
CREATE OR REPLACE FUNCTION public.squad_screen(p_content uuid, p_decision text, p_comment text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k public.contents; c public.campaigns; due timestamptz;
BEGIN
  IF NOT public.squad_is_admin() THEN RAISE EXCEPTION 'Só o time Squad UGC faz a triagem.'; END IF;
  SELECT * INTO k FROM public.contents WHERE id = p_content FOR UPDATE;
  IF k.id IS NULL THEN RAISE EXCEPTION 'Entrega não encontrada.'; END IF;
  IF k.status <> 'squad_review' THEN RETURN k.status; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = k.campaign_id;
  IF p_decision = 'forward' THEN
    due := public.add_business_days(now(), public.squad_setting('review_business_days')::integer);
    UPDATE public.contents SET status = 'reviewing', forwarded_at = now(), review_due_at = due WHERE id = k.id;
    PERFORM public.squad_notify(c.owner_id, 'Nova entrega para revisar', c.title || ': versão ' || k.version || ' aprovada pela Squad. Revise até '
      || to_char(due AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') || '; depois disso ela é aprovada automaticamente.', '/painel/campanhas', c.id);
    RETURN 'reviewing';
  ELSIF p_decision = 'revision' THEN
    IF coalesce(trim(p_comment), '') = '' THEN RAISE EXCEPTION 'Explique o que precisa ser ajustado.'; END IF;
    UPDATE public.contents SET status = 'revision_requested' WHERE id = k.id;
    UPDATE public.campaign_creators SET stage = 'revision', updated_at = now() WHERE campaign_id = k.campaign_id AND creator_id = k.creator_id;
    INSERT INTO public.content_reviews (content_id, author_name, author_role, comment, decision, author_id)
      VALUES (k.id, 'Squad UGC', 'squad', p_comment, 'squad_revision', auth.uid());
    PERFORM public.squad_notify(public.creator_auth_id(k.creator_id), 'Ajuste solicitado pela Squad', c.title || ': ' || p_comment, '/creator/minhas-campanhas', c.id);
    RETURN 'revision';
  END IF;
  RAISE EXCEPTION 'Decisão inválida.';
END $$;

-- marca só lê o que a Squad encaminhou
DROP POLICY IF EXISTS "contents_read" ON public.contents;
CREATE POLICY "contents_read" ON public.contents FOR SELECT TO authenticated
  USING (public.squad_is_admin() OR creator_id = public.my_creator_id() OR (forwarded_at IS NOT NULL AND public.owns_campaign(campaign_id)));
DROP POLICY IF EXISTS "reviews_read" ON public.content_reviews;
CREATE POLICY "reviews_read" ON public.content_reviews FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.contents c WHERE c.id = content_id AND (public.squad_is_admin() OR c.creator_id = public.my_creator_id()
    OR (c.forwarded_at IS NOT NULL AND public.owns_campaign(c.campaign_id)))));

-- arquivos: marca lê só os vídeos encaminhados e os próprios comprovantes
DROP POLICY IF EXISTS "campanhas_read" ON storage.objects;
CREATE POLICY "campanhas_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'campanhas' AND (public.squad_is_admin()
    OR (storage.foldername(name))[2] = public.my_creator_id()::text
    OR (public.owns_campaign(((storage.foldername(name))[1])::uuid) AND (
      name LIKE '%/pagamento-marca-%'
      OR EXISTS (SELECT 1 FROM public.contents k WHERE k.file_path = name AND k.forwarded_at IS NOT NULL)))));

REVOKE ALL ON FUNCTION public.brand_squad(uuid), public.squad_screen(uuid, text, text), public.squad_notify_admins(text, text, text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.brand_squad(uuid), public.squad_screen(uuid, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
