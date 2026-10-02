-- ==============================================================================
-- MIGRAÇÃO: 3 NÍVEIS DE ACESSO AUTENTICADO NO BANCO DE DADOS (SUPABASE)
-- 1. Administrador Geral (admin_master)
-- 2. Administrador de Empresa / Contratante (brand_admin)
-- 3. UGC Influenciador / Prestador de Serviço (creator)
-- ==============================================================================

-- 1. Garantir constraint dos 3 papéis
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_user_role;
ALTER TABLE public.profiles ADD CONSTRAINT check_user_role 
    CHECK (role IN ('admin_master', 'brand_admin', 'creator'));

ALTER TABLE public.memberships DROP CONSTRAINT IF EXISTS check_membership_role;
ALTER TABLE public.memberships ADD CONSTRAINT check_membership_role 
    CHECK (role IN ('admin_master', 'brand_admin', 'creator'));

-- 2. Funções auxiliares de checagem de nível de autenticação (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1),
    'creator'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_master()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_auth_role() = 'admin_master';
$$;

CREATE OR REPLACE FUNCTION public.is_brand_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_auth_role() IN ('admin_master', 'brand_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_creator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_auth_role() = 'creator';
$$;

-- 3. Inserir ou Atualizar os 3 Perfis Representativos no Banco
DO $$
DECLARE
    v_org_id UUID := '00000000-0000-0000-0000-000000000001';
    v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
    v_brand_id UUID := '00000000-0000-0000-0000-000000000002';
    v_creator_id UUID := '00000000-0000-0000-0000-000000000003';
BEGIN
    -- Nível 1: Administrador Geral
    INSERT INTO public.profiles (
        id, email, full_name, phone, role, status, avatar_url, updated_at
    ) VALUES (
        v_admin_id,
        'admin@squadra.app',
        'Administrador Geral (Squadra Master)',
        '(11) 99999-0001',
        'admin_master',
        'active',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        now()
    ) ON CONFLICT (email) DO UPDATE SET
        role = 'admin_master',
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();

    -- Nível 2: Administrador de Empresa (Contratante)
    INSERT INTO public.profiles (
        id, email, full_name, phone, role, status, avatar_url, updated_at
    ) VALUES (
        v_brand_id,
        'empresa@squadra.app',
        'Diretoria de Marketing (Squadra Nutrition)',
        '(11) 98888-0002',
        'brand_admin',
        'active',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        now()
    ) ON CONFLICT (email) DO UPDATE SET
        role = 'brand_admin',
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();

    -- Nível 3: UGC / Influenciador (Prestador de Serviço)
    INSERT INTO public.profiles (
        id, email, full_name, phone, role, status, avatar_url, updated_at
    ) VALUES (
        v_creator_id,
        'ugc@squadra.app',
        'Bruna Oliveira (UGC Creator)',
        '(11) 97777-0003',
        'creator',
        'active',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        now()
    ) ON CONFLICT (email) DO UPDATE SET
        role = 'creator',
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();

    -- Inserir memberships
    INSERT INTO public.memberships (user_id, organization_id, role)
    VALUES 
        (v_admin_id, v_org_id, 'admin_master'),
        (v_brand_id, v_org_id, 'brand_admin'),
        (v_creator_id, v_org_id, 'creator')
    ON CONFLICT (user_id, organization_id) DO UPDATE SET role = EXCLUDED.role;

    -- Vincular um creator de exemplo ao perfil UGC
    UPDATE public.creators 
    SET user_id = v_creator_id,
        professional_name = 'Bruna Oliveira (UGC Creator)',
        email = 'ugc@squadra.app'
    WHERE id = (SELECT id FROM public.creators LIMIT 1);

END $$;

-- 4. Criação de Usuários na auth.users (caso a extensão pgcrypto permita)
DO $$
DECLARE
    v_admin_uid UUID := 'a0000000-0000-0000-0000-000000000001';
    v_brand_uid UUID := 'b0000000-0000-0000-0000-000000000002';
    v_ugc_uid   UUID := 'c0000000-0000-0000-0000-000000000003';
    v_pwd_hash  TEXT;
BEGIN
    v_pwd_hash := crypt('Squadra@2026', gen_salt('bf'));

    -- 1. Admin Master
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        role, aud, confirmation_token
    ) VALUES (
        v_admin_uid,
        '00000000-0000-0000-0000-000000000000',
        'admin@squadra.app',
        v_pwd_hash,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Administrador Geral","role":"admin_master"}'::jsonb,
        now(),
        now(),
        'authenticated',
        'authenticated',
        ''
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 2. Administrador de Empresa
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        role, aud, confirmation_token
    ) VALUES (
        v_brand_uid,
        '00000000-0000-0000-0000-000000000000',
        'empresa@squadra.app',
        v_pwd_hash,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Diretoria de Marketing","role":"brand_admin"}'::jsonb,
        now(),
        now(),
        'authenticated',
        'authenticated',
        ''
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 3. UGC Influenciador
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        role, aud, confirmation_token
    ) VALUES (
        v_ugc_uid,
        '00000000-0000-0000-0000-000000000000',
        'ugc@squadra.app',
        v_pwd_hash,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Bruna Oliveira","role":"creator"}'::jsonb,
        now(),
        now(),
        'authenticated',
        'authenticated',
        ''
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- Vincular auth_user_id aos perfis em public.profiles
    UPDATE public.profiles SET auth_user_id = v_admin_uid WHERE email = 'admin@squadra.app';
    UPDATE public.profiles SET auth_user_id = v_brand_uid WHERE email = 'empresa@squadra.app';
    UPDATE public.profiles SET auth_user_id = v_ugc_uid   WHERE email = 'ugc@squadra.app';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'auth.users update skipped or restricted: %', SQLERRM;
END $$;
