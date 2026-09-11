-- ==============================================================================
-- NAIL CLUB PRO — TESTE DE VALIDAÇÃO DE SEGURANÇA E RLS
-- Executa em transação isolada com ROLLBACK garantido.
-- Testa 4 atores: Anon, Creator A, Creator B, Marca A, Marca B e Admin.
-- ==============================================================================

BEGIN;

CREATE TEMPORARY TABLE rls_test_results (
  test_id SERIAL PRIMARY KEY,
  test_name TEXT NOT NULL,
  expected TEXT NOT NULL,
  result TEXT NOT NULL,
  status TEXT NOT NULL -- 'PASS' ou 'FAIL'
);

DO $$
DECLARE
  v_user_admin_auth UUID := gen_random_uuid();
  v_user_creator_a_auth UUID := gen_random_uuid();
  v_user_creator_b_auth UUID := gen_random_uuid();
  v_user_brand_a_auth UUID := gen_random_uuid();
  v_user_brand_b_auth UUID := gen_random_uuid();

  v_profile_admin UUID;
  v_profile_creator_a UUID;
  v_profile_creator_b UUID;
  v_profile_brand_a UUID;
  v_profile_brand_b UUID;

  v_creator_a UUID;
  v_creator_b UUID;
  v_brand_a UUID;
  v_brand_b UUID;

  v_campaign_a UUID;
  v_submission_a UUID;
  v_earning_a UUID;

  v_count INTEGER;
  v_failed_as_expected BOOLEAN;
