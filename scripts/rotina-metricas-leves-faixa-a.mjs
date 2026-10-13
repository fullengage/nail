// ==============================================================================
// SQUAD UGC — ROTINA DE MEDIÇÃO LEVE DIÁRIA (FAIXA A)
// ==============================================================================
// Coleta leve: seguidores e data do último post (uma chamada por creator).
// Grava uma nova linha histórica em creator_metrics (metric_type = 'light')
// e atualiza o cadastro do creator em creators com os seguidores e timestamps de fila.
//
// Uso:
//   node --env-file=.env scripts/rotina-metricas-leves-faixa-a.mjs               (mostra o que vai medir)
//   node --env-file=.env scripts/rotina-metricas-leves-faixa-a.mjs --limite 5   (mede 5 perfis para teste)
//   node --env-file=.env scripts/rotina-metricas-leves-faixa-a.mjs --apply      (executa e grava no Supabase)
// ==============================================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const TOKEN = process.env.APIFY_TOKEN;
const MAX_USD = Number(process.env.APIFY_MAX_USD || 18.5);

const CACHE_FILE = new URL('../data/metricas-leves-faixa-a.json', import.meta.url);
const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};
const saveCache = () => writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

const arg = (k, d = null) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const APPLY = process.argv.includes('--apply');
const DRY_RUN = process.argv.includes('--dry-run') || !APPLY;
const LIMIT = arg('--limite') ? Number(arg('--limite')) : null;
const SINGLE_USER = arg('--usuario');

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

