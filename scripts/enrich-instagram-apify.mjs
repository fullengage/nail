// Seguidores e engajamento do Instagram dos creators que já têm Instagram confirmado (169),
// via Apify (actor oficial apify/instagram-profile-scraper). Em lotes, com cache retomável.
//
// Uso:
//   node --env-file=.env scripts/enrich-instagram-apify.mjs            # coleta (A+B primeiro)
//   node --env-file=.env scripts/enrich-instagram-apify.mjs --limite 10 # teste com 10 perfis
//   node --env-file=.env scripts/enrich-instagram-apify.mjs --apply    # grava no painel e no Supabase
//
// .env: APIFY_TOKEN=apify_api_...   (sem prefixo VITE_: o token NÃO pode ir para o navegador)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const LEADS = new URL('../data/realLeads.json', import.meta.url);
const CACHE = new URL('../data/ig-cache.json', import.meta.url);
const ACTOR = 'apify~instagram-profile-scraper';
const BATCH = 25;
const PAUSE_MS = 5000;

const leads = JSON.parse(readFileSync(LEADS, 'utf8'));
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const save = () => writeFileSync(CACHE, JSON.stringify(cache, null, 1));
const handleOf = (ig) => (ig || '').replace(/^@/, '').trim().toLowerCase();
const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);

// engajamento médio dos últimos posts = (curtidas + comentários) / seguidores
export function summarize(p) {
  const posts = (p.latestPosts || []).slice(0, 12);
  const inter = posts.reduce((a, x) => a + (x.likesCount > 0 ? x.likesCount : 0) + (x.commentsCount || 0), 0);
  const followers = p.followersCount || 0;
  return {
    ok: true,
    username: (p.username || '').toLowerCase(),
    followers,
    following: p.followsCount || 0,
    posts: p.postsCount || 0,
    engagement: followers && posts.length ? Math.round((inter / posts.length / followers) * 10000) / 100 : null,
    verified: !!p.verified,
    business: !!p.isBusinessAccount,
    category: p.businessCategoryName || '',
    bio: p.biography || '',
    link: p.externalUrl || '',
    at: new Date().toISOString(),
  };
}

// auto-checagem do cálculo
{
  const s = summarize({ username: 'X', followersCount: 1000, latestPosts: [{ likesCount: 40, commentsCount: 10 }, { likesCount: 25, commentsCount: 5 }] });
  console.assert(s.engagement === 4 && s.username === 'x', 'summarize', s);
}

if (process.argv.includes('--apply')) {
  let changed = 0;
  const updates = [];
  for (const l of leads) {
    const c = cache[handleOf(l.instagram)];
    if (!c?.ok) continue;
    l.instagram_followers = c.followers;
    l.instagram_engagement = c.engagement;
    l.instagram_verified = c.verified;
    updates.push(l);
    changed++;
  }
  writeFileSync(LEADS, JSON.stringify(leads, null, 1));
  console.log(`realLeads.json: ${changed} creators com seguidores do Instagram`);
  if (process.env.VITE_SUPABASE_URL) {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(process.env.VITE_SUPABASE_URL, (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY));
    let ok = 0;
    for (const l of updates) {
      const { error } = await sb.from('creators').update({ instagram_followers: l.instagram_followers }).eq('tiktok', l.tiktok);
      if (!error) ok++;
    }
    console.log(`supabase: ${ok}/${updates.length} atualizados`);
  }
  process.exit(0);
}

const token = process.env.APIFY_TOKEN;
const prio = (l) => (/^[AB]/.test(l.faixa || '') ? 0 : 1);
let queue = [...new Set(leads.filter((l) => l.instagram).sort((a, b) => prio(a) - prio(b)).map((l) => handleOf(l.instagram)))].filter((h) => !cache[h]?.ok);
if (arg('--limite')) queue = queue.slice(0, Number(arg('--limite')));
console.log(`perfis a coletar: ${queue.length} (já no cache: ${Object.values(cache).filter((c) => c.ok).length}) em lotes de ${BATCH}`);
if (!token) {
  console.log('Falta APIFY_TOKEN no .env (Apify → Settings → API & Integrations). Nada foi cobrado.');
  process.exit(1);
}

for (let i = 0; i < queue.length; i += BATCH) {
  const lote = queue.slice(i, i + BATCH);
  const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${token}&timeout=300`;
  let items;
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: lote }) });
    if (r.status === 402) { console.log('Sem créditos no Apify. Parando (o cache guarda o que já veio).'); break; }
    if (!r.ok) { console.log(`lote ${i / BATCH + 1}: erro ${r.status} ${(await r.text()).slice(0, 160)}`); break; }
    items = await r.json();
  } catch (e) {
    console.log(`lote ${i / BATCH + 1}: falha de rede (${e.message}). Rode de novo para retomar.`);
    break;
  }
  const got = new Set();
  for (const p of items) {
    if (!p.username) continue;
    const s = summarize(p);
    cache[s.username] = s;
    got.add(s.username);
  }
  for (const h of lote) if (!got.has(h)) cache[h] = { ok: false, reason: 'perfil não encontrado ou privado', at: new Date().toISOString() };
  save();
  console.log(`lote ${i / BATCH + 1}: ${got.size}/${lote.length} perfis lidos`);
  if (i + BATCH < queue.length) await new Promise((res) => setTimeout(res, PAUSE_MS));
}
const ok = Object.values(cache).filter((c) => c.ok);
console.log(`total no cache: ${ok.length} perfis | seguidores somados: ${ok.reduce((a, c) => a + c.followers, 0).toLocaleString('pt-BR')}`);
