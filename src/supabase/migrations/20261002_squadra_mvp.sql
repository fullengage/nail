-- ==============================================================================
-- SQUADRA UGC & CREATOR COMMERCE — ESQUEMA COMPLETO DO BANCO DE DADOS (SUPABASE)
-- ==============================================================================

-- 1. Extensões essenciais
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela: ORGANIZATIONS (Multi-inquilino / multiempresa)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    settings JSONB DEFAULT '{"score_weights": {"engagement": 30, "audience": 20, "nicheMatch": 25, "deliveryHistory": 15, "quality": 10}}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela: PROFILES (Perfis de Usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'creator', -- 'admin_master', 'brand_admin', 'manager', 'analyst', 'creator'
    status TEXT NOT NULL DEFAULT 'active', -- 'pending', 'active', 'suspended'
    terms_accepted_at TIMESTAMPTZ,
    privacy_accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela: MEMBERSHIPS (Vínculo Usuário <-> Organização com Papéis)
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'creator', -- 'admin_master', 'brand_admin', 'manager', 'analyst', 'creator'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, organization_id)
);

-- 5. Tabela: BRANDS (Marcas da Organização)
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    cnpj TEXT,
    description TEXT,
    logo_url TEXT,
    cover_url TEXT,
    website TEXT,
    instagram TEXT,
    tiktok TEXT,
    score_weights JSONB DEFAULT '{"engagement": 30, "audience": 20, "nicheMatch": 25, "deliveryHistory": 15, "quality": 10}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabela: CREATORS
CREATE TABLE IF NOT EXISTS public.creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    professional_name TEXT NOT NULL,
    bio TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    instagram TEXT NOT NULL,
    tiktok TEXT,
    youtube TEXT,
    instagram_followers INTEGER DEFAULT 0,
    tiktok_followers INTEGER DEFAULT 0,
    youtube_followers INTEGER DEFAULT 0,
    operational_score NUMERIC(5,2) DEFAULT 85.00,
    engagement_rate NUMERIC(5,2) DEFAULT 4.20,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
    techniques TEXT[] DEFAULT ARRAY[]::TEXT[],
    email TEXT,
    phone TEXT,
    media_kit_url TEXT,
    portfolio_cover_url TEXT,
    profile_completion INTEGER DEFAULT 95,
    verification_status TEXT DEFAULT 'verified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Tabela: CREATOR_SOCIAL_ACCOUNTS
CREATE TABLE IF NOT EXISTS public.creator_social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'instagram', 'tiktok', 'youtube'
    username TEXT NOT NULL,
    followers INTEGER DEFAULT 0,
    engagement_rate NUMERIC(5,2) DEFAULT 0,
    profile_url TEXT,
    last_synced_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tabela: CREATOR_TAGS
CREATE TABLE IF NOT EXISTS public.creator_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    tag TEXT NOT NULL
);

-- 9. Tabela: RETAIL_POINTS (PDVs)
CREATE TABLE IF NOT EXISTS public.retail_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trade_name TEXT,
    network TEXT,
    cnpj TEXT,
    type TEXT NOT NULL, -- 'cosmetics', 'pharmacy', 'salon', 'perfumery', 'distributor'
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    manager_name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Tabela: CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    objective TEXT,
    campaign_type TEXT NOT NULL DEFAULT 'ugc', -- 'ugc', 'product_seeding', 'paid_content', 'affiliate', 'live_commerce'
    cover_url TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    application_deadline DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '10 days'),
    creator_slots INTEGER NOT NULL DEFAULT 20,
    occupied_slots INTEGER NOT NULL DEFAULT 0,
    budget NUMERIC(12,2) DEFAULT 0,
    commission_type TEXT DEFAULT 'fixed',
    commission_value NUMERIC(10,2) DEFAULT 0,
    requirements_text TEXT,
    deliverables_text TEXT,
    status TEXT NOT NULL DEFAULT 'open', -- 'draft', 'pending_approval', 'open', 'in_progress', 'completed', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Tabela: CAMPAIGN_CREATORS (Squad & Pipeline de 14 Etapas)
CREATE TABLE IF NOT EXISTS public.campaign_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    stage TEXT NOT NULL DEFAULT 'discovery', -- discovery, invited, applied, screening, squad_approved, briefing_sent, shipping, delivered, producing, submitted, reviewing, approved, published, completed
    operational_score NUMERIC(5,2) DEFAULT 85,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'selected',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(campaign_id, creator_id)
);