async function recordMetricRunStart() {
  if (!APPLY) return null;
  try {
    const { data } = await supabase
      .from('creator_metric_runs')
      .insert({
        trigger_type: 'cli_tier_a',
        metric_type: 'light',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    return data?.id || null;
  } catch {
    return null; // tabela de runs pode ainda não ter sido migrada
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

async function fetchTierACreators() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('creators')
      .select('id, professional_name, tiktok, instagram, tags, tiktok_followers, instagram_followers')
      .range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }

  return all.filter((c) => {
    const tags = c.tags || [];
    return tags.some((t) => t.includes('A - Prioritário'));
  });
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
        console.warn(`Lote TikTok ${i / BATCH + 1} falhou: ${res.status}`);
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
        console.warn(`Lote Instagram ${i / BATCH + 1} falhou: ${res.status}`);
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

// Grava snapshot leve em creator_metrics e atualiza creators
async function saveLightMeasurement(creatorId, platform, followers, lastPostAt) {
  const now = new Date().toISOString();
  const nextLight = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  // 1. Grava snapshot em creator_metrics
  const metricPayload = {
    creator_id: creatorId,
    platform,
    collected_at: now,
    followers,
    posts_analyzed: 0,
    metric_type: 'light',
    data_source: 'apify',
    last_post_at: lastPostAt || null,
  };

  let metricError = null;
  const { error: insErr } = await supabase.from('creator_metrics').insert(metricPayload);
  if (insErr) {
    // Se colunas novas ainda não existirem (antes da migração), faz fallback
    if (/column "metric_type"|column "data_source"/i.test(insErr.message)) {
      const fallbackPayload = {
        creator_id: creatorId,
        platform,
        collected_at: now,
        followers,
        posts_analyzed: 0,
      };
      const { error: fErr } = await supabase.from('creator_metrics').insert(fallbackPayload);
      metricError = fErr;
    } else {
      metricError = insErr;
    }
  }

  // 2. Atualiza totais e fila em creators
  const creatorUpdates = {
    updated_at: now,
    last_light_sync_at: now,
    next_light_sync_at: nextLight,
    sync_error_count: 0,
    sync_error_last: null,
    ...(platform === 'tiktok' ? { tiktok_followers: followers } : { instagram_followers: followers }),
    ...(lastPostAt ? { last_post_at: lastPostAt } : {}),
  };

  const { error: upErr } = await supabase.from('creators').update(creatorUpdates).eq('id', creatorId);
  if (upErr && /column "last_light_sync_at"/i.test(upErr.message)) {
    // Fallback caso a migração ainda não tenha sido rodada
    const minimalUpdates = {
      updated_at: now,
      ...(platform === 'tiktok' ? { tiktok_followers: followers } : { instagram_followers: followers }),
    };
    await supabase.from('creators').update(minimalUpdates).eq('id', creatorId);
  }

  return { ok: !metricError, error: metricError?.message };
}

async function run() {
  console.log('=== SQUAD UGC — ROTINA DE MEDIÇÃO LEVE DIÁRIA (FAIXA A) ===\n');

  console.log('1. Carregando creators da Faixa A do banco...');
  let creators = await fetchTierACreators();
  console.log(`Creators na Faixa A: ${creators.length}`);

  if (SINGLE_USER) {
    creators = creators.filter((c) => handleOf(c.tiktok) === handleOf(SINGLE_USER) || handleOf(c.instagram) === handleOf(SINGLE_USER));
    console.log(`Filtrado para usuário único: ${SINGLE_USER} (${creators.length} encontrado)`);
  }

  if (LIMIT && LIMIT > 0) {
    creators = creators.slice(0, LIMIT);
    console.log(`Limitando execução para ${creators.length} creators`);
  }

  const ttHandles = [...new Set(creators.map((c) => handleOf(c.tiktok)).filter(Boolean))];
  const igHandles = [...new Set(creators.map((c) => handleOf(c.instagram)).filter(Boolean))];

  console.log(`Perfis a medir: ${ttHandles.length} no TikTok, ${igHandles.length} no Instagram`);
  console.log(`Modo: ${APPLY ? 'APLICAÇÃO REAL (GRAVANDO NO BANCO)' : 'SIMULAÇÃO / DRY-RUN (sem gravação)'}\n`);

  if (!TOKEN) {
    console.log('AVISO: APIFY_TOKEN ausente no .env. Mostrando resumo e alvos da fila.');
    for (const c of creators.slice(0, 10)) {
      console.log(`  - ${c.professional_name}: TT @${handleOf(c.tiktok) || '—'} (${c.tiktok_followers || 0} seg) | IG @${handleOf(c.instagram) || '—'} (${c.instagram_followers || 0} seg)`);
    }
    return;
  }

  const runId = await recordMetricRunStart();
  let successCount = 0;
  let failCount = 0;
  const errors = [];

  console.log('2. Coletando métricas leves do TikTok...');
  const ttData = await collectTikTokLight(ttHandles);

  console.log('3. Coletando métricas leves do Instagram...');
  const igData = await collectInstagramLight(igHandles);

  console.log('\n4. Processando resultados...');
  for (const c of creators) {
    const ttH = handleOf(c.tiktok);
    const igH = handleOf(c.instagram);

    const ttRes = ttH ? ttData[ttH] : null;
    const igRes = igH ? igData[igH] : null;

    let cSuccess = false;

    // Processa TikTok
    if (ttRes?.ok && ttRes.followers != null) {
      if (APPLY) {
        await saveLightMeasurement(c.id, 'tiktok', ttRes.followers, ttRes.lastPostAt);
      }
      cSuccess = true;
      cache[`tt:${ttH}`] = { followers: ttRes.followers, at: new Date().toISOString(), lastPostAt: ttRes.lastPostAt };
      console.log(`  [OK] TikTok @${ttH}: ${ttRes.followers} seguidores (antigo: ${c.tiktok_followers || '—'})`);
    } else if (ttH && ttRes && !ttRes.ok) {
      errors.push({ creator_id: c.id, handle: `@${ttH}`, error: ttRes.error });
      console.log(`  [FALHA] TikTok @${ttH}: ${ttRes.error}`);
    }

    // Processa Instagram
    if (igRes?.ok && igRes.followers != null) {
      if (APPLY) {
        await saveLightMeasurement(c.id, 'instagram', igRes.followers, igRes.lastPostAt);
      }
      cSuccess = true;
      cache[`ig:${igH}`] = { followers: igRes.followers, at: new Date().toISOString(), lastPostAt: igRes.lastPostAt };
      console.log(`  [OK] Instagram @${igH}: ${igRes.followers} seguidores (antigo: ${c.instagram_followers || '—'})`);
    } else if (igH && igRes && !igRes.ok) {
      errors.push({ creator_id: c.id, handle: `@${igH}`, error: igRes.error });
      console.log(`  [FALHA] Instagram @${igH}: ${igRes.error}`);
    }

    if (cSuccess) successCount++;
    else failCount++;
  }

  saveCache();
  await recordMetricRunEnd(runId, { target: creators.length, success: successCount, failed: failCount, errors });

  console.log('\n=== RESUMO DA EXECUÇÃO ===');
  console.log(`Creators processados: ${creators.length}`);
  console.log(`Sucessos: ${successCount}`);
  console.log(`Falhas: ${failCount}`);
  console.log(`Cache atualizado em: data/metricas-leves-faixa-a.json`);
}

run().catch((e) => {
  console.error('Falha na execução:', e);
  process.exit(1);
});
