-- ==============================================================================
-- SQUAD UGC — fluxo completo da campanha no servidor (rodar 1x no SQL Editor, depois de 20261005)
-- Empresa (dono da campanha) ⇄ Creator ⇄ Admin com estados, aceite, entregas, revisões,
-- direitos de uso, pagamento manual e notificações internas. Seguro para rodar de novo.
--
-- Estados da campanha:  draft → open (publicada) → selecting → in_progress → completed | cancelled
-- Estados do creator:   invited → applied (aceitou as condições) → hired → shipping → producing
--                       → submitted → revision → approved → paid   (| rejected | cancelled)
-- Pagamento passa pela Squad (manual, fora do sistema): marca paga a Squad (cachê + taxa) → admin confirma → admin repassa ao creator.
-- ==============================================================================

-- ---------- campanha: dono, produto, entregas, remuneração, briefing, direitos ----------
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS owner_id uuid DEFAULT auth.uid();
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS client_ref uuid;            -- idempotência (clique duplo / rede)
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS intent text;                -- conteudo_marca | post_creator | comissao | live | seeding
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS product jsonb NOT NULL DEFAULT '{}'::jsonb;        -- {name,url,image_url,description,value}
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS deliverables jsonb NOT NULL DEFAULT '{}'::jsonb;   -- {per_creator,format,duration,must_publish,network,post_days,live_platform,live_minutes}
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS compensation jsonb NOT NULL DEFAULT '{}'::jsonb;   -- {fee,product,commission_pct,commission_base,tracking,payment_terms}
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS brief jsonb NOT NULL DEFAULT '{}'::jsonb;          -- {show,identify,deliver,references,restrictions,materials,technical}
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS usage_rights jsonb NOT NULL DEFAULT '{}'::jsonb;   -- {organic,brand_ads,creator_ads,months}
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS hashtag text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS coupon text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS selection_deadline date;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS delivery_deadline date;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS revisions_included integer NOT NULL DEFAULT 1;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS terms_version integer NOT NULL DEFAULT 1;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false; -- dados de teste nunca aparecem como reais
CREATE UNIQUE INDEX IF NOT EXISTS campaigns_client_ref_key ON public.campaigns (client_ref); -- NULLs não colidem
CREATE INDEX IF NOT EXISTS campaigns_owner_idx ON public.campaigns (owner_id);
ALTER TABLE public.campaigns ALTER COLUMN status SET DEFAULT 'draft';

