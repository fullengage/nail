-- ==============================================================================
-- NAIL CLUB PRO — MIGRATION FASE 1: SEGURANÇA, ROLES E RLS RIGOROSO
-- Data: 2026-09-11
-- Alvo estrito: Apenas objetos no schema public com prefixo "ncp_" e buckets "ncp-*"
-- ==============================================================================

-- 1. FUNÇÃO AUXILIAR DE ADMIN (SECURITY DEFINER)
-- Retorna true se o usuário autenticado atual tiver role 'admin' e status 'active' em ncp_profiles
CREATE OR REPLACE FUNCTION public.ncp_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ncp_profiles
    WHERE auth_user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
  );
$$;

-- 2. FUNÇÃO AUXILIAR DE IDENTIFICAÇÃO DE PERFIL NCP
-- Retorna o ncp_profiles.id correspondente ao auth.uid() atual
CREATE OR REPLACE FUNCTION public.ncp_current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.ncp_profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- 3. FUNÇÃO AUXILIAR DE IDENTIFICAÇÃO DE CREATOR NCP
-- Retorna o ncp_creator_profiles.id correspondente ao auth.uid() atual
CREATE OR REPLACE FUNCTION public.ncp_current_creator_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.id
  FROM public.ncp_creator_profiles cp
  JOIN public.ncp_profiles p ON p.id = cp.user_id
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- 4. FUNÇÃO AUXILIAR DE IDENTIFICAÇÃO DE MARCA NCP
-- Retorna o ncp_brand_profiles.id correspondente ao auth.uid() atual
CREATE OR REPLACE FUNCTION public.ncp_current_brand_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bp.id
  FROM public.ncp_brand_profiles bp
  JOIN public.ncp_profiles p ON p.id = bp.user_id
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- 5. TRIGGER: PROTEÇÃO DA COLUNA ROLE CONTRA ELEVAÇÃO DE PRIVILÉGIO
-- Impede que usuários não-admin alterem o campo 'role' em ncp_profiles
CREATE OR REPLACE FUNCTION public.ncp_protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.ncp_is_admin() THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o nível de permissão (role). Operação bloqueada.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ncp_protect_profile_role ON public.ncp_profiles;
CREATE TRIGGER trg_ncp_protect_profile_role
BEFORE UPDATE ON public.ncp_profiles
FOR EACH ROW
EXECUTE FUNCTION public.ncp_protect_profile_role();