-- 12. Tabela: CAMPAIGN_APPLICATIONS (Inscrições / Candidaturas públicas)
CREATE TABLE IF NOT EXISTS public.campaign_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
    creator_name TEXT,
    creator_email TEXT,
    creator_phone TEXT,
    creator_instagram TEXT,
    message TEXT,
    media_kit_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Tabela: SHIPMENTS (Logística e Rastreio de Envios de Produtos)
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    tracking_code TEXT NOT NULL,
    carrier TEXT NOT NULL DEFAULT 'Correios', -- 'Correios', 'Melhor Envio', 'Loggi', 'Total Express'
    status TEXT NOT NULL DEFAULT 'shipped', -- 'pending', 'shipped', 'in_transit', 'delivered'
    address_street TEXT NOT NULL,
    address_city TEXT NOT NULL,
    address_state TEXT NOT NULL,
    address_zip TEXT NOT NULL,
    shipped_at TIMESTAMPTZ DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    notes TEXT
);

-- 14. Tabela: CONTENTS (Mosaico de Criativos UGC)
CREATE TABLE IF NOT EXISTS public.contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL DEFAULT 'instagram_reel', -- 'instagram_reel', 'tiktok', 'story', 'ugc'
    media_url TEXT NOT NULL,
    published_url TEXT,
    caption TEXT,
    status TEXT NOT NULL DEFAULT 'reviewing', -- 'reviewing', 'revision_requested', 'approved', 'published'
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ
);

-- 15. Tabela: CONTENT_REVIEWS (Comentários e Feedbacks de Aprovação)
CREATE TABLE IF NOT EXISTS public.content_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL DEFAULT 'brand_manager',
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Tabela: CONTENT_METRICS (Métricas de Engajamento)
CREATE TABLE IF NOT EXISTS public.content_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    views BIGINT DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    sales INTEGER DEFAULT 0,
    revenue NUMERIC(12,2) DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. Tabela: AFFILIATE_LINKS (Afiliados e Códigos de Rastreio de Venda)
CREATE TABLE IF NOT EXISTS public.affiliate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    commission_percentage NUMERIC(5,2) DEFAULT 10.00,
    total_clicks INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    gmv NUMERIC(12,2) DEFAULT 0,
    commission_amount NUMERIC(12,2) DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'paid'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. Tabela: AFFILIATE_SALES (Vendas por Afiliado)
CREATE TABLE IF NOT EXISTS public.affiliate_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    commission NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. Tabela: NOTES & ACTIVITIES
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. Tabela: SOURCE_COUNTS (Contadores Totais de Origem)
CREATE TABLE IF NOT EXISTS public.source_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    manicures INTEGER NOT NULL DEFAULT 17000,
    tiktok INTEGER NOT NULL DEFAULT 799,
    instagram INTEGER NOT NULL DEFAULT 560,
    retail_points INTEGER NOT NULL DEFAULT 8059,
    unique_creators INTEGER NOT NULL DEFAULT 18359,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. Índices para performance e deduplicação
CREATE INDEX IF NOT EXISTS idx_creators_city_state ON public.creators(city, state);
CREATE INDEX IF NOT EXISTS idx_creators_instagram ON public.creators(instagram);
CREATE INDEX IF NOT EXISTS idx_creators_email ON public.creators(email);
CREATE INDEX IF NOT EXISTS idx_creators_phone ON public.creators(phone);
CREATE INDEX IF NOT EXISTS idx_retail_points_state_city ON public.retail_points(state, city);
CREATE INDEX IF NOT EXISTS idx_retail_points_type ON public.retail_points(type);
CREATE INDEX IF NOT EXISTS idx_campaign_creators_stage ON public.campaign_creators(stage);

-- 22. Habilitar RLS e Políticas Permissivas para MVP
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_counts ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura/escrita com anon/authenticated para protótipo ágil
DO $$
BEGIN
    EXECUTE 'CREATE POLICY "Allow public read organizations" ON public.organizations FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read brands" ON public.brands FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read creators" ON public.creators FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read retail_points" ON public.retail_points FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read campaigns" ON public.campaigns FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read campaign_creators" ON public.campaign_creators FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read campaign_applications" ON public.campaign_applications FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read shipments" ON public.shipments FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read contents" ON public.contents FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read content_reviews" ON public.content_reviews FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read affiliate_links" ON public.affiliate_links FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Allow public read source_counts" ON public.source_counts FOR SELECT USING (true)';
    
    -- Inscrições públicas
    EXECUTE 'CREATE POLICY "Allow public insert applications" ON public.campaign_applications FOR INSERT WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Allow public write creators" ON public.creators FOR ALL USING (true)';
    EXECUTE 'CREATE POLICY "Allow public write retail_points" ON public.retail_points FOR ALL USING (true)';
    EXECUTE 'CREATE POLICY "Allow public write campaigns" ON public.campaigns FOR ALL USING (true)';
    EXECUTE 'CREATE POLICY "Allow public write campaign_creators" ON public.campaign_creators FOR ALL USING (true)';
    EXECUTE 'CREATE POLICY "Allow public write shipments" ON public.shipments FOR ALL USING (true)';
    EXECUTE 'CREATE POLICY "Allow public write contents" ON public.contents FOR ALL USING (true)';
    EXECUTE 'CREATE POLICY "Allow public write content_reviews" ON public.content_reviews FOR ALL USING (true)';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
