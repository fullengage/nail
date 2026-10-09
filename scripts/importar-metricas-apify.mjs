// Transforma o que já foi raspado no Apify (data/apify/, baixado da conta) em snapshots de creator_metrics.
// Não gasta crédito do Apify. Só grava perfis que estão na base (creators.tiktok / creators.instagram)
// e com pelo menos MIN_POSTS posts; data da coleta = início da execução no Apify.
//
// Uso: node --env-file=.env --experimental-strip-types scripts/importar-metricas-apify.mjs          (só mostra)
//      node --env-file=.env --experimental-strip-types scripts/importar-metricas-apify.mjs --apply  (grava)
// .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { MIN_POSTS, snapshotOf, igSnapshotOf } from './lib/snapshot.mjs';

const DIR = new URL('../data/apify/', import.meta.url);
const SB_URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes('--apply');
const handleOf = (h) => String(h || '').replace(/^@/, '').replace(/^https?:\/\/(www\.)?(tiktok|instagram)\.com\/@?/i, '').split(/[/?]/)[0].trim().toLowerCase();
if (!existsSync(DIR)) { console.log('Falta data/apify/ (baixe os datasets do Apify antes).'); process.exit(1); }
if (!SB_URL || !KEY) { console.log('Falta VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env'); process.exit(1); }

async function sb(path, init = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 || r.status === 201 ? null : r.json();
}
async function all(path) {
  const out = [];
  for (let f = 0; ; f += 1000) {
    const rows = await sb(path, { headers: { Range: `${f}-${f + 999}` } });
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

// arquivos: data/apify/<ator>/<início da execução>_<runId>.json
const runs = (actor) => (existsSync(new URL(`${actor}/`, DIR)) ? readdirSync(new URL(`${actor}/`, DIR)) : []).map((f) => ({
  at: f.split('_')[0].replace(/T(\d\d)-(\d\d)-(\d\d)-(\d+)Z$/, 'T$1:$2:$3.$4Z'),
  items: JSON.parse(readFileSync(new URL(`${actor}/${f}`, DIR), 'utf8')),
}));

// TikTok: junta os vídeos de todas as execuções por perfil (sem repetir vídeo); data = execução mais recente
const tt = new Map();
for (const { at, items } of [...runs('free-tiktok-scraper'), ...runs('tiktok-scraper')]) {
  for (const v of items) {
    const h = handleOf(v.authorMeta?.name);
    if (!h || !v.id) continue;
    const e = tt.get(h) || { at, vids: new Map() };
    if (at > e.at) e.at = at;
    e.vids.set(v.id, v);
    tt.set(h, e);
  }
}
// Instagram: perfil completo (com latestPosts); fica a execução mais recente de cada perfil
const ig = new Map();
for (const { at, items } of runs('instagram-profile-scraper')) {
  for (const p of items) {
    const h = handleOf(p.username);
    if (h && !p.private && (!ig.has(h) || at > ig.get(h).at)) ig.set(h, { at, profile: p });
  }
}

const creators = await all('creators?select=id,tiktok,instagram');
const byTT = new Map(creators.filter((c) => c.tiktok).map((c) => [handleOf(c.tiktok), c.id]));
const byIG = new Map(creators.filter((c) => c.instagram).map((c) => [handleOf(c.instagram), c.id]));
const done = new Set((await all('creator_metrics?select=creator_id,platform,collected_at').catch((e) => { if (APPLY) throw e; console.log('(tabela creator_metrics ainda não existe no banco: rode a migração 20261007)'); return []; })).map((m) => `${m.creator_id}|${m.platform}|${Date.parse(m.collected_at)}`));

const rows = [];
const skip = { fora_da_base: 0, poucos_posts: 0, ja_gravado: 0 };
const push = (id, at, snap) => {
  if (!id) return void skip.fora_da_base++;
  if (snap.posts_analyzed < MIN_POSTS) return void skip.poucos_posts++;
  if (done.has(`${id}|${snap.platform}|${Date.parse(at)}`)) return void skip.ja_gravado++;
  rows.push({ creator_id: id, collected_at: at, ...snap });
};
for (const [h, e] of tt) push(byTT.get(h), e.at, snapshotOf([...e.vids.values()], Date.parse(e.at)));
for (const [h, e] of ig) push(byIG.get(h), e.at, igSnapshotOf(e.profile, Date.parse(e.at)));

const count = (p) => rows.filter((r) => r.platform === p).length;
console.log(`perfis no Apify: TikTok ${tt.size} · Instagram ${ig.size} | base: ${creators.length} creators`);
console.log(`snapshots a gravar: TikTok ${count('tiktok')} · Instagram ${count('instagram')} | ignorados: ${JSON.stringify(skip)} (mínimo ${MIN_POSTS} posts)`);
for (const r of rows.slice(0, 3)) console.log(`  ${r.platform} ${r.creator_id.slice(0, 8)} · ${r.followers} seg · ${r.posts_analyzed} posts · views ${r.avg_views} · curt. ${r.avg_likes} · coment. ${r.avg_comments} · ER/views ${r.er_by_views}% · ER/seg ${r.er_by_followers}%`);
if (!APPLY) { console.log('\nNada gravado. Rode com --apply para gravar.'); process.exit(0); }
for (let i = 0; i < rows.length; i += 500) {
  await sb('creator_metrics', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(rows.slice(i, i + 500)) });
}
console.log(`creator_metrics: ${rows.length} snapshots gravados.`);