-- ---------- helpers de identidade ----------
CREATE OR REPLACE FUNCTION public.squad_profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid() LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.squad_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.role FROM public.profiles p WHERE p.auth_user_id = auth.uid() LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.squad_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(public.squad_role() IN ('admin_master', 'admin'), false);
$$;
CREATE OR REPLACE FUNCTION public.squad_is_brand()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(public.squad_role() IN ('brand_admin', 'brand', 'manager', 'admin_master', 'admin'), false);
$$;
-- creator do usuário logado (creators.user_id → profiles.id)
CREATE OR REPLACE FUNCTION public.my_creator_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id FROM public.creators c WHERE c.user_id = public.squad_profile_id() LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.owns_campaign(p_campaign uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = p_campaign AND c.owner_id = auth.uid());
$$;
CREATE OR REPLACE FUNCTION public.can_manage_campaign(p_campaign uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.squad_is_admin() OR public.owns_campaign(p_campaign);
$$;

-- condições mudaram depois de publicada → nova versão (aceites antigos continuam com a versão deles)
CREATE OR REPLACE FUNCTION public.campaign_terms_bump()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> 'draft' AND (NEW.compensation IS DISTINCT FROM OLD.compensation OR NEW.deliverables IS DISTINCT FROM OLD.deliverables
     OR NEW.usage_rights IS DISTINCT FROM OLD.usage_rights OR NEW.revisions_included IS DISTINCT FROM OLD.revisions_included
     OR NEW.delivery_deadline IS DISTINCT FROM OLD.delivery_deadline) THEN
    NEW.terms_version := OLD.terms_version + 1;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS campaigns_terms_bump ON public.campaigns;
CREATE TRIGGER campaigns_terms_bump BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.campaign_terms_bump();

-- ---------- participação do creator ----------
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS fee numeric(10,2);
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS invited_at timestamptz;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS applied_at timestamptz;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS hired_at timestamptz;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS terms_version integer;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS terms_snapshot jsonb;      -- o que o creator aceitou, congelado
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS terms_accepted_by uuid;    -- auth.uid() de quem aceitou
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS shipping jsonb;            -- endereço (privado: marca dona, creator e admin)
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS shipping_note text;        -- rastreio informado pela marca
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'nao_devido'; -- nao_devido | aguardando_marca | recebido | repassado
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS payment_amount numeric(10,2);
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS payment_note text;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS payment_proof_path text;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS paid_by uuid;

-- ---------- entregas com versões ----------
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS file_path text;      -- arquivo original no storage (bucket campanhas)
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS mime text;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS rights_until date;   -- fim da autorização de uso deste arquivo
ALTER TABLE public.contents ALTER COLUMN media_url DROP NOT NULL;
ALTER TABLE public.content_reviews ADD COLUMN IF NOT EXISTS decision text NOT NULL DEFAULT 'comment'; -- comment | revision | approved
ALTER TABLE public.content_reviews ADD COLUMN IF NOT EXISTS author_id uuid;

-- ---------- notificações internas (nenhum e-mail é enviado) ----------
CREATE TABLE IF NOT EXISTS public.squad_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,             -- auth.uid() do destinatário
  title text NOT NULL,
  body text,
  link text,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS squad_notifications_user_idx ON public.squad_notifications (user_id, created_at DESC);
ALTER TABLE public.squad_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_own_read" ON public.squad_notifications;
CREATE POLICY "notif_own_read" ON public.squad_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notif_own_update" ON public.squad_notifications;
CREATE POLICY "notif_own_update" ON public.squad_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, UPDATE (read_at) ON public.squad_notifications TO authenticated;

CREATE OR REPLACE FUNCTION public.squad_notify(p_user uuid, p_title text, p_body text, p_link text, p_campaign uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.squad_notifications (user_id, title, body, link, campaign_id)
  SELECT p_user, p_title, p_body, p_link, p_campaign WHERE p_user IS NOT NULL;
$$;
-- auth.uid() do creator (se ele tiver conta)
CREATE OR REPLACE FUNCTION public.creator_auth_id(p_creator uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.auth_user_id FROM public.creators c JOIN public.profiles p ON p.id = c.user_id WHERE c.id = p_creator;
$$;

-- ---------- leitura (RLS) ----------
DROP POLICY IF EXISTS "Allow public read campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_member_write" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_read" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_insert" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_manage" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_delete" ON public.campaigns;
-- publicada é pública (home, creators); rascunho só dono/admin; teste só para quem está logado
CREATE POLICY "campaigns_read" ON public.campaigns FOR SELECT USING (
  owner_id = auth.uid() OR public.squad_is_admin() OR (status <> 'draft' AND (NOT is_test OR auth.uid() IS NOT NULL)));
CREATE POLICY "campaigns_insert" ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (public.squad_is_brand() AND owner_id = auth.uid());
CREATE POLICY "campaigns_manage" ON public.campaigns FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.squad_is_admin()) WITH CHECK (owner_id = auth.uid() OR public.squad_is_admin());
CREATE POLICY "campaigns_delete" ON public.campaigns FOR DELETE TO authenticated
  USING ((owner_id = auth.uid() AND status = 'draft') OR public.squad_is_admin());
-- status e versão das condições só mudam pelas funções (publicar, contratar…)
REVOKE UPDATE ON public.campaigns FROM anon, authenticated;
GRANT UPDATE (title, slug, description, objective, campaign_type, cover_url, start_date, end_date, application_deadline,
  creator_slots, budget, commission_type, commission_value, requirements_text, deliverables_text, intent, product,
  deliverables, compensation, brief, usage_rights, hashtag, coupon, selection_deadline, delivery_deadline,
  revisions_included, updated_at) ON public.campaigns TO authenticated;

DROP POLICY IF EXISTS "Allow public read campaign_creators" ON public.campaign_creators;
DROP POLICY IF EXISTS "campaign_creators_member_write" ON public.campaign_creators;
DROP POLICY IF EXISTS "cc_read" ON public.campaign_creators;
DROP POLICY IF EXISTS "cc_owner_insert" ON public.campaign_creators;
DROP POLICY IF EXISTS "cc_owner_update" ON public.campaign_creators;
DROP POLICY IF EXISTS "cc_owner_delete" ON public.campaign_creators;
CREATE POLICY "cc_read" ON public.campaign_creators FOR SELECT TO authenticated
  USING (public.can_manage_campaign(campaign_id) OR creator_id = public.my_creator_id());
-- a marca monta o pipeline (convite/triagem); aceite, entrega e pagamento só pelas funções
CREATE POLICY "cc_owner_insert" ON public.campaign_creators FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_campaign(campaign_id) AND stage IN ('discovery', 'invited', 'screening'));
CREATE POLICY "cc_owner_update" ON public.campaign_creators FOR UPDATE TO authenticated
  USING (public.can_manage_campaign(campaign_id)) WITH CHECK (public.can_manage_campaign(campaign_id));
CREATE POLICY "cc_owner_delete" ON public.campaign_creators FOR DELETE TO authenticated
  USING (public.can_manage_campaign(campaign_id) AND terms_accepted_at IS NULL);
REVOKE UPDATE ON public.campaign_creators FROM anon, authenticated;
GRANT UPDATE (notes, fee, operational_score, updated_at) ON public.campaign_creators TO authenticated;
REVOKE SELECT ON public.campaign_creators FROM anon;

DROP POLICY IF EXISTS "Allow public read contents" ON public.contents;
DROP POLICY IF EXISTS "contents_member_write" ON public.contents;
DROP POLICY IF EXISTS "contents_read" ON public.contents;
CREATE POLICY "contents_read" ON public.contents FOR SELECT TO authenticated
  USING (public.can_manage_campaign(campaign_id) OR creator_id = public.my_creator_id());
REVOKE INSERT, UPDATE, DELETE ON public.contents FROM anon, authenticated;
REVOKE SELECT ON public.contents FROM anon;

DROP POLICY IF EXISTS "Allow public read content_reviews" ON public.content_reviews;
DROP POLICY IF EXISTS "content_reviews_member_write" ON public.content_reviews;
DROP POLICY IF EXISTS "reviews_read" ON public.content_reviews;
CREATE POLICY "reviews_read" ON public.content_reviews FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.contents c WHERE c.id = content_id AND (public.can_manage_campaign(c.campaign_id) OR c.creator_id = public.my_creator_id())));
REVOKE INSERT, UPDATE, DELETE ON public.content_reviews FROM anon, authenticated;
REVOKE SELECT ON public.content_reviews FROM anon;