BEGIN
  -- 1. SETUP DE DADOS DE TESTE TEMPORÁRIOS
  INSERT INTO public.ncp_profiles (auth_user_id, role, full_name, email, status)
  VALUES (v_user_admin_auth, 'admin', 'Test Admin User', 'admin_test@test.local', 'active')
  RETURNING id INTO v_profile_admin;

  INSERT INTO public.ncp_profiles (auth_user_id, role, full_name, email, status)
  VALUES (v_user_creator_a_auth, 'creator', 'Test Creator A', 'creator_a@test.local', 'active')
  RETURNING id INTO v_profile_creator_a;

  INSERT INTO public.ncp_profiles (auth_user_id, role, full_name, email, status)
  VALUES (v_user_creator_b_auth, 'creator', 'Test Creator B', 'creator_b@test.local', 'active')
  RETURNING id INTO v_profile_creator_b;

  INSERT INTO public.ncp_profiles (auth_user_id, role, full_name, email, status)
  VALUES (v_user_brand_a_auth, 'brand', 'Test Brand A', 'brand_a@test.local', 'active')
  RETURNING id INTO v_profile_brand_a;

  INSERT INTO public.ncp_profiles (auth_user_id, role, full_name, email, status)
  VALUES (v_user_brand_b_auth, 'brand', 'Test Brand B', 'brand_b@test.local', 'active')
  RETURNING id INTO v_profile_brand_b;

  -- Criar perfis específicos
  INSERT INTO public.ncp_creator_profiles (user_id, professional_name, city, state)
  VALUES (v_profile_creator_a, 'Creator A', 'São Paulo', 'SP')
  RETURNING id INTO v_creator_a;

  INSERT INTO public.ncp_creator_profiles (user_id, professional_name, city, state)
  VALUES (v_profile_creator_b, 'Creator B', 'Rio de Janeiro', 'RJ')
  RETURNING id INTO v_creator_b;

  INSERT INTO public.ncp_brand_profiles (user_id, company_name, brand_name, contact_name, contact_email)
  VALUES (v_profile_brand_a, 'Empresa A LTDA', 'Marca A', 'Gestor A', 'brand_a@test.local')
  RETURNING id INTO v_brand_a;

  INSERT INTO public.ncp_brand_profiles (user_id, company_name, brand_name, contact_name, contact_email)
  VALUES (v_profile_brand_b, 'Empresa B LTDA', 'Marca B', 'Gestor B', 'brand_b@test.local')
  RETURNING id INTO v_brand_b;

  -- Campanha da Marca A
  INSERT INTO public.ncp_campaigns (
    brand_id, title, slug, description, start_date, end_date, application_deadline, commission_value, status
  ) VALUES (
    v_brand_a, 'Campanha Teste A', 'campanha-teste-a', 'Desc', NOW(), NOW() + interval '30 days', NOW() + interval '10 days', 350.00, 'open'
  ) RETURNING id INTO v_campaign_a;

  -- Submissão de Creator A na Campanha da Marca A
  INSERT INTO public.ncp_content_submissions (
    campaign_id, creator_id, media_url, published_url, status
  ) VALUES (
    v_campaign_a, v_creator_a, 'https://storage/test.mp4', 'https://instagram.com/p/test', 'submitted'
  ) RETURNING id INTO v_submission_a;

  -- Ganhos de Creator A
  INSERT INTO public.ncp_creator_earnings (
    creator_id, campaign_id, amount, status
  ) VALUES (
    v_creator_a, v_campaign_a, 350.00, 'approved'
  ) RETURNING id INTO v_earning_a;

  -- ==========================================================================
  -- TESTE 1: Creator B tenta ler os ganhos de Creator A (deve retornar 0)
  -- ==========================================================================
  PERFORM set_config('request.jwt.claim.sub', v_user_creator_b_auth::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT COUNT(*) INTO v_count
  FROM public.ncp_creator_earnings
  WHERE id = v_earning_a;

  IF v_count = 0 THEN
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Creator B não lê ganhos de Creator A', '0 linhas visíveis', format('%s linhas', v_count), 'PASS');
  ELSE
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Creator B não lê ganhos de Creator A', '0 linhas visíveis', format('%s linhas (VAZAMENTO)', v_count), 'FAIL');
  END IF;

  -- ==========================================================================
  -- TESTE 2: Creator A consegue ler seus próprios ganhos (deve retornar 1)
  -- ==========================================================================
  PERFORM set_config('request.jwt.claim.sub', v_user_creator_a_auth::text, true);

  SELECT COUNT(*) INTO v_count
  FROM public.ncp_creator_earnings
  WHERE id = v_earning_a;

  IF v_count = 1 THEN
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Creator A lê seus próprios ganhos', '1 linha visível', format('%s linha', v_count), 'PASS');
  ELSE
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Creator A lê seus próprios ganhos', '1 linha visível', format('%s linhas', v_count), 'FAIL');
  END IF;

  -- ==========================================================================
  -- TESTE 3: Creator A tenta se promover para Admin (Trigger deve bloquear)
  -- ==========================================================================
  v_failed_as_expected := false;
  BEGIN
    UPDATE public.ncp_profiles
    SET role = 'admin'
    WHERE id = v_profile_creator_a;
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true;
  END;

  IF v_failed_as_expected THEN
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Creator não se promove a admin', 'Exceção bloqueando elevação', 'Bloqueado por trigger', 'PASS');
  ELSE
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Creator não se promove a admin', 'Exceção bloqueando elevação', 'Permitiu promoção (FALHA)', 'FAIL');
  END IF;

  -- ==========================================================================
  -- TESTE 4: Marca B tenta aprovar envio da Marca A (RPC deve bloquear)
  -- ==========================================================================
  PERFORM set_config('request.jwt.claim.sub', v_user_brand_b_auth::text, true);
  v_failed_as_expected := false;
  BEGIN
    PERFORM public.ncp_approve_submission_and_release_earning(v_submission_a);
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true;
  END;

  IF v_failed_as_expected THEN
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Marca B não aprova envio de Marca A', 'Exceção de permissão da RPC', 'Bloqueado com sucesso', 'PASS');
  ELSE
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Marca B não aprova envio de Marca A', 'Exceção de permissão da RPC', 'Aprovou envio alheio (FALHA)', 'FAIL');
  END IF;

  -- ==========================================================================
  -- TESTE 5: Visitante Anônimo tenta inserir ganho (RLS deve bloquear)
  -- ==========================================================================
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
  v_failed_as_expected := false;
  BEGIN
    INSERT INTO public.ncp_creator_earnings (creator_id, amount, status)
    VALUES (v_creator_a, 9999.00, 'approved');
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true;
  END;

  -- Se não disparou exceção, verificar se RLS filtrou (0 rows inseridas)
  IF v_failed_as_expected THEN
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Anônimo não injeta ganhos falsos', 'Inserção rejeitada', 'Bloqueado com exceção', 'PASS');
  ELSE
    SELECT COUNT(*) INTO v_count FROM public.ncp_creator_earnings WHERE amount = 9999.00;
    IF v_count = 0 THEN
      INSERT INTO rls_test_results (test_name, expected, result, status)
      VALUES ('Anônimo não injeta ganhos falsos', '0 linhas inseridas', '0 linhas inseridas', 'PASS');
    ELSE
      INSERT INTO rls_test_results (test_name, expected, result, status)
      VALUES ('Anônimo não injeta ganhos falsos', '0 linhas inseridas', 'Injetou registro (FALHA)', 'FAIL');
    END IF;
  END IF;

  -- ==========================================================================
  -- TESTE 6: Marca A aprova sua própria entrega com sucesso via RPC
  -- ==========================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_user_brand_a_auth::text, true);

  BEGIN
    PERFORM public.ncp_approve_submission_and_release_earning(v_submission_a);
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Marca A aprova sua própria entrega', 'Sucesso via RPC', 'Aprovado e cachê liberado', 'PASS');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Marca A aprova sua própria entrega', 'Sucesso via RPC', SQLERRM, 'FAIL');
  END IF;

  -- ==========================================================================
  -- TESTE 7: Admin consegue auditar eventos de pagamento
  -- ==========================================================================
  PERFORM set_config('request.jwt.claim.sub', v_user_admin_auth::text, true);

  SELECT COUNT(*) INTO v_count
  FROM public.ncp_payment_events;

  IF v_count >= 1 THEN
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Admin audita tabela append-only ncp_payment_events', '>= 1 evento registrado', format('%s eventos', v_count), 'PASS');
  ELSE
    INSERT INTO rls_test_results (test_name, expected, result, status)
    VALUES ('Admin audita tabela append-only ncp_payment_events', '>= 1 evento registrado', '0 eventos (FALHA)', 'FAIL');
  END IF;

END $$;

SELECT test_id, test_name, expected, result, status FROM rls_test_results ORDER BY test_id;

-- ROLLBACK para que nenhum dado temporário de teste persista no banco
ROLLBACK;
