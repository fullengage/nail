-- ==============================================================================
-- NAIL CLUB PRO — SUPABASE POSTGRESQL SCHEMA (DDL + RLS + SEED DATA)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role_enum AS ENUM ('creator', 'brand', 'admin', 'brand_manager');
CREATE TYPE user_status_enum AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE campaign_type_enum AS ENUM ('product_seeding', 'paid_content', 'ugc', 'affiliate', 'live_commerce');
CREATE TYPE commission_type_enum AS ENUM ('fixed', 'percentage', 'product_only');
CREATE TYPE campaign_status_enum AS ENUM ('draft', 'pending_approval', 'open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE application_status_enum AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE participant_status_enum AS ENUM ('selected', 'product_sent', 'producing', 'submitted', 'approved', 'completed');
CREATE TYPE content_type_enum AS ENUM ('instagram_post', 'instagram_reel', 'story', 'tiktok', 'youtube', 'live', 'ugc');
CREATE TYPE submission_status_enum AS ENUM ('submitted', 'revision_requested', 'approved');
CREATE TYPE earning_type_enum AS ENUM ('campaign', 'affiliate', 'bonus');
CREATE TYPE earning_status_enum AS ENUM ('pending', 'approved', 'paid');

-- 2. PROFILES (Base User Table linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL DEFAULT 'creator',
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    status user_status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATOR PROFILES
CREATE TABLE IF NOT EXISTS public.creator_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    professional_name TEXT NOT NULL,
    bio TEXT,
    city TEXT,
    state TEXT,
    instagram TEXT,
    tiktok TEXT,
    youtube TEXT,
    instagram_followers INTEGER DEFAULT 0,
    tiktok_followers INTEGER DEFAULT 0,
    youtube_followers INTEGER DEFAULT 0,
    years_experience INTEGER DEFAULT 1,
    specialties TEXT[] DEFAULT '{}',
    techniques TEXT[] DEFAULT '{}',
    accepts_product_campaigns BOOLEAN DEFAULT TRUE,
    accepts_paid_campaigns BOOLEAN DEFAULT TRUE,
    accepts_affiliate_campaigns BOOLEAN DEFAULT TRUE,
    accepts_live_campaigns BOOLEAN DEFAULT TRUE,
    portfolio_cover_url TEXT,
    profile_completion INTEGER DEFAULT 70,
    verification_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATOR PORTFOLIO
CREATE TABLE IF NOT EXISTS public.creator_portfolio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL DEFAULT 'image', -- 'image' | 'video'
    media_url TEXT NOT NULL,
    caption TEXT,
    technique TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BRAND PROFILES
CREATE TABLE IF NOT EXISTS public.brand_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    cnpj TEXT,
    description TEXT,
    website TEXT,
    instagram TEXT,
    tiktok TEXT,
    logo_url TEXT,
    cover_url TEXT,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    city TEXT,
    state TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    image_url TEXT,
    website_url TEXT,
    product_url TEXT,
    price NUMERIC(10, 2) DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    objective TEXT,
    campaign_type campaign_type_enum NOT NULL DEFAULT 'paid_content',
    cover_url TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    application_deadline TIMESTAMPTZ NOT NULL,
    creator_slots INTEGER DEFAULT 10,
    occupied_slots INTEGER DEFAULT 0,
    budget NUMERIC(12, 2) DEFAULT 0,
    commission_type commission_type_enum DEFAULT 'fixed',
    commission_value NUMERIC(10, 2) DEFAULT 0,
    requirements_text TEXT,
    deliverables_text TEXT,
    status campaign_status_enum DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CAMPAIGN PRODUCTS LINK
CREATE TABLE IF NOT EXISTS public.campaign_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1
);

-- 9. CAMPAIGN REQUIREMENTS
CREATE TABLE IF NOT EXISTS public.campaign_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE UNIQUE,
    min_followers INTEGER DEFAULT 1000,
    state TEXT,
    city TEXT,
    required_specialties TEXT[] DEFAULT '{}',
    requires_instagram BOOLEAN DEFAULT TRUE,
    requires_tiktok BOOLEAN DEFAULT FALSE,
    requires_video BOOLEAN DEFAULT TRUE,
    requires_live BOOLEAN DEFAULT FALSE
);

-- 10. CAMPAIGN APPLICATIONS
CREATE TABLE IF NOT EXISTS public.campaign_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    message TEXT,
    status application_status_enum DEFAULT 'pending',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    UNIQUE(campaign_id, creator_id)
);

-- 11. CAMPAIGN PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.campaign_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    status participant_status_enum DEFAULT 'selected',
    tracking_code TEXT,
    product_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, creator_id)
);

-- 12. CONTENT SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.content_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    content_type content_type_enum NOT NULL DEFAULT 'instagram_reel',
    media_url TEXT NOT NULL,
    published_url TEXT NOT NULL,
    caption TEXT,
    status submission_status_enum DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- 13. CONTENT METRICS
CREATE TABLE IF NOT EXISTS public.content_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.content_submissions(id) ON DELETE CASCADE UNIQUE,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    sales INTEGER DEFAULT 0,
    revenue NUMERIC(12, 2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AFFILIATE LINKS
CREATE TABLE IF NOT EXISTS public.affiliate_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    code TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    commission_percentage NUMERIC(5, 2) DEFAULT 10,
    clicks INTEGER DEFAULT 0,
    orders INTEGER DEFAULT 0,
    revenue NUMERIC(12, 2) DEFAULT 0,
    commission_generated NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CREATOR EARNINGS
CREATE TABLE IF NOT EXISTS public.creator_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    earning_type earning_type_enum NOT NULL DEFAULT 'campaign',
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status earning_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- 16. COURSES & LESSONS
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    category TEXT,
    published BOOLEAN DEFAULT TRUE,
    instructor_name TEXT,
    instructor_avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    content TEXT,
    duration_minutes INTEGER DEFAULT 15,
    position INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.course_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(creator_id, lesson_id)
);

-- 17. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system',
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES ENABLED
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public creator profiles are viewable by everyone" ON public.creator_profiles FOR SELECT USING (true);
CREATE POLICY "Public portfolio is viewable by everyone" ON public.creator_portfolio FOR SELECT USING (true);
CREATE POLICY "Public brand profiles are viewable by everyone" ON public.brand_profiles FOR SELECT USING (true);
CREATE POLICY "Public products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public campaigns are viewable by everyone" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Public courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Public lessons are viewable by everyone" ON public.lessons FOR SELECT USING (true);

-- ==============================================================================
-- creator_metrics (migração 20261007_creator_metrics.sql): histórico de coletas de desempenho.
-- Referencia public.creators (schema atual em migrations/20261002_squadra_mvp.sql).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.creator_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('tiktok', 'instagram')),
  collected_at timestamptz NOT NULL DEFAULT now(),
  followers integer,
  posts_analyzed integer NOT NULL DEFAULT 0,
  period_days integer,
  avg_views numeric(14,2),
  avg_likes numeric(14,2),
  avg_comments numeric(14,2),
  avg_shares numeric(14,2),
  er_by_views numeric(8,2),
  er_by_followers numeric(8,2),
  paid_posts_180d integer,
  top_hashtags text[] NOT NULL DEFAULT ARRAY[]::text[],
  recent_posts jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS creator_metrics_creator_platform_idx ON public.creator_metrics (creator_id, platform, collected_at DESC);
ALTER TABLE public.creator_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_metrics_read" ON public.creator_metrics FOR SELECT TO authenticated USING (true);
