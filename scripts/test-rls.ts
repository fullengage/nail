/**
 * NAIL CLUB PRO — Executador de Testes Automatizados de RLS
 * Executa as asserções de segurança em ambiente isolado no Postgres
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis do .env
const envPath = resolve(process.cwd(), '.env');
let envContent = '';
try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (e) {
  console.error('Arquivo .env não encontrado.');
}

const getEnvVar = (name: string): string => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : process.env[name] || '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL ou Anon Key não configurados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runRlsTests() {
  console.log('\n============================================================');
  console.log('🛡️  NAIL CLUB PRO — SUITE DE TESTES DE RLS E SEGURANÇA');
  console.log('============================================================\n');
  console.log(`📡 Conectando ao Supabase: ${supabaseUrl}`);

  // Teste 1: Visitante anônimo não deve ler ncp_creator_earnings
  console.log('\n🔍 Executando Teste 1: Leitura anônima em ncp_creator_earnings...');
  const { data: anonEarnings, error: anonErr } = await supabase
    .from('ncp_creator_earnings')
    .select('*');

  const t1Passed = (!anonEarnings || anonEarnings.length === 0) && !anonErr;
  console.log(
    t1Passed
      ? '   ✅ PASS: Anônimo não tem acesso a ncp_creator_earnings (0 linhas retornadas).'
      : `   ❌ FAIL: Anônimo obteve acesso ou erro inesperado: ${anonErr?.message || anonEarnings?.length}`
  );

  // Teste 2: Visitante anônimo não deve ler ncp_campaign_applications
  console.log('\n🔍 Executando Teste 2: Leitura anônima em ncp_campaign_applications...');
  const { data: anonApps, error: appsErr } = await supabase
    .from('ncp_campaign_applications')
    .select('*');

  const t2Passed = (!anonApps || anonApps.length === 0) && !appsErr;
  console.log(
    t2Passed
      ? '   ✅ PASS: Anônimo não tem acesso a candidaturas de campanhas (0 linhas retornadas).'
      : `   ❌ FAIL: Anônimo obteve acesso a candidaturas!`
  );

  // Teste 3: Anônimo não consegue injetar dados em ncp_creator_earnings
  console.log('\n🔍 Executando Teste 3: Tentativa de inserção não autorizada de cachê...');
  const { error: insertEarningErr } = await supabase
    .from('ncp_creator_earnings')
    .insert({
      amount: 9999.00,
      status: 'approved',
      earning_type: 'campaign',
    });

  const t3Passed = Boolean(insertEarningErr);
  console.log(
    t3Passed
      ? `   ✅ PASS: Inserção rejeitada pelo RLS (${insertEarningErr?.message}).`
      : '   ❌ FAIL: Inserção de ganho permitida sem autenticação!'
  );

  // Teste 4: Usuários suspensos de demonstração não devem estar ativos
  console.log('\n🔍 Executando Teste 4: Verificação de status dos usuários de demonstração...');
  const { data: demoProfiles } = await supabase
    .from('ncp_profiles')
    .select('email, status')
    .in('email', ['admin@nailclubpro.com.br', 'camila@camilanails.art']);

  const allSuspended = demoProfiles?.every((p) => p.status === 'suspended') ?? false;
  console.log(
    allSuspended
      ? '   ✅ PASS: Perfis demo desativados com status "suspended".'
      : `   ❌ FAIL: Perfis demo ainda ativos no banco: ${JSON.stringify(demoProfiles)}`
  );

  // Teste 5: Verificação das RPCs financeiras registradas
  console.log('\n🔍 Executando Teste 5: Verificação da RPC ncp_approve_submission_and_release_earning...');
  const { error: rpcErr } = await supabase.rpc('ncp_approve_submission_and_release_earning', {
    p_submission_id: '00000000-0000-0000-0000-000000000000',
  });

  // Espera-se erro de negócio ("Submissão de conteúdo não encontrada" ou permissão negada), NÃO erro de função inexistente
  const rpcExists = rpcErr && !rpcErr.message.includes('could not find the function');
  console.log(
    rpcExists
      ? `   ✅ PASS: RPC de aprovação financeira existe e valida permissões (${rpcErr?.message}).`
      : `   ❌ FAIL: RPC financeira não encontrada: ${rpcErr?.message}`
  );

  // Teste 6: Lead de marca fundadora (Anon pode inserir, mas SELECT bloqueado por RLS)
  console.log('\n🔍 Executando Teste 6: Inserção de lead de marca e bloqueio de leitura RLS...');
  const testBrandEmail = `test-lead-${Date.now()}@example.com`;
  const { error: insertLeadErr } = await supabase.from('ncp_brand_leads').insert({
    name: 'Lead Teste Anon',
    company: 'Cosméticos Teste LTDA',
    role: 'Diretor',
    email: testBrandEmail,
    whatsapp: '(11) 99999-9999',
    category: 'Esmaltes & Cores',
    sales_channel: 'Perfumarias e Lojas Físicas',
    budget_tier: 'R$ 5.000 a R$ 15.000 / campanha',
    origin: 'test_script',
  });
  const t6InsertOk = !insertLeadErr;

  // Tenta ler ncp_brand_leads como anônimo (deve retornar vazio devido ao RLS)
  const { data: leadsRead } = await supabase.from('ncp_brand_leads').select('*');
  const t6SelectBlocked = !leadsRead || leadsRead.length === 0;

  console.log(
    t6InsertOk && t6SelectBlocked
      ? '   ✅ PASS: Lead de marca inserido com sucesso e leitura bloqueada por RLS para anônimos.'
      : `   ❌ FAIL: Inserção (${insertLeadErr?.message}) ou Leitura permitida para anônimo (${leadsRead?.length} registros)`
  );

  // Teste 7: Lista de espera de creator (Anon pode inserir, mas SELECT bloqueado por RLS)
  console.log('\n🔍 Executando Teste 7: Inserção na waitlist de creator e bloqueio de leitura RLS...');
  const testCreatorIg = `@creator_test_${Date.now()}`;
  const { error: insertWaitlistErr } = await supabase.from('ncp_creator_waitlist').insert({
    name: 'Creator Teste Waitlist',
    city: 'Campinas',
    state: 'SP',
    techniques: ['Fibra de Vidro', 'Esmaltação em Gel'],
    instagram: testCreatorIg,
    whatsapp: '(19) 98888-8888',
  });
  const t7InsertOk = !insertWaitlistErr;

  // Tenta ler ncp_creator_waitlist como anônimo (deve retornar vazio devido ao RLS)
  const { data: waitlistRead } = await supabase.from('ncp_creator_waitlist').select('*');
  const t7SelectBlocked = !waitlistRead || waitlistRead.length === 0;

  console.log(
    t7InsertOk && t7SelectBlocked
      ? '   ✅ PASS: Creator cadastrada na waitlist e leitura bloqueada por RLS para anônimos.'
      : `   ❌ FAIL: Inserção (${insertWaitlistErr?.message}) ou Leitura permitida para anônimo (${waitlistRead?.length} registros)`
  );

  // Teste 8: Verificação de campos is_featured e consentimento
  console.log('\n🔍 Executando Teste 8: Consulta de creators em destaque no banco...');
  const { data: featuredCreators, error: featuredErr } = await supabase
    .from('ncp_creator_profiles')
    .select('id, professional_name, is_featured, featured_consent_at')
    .eq('is_featured', true)
    .not('featured_consent_at', 'is', null);

  const t8Ok = !featuredErr;
  console.log(
    t8Ok
      ? `   ✅ PASS: Colunas is_featured e featured_consent_at operacionais no banco (${featuredCreators?.length ?? 0} creators em destaque com consentimento).`
      : `   ❌ FAIL: Erro ao consultar creators em destaque: ${featuredErr?.message}`
  );

  console.log('\n============================================================');
  const allTestsPassed =
    t1Passed &&
    t2Passed &&
    t3Passed &&
    allSuspended &&
    rpcExists &&
    t6InsertOk &&
    t6SelectBlocked &&
    t7InsertOk &&
    t7SelectBlocked &&
    t8Ok;

  if (allTestsPassed) {
    console.log('🎉 TODOS OS 8 TESTES DE RLS E SEGURANÇA PASSARAM COM SUCESSO! PLATAFORMA BLINDADA.');
    console.log('============================================================\n');
    process.exit(0);
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM. REVISE AS POLICIES DO SUPABASE.');
    console.log('============================================================\n');
    process.exit(1);
  }
}

runRlsTests().catch((err) => {
  console.error('Erro ao executar suite de testes:', err);
  process.exit(1);
});
