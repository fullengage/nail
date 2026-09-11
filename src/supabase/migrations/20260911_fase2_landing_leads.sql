-- ==============================================================================
-- NAIL CLUB PRO — MIGRATION FASE 2: LANDING, LEADS, LISTA DE ESPERA E CONSENTIMENTO
-- Data: 2026-09-11
-- Alvo estrito: Schema public, apenas tabelas e colunas com prefixo "ncp_"
-- ==============================================================================

-- 1. CAMPOS DE CONSENTIMENTO E DESTAQUE EM ncp_creator_profiles
ALTER TABLE public.ncp_creator_profiles
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_consent_at TIMESTAMPTZ NULL;

-- 2. CAMPOS DE ACEITE DE TERMOS E PRIVACIDADE EM ncp_profiles
ALTER TABLE public.ncp_profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ NULL;

-- 3. TABELA DE LEADS: PROGRAMA DE MARCAS FUNDADORAS (ncp_brand_leads)
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para ncp_brand_leads
ALTER TABLE public.ncp_brand_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ncp_brand_leads_insert" ON public.ncp_brand_leads;
CREATE POLICY "ncp_brand_leads_insert" ON public.ncp_brand_leads
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "ncp_brand_leads_select" ON public.ncp_brand_leads;
CREATE POLICY "ncp_brand_leads_select" ON public.ncp_brand_leads
FOR SELECT USING (public.ncp_is_admin());

DROP POLICY IF EXISTS "ncp_brand_leads_update" ON public.ncp_brand_leads;
CREATE POLICY "ncp_brand_leads_update" ON public.ncp_brand_leads
FOR UPDATE USING (public.ncp_is_admin());

DROP POLICY IF EXISTS "ncp_brand_leads_delete" ON public.ncp_brand_leads;
CREATE POLICY "ncp_brand_leads_delete" ON public.ncp_brand_leads
FOR DELETE USING (public.ncp_is_admin());

-- 4. TABELA DE LISTA DE ESPERA DE CREATORS (ncp_creator_waitlist)
CREATE TABLE IF NOT EXISTS public.ncp_creator_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    techniques TEXT[] DEFAULT '{}',
    instagram TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para ncp_creator_waitlist
ALTER TABLE public.ncp_creator_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ncp_creator_waitlist_insert" ON public.ncp_creator_waitlist;
CREATE POLICY "ncp_creator_waitlist_insert" ON public.ncp_creator_waitlist
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "ncp_creator_waitlist_select" ON public.ncp_creator_waitlist;
CREATE POLICY "ncp_creator_waitlist_select" ON public.ncp_creator_waitlist
FOR SELECT USING (public.ncp_is_admin());

DROP POLICY IF EXISTS "ncp_creator_waitlist_update" ON public.ncp_creator_waitlist;
CREATE POLICY "ncp_creator_waitlist_update" ON public.ncp_creator_waitlist
FOR UPDATE USING (public.ncp_is_admin());

DROP POLICY IF EXISTS "ncp_creator_waitlist_delete" ON public.ncp_creator_waitlist;
CREATE POLICY "ncp_creator_waitlist_delete" ON public.ncp_creator_waitlist
FOR DELETE USING (public.ncp_is_admin());

-- 5. ÍNDICES DE DESEMPENHO E AUDITORIA
CREATE INDEX IF NOT EXISTS idx_ncp_brand_leads_created_at ON public.ncp_brand_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ncp_creator_waitlist_created_at ON public.ncp_creator_waitlist (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ncp_creator_profiles_featured ON public.ncp_creator_profiles (is_featured, featured_consent_at) WHERE is_featured = true;
