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

  console.log('\n============================================================');
  const allTestsPassed = t1Passed && t2Passed && t3Passed && allSuspended && rpcExists;
  if (allTestsPassed) {
    console.log('🎉 TODOS OS TESTES DE RLS PASSARAM COM SUCESSO! PLATAFORMA BLINDADA.');
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
