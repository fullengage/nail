// Descobre creators brasileiros no TikTok (UGC, publi, afiliados TikTok Shop / live) via Apify.
// Um vídeo por resultado já traz o perfil do autor (seguidores, bio, link): não precisa 2ª chamada.
// Cache retomável em data/tt-descoberta.json. Saída: data/creators_tiktok_novos.csv
//
// Uso: node --env-file=.env scripts/buscar-creators-tiktok.mjs --videos 80
//      node --env-file=.env scripts/buscar-creators-tiktok.mjs --so-filtrar
//      node --env-file=.env scripts/buscar-creators-tiktok.mjs --apply
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { BRAND, PAGE, ES, PORTUGAL } from './creator-filtro.mjs';

const TOKEN = process.env.APIFY_TOKEN;
const CACHE = new URL('../data/tt-descoberta.json', import.meta.url);
const OUT = new URL('../data/creators_tiktok_novos.csv', import.meta.url);
const HASHTAGS = [
  // live / TikTok Shop (foco do Squad UGC)
  'tiktokshopbrasil', 'afiliadotiktokshop', 'achadinhostiktokshop', 'livetiktokshop', 'tiktokshopbr',
  // UGC / publi
  'ugcbrasil', 'ugccreatorbrasil', 'ugcbr', 'publi', 'recebidos', 'resenhasincera', 'testei', 'criadoradeconteudo',
  // segmentos
  'maquiagembrasil', 'skincarebrasil', 'modafeminina', 'maternidadereal', 'cozinhapratica',
  'tiktokmefezcomprar', 'achadinhos', 'unboxingbrasil', 'fitnessbrasil', 'cabelocacheado', 'decoracaobrasil', 'petsbrasil', 'receitasfaceis', 'livetiktok', 'creatorugc', 'recebidosdodia',
  'resenhadeprodutos', 'autocuidado', 'rotinadebeleza', 'modaplussize', 'maquiagemnatural',
];
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const db = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : { tags: {}, authors: {} };
const save = () => writeFileSync(CACHE, JSON.stringify(db));
const tier = (n) => (n >= 1e6 ? 'macro 1M+' : n >= 1e5 ? 'médio 100k-1M' : 'micro até 100k');
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;

// autor vira candidato se: escreve em português do Brasil, não é marca/loja/página, 1k+ seguidores
export function avaliar(a) {
  const bio = `${a.bio} ${a.nome}`;
  const pt = a.langs.pt / Math.max(1, a.langs.total) >= 0.5;
  const fora = ES.test(bio) || PORTUGAL.test(`${bio} ${a.textos}`);
  return { ok: pt && !fora && !BRAND.test(bio) && !PAGE.test(bio) && !a.priv && a.seg >= 1000, brand: BRAND.test(bio) };
}
console.assert(avaliar({ bio: 'Indico só o que uso', nome: 'Cintia', langs: { pt: 2, total: 2 }, textos: '', priv: false, seg: 22700 }).ok, 'creator');
console.assert(!avaliar({ bio: 'Loja oficial, frete grátis', nome: 'X', langs: { pt: 1, total: 1 }, textos: '', priv: false, seg: 9000 }).ok, 'loja');
console.assert(!avaliar({ bio: 'reviews', nome: 'X', langs: { pt: 1, total: 1 }, textos: 'promo em Lisboa', priv: false, seg: 9000 }).ok, 'portugal');

if (process.argv.includes('--apply')) {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(process.env.VITE_SUPABASE_URL, (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY));
  const rows = readFileSync(OUT, 'utf8').trim().split('\n').slice(1).map((l) => JSON.parse(`[${l}]`));
  const known = new Set();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from('creators').select('tiktok').neq('tiktok', '').range(from, from + 999);
    (data || []).forEach((r) => known.add((r.tiktok || '').toLowerCase()));
    if (!data || data.length < 1000) break;
  }
  const novos = rows.filter((r) => !known.has(`@${r[0]}`)).map(([u, nome, seg, eng, shop, bio, email, link]) => ({
    professional_name: nome || u, bio, city: '', state: '', instagram: '', tiktok: `@${u}`, tiktok_followers: seg,
    engagement_rate: eng || 0, operational_score: 0, tags: ['origem:tiktok', 'UGC/publi', tier(seg), ...(shop === 'sim' ? ['TikTok Shop'] : [])],
    specialties: [], email: email || null, media_kit_url: link || `https://www.tiktok.com/@${u}`, verification_status: 'unverified',
  }));
  for (let i = 0; i < novos.length; i += 200) {
    const { error } = await sb.from('creators').insert(novos.slice(i, i + 200));
    if (error) throw error;
  }
  console.log(`supabase: ${novos.length} creators novos do TikTok inseridos`);
  process.exit(0);
}

