// Mede o desempenho dos creators no TikTok (últimos 12 posts) e grava um snapshot em creator_metrics.
// Apify clockworks~free-tiktok-scraper, input por perfil. Cache retomável em data/tt-metricas.json.
//
// Uso: node --env-file=.env scripts/medir-creator-tiktok.mjs --usuario @agar293   (só mede e mostra)
//      node --env-file=.env scripts/medir-creator-tiktok.mjs --limite 100          (mede 100 da base)
//      node --env-file=.env scripts/medir-creator-tiktok.mjs --apply               (grava o que está no cache)
// .env: APIFY_TOKEN (sem VITE_), SUPABASE_SERVICE_ROLE_KEY (gravação), APIFY_MAX_USD (trava, padrão 18.5)
// Custo: ~US$ 0,003 por post × 12 posts = ~US$ 0,036 por creator (~US$ 3,60 por 100).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { POSTS, snapshotOf } from './lib/snapshot.mjs';

const TOKEN = process.env.APIFY_TOKEN;
const SB_URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CACHE = new URL('../data/tt-metricas.json', import.meta.url);
const BATCH = 10; // perfis por chamada
const MAX_USD = Number(process.env.APIFY_MAX_USD || 18.5);
const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const handleOf = (h) => (h || '').replace(/^@/, '').trim().toLowerCase();
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const save = () => writeFileSync(CACHE, JSON.stringify(cache));
const DAY = 86400000;

async function budgetOk() {
  const r = await fetch(`https://api.apify.com/v2/users/me/limits?token=${TOKEN}`).then((x) => x.json()).catch(() => null);
  const used = r?.data?.current?.monthlyUsageUsd ?? 0;
  if (used >= MAX_USD) { console.log(`orçamento atingido: US$ ${used.toFixed(2)} de ${MAX_USD}. Parando (cache salvo).`); return false; }
  return true;
}
async function sb(path, init = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? null : r.json();
}

// ---------- gravação ----------
if (process.argv.includes('--apply')) {
  if (!KEY) { console.log('Falta SUPABASE_SERVICE_ROLE_KEY no .env'); process.exit(1); }
  const pend = Object.entries(cache).filter(([, c]) => c.ok && !c.applied_at);
  let ok = 0, sem = 0;
  for (const [h, c] of pend) {
    const [creator] = await sb(`creators?select=id&tiktok=in.(${encodeURIComponent(`"@${h}","${h}"`)})&limit=1`);
    if (!creator) { sem++; continue; }
    await sb('creator_metrics', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ creator_id: creator.id, collected_at: c.collected_at, ...c.snapshot }) });
    c.applied_at = new Date().toISOString();
    ok++;
  }
  save();
  console.log(`creator_metrics: ${ok} snapshots gravados${sem ? ` · ${sem} perfis fora da base (não gravados)` : ''}`);
  process.exit(0);
}

// ---------- coleta ----------
if (!TOKEN) { console.log('Falta APIFY_TOKEN no .env'); process.exit(1); }
let queue;
if (arg('--usuario')) queue = [handleOf(arg('--usuario'))];
else {
  if (!KEY) { console.log('Falta SUPABASE_SERVICE_ROLE_KEY no .env (para ler a lista de creators)'); process.exit(1); }
  const all = [];
  for (let f = 0; ; f += 1000) {
    const rows = await sb('creators?select=tiktok,tiktok_followers&tiktok=neq.&order=tiktok_followers.desc.nullslast', { headers: { Range: `${f}-${f + 999}` } });
    all.push(...rows);
    if (rows.length < 1000) break;
  }
  // mede de novo só quem não foi medido nos últimos 25 dias (assim o histórico fecha ~30 dias)
  queue = [...new Set(all.map((r) => handleOf(r.tiktok)).filter(Boolean))].filter((h) => !cache[h]?.ok || Date.now() - Date.parse(cache[h].collected_at) > 25 * DAY);
  if (arg('--limite')) queue = queue.slice(0, Number(arg('--limite')));
}
console.log(`perfis a medir: ${queue.length} (~US$ ${(queue.length * POSTS * 0.003).toFixed(2)})`);
for (let i = 0; i < queue.length; i += BATCH) {
  if (!(await budgetOk())) break;
  const lote = queue.slice(i, i + BATCH);
  const r = await fetch(`https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/run-sync-get-dataset-items?token=${TOKEN}&timeout=300`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profiles: lote, resultsPerPage: POSTS }),
  });
  if (r.status === 402) { console.log('sem créditos no Apify'); break; }
  if (!r.ok) { console.log(`lote ${i / BATCH + 1}: erro ${r.status} ${(await r.text()).slice(0, 150)}`); break; }
  const items = await r.json();
  for (const h of lote) {
    const vids = items.filter((v) => handleOf(v.authorMeta?.name) === h);
    cache[h] = vids.length
      // posts brutos ficam no cache para recalcular sem nova coleta
      ? { ok: true, collected_at: new Date().toISOString(), raw: vids.map((v) => ({ playCount: v.playCount, diggCount: v.diggCount, commentCount: v.commentCount, shareCount: v.shareCount, createTimeISO: v.createTimeISO, createTime: v.createTime, webVideoUrl: v.webVideoUrl, videoMeta: { coverUrl: v.videoMeta?.coverUrl }, hashtags: v.hashtags, isAd: v.isAd, isSponsored: v.isSponsored, isPinned: v.isPinned, authorMeta: { name: v.authorMeta?.name, fans: v.authorMeta?.fans } })), snapshot: snapshotOf(vids) }
      : { ok: false, reason: 'perfil privado, inexistente ou sem posts', collected_at: new Date().toISOString() };
  }
  save();
  console.log(`lote ${i / BATCH + 1}: ${lote.filter((h) => cache[h].ok).length}/${lote.length} medidos`);
}
for (const h of queue.slice(0, 5)) {
  const s = cache[h]?.snapshot;
  if (s) console.log(`  @${h} · ${s.followers} seg · ${s.posts_analyzed} posts · views ${s.avg_views} · curtidas ${s.avg_likes} · coment. ${s.avg_comments} · compart. ${s.avg_shares} · ER/views ${s.er_by_views}% · ER/seg ${s.er_by_followers}% · publis 180d ${s.paid_posts_180d ?? '—'}`);
}
