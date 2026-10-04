-- ==============================================================================
-- SQUAD UGC — pendências de banco (rodar 1x no SQL Editor do Supabase)
-- 1) Leads do site: "Candidatar marca", lista de creators e "Solicitar projeto" de PDVs
-- 2) Cachê por creator no squad (campaign_creators.fee)
-- Seguro para rodar de novo (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ==============================================================================

-- quem é admin do Squad UGC (perfil logado com papel admin)
CREATE OR REPLACE FUNCTION public.squad_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid() AND p.role IN ('admin_master', 'admin')
  );
$$;

-- 1a) leads de marca (inclui pedidos de projeto de PDV: origin = 'pdv_projeto')
CREATE TABLE IF NOT EXISTS public.ncp_brand_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    role TEXT,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    category TEXT,
    sales_channel TEXT,
    budget_tier TEXT,
    origin TEXT NOT NULL DEFAULT 'landing_founding_brands',
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'novo', -- novo, em_contato, proposta, fechado, perdido
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ncp_brand_leads ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'novo';
ALTER TABLE public.ncp_brand_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "brand_leads_insert" ON public.ncp_brand_leads;
CREATE POLICY "brand_leads_insert" ON public.ncp_brand_leads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "brand_leads_admin" ON public.ncp_brand_leads;
CREATE POLICY "brand_leads_admin" ON public.ncp_brand_leads FOR ALL USING (public.squad_is_admin()) WITH CHECK (public.squad_is_admin());

-- 1b) lista de espera de creators
CREATE TABLE IF NOT EXISTS public.ncp_creator_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    instagram TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    city TEXT,
    state TEXT,
    techniques TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'novo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ncp_creator_waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creator_waitlist_insert" ON public.ncp_creator_waitlist;
CREATE POLICY "creator_waitlist_insert" ON public.ncp_creator_waitlist FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "creator_waitlist_admin" ON public.ncp_creator_waitlist;
CREATE POLICY "creator_waitlist_admin" ON public.ncp_creator_waitlist FOR ALL USING (public.squad_is_admin()) WITH CHECK (public.squad_is_admin());

-- 2) cachê por creator no squad (hoje vai em notes como "cache=150;")
ALTER TABLE public.campaign_creators ADD COLUMN IF NOT EXISTS fee NUMERIC(10,2);
UPDATE public.campaign_creators
SET fee = (regexp_match(notes, 'cache=([0-9.]+);'))[1]::numeric,
    notes = btrim(regexp_replace(notes, 'cache=[0-9.]+;\s*', ''))
WHERE fee IS NULL AND notes ~ 'cache=[0-9.]+;';

NOTIFY pgrst, 'reload schema';