if (!TOKEN) { console.log('Falta APIFY_TOKEN no .env'); process.exit(1); }
const VIDEOS = Number(arg('--videos', 80));
const MAX_USD = Number(process.env.APIFY_MAX_USD || 18.5);
async function budgetOk() {
  const r = await fetch(`https://api.apify.com/v2/users/me/limits?token=${TOKEN}`).then((x) => x.json()).catch(() => null);
  const used = r?.data?.current?.monthlyUsageUsd ?? 0;
  if (used >= MAX_USD) { console.log(`orçamento atingido: US$ ${used.toFixed(2)} de ${MAX_USD}. Parando (cache salvo).`); return false; }
  return true;
}

for (const tag of process.argv.includes('--so-filtrar') ? [] : HASHTAGS) {
  if ((db.tags[tag] || 0) >= VIDEOS) continue;
  if (!(await budgetOk())) break;
  const r = await fetch(`https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/run-sync-get-dataset-items?token=${TOKEN}&timeout=300`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hashtags: [tag], resultsPerPage: VIDEOS }),
  });
  if (r.status === 402) { console.log('sem créditos no Apify'); break; }
  if (!r.ok) { console.log(`#${tag}: erro ${r.status}`); continue; }
  const items = await r.json();
  for (const v of items) {
    const m = v.authorMeta;
    if (!m?.name) continue;
    const u = m.name.toLowerCase();
    const a = (db.authors[u] ||= { u, langs: { pt: 0, total: 0 }, textos: '', views: 0, inter: 0, shop: false, tags: [] });
    Object.assign(a, { nome: m.nickName || '', seg: m.fans || 0, bio: m.signature || '', link: m.bioLink?.link || m.bioLink || '', priv: !!m.privateAccount, verificado: !!m.verified });
    a.langs.total++; if (v.textLanguage === 'pt') a.langs.pt++;
    a.textos = `${a.textos} ${(v.text || '').slice(0, 200)}`.slice(-1000);
    a.views += v.playCount || 0; a.inter += (v.diggCount || 0) + (v.commentCount || 0) + (v.shareCount || 0);
    a.shop ||= !!v.hasTikTokShopProduct;
    if (!a.tags.includes(tag)) a.tags.push(tag);
  }
  db.tags[tag] = VIDEOS;
  save();
  console.log(`#${tag}: ${items.length} vídeos | autores no cache: ${Object.keys(db.authors).length}`);
}

const all = Object.values(db.authors);
const ok = all.filter((a) => avaliar(a).ok).sort((x, y) => y.seg - x.seg);
const esc = (v) => JSON.stringify(v ?? '');
writeFileSync(OUT, ['usuario,nome,seguidores,engajamento,tiktok_shop,bio,email,link'].concat(ok.map((a) => [
  esc(a.u), esc(a.nome), a.seg, a.views ? Math.round((a.inter / a.views) * 10000) / 100 : 0, esc(a.shop ? 'sim' : ''),
  esc(a.bio.replace(/\s+/g, ' ')), esc((a.bio.match(EMAIL) || [''])[0]), esc(typeof a.link === 'string' ? a.link : ''),
].join(','))).join('\n'));
console.log(`autores: ${all.length} | marcas/lojas: ${all.filter((a) => avaliar(a).brand).length} | creators BR (1k+): ${ok.length} (TikTok Shop: ${ok.filter((a) => a.shop).length}) -> data/creators_tiktok_novos.csv`);
for (const a of ok.slice(0, 8)) console.log(`  @${a.u} · ${a.seg.toLocaleString('pt-BR')} seg${a.shop ? ' · shop' : ''} · ${a.bio.slice(0, 60).replace(/\s+/g, ' ')}`);