DROP POLICY IF EXISTS "Allow public read shipments" ON public.shipments;
DROP POLICY IF EXISTS "shipments_member_write" ON public.shipments;
REVOKE ALL ON public.shipments FROM anon;

-- ---------- regras da Squad (ajustáveis pelo admin; nada de número escondido no código) ----------
CREATE TABLE IF NOT EXISTS public.squad_settings (key text PRIMARY KEY, value numeric NOT NULL, label text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO public.squad_settings (key, value, label) VALUES
  ('fee_pct', 15, 'Taxa da Squad UGC (% sobre o cachê aprovado)'),
  ('review_business_days', 5, 'Dias úteis para a marca revisar; depois aprova automaticamente'),
  ('brand_payment_days', 7, 'Dias corridos para a marca pagar a Squad após a aprovação'),
  ('payout_business_days', 5, 'Dias úteis para a Squad repassar ao creator após receber da marca')
ON CONFLICT (key) DO NOTHING;
ALTER TABLE public.squad_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_read" ON public.squad_settings;
CREATE POLICY "settings_read" ON public.squad_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "settings_admin" ON public.squad_settings;
CREATE POLICY "settings_admin" ON public.squad_settings FOR UPDATE TO authenticated USING (public.squad_is_admin()) WITH CHECK (public.squad_is_admin());
REVOKE INSERT, DELETE ON public.squad_settings FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.squad_setting(p_key text)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT value FROM public.squad_settings WHERE key = p_key $$;

-- dias úteis (seg–sex; feriados não são considerados)
CREATE OR REPLACE FUNCTION public.add_business_days(p_from timestamptz, p_days integer)
RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE d timestamptz := p_from; n integer := 0;
BEGIN
  WHILE n < p_days LOOP
    d := d + interval '1 day';
    IF extract(isodow FROM d) < 6 THEN n := n + 1; END IF;
  END LOOP;
  RETURN d;
END $$;

-- ---------- ações (máquina de estados no servidor) ----------
CREATE OR REPLACE FUNCTION public.campaign_publish(p_campaign uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.campaigns;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign FOR UPDATE;
  IF c.id IS NULL OR NOT public.can_manage_campaign(p_campaign) THEN RAISE EXCEPTION 'Campanha não encontrada.'; END IF;
  IF c.status <> 'draft' THEN RETURN c.status; END IF;  -- clique repetido não republica
  IF coalesce(length(trim(c.title)), 0) < 3 THEN RAISE EXCEPTION 'Dê um nome à campanha.'; END IF;
  IF coalesce(c.product ->> 'name', '') = '' THEN RAISE EXCEPTION 'Informe o produto da campanha.'; END IF;
  IF c.creator_slots < 1 THEN RAISE EXCEPTION 'Informe quantos creators você quer.'; END IF;
  IF coalesce(c.brief ->> 'show', '') = '' THEN RAISE EXCEPTION 'Escreva o que o creator deve mostrar ou falar.'; END IF;
  IF coalesce((c.compensation ->> 'fee')::numeric, 0) <= 0 AND NOT coalesce((c.compensation ->> 'product')::boolean, false)
     AND coalesce((c.compensation ->> 'commission_pct')::numeric, 0) <= 0 THEN
    RAISE EXCEPTION 'Defina a remuneração: cachê, produto ou comissão.';
  END IF;
  IF coalesce((c.compensation ->> 'commission_pct')::numeric, 0) > 0 AND coalesce(c.compensation ->> 'payment_terms', '') = '' THEN
    RAISE EXCEPTION 'Explique quando e como a comissão é paga.';
  END IF;
  UPDATE public.campaigns SET status = 'open', published_at = now(), squad_fee_pct = public.squad_setting('fee_pct') WHERE id = p_campaign;
  RETURN 'open';
END $$;

-- fechar candidaturas / concluir / cancelar
CREATE OR REPLACE FUNCTION public.campaign_set_status(p_campaign uuid, p_status text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur text;
BEGIN
  IF NOT public.can_manage_campaign(p_campaign) THEN RAISE EXCEPTION 'Sem permissão.'; END IF;
  SELECT status INTO cur FROM public.campaigns WHERE id = p_campaign;
  IF NOT ((cur IN ('open', 'selecting', 'in_progress') AND p_status IN ('selecting', 'in_progress', 'completed', 'cancelled'))
       OR (cur = 'draft' AND p_status = 'cancelled')) THEN
    RAISE EXCEPTION 'Mudança de estado inválida (% → %).', cur, p_status;
  END IF;
  UPDATE public.campaigns SET status = p_status WHERE id = p_campaign;
  RETURN p_status;
END $$;

CREATE OR REPLACE FUNCTION public.campaign_terms(c public.campaigns)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object('version', c.terms_version, 'product', c.product, 'deliverables', c.deliverables,
    'compensation', c.compensation, 'usage_rights', c.usage_rights, 'revisions_included', c.revisions_included,
    'delivery_deadline', c.delivery_deadline, 'brief', c.brief, 'hashtag', c.hashtag, 'coupon', c.coupon,
    'review_business_days', public.squad_setting('review_business_days'), 'payout_business_days', public.squad_setting('payout_business_days'),
    'payment_flow', 'A marca paga a Squad UGC; a Squad repassa o cachê ao creator.');
$$;

-- marca convida creators mapeados (só registro interno: nenhum convite é enviado por e-mail)
CREATE OR REPLACE FUNCTION public.brand_invite(p_campaign uuid, p_creators uuid[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer; c public.campaigns;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign;
  IF NOT public.can_manage_campaign(p_campaign) THEN RAISE EXCEPTION 'Sem permissão.'; END IF;
  IF c.status NOT IN ('open', 'selecting', 'in_progress') THEN RAISE EXCEPTION 'Publique a campanha antes de convidar.'; END IF;
  WITH ins AS (
    INSERT INTO public.campaign_creators (campaign_id, creator_id, stage, status, invited_at, fee)
    SELECT p_campaign, x, 'invited', 'invited', now(), (c.compensation ->> 'fee')::numeric FROM unnest(p_creators) x
    ON CONFLICT (campaign_id, creator_id) DO NOTHING RETURNING creator_id)
  SELECT count(*) INTO n FROM (SELECT public.squad_notify(public.creator_auth_id(creator_id), 'Convite para campanha',
      c.title || ': veja as condições e responda.', '/creator/oportunidades', p_campaign) FROM ins) z;
  RETURN n;
END $$;

-- creator se candidata / aceita convite: registra o aceite das condições da versão atual
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
  PERFORM public.squad_notify(c.owner_id, 'Nova candidatura', c.title || ': um creator aceitou as condições e quer participar.', '/painel/campanhas', p_campaign);
  RETURN 'applied';
END $$;

-- marca contrata / recusa / informa envio do produto
CREATE OR REPLACE FUNCTION public.brand_participant(p_cc uuid, p_action text, p_note text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.campaign_creators; c public.campaigns; hired integer; nxt text;
BEGIN
  SELECT * INTO r FROM public.campaign_creators WHERE id = p_cc FOR UPDATE;
  IF r.id IS NULL OR NOT public.can_manage_campaign(r.campaign_id) THEN RAISE EXCEPTION 'Sem permissão.'; END IF;
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

-- creator informa endereço (só quando a campanha envia produto)
CREATE OR REPLACE FUNCTION public.creator_set_shipping(p_campaign uuid, p_shipping jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := public.my_creator_id(); c public.campaigns;
BEGIN
  UPDATE public.campaign_creators SET shipping = p_shipping, updated_at = now()
  WHERE campaign_id = p_campaign AND creator_id = me AND stage = 'shipping';
  IF NOT FOUND THEN RAISE EXCEPTION 'Nada a enviar nesta campanha.'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign;
  PERFORM public.squad_notify(c.owner_id, 'Endereço recebido', c.title || ': envie o produto ao creator.', '/painel/campanhas', p_campaign);
END $$;

-- pagamento passa pela Squad: marca paga a Squad (cachê + taxa) → Squad confirma → Squad repassa ao creator
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS squad_fee_pct numeric(5,2);           -- congelada na publicação
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS review_due_at timestamptz;             -- depois disso aprova sozinho
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS auto_approved boolean NOT NULL DEFAULT false;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS squad_fee_amount numeric(10,2);
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS brand_total numeric(10,2);    -- cachê + taxa (cobrado da marca)
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS brand_due_at timestamptz;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS brand_reported_at timestamptz; -- marca disse que pagou
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS brand_payment_note text;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS brand_proof_path text;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS brand_paid_at timestamptz;     -- Squad confirmou o recebimento
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS payout_due_at timestamptz;
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS overdue_notified_at timestamptz;
-- payment_status: nao_devido | aguardando_marca | recebido (Squad recebeu) | repassado (creator recebeu)

-- creator entrega (arquivo original e/ou link do post); nova versão nunca apaga a anterior
CREATE OR REPLACE FUNCTION public.creator_submit(p_campaign uuid, p_file_path text, p_file_name text, p_mime text,
  p_post_url text DEFAULT NULL, p_caption text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := public.my_creator_id(); r public.campaign_creators; c public.campaigns; v integer; due timestamptz;
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
  due := public.add_business_days(now(), public.squad_setting('review_business_days')::integer);
  INSERT INTO public.contents (campaign_id, creator_id, content_type, media_url, published_url, caption, status, version, file_path, file_name, mime, review_due_at)
  VALUES (p_campaign, me, CASE WHEN p_file_path IS NULL THEN 'post' ELSE 'ugc' END, p_file_path, nullif(p_post_url, ''), p_caption, 'reviewing', v, p_file_path, p_file_name, p_mime, due);
  UPDATE public.campaign_creators SET stage = 'submitted', updated_at = now() WHERE id = r.id;
  PERFORM public.squad_notify(c.owner_id, 'Nova entrega para revisar', c.title || ': versão ' || v || ' enviada. Revise até '
    || to_char(due AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') || '; depois disso ela é aprovada automaticamente.', '/painel/campanhas', p_campaign);
  RETURN v;
END $$;

-- aprovação (pela marca ou automática): direitos começam a contar e a Squad cobra a marca
CREATE OR REPLACE FUNCTION public.squad_approve_content(p_content uuid, p_comment text, p_auto boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k public.contents; c public.campaigns; r public.campaign_creators; months integer; v_fee numeric; v_pct numeric; v_tax numeric; v_due timestamptz;
BEGIN
  SELECT * INTO k FROM public.contents WHERE id = p_content FOR UPDATE;
  IF k.status <> 'reviewing' THEN RETURN k.status; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = k.campaign_id;
  SELECT * INTO r FROM public.campaign_creators WHERE campaign_id = k.campaign_id AND creator_id = k.creator_id FOR UPDATE;
  months := coalesce((r.terms_snapshot -> 'usage_rights' ->> 'months')::integer, (c.usage_rights ->> 'months')::integer, 0);
  UPDATE public.contents SET status = 'approved', approved_at = now(), auto_approved = p_auto,
    rights_until = CASE WHEN months > 0 THEN (now() + make_interval(months => months))::date END WHERE id = k.id;
  INSERT INTO public.content_reviews (content_id, author_name, author_role, comment, decision, author_id)
    VALUES (k.id, CASE WHEN p_auto THEN 'Squad UGC' ELSE 'Marca' END, CASE WHEN p_auto THEN 'system' ELSE 'brand' END, p_comment, 'approved', auth.uid());
  v_fee := coalesce(r.fee, (c.compensation ->> 'fee')::numeric, 0);
  v_pct := coalesce(c.squad_fee_pct, public.squad_setting('fee_pct'), 0);
  v_tax := round(v_fee * v_pct / 100, 2);
  v_due := now() + make_interval(days => public.squad_setting('brand_payment_days')::integer);
  UPDATE public.campaign_creators SET stage = 'approved', updated_at = now(), payment_amount = v_fee,
    squad_fee_amount = CASE WHEN v_fee > 0 THEN v_tax END, brand_total = CASE WHEN v_fee > 0 THEN v_fee + v_tax END,
    brand_due_at = CASE WHEN v_fee > 0 THEN v_due END,
    payment_status = CASE WHEN v_fee > 0 THEN 'aguardando_marca' ELSE 'nao_devido' END
    WHERE id = r.id;
  PERFORM public.squad_notify(public.creator_auth_id(k.creator_id), 'Entrega aprovada' || CASE WHEN p_auto THEN ' (prazo de revisão encerrado)' ELSE '' END,
    c.title || CASE WHEN v_fee > 0 THEN ': a Squad repassa seu cachê depois de receber da marca.' ELSE ': conteúdo aprovado.' END, '/creator/ganhos', c.id);
  IF v_fee > 0 THEN
    PERFORM public.squad_notify(c.owner_id, 'Pagamento a fazer à Squad UGC',
      c.title || ': R$ ' || to_char(v_fee + v_tax, 'FM999999990.00') || ' (cachê + taxa de ' || v_pct || '%) até ' || to_char(v_due AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') || '.', '/painel/campanhas', c.id);
  END IF;
  RETURN 'approved';
END $$;

-- marca revisa: pedir ajuste (com motivo, dentro das revisões incluídas) ou aprovar
CREATE OR REPLACE FUNCTION public.brand_review(p_content uuid, p_decision text, p_comment text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k public.contents; c public.campaigns; used integer;
BEGIN
  SELECT * INTO k FROM public.contents WHERE id = p_content FOR UPDATE;
  IF k.id IS NULL OR NOT public.can_manage_campaign(k.campaign_id) THEN RAISE EXCEPTION 'Sem permissão.'; END IF;
  IF k.status <> 'reviewing' THEN RETURN k.status; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = k.campaign_id;
  IF p_decision = 'revision' THEN
    IF coalesce(trim(p_comment), '') = '' THEN RAISE EXCEPTION 'Explique o que precisa ser ajustado.'; END IF;
    SELECT count(*) INTO used FROM public.content_reviews cr JOIN public.contents x ON x.id = cr.content_id
      WHERE x.campaign_id = k.campaign_id AND x.creator_id = k.creator_id AND cr.decision = 'revision';
    IF used >= c.revisions_included THEN RAISE EXCEPTION 'As % revisões incluídas já foram usadas. Aprove ou combine uma revisão extra.', c.revisions_included; END IF;
    UPDATE public.contents SET status = 'revision_requested' WHERE id = k.id;
    UPDATE public.campaign_creators SET stage = 'revision', updated_at = now() WHERE campaign_id = k.campaign_id AND creator_id = k.creator_id;
    INSERT INTO public.content_reviews (content_id, author_name, author_role, comment, decision, author_id)
      VALUES (k.id, 'Marca', 'brand', p_comment, 'revision', auth.uid());
    PERFORM public.squad_notify(public.creator_auth_id(k.creator_id), 'Ajuste solicitado', c.title || ': ' || p_comment, '/creator/minhas-campanhas', c.id);
    RETURN 'revision';
  ELSIF p_decision = 'approved' THEN
    RETURN public.squad_approve_content(k.id, coalesce(nullif(trim(p_comment), ''), 'Aprovado.'), false);
  END IF;
  RAISE EXCEPTION 'Decisão inválida.';
END $$;

-- marca avisa que pagou a Squad (referência + comprovante); quem confirma é o admin
CREATE OR REPLACE FUNCTION public.brand_report_payment(p_cc uuid, p_note text, p_proof_path text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.campaign_creators; c public.campaigns; a uuid;
BEGIN
  SELECT * INTO r FROM public.campaign_creators WHERE id = p_cc FOR UPDATE;
  IF r.id IS NULL OR NOT public.can_manage_campaign(r.campaign_id) THEN RAISE EXCEPTION 'Sem permissão.'; END IF;
  IF r.payment_status <> 'aguardando_marca' THEN RAISE EXCEPTION 'Não há pagamento em aberto para este creator.'; END IF;
  IF coalesce(trim(p_note), '') = '' THEN RAISE EXCEPTION 'Informe a referência do pagamento (ex.: PIX em 05/10, ID E123…).'; END IF;
  UPDATE public.campaign_creators SET brand_reported_at = now(), brand_payment_note = p_note, brand_proof_path = coalesce(p_proof_path, brand_proof_path), updated_at = now() WHERE id = p_cc;
  SELECT * INTO c FROM public.campaigns WHERE id = r.campaign_id;
  FOR a IN SELECT auth_user_id FROM public.profiles WHERE role IN ('admin_master', 'admin') AND auth_user_id IS NOT NULL LOOP
    PERFORM public.squad_notify(a, 'Marca informou pagamento', c.title || ': ' || p_note || '. Confirme o recebimento.', '/painel/campanhas', c.id);
  END LOOP;
  RETURN 'informado';
END $$;

-- admin: confirma que a Squad recebeu da marca (abre o prazo de repasse) e registra o repasse ao creator
CREATE OR REPLACE FUNCTION public.admin_payment(p_cc uuid, p_action text, p_note text DEFAULT NULL, p_proof_path text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.campaign_creators; c public.campaigns; due timestamptz;
BEGIN
  IF NOT public.squad_is_admin() THEN RAISE EXCEPTION 'Só o time Squad UGC confirma pagamentos.'; END IF;
  SELECT * INTO r FROM public.campaign_creators WHERE id = p_cc FOR UPDATE;
  SELECT * INTO c FROM public.campaigns WHERE id = r.campaign_id;
  IF p_action = 'received' THEN
    IF r.payment_status IN ('recebido', 'repassado') THEN RETURN r.payment_status; END IF;
    IF r.payment_status <> 'aguardando_marca' THEN RAISE EXCEPTION 'Nada a receber da marca.'; END IF;
    due := public.add_business_days(now(), public.squad_setting('payout_business_days')::integer);
    UPDATE public.campaign_creators SET payment_status = 'recebido', brand_paid_at = now(), payout_due_at = due,
      brand_payment_note = coalesce(nullif(trim(p_note), ''), brand_payment_note), updated_at = now() WHERE id = p_cc;
    PERFORM public.squad_notify(c.owner_id, 'Pagamento recebido pela Squad', c.title || ': o creator será pago até ' || to_char(due AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') || '.', '/painel/campanhas', c.id);
    PERFORM public.squad_notify(public.creator_auth_id(r.creator_id), 'A marca pagou: seu repasse está a caminho',
      c.title || ': a Squad repassa seu cachê até ' || to_char(due AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') || '.', '/creator/ganhos', c.id);
    RETURN 'recebido';
  ELSIF p_action = 'payout' THEN
    IF r.payment_status = 'repassado' THEN RETURN 'repassado'; END IF;
    IF r.payment_status <> 'recebido' THEN RAISE EXCEPTION 'Confirme primeiro o recebimento da marca.'; END IF;
    IF coalesce(trim(p_note), '') = '' THEN RAISE EXCEPTION 'Informe a referência do repasse (ex.: PIX ID E123…).'; END IF;
    UPDATE public.campaign_creators SET payment_status = 'repassado', paid_at = now(), paid_by = auth.uid(), payment_note = p_note,
      payment_proof_path = p_proof_path, stage = 'paid', updated_at = now() WHERE id = p_cc;
    PERFORM public.squad_notify(public.creator_auth_id(r.creator_id), 'Cachê pago pela Squad', c.title || ': ' || p_note || '. Confira na sua conta.', '/creator/ganhos', c.id);
    PERFORM public.squad_notify(c.owner_id, 'Creator pago', c.title || ': repasse feito pela Squad.', '/painel/campanhas', c.id);
    RETURN 'repassado';
  END IF;
  RAISE EXCEPTION 'Ação inválida.';
END $$;

-- prazos: aprova entregas não revisadas e avisa de cobranças em atraso (idempotente).
-- Roda quando alguém abre o painel e, se o pg_cron existir, a cada hora.
CREATE OR REPLACE FUNCTION public.squad_run_deadlines()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k record; r record; a uuid; n integer := 0;
BEGIN
  FOR k IN SELECT id FROM public.contents WHERE status = 'reviewing' AND review_due_at < now() LOOP
    PERFORM public.squad_approve_content(k.id, 'Aprovado automaticamente: o prazo de revisão de ' || public.squad_setting('review_business_days') || ' dias úteis terminou sem resposta da marca.', true);
    n := n + 1;
  END LOOP;
  FOR r IN SELECT cc.id, cc.brand_total, c.title, c.id AS cid, c.owner_id FROM public.campaign_creators cc JOIN public.campaigns c ON c.id = cc.campaign_id
           WHERE cc.payment_status = 'aguardando_marca' AND cc.brand_due_at < now() AND cc.overdue_notified_at IS NULL LOOP
    UPDATE public.campaign_creators SET overdue_notified_at = now() WHERE id = r.id;
    PERFORM public.squad_notify(r.owner_id, 'Pagamento em atraso', r.title || ': o prazo para pagar a Squad venceu.', '/painel/campanhas', r.cid);
    FOR a IN SELECT auth_user_id FROM public.profiles WHERE role IN ('admin_master', 'admin') AND auth_user_id IS NOT NULL LOOP
      PERFORM public.squad_notify(a, 'Cobrança em atraso', r.title || ': R$ ' || to_char(r.brand_total, 'FM999999990.00') || ' não pago no prazo.', '/painel/campanhas', r.cid);
    END LOOP;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('squad-deadlines', '7 * * * *', 'select public.squad_run_deadlines()');
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pg_cron indisponível: prazos rodam ao abrir o painel (%).', SQLERRM;
END $$;

DROP FUNCTION IF EXISTS public.brand_mark_paid(uuid, text, text);
REVOKE ALL ON FUNCTION public.campaign_publish(uuid), public.campaign_set_status(uuid, text), public.brand_invite(uuid, uuid[]),
  public.creator_apply(uuid, integer, text), public.brand_participant(uuid, text, text), public.creator_set_shipping(uuid, jsonb),
  public.creator_submit(uuid, text, text, text, text, text), public.brand_review(uuid, text, text),
  public.brand_report_payment(uuid, text, text), public.admin_payment(uuid, text, text, text), public.squad_run_deadlines(),
  public.squad_approve_content(uuid, text, boolean), public.squad_notify(uuid, text, text, text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.campaign_publish(uuid), public.campaign_set_status(uuid, text), public.brand_invite(uuid, uuid[]),
  public.creator_apply(uuid, integer, text), public.brand_participant(uuid, text, text), public.creator_set_shipping(uuid, jsonb),
  public.creator_submit(uuid, text, text, text, text, text), public.brand_review(uuid, text, text),
  public.brand_report_payment(uuid, text, text), public.admin_payment(uuid, text, text, text), public.squad_run_deadlines(),
  public.my_creator_id(), public.squad_role(), public.squad_setting(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.squad_setting(text) TO anon;

-- ---------- storage privado dos arquivos: campanhas/<campaign_id>/<creator_id>/arquivo ----------
INSERT INTO storage.buckets (id, name, public) VALUES ('campanhas', 'campanhas', false) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "campanhas_upload" ON storage.objects;
DROP POLICY IF EXISTS "campanhas_read" ON storage.objects;
CREATE POLICY "campanhas_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'campanhas' AND (
    ((storage.foldername(name))[2] = public.my_creator_id()::text AND EXISTS (SELECT 1 FROM public.campaign_creators cc
       WHERE cc.campaign_id::text = (storage.foldername(name))[1] AND cc.creator_id = public.my_creator_id() AND cc.stage IN ('producing', 'revision')))
    OR public.can_manage_campaign(((storage.foldername(name))[1])::uuid)));
CREATE POLICY "campanhas_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'campanhas' AND (public.can_manage_campaign(((storage.foldername(name))[1])::uuid)
    OR (storage.foldername(name))[2] = public.my_creator_id()::text));

-- ---------- dados de teste identificados ----------
-- o login de demonstração ugc@squadra.app estava ligado a um creator REAL; passa a usar um creator de teste
UPDATE public.creators SET user_id = NULL WHERE user_id = '00000000-0000-0000-0000-000000000003'
  AND professional_name NOT LIKE '[TESTE]%';
INSERT INTO public.creators (id, user_id, professional_name, bio, city, state, instagram, tiktok, tags, specialties, verification_status)
VALUES ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000003', '[TESTE] Creator Squad',
  'Conta de teste da Squad UGC. Não é um creator real.', 'São Paulo', 'SP', '', '', ARRAY['teste'], ARRAY[]::text[], 'unverified')
ON CONFLICT (id) DO UPDATE SET user_id = excluded.user_id;

NOTIFY pgrst, 'reload schema';
