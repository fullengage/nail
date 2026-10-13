// ==============================================================================
// SQUAD UGC — ROTINA AGENDADA: EXECUTAR FILA DE MÉTRICAS (TODAS AS FAIXAS)
// ==============================================================================
// Roda de hora em hora (via cron / n8n / Supabase Scheduled Function).
// - Pega os creators vencidos por ordem de prioridade (Faixa A > B > C > sem faixa).
// - Respeita o limite de lote por hora configurado em squad_settings.
// - Em caso de erro: reagenda com intervalo crescente (backoff exponencial).
// - Em caso de sucesso: agenda a próxima de acordo com a prioridade e atividade.
// - Registra cada execução completa em creator_metric_runs.
//
// Uso:
//   node --env-file=.env scripts/executar-fila-metricas.mjs                (simulação / dry-run)
//   node --env-file=.env scripts/executar-fila-metricas.mjs --limite 10   (limita a 10 perfis)
//   node --env-file=.env scripts/executar-fila-metricas.mjs --apply       (executa e grava no banco)
// ==============================================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_METRIC_CONFIG,
  getCreatorTier,
  isAccountInactive,
  calculateNextLightSyncDate,
  sortQueueCandidates,
  parseSquadSettings,
} from '../src/services/metricsSyncService.ts';

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const TOKEN = process.env.APIFY_TOKEN;
const MAX_USD = Number(process.env.APIFY_MAX_USD || 18.5);

const CACHE_FILE = new URL('../data/metricas-fila-cache.json', import.meta.url);
const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};
const saveCache = () => writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

const arg = (k, d = null) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const APPLY = process.argv.includes('--apply');
const LIMIT_ARG = arg('--limite') ? Number(arg('--limite')) : null;

if (!SB_URL || !SB_KEY) {
  console.error('ERRO: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente no .env');
  process.exit(1);
}

const supabase = createClient(SB_URL, SB_KEY);
const handleOf = (h) => String(h || '').replace(/^@/, '').replace(/^https?:\/\/(www\.)?(tiktok|instagram)\.com\/@?/i, '').split(/[/?]/)[0].trim().toLowerCase();