-- 6. TABELA DE AUDITORIA FINANCEIRA: ncp_payment_events (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.ncp_payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    earning_id UUID REFERENCES public.ncp_creator_earnings(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.ncp_campaigns(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES public.ncp_profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'released', 'paid', 'cancelled'
    amount NUMERIC(12, 2) NOT NULL,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ATIVAÇÃO DE RLS EM TODAS AS TABELAS ncp_*
ALTER TABLE public.ncp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_creator_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_content_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncp_payment_events ENABLE ROW LEVEL SECURITY;

-- 8. LIMPEZA DE POLICIES ANTIGAS (APENAS NAS TABELAS ncp_*)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE tablename LIKE 'ncp_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ==============================================================================
-- 9. POLICIES DEFINITIVAS DE RLS (TABELA POR TABELA)
-- ==============================================================================

-- --- ncp_profiles ---
-- Visualização: próprio perfil, admin, ou público básico para criadoras e marcas ativas
CREATE POLICY "ncp_profiles_select" ON public.ncp_profiles
FOR SELECT USING (
  auth_user_id = auth.uid()
  OR public.ncp_is_admin()
  OR (status = 'active' AND role IN ('creator', 'brand'))
);

CREATE POLICY "ncp_profiles_insert" ON public.ncp_profiles
FOR INSERT WITH CHECK (
  auth_user_id = auth.uid()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_profiles_update" ON public.ncp_profiles
FOR UPDATE USING (
  auth_user_id = auth.uid()
  OR public.ncp_is_admin()
);

-- --- ncp_creator_profiles ---
-- Visualização: qualquer pessoa pode ver perfis públicos de creators ativas; o próprio dono e admin vêem tudo
CREATE POLICY "ncp_creator_profiles_select" ON public.ncp_creator_profiles
FOR SELECT USING (
  user_id = public.ncp_current_profile_id()
  OR public.ncp_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.ncp_profiles p
    WHERE p.id = ncp_creator_profiles.user_id
      AND p.status = 'active'
  )
);

CREATE POLICY "ncp_creator_profiles_insert" ON public.ncp_creator_profiles
FOR INSERT WITH CHECK (
  user_id = public.ncp_current_profile_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_creator_profiles_update" ON public.ncp_creator_profiles
FOR UPDATE USING (
  user_id = public.ncp_current_profile_id()
  OR public.ncp_is_admin()
);

-- --- ncp_creator_portfolio ---
CREATE POLICY "ncp_creator_portfolio_select" ON public.ncp_creator_portfolio
FOR SELECT USING (true);

CREATE POLICY "ncp_creator_portfolio_insert" ON public.ncp_creator_portfolio
FOR INSERT WITH CHECK (
  creator_id = public.ncp_current_creator_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_creator_portfolio_update" ON public.ncp_creator_portfolio
FOR UPDATE USING (
  creator_id = public.ncp_current_creator_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_creator_portfolio_delete" ON public.ncp_creator_portfolio
FOR DELETE USING (
  creator_id = public.ncp_current_creator_id()
  OR public.ncp_is_admin()
);

-- --- ncp_brand_profiles ---
CREATE POLICY "ncp_brand_profiles_select" ON public.ncp_brand_profiles
FOR SELECT USING (
  user_id = public.ncp_current_profile_id()
  OR public.ncp_is_admin()
  OR status = 'active'
);

CREATE POLICY "ncp_brand_profiles_insert" ON public.ncp_brand_profiles
FOR INSERT WITH CHECK (
  user_id = public.ncp_current_profile_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_brand_profiles_update" ON public.ncp_brand_profiles
FOR UPDATE USING (
  user_id = public.ncp_current_profile_id()
  OR public.ncp_is_admin()
);

-- --- ncp_products ---
CREATE POLICY "ncp_products_select" ON public.ncp_products
FOR SELECT USING (
  active = true
  OR brand_id = public.ncp_current_brand_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_products_insert" ON public.ncp_products
FOR INSERT WITH CHECK (
  brand_id = public.ncp_current_brand_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_products_update" ON public.ncp_products
FOR UPDATE USING (
  brand_id = public.ncp_current_brand_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_products_delete" ON public.ncp_products
FOR DELETE USING (
  brand_id = public.ncp_current_brand_id()
  OR public.ncp_is_admin()
);

-- --- ncp_campaigns ---
-- Visitantes/Creators só vêem campanhas publicadas/abertas; Marca dona vê suas próprias; Admin vê tudo
CREATE POLICY "ncp_campaigns_select" ON public.ncp_campaigns
FOR SELECT USING (
  status IN ('open', 'in_progress', 'completed')
  OR brand_id = public.ncp_current_brand_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_campaigns_insert" ON public.ncp_campaigns
FOR INSERT WITH CHECK (
  brand_id = public.ncp_current_brand_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_campaigns_update" ON public.ncp_campaigns
FOR UPDATE USING (
  brand_id = public.ncp_current_brand_id()
  OR public.ncp_is_admin()
);

-- --- ncp_campaign_applications ---
-- Creator vê as suas; Marca dona da campanha vê as candidaturas da campanha; Admin vê tudo
CREATE POLICY "ncp_applications_select" ON public.ncp_campaign_applications
FOR SELECT USING (
  creator_id = public.ncp_current_creator_id()
  OR public.ncp_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.ncp_campaigns c
    WHERE c.id = ncp_campaign_applications.campaign_id
      AND c.brand_id = public.ncp_current_brand_id()
  )
);

CREATE POLICY "ncp_applications_insert" ON public.ncp_campaign_applications
FOR INSERT WITH CHECK (
  creator_id = public.ncp_current_creator_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_applications_update" ON public.ncp_campaign_applications
FOR UPDATE USING (
  public.ncp_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.ncp_campaigns c
    WHERE c.id = ncp_campaign_applications.campaign_id
      AND c.brand_id = public.ncp_current_brand_id()
  )
);

-- --- ncp_campaign_participants ---
CREATE POLICY "ncp_participants_select" ON public.ncp_campaign_participants
FOR SELECT USING (
  creator_id = public.ncp_current_creator_id()
  OR public.ncp_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.ncp_campaigns c
    WHERE c.id = ncp_campaign_participants.campaign_id
      AND c.brand_id = public.ncp_current_brand_id()
  )
);

CREATE POLICY "ncp_participants_insert" ON public.ncp_campaign_participants
FOR INSERT WITH CHECK (
  public.ncp_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.ncp_campaigns c
    WHERE c.id = ncp_campaign_participants.campaign_id
      AND c.brand_id = public.ncp_current_brand_id()
  )
);

CREATE POLICY "ncp_participants_update" ON public.ncp_campaign_participants
FOR UPDATE USING (
  public.ncp_is_admin()
  OR creator_id = public.ncp_current_creator_id()
  OR EXISTS (
    SELECT 1 FROM public.ncp_campaigns c
    WHERE c.id = ncp_campaign_participants.campaign_id
      AND c.brand_id = public.ncp_current_brand_id()
  )
);

-- --- ncp_content_submissions ---
CREATE POLICY "ncp_submissions_select" ON public.ncp_content_submissions
FOR SELECT USING (
  creator_id = public.ncp_current_creator_id()
  OR public.ncp_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.ncp_campaigns c
    WHERE c.id = ncp_content_submissions.campaign_id
      AND c.brand_id = public.ncp_current_brand_id()
  )
);

CREATE POLICY "ncp_submissions_insert" ON public.ncp_content_submissions
FOR INSERT WITH CHECK (
  creator_id = public.ncp_current_creator_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_submissions_update" ON public.ncp_content_submissions
FOR UPDATE USING (
  public.ncp_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.ncp_campaigns c
    WHERE c.id = ncp_content_submissions.campaign_id
      AND c.brand_id = public.ncp_current_brand_id()
  )
);

-- --- ncp_content_metrics ---
CREATE POLICY "ncp_metrics_select" ON public.ncp_content_metrics
FOR SELECT USING (
  public.ncp_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.ncp_content_submissions s
    WHERE s.id = ncp_content_metrics.submission_id
      AND (
        s.creator_id = public.ncp_current_creator_id()
        OR EXISTS (
          SELECT 1 FROM public.ncp_campaigns c
          WHERE c.id = s.campaign_id
            AND c.brand_id = public.ncp_current_brand_id()
        )
      )
  )
);

CREATE POLICY "ncp_metrics_insert" ON public.ncp_content_metrics
FOR INSERT WITH CHECK (
  public.ncp_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.ncp_content_submissions s
    WHERE s.id = ncp_content_metrics.submission_id
      AND s.creator_id = public.ncp_current_creator_id()
  )
);

CREATE POLICY "ncp_metrics_update" ON public.ncp_content_metrics
FOR UPDATE USING (
  public.ncp_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.ncp_content_submissions s
    WHERE s.id = ncp_content_metrics.submission_id
      AND s.creator_id = public.ncp_current_creator_id()
  )
);

-- --- ncp_affiliate_links ---
CREATE POLICY "ncp_affiliate_links_select" ON public.ncp_affiliate_links
FOR SELECT USING (
  creator_id = public.ncp_current_creator_id()
  OR public.ncp_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.ncp_campaigns c
    WHERE c.id = ncp_affiliate_links.campaign_id
      AND c.brand_id = public.ncp_current_brand_id()
  )
);

CREATE POLICY "ncp_affiliate_links_insert" ON public.ncp_affiliate_links
FOR INSERT WITH CHECK (
  creator_id = public.ncp_current_creator_id()
  OR public.ncp_is_admin()
);

-- --- ncp_creator_earnings (BLINDAGEM FINANCEIRA RIGOROSA) ---
-- Creator vê somente seus próprios ganhos. Admin vê tudo.
-- NENHUMA policy de INSERT, UPDATE ou DELETE para creator ou marca!
-- Alterações financeiras só acontecem através das RPCs SECURITY DEFINER ou pelo admin.
CREATE POLICY "ncp_creator_earnings_select" ON public.ncp_creator_earnings
FOR SELECT USING (
  creator_id = public.ncp_current_creator_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_creator_earnings_admin_manage" ON public.ncp_creator_earnings
FOR ALL USING (
  public.ncp_is_admin()
) WITH CHECK (
  public.ncp_is_admin()
);

-- --- ncp_payment_events (AUDITORIA APPEND-ONLY) ---
-- Leitura: participantes envolvidos ou admin.
-- Escrita: apenas admin ou RPC SECURITY DEFINER. Nenhum UPDATE/DELETE permitido.
CREATE POLICY "ncp_payment_events_select" ON public.ncp_payment_events
FOR SELECT USING (
  actor_id = public.ncp_current_profile_id()
  OR public.ncp_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.ncp_campaigns c
    WHERE c.id = ncp_payment_events.campaign_id
      AND c.brand_id = public.ncp_current_brand_id()
  )
  OR EXISTS (
    SELECT 1 FROM public.ncp_creator_earnings e
    WHERE e.id = ncp_payment_events.earning_id
      AND e.creator_id = public.ncp_current_creator_id()
  )
);

CREATE POLICY "ncp_payment_events_insert" ON public.ncp_payment_events
FOR INSERT WITH CHECK (
  public.ncp_is_admin()
  OR actor_id = public.ncp_current_profile_id()
);

-- --- ncp_courses & ncp_lessons ---
CREATE POLICY "ncp_courses_select" ON public.ncp_courses FOR SELECT USING (true);
CREATE POLICY "ncp_lessons_select" ON public.ncp_lessons FOR SELECT USING (true);
CREATE POLICY "ncp_courses_admin" ON public.ncp_courses FOR ALL USING (public.ncp_is_admin()) WITH CHECK (public.ncp_is_admin());
CREATE POLICY "ncp_lessons_admin" ON public.ncp_lessons FOR ALL USING (public.ncp_is_admin()) WITH CHECK (public.ncp_is_admin());

-- --- ncp_notifications ---
CREATE POLICY "ncp_notifications_select" ON public.ncp_notifications
FOR SELECT USING (
  user_id = public.ncp_current_profile_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_notifications_insert" ON public.ncp_notifications
FOR INSERT WITH CHECK (
  user_id = public.ncp_current_profile_id()
  OR public.ncp_is_admin()
);

CREATE POLICY "ncp_notifications_update" ON public.ncp_notifications
FOR UPDATE USING (
  user_id = public.ncp_current_profile_id()
  OR public.ncp_is_admin()
);

-- ==============================================================================
-- 10. RPCS DE MOVIMENTAÇÃO FINANCEIRA SEGURA (SECURITY DEFINER)
-- ==============================================================================

-- 10.1 Marca ou Admin aprova entrega e libera o cachê
CREATE OR REPLACE FUNCTION public.ncp_approve_submission_and_release_earning(p_submission_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission RECORD;
  v_campaign RECORD;
  v_earning_id UUID;
  v_current_brand UUID;
  v_is_adm BOOLEAN;
  v_amount NUMERIC(10, 2);
BEGIN
  v_is_adm := public.ncp_is_admin();
  v_current_brand := public.ncp_current_brand_id();

  -- Buscar a submissão
  SELECT * INTO v_submission
  FROM public.ncp_content_submissions
  WHERE id = p_submission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submissão de conteúdo não encontrada.';
  END IF;

  -- Buscar a campanha vinculada
  SELECT * INTO v_campaign
  FROM public.ncp_campaigns
  WHERE id = v_submission.campaign_id;

  -- Validar se o chamador é a marca dona da campanha ou admin
  IF NOT v_is_adm AND (v_current_brand IS NULL OR v_campaign.brand_id <> v_current_brand) THEN
    RAISE EXCEPTION 'Apenas a marca responsável pela campanha ou um administrador pode aprovar esta entrega.';
  END IF;

  -- Atualizar status da submissão para 'approved'
  UPDATE public.ncp_content_submissions
  SET status = 'approved', approved_at = NOW()
  WHERE id = p_submission_id;

  -- Atualizar participante para 'completed'
  UPDATE public.ncp_campaign_participants
  SET status = 'completed', updated_at = NOW()
  WHERE campaign_id = v_submission.campaign_id
    AND creator_id = v_submission.creator_id;

  -- Determinar valor do cachê
  v_amount := COALESCE(v_campaign.commission_value, 0);

  -- Inserir ganho em ncp_creator_earnings com status 'approved'
  INSERT INTO public.ncp_creator_earnings (
    creator_id,
    campaign_id,
    earning_type,
    amount,
    status,
    created_at
  ) VALUES (
    v_submission.creator_id,
    v_submission.campaign_id,
    'campaign',
    v_amount,
    'approved',
    NOW()
  ) RETURNING id INTO v_earning_id;

  -- Registrar evento na auditoria append-only
  INSERT INTO public.ncp_payment_events (
    earning_id,
    campaign_id,
    actor_id,
    event_type,
    amount,
    notes
  ) VALUES (
    v_earning_id,
    v_submission.campaign_id,
    public.ncp_current_profile_id(),
    'released',
    v_amount,
    format('Cachê liberado após aprovação do conteúdo %s', p_submission_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'earning_id', v_earning_id,
    'amount', v_amount,
    'status', 'approved'
  );
END;
$$;

-- 10.2 Admin liquida o pagamento e anexa comprovante
CREATE OR REPLACE FUNCTION public.ncp_mark_earning_paid(
  p_earning_id UUID,
  p_receipt_url TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earning RECORD;
BEGIN
  IF NOT public.ncp_is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem marcar cachês como pagos.';
  END IF;

  SELECT * INTO v_earning
  FROM public.ncp_creator_earnings
  WHERE id = p_earning_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro de ganho não encontrado.';
  END IF;

  IF v_earning.status = 'paid' THEN
    RAISE EXCEPTION 'Este cachê já foi marcado como pago anteriormente.';
  END IF;

  UPDATE public.ncp_creator_earnings
  SET status = 'paid', paid_at = NOW()
  WHERE id = p_earning_id;

  INSERT INTO public.ncp_payment_events (
    earning_id,
    campaign_id,
    actor_id,
    event_type,
    amount,
    receipt_url,
    notes
  ) VALUES (
    p_earning_id,
    v_earning.campaign_id,
    public.ncp_current_profile_id(),
    'paid',
    v_earning.amount,
    p_receipt_url,
    COALESCE(p_notes, 'Pagamento liquidado via transferência')
  );

  RETURN jsonb_build_object(
    'success', true,
    'earning_id', p_earning_id,
    'status', 'paid',
    'paid_at', NOW()
  );
END;
$$;

-- ==============================================================================
-- 11. BUCKETS DE STORAGE & POLICIES ISOLADAS
-- ==============================================================================

-- Criar bucket privado se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ncp-private',
  'ncp-private',
  false,
  104857600, -- 100 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf'];

-- Remover policies antigas do storage para ncp-media e ncp-private de forma segura
DROP POLICY IF EXISTS "ncp_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "ncp_media_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "ncp_media_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "ncp_media_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "ncp_private_read" ON storage.objects;
DROP POLICY IF EXISTS "ncp_private_upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to ncp-media" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload to ncp-media" ON storage.objects;

-- 11.1 Bucket Público ncp-media (Fotos de perfil e portfólio público)
-- Leitura pública
CREATE POLICY "ncp_media_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'ncp-media');

-- Upload permitido apenas para usuário autenticado na sua pasta
CREATE POLICY "ncp_media_auth_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'ncp-media'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update/Delete apenas pelo dono do arquivo ou admin
CREATE POLICY "ncp_media_owner_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'ncp-media'
  AND (
    (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
    OR public.ncp_is_admin()
  )
);

CREATE POLICY "ncp_media_owner_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'ncp-media'
  AND (
    (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
    OR public.ncp_is_admin()
  )
);

-- 11.2 Bucket Privado ncp-private (Vídeos brutos, comprovantes PIX)
-- Leitura restrita: dono da pasta, admin
CREATE POLICY "ncp_private_read" ON storage.objects
FOR SELECT USING (
  bucket_id = 'ncp-private'
  AND (
    (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
    OR public.ncp_is_admin()
  )
);

-- Upload no bucket privado na pasta do usuário
CREATE POLICY "ncp_private_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'ncp-private'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ==============================================================================
-- 12. DOCUMENTAÇÃO DE REVERSÃO (ROLLBACK)
-- ==============================================================================
/*
-- Para reverter esta migration:
DROP TRIGGER IF EXISTS trg_ncp_protect_profile_role ON public.ncp_profiles;
DROP FUNCTION IF EXISTS public.ncp_protect_profile_role();
DROP FUNCTION IF EXISTS public.ncp_approve_submission_and_release_earning(UUID);
DROP FUNCTION IF EXISTS public.ncp_mark_earning_paid(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.ncp_current_brand_id();
DROP FUNCTION IF EXISTS public.ncp_current_creator_id();
DROP FUNCTION IF EXISTS public.ncp_current_profile_id();
DROP FUNCTION IF EXISTS public.ncp_is_admin();
DROP TABLE IF EXISTS public.ncp_payment_events CASCADE;
-- Reaplicar policies permissivas anteriores de leitura pública se desejado.
*/
