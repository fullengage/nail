-- ==============================================================================
-- SQUAD UGC — contatos só para o admin + fim da escrita aberta (rodar 1x no SQL Editor)
-- * Visitantes e empresas leem creators/PDVs SEM e-mail, telefone e gerente.
-- * Só admin logado (profiles.role admin/admin_master ligado ao auth.uid()) recebe os contatos,
--   pelas funções admin_creator_contacts() e admin_retail_contacts().
-- * Escrita: creators/PDVs só admin; campanhas/squads só usuário logado; anônimo não grava.
-- * Scripts de importação usam a chave service_role (ignora RLS) — nunca no site.
-- Seguro para rodar de novo.
-- ==============================================================================

-- quem é admin / quem é usuário logado com perfil
CREATE OR REPLACE FUNCTION public.squad_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.auth_user_id = auth.uid() AND p.role IN ('admin_master', 'admin'));
$$;
CREATE OR REPLACE FUNCTION public.squad_is_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.auth_user_id = auth.uid());
$$;

-- 1) colunas de contato fora da leitura pública
-- (coluna nova em creators/retail_points precisa entrar no GRANT abaixo para aparecer no site)
REVOKE SELECT ON public.creators FROM anon, authenticated;
GRANT SELECT (id, user_id, professional_name, bio, city, state, instagram, tiktok, youtube,
  instagram_followers, tiktok_followers, youtube_followers, operational_score, engagement_rate,
  tags, specialties, techniques, media_kit_url, portfolio_cover_url, profile_completion,
  verification_status, created_at, updated_at) ON public.creators TO anon, authenticated;

REVOKE SELECT ON public.retail_points FROM anon, authenticated;
GRANT SELECT (id, organization_id, name, trade_name, network, cnpj, type, city, state, address, status, created_at)
  ON public.retail_points TO anon, authenticated;

-- 2) contatos só para admin
CREATE OR REPLACE FUNCTION public.admin_creator_contacts()
RETURNS TABLE (id uuid, email text, phone text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.email, c.phone FROM public.creators c
  WHERE public.squad_is_admin() AND (c.email IS NOT NULL OR c.phone IS NOT NULL)
  ORDER BY c.id;
$$;
CREATE OR REPLACE FUNCTION public.admin_retail_contacts(p_network text DEFAULT NULL)
RETURNS TABLE (id uuid, phone text, email text, manager_name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.phone, r.email, r.manager_name FROM public.retail_points r
  WHERE public.squad_is_admin() AND (p_network IS NULL OR r.network = p_network)
  ORDER BY r.id;
$$;
-- o próprio creator logado vê o seu cadastro completo
CREATE OR REPLACE FUNCTION public.my_creator()
RETURNS SETOF public.creators LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.creators WHERE email IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email') LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.admin_creator_contacts() FROM public;
REVOKE ALL ON FUNCTION public.admin_retail_contacts(text) FROM public;
REVOKE ALL ON FUNCTION public.my_creator() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_creator_contacts(), public.admin_retail_contacts(text), public.my_creator() TO authenticated;

-- 3) escrita: acabou o "FOR ALL USING (true)"
DROP POLICY IF EXISTS "Allow public write creators" ON public.creators;
DROP POLICY IF EXISTS "creators_admin_write" ON public.creators;
DROP POLICY IF EXISTS "creators_self_insert" ON public.creators;
CREATE POLICY "creators_admin_write" ON public.creators FOR ALL TO authenticated
  USING (public.squad_is_admin()) WITH CHECK (public.squad_is_admin());
-- cadastro do próprio creator (tela de cadastro)
CREATE POLICY "creators_self_insert" ON public.creators FOR INSERT TO authenticated
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Allow public write retail_points" ON public.retail_points;
DROP POLICY IF EXISTS "retail_admin_write" ON public.retail_points;
CREATE POLICY "retail_admin_write" ON public.retail_points FOR ALL TO authenticated
  USING (public.squad_is_admin()) WITH CHECK (public.squad_is_admin());

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['campaigns', 'campaign_creators', 'shipments', 'contents', 'content_reviews'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow public write %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_member_write" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%s_member_write" ON public.%I FOR ALL TO authenticated USING (public.squad_is_member()) WITH CHECK (public.squad_is_member())', t, t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

-- Conferência (rodar depois, logado como anon no SQL Editor não se aplica; teste pelo site):
--   visitante: GET /rest/v1/creators?select=email  -> erro "permission denied for column email"
--   admin logado: rpc admin_creator_contacts      -> lista os contatos