async function budgetOk() {
  if (!TOKEN) return false;
  try {
    const res = await fetch(`https://api.apify.com/v2/users/me/limits?token=${TOKEN}`);
    const data = await res.json();
    const used = data?.data?.current?.monthlyUsageUsd ?? 0;
    if (used >= MAX_USD) {
      console.log(`[TRAVA] Orçamento atingido: US$ ${used.toFixed(2)} de ${MAX_USD}. Parando.`);
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

async function loadConfig() {
  try {
    const { data } = await supabase.from('squad_settings').select('key, value');
    if (data && data.length > 0) {
      return parseSquadSettings(data);
    }
  } catch {}
  return DEFAULT_METRIC_CONFIG;
}

async function fetchQueue(limit) {
  // 1. Tenta buscar via RPC otimizado (migração 20261011)
  try {
    const { data, error } = await supabase.rpc('get_creators_metrics_queue', { p_limit: limit });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {}

  // 2. Fallback caso a migração RPC ainda não tenha sido rodada
  const all = [];
  for (let from = 0; ; from += 1000) {
    let { data, error } = await supabase
      .from('creators')
      .select('id, professional_name, tiktok, instagram, tags, tiktok_followers, instagram_followers, created_at, last_post_at, next_light_sync_at')
      .range(from, from + 999);

    if (error && /column .* does not exist/i.test(error.message)) {
      // Fallback para colunas básicas antes da migração
      const fallbackRes = await supabase
        .from('creators')
        .select('id, professional_name, tiktok, instagram, tags, tiktok_followers, instagram_followers, created_at')
        .range(from, from + 999);
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }

  const eligible = all.filter((c) => (c.tiktok && c.tiktok.trim()) || (c.instagram && c.instagram.trim()));
  const sorted = sortQueueCandidates(eligible);
  return sorted.slice(0, limit);
}

async function recordMetricRunStart() {
  if (!APPLY) return null;
  try {
    const { data } = await supabase
      .from('creator_metric_runs')
      .insert({
        trigger_type: 'cron_hourly',
        metric_type: 'light',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    return data?.id || null;
  } catch {
    return null;
  }
}

async function recordMetricRunEnd(runId, { target, success, failed, errors }) {
  if (!APPLY || !runId) return;
  try {
    await supabase
      .from('creator_metric_runs')
      .update({
        completed_at: new Date().toISOString(),
        total_target: target,
        total_success: success,
        total_failed: failed,
        errors: errors.slice(0, 50),
        status: failed === target && target > 0 ? 'failed' : 'completed',
      })
      .eq('id', runId);
  } catch {}
}

// Coleta leve TikTok via Apify
async function collectTikTokLight(handles) {
  if (!handles.length) return {};
  if (!TOKEN) throw new Error('APIFY_TOKEN ausente');

  const results = {};
  const BATCH = 10;
  for (let i = 0; i < handles.length; i += BATCH) {
    if (!(await budgetOk())) break;
    const batch = handles.slice(i, i + BATCH);
    try {
      const res = await fetch(`https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/run-sync-get-dataset-items?token=${TOKEN}&timeout=300`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles: batch, resultsPerPage: 1 }),
      });
      if (!res.ok) {
        console.warn(`Lote TikTok ${i / BATCH + 1} falhou com status ${res.status}`);
        continue;
      }
      const items = await res.json();
      for (const h of batch) {
        const item = items.find((v) => handleOf(v.authorMeta?.name) === h);
        if (item?.authorMeta) {
          results[h] = {
            ok: true,
            followers: item.authorMeta.fans ?? null,
            lastPostAt: item.createTimeISO || (item.createTime ? new Date(item.createTime * 1000).toISOString() : null),
          };
        } else {
          results[h] = { ok: false, error: 'Perfil sem vídeos públicos ou não encontrado' };
        }
      }
    } catch (e) {
      console.warn(`Erro na chamada do lote TikTok: ${e.message}`);
    }
  }
  return results;
}

// Coleta leve Instagram via Apify
async function collectInstagramLight(handles) {
  if (!handles.length) return {};
  if (!TOKEN) throw new Error('APIFY_TOKEN ausente');

  const results = {};
  const BATCH = 25;
  for (let i = 0; i < handles.length; i += BATCH) {
    if (!(await budgetOk())) break;
    const batch = handles.slice(i, i + BATCH);
    try {
      const res = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${TOKEN}&timeout=300`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: batch }),
      });
      if (!res.ok) {
        console.warn(`Lote Instagram ${i / BATCH + 1} falhou com status ${res.status}`);
        continue;
      }
      const items = await res.json();
      for (const p of items) {
        const u = handleOf(p.username);
        if (u) {
          results[u] = {
            ok: true,
            followers: p.followersCount ?? null,
            lastPostAt: p.latestPosts?.[0]?.timestamp || null,
          };
        }
      }
      for (const h of batch) {
        if (!results[h]) results[h] = { ok: false, error: 'Perfil privado ou não encontrado' };
      }
    } catch (e) {
      console.warn(`Erro na chamada do lote Instagram: ${e.message}`);
    }
  }
  return results;
}

async function handleSuccess(creator, platform, followers, lastPostAt, config) {
  const now = new Date().toISOString();
  const tier = getCreatorTier(creator);
  const isInactive = isAccountInactive(lastPostAt || creator.last_post_at, config.inactiveThresholdDays);
  const nextSync = calculateNextLightSyncDate(tier, isInactive, 0, config);

  // 1. Grava snapshot de histórico
  const metricPayload = {
    creator_id: creator.id,
    platform,
    collected_at: now,
    followers,
    posts_analyzed: 0,
    metric_type: 'light',
    data_source: 'apify',
    last_post_at: lastPostAt || null,
  };

  const { error: insErr } = await supabase.from('creator_metrics').insert(metricPayload);
  if (insErr && /column "metric_type"|column "data_source"/i.test(insErr.message)) {
    // Fallback retrocompatível
    await supabase.from('creator_metrics').insert({
      creator_id: creator.id,
      platform,
      collected_at: now,
      followers,
      posts_analyzed: 0,
    });
  }

  // 2. Atualiza cadastro e agenda próxima medição
  const creatorUpdates = {
    updated_at: now,
    last_light_sync_at: now,
    next_light_sync_at: nextSync,
    sync_error_count: 0,
    sync_error_last: null,
    ...(platform === 'tiktok' ? { tiktok_followers: followers } : { instagram_followers: followers }),
    ...(lastPostAt ? { last_post_at: lastPostAt } : {}),
  };

  const { error: upErr } = await supabase.from('creators').update(creatorUpdates).eq('id', creator.id);
  if (upErr && /column "last_light_sync_at"/i.test(upErr.message)) {
    await supabase.from('creators').update({
      updated_at: now,
      ...(platform === 'tiktok' ? { tiktok_followers: followers } : { instagram_followers: followers }),
    }).eq('id', creator.id);
  }
}

async function handleFailure(creator, errorMessage, config) {
  const tier = getCreatorTier(creator);
  const currentErrors = (creator.sync_error_count || 0) + 1;
  const isInactive = isAccountInactive(creator.last_post_at, config.inactiveThresholdDays);
  const nextRetry = calculateNextLightSyncDate(tier, isInactive, currentErrors, config);

  try {
    await supabase.from('creators').update({
      sync_error_count: currentErrors,
      sync_error_last: String(errorMessage).slice(0, 300),
      next_light_sync_at: nextRetry,
      updated_at: new Date().toISOString(),
    }).eq('id', creator.id);
  } catch {}
}

async function run() {
  console.log('=== SQUAD UGC — EXECUTOR DA FILA DE MÉTRICAS (POR PRIORIDADE) ===\n');

  const config = await loadConfig();
  const limit = LIMIT_ARG || config.batchHourlyLimit;
  console.log(`Configuração ativa: limite de ${limit} creators por lote horária`);

  console.log('1. Carregando fila por prioridade...');
  const queue = await fetchQueue(limit);
  console.log(`Creators elegíveis na fila: ${queue.length}`);

  if (!queue.length) {
    console.log('Nenhum creator com medição pendente no momento.');
    return;
  }

  console.log('\nComposição da fila para este lote:');
  const countsByTier = { A: 0, B: 0, C: 0, none: 0 };
  for (const c of queue) {
    countsByTier[getCreatorTier(c)]++;
  }
  console.log(`  - Faixa A (Prioritário): ${countsByTier.A}`);
  console.log(`  - Faixa B (Qualificado): ${countsByTier.B}`);
  console.log(`  - Faixa C (Fora de perfil): ${countsByTier.C}`);
  console.log(`  - Sem faixa: ${countsByTier.none}`);
  console.log(`Modo: ${APPLY ? 'APLICAÇÃO REAL (GRAVANDO NO BANCO)' : 'SIMULAÇÃO / DRY-RUN (sem gravação)'}\n`);

  if (!TOKEN) {
    console.log('AVISO: APIFY_TOKEN ausente. Simulação dos 10 primeiros da fila:');
    for (const c of queue.slice(0, 10)) {
      const t = getCreatorTier(c);
      console.log(`  [Faixa ${t.toUpperCase()}] ${c.professional_name}: TT @${handleOf(c.tiktok) || '—'} | IG @${handleOf(c.instagram) || '—'}`);
    }
    return;
  }

  const runId = await recordMetricRunStart();
  let successCount = 0;
  let failCount = 0;
  const errors = [];

  const ttHandles = [...new Set(queue.map((c) => handleOf(c.tiktok)).filter(Boolean))];
  const igHandles = [...new Set(queue.map((c) => handleOf(c.instagram)).filter(Boolean))];

  console.log(`2. Coletando dados leves: ${ttHandles.length} no TikTok, ${igHandles.length} no Instagram...`);
  const ttData = await collectTikTokLight(ttHandles);
  const igData = await collectInstagramLight(igHandles);

  console.log('3. Atualizando banco e reagendando fila...');
  for (const c of queue) {
    const ttH = handleOf(c.tiktok);
    const igH = handleOf(c.instagram);
    const tier = getCreatorTier(c);

    const ttRes = ttH ? ttData[ttH] : null;
    const igRes = igH ? igData[igH] : null;

    let cSuccess = false;
    let lastErr = null;

    if (ttRes?.ok && ttRes.followers != null) {
      if (APPLY) await handleSuccess(c, 'tiktok', ttRes.followers, ttRes.lastPostAt, config);
      cSuccess = true;
      cache[`tt:${ttH}`] = { followers: ttRes.followers, at: new Date().toISOString(), lastPostAt: ttRes.lastPostAt };
      console.log(`  [OK - Faixa ${tier}] TikTok @${ttH}: ${ttRes.followers} seguidores`);
    } else if (ttH && ttRes && !ttRes.ok) {
      lastErr = ttRes.error;
    }

    if (igRes?.ok && igRes.followers != null) {
      if (APPLY) await handleSuccess(c, 'instagram', igRes.followers, igRes.lastPostAt, config);
      cSuccess = true;
      cache[`ig:${igH}`] = { followers: igRes.followers, at: new Date().toISOString(), lastPostAt: igRes.lastPostAt };
      console.log(`  [OK - Faixa ${tier}] Instagram @${igH}: ${igRes.followers} seguidores`);
    } else if (igH && igRes && !igRes.ok) {
      lastErr = lastErr ? `${lastErr} | ${igRes.error}` : igRes.error;
    }

    if (cSuccess) {
      successCount++;
    } else {
      failCount++;
      const errMsg = lastErr || 'Perfil não retornou dados';
      errors.push({ creator_id: c.id, handle: ttH ? `@${ttH}` : `@${igH}`, error: errMsg });
      console.log(`  [FALHA - Faixa ${tier}] ${c.professional_name}: ${errMsg}`);
      if (APPLY) await handleFailure(c, errMsg, config);
    }
  }

  saveCache();
  await recordMetricRunEnd(runId, { target: queue.length, success: successCount, failed: failCount, errors });

  console.log('\n=== RESUMO DA EXECUÇÃO DA FILA ===');
  console.log(`Creators processados: ${queue.length}`);
  console.log(`Sucessos: ${successCount}`);
  console.log(`Falhas: ${failCount}`);
  console.log(`Cache atualizado em: data/metricas-fila-cache.json`);
}

run().catch((e) => {
  console.error('Falha na execução:', e);
  process.exit(1);
});
