// Descobre creators de UGC / publi pago no Instagram (pessoas, não marcas) via Apify.
// 1) posts por hashtag → autores   2) perfil de cada autor   3) filtro creator × marca
// Cache retomável em data/ig-descoberta.json. Saída: data/creators_instagram_novos.csv
//
// Uso: node --env-file=.env scripts/buscar-creators-instagram.mjs --posts 50   (teste)
//      node --env-file=.env scripts/buscar-creators-instagram.mjs --posts 300  (coleta maior)
//      node --env-file=.env scripts/buscar-creators-instagram.mjs --apply      (insere no Supabase)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const TOKEN = process.env.APIFY_TOKEN;
const CACHE = new URL('../data/ig-descoberta.json', import.meta.url);
const OUT = new URL('../data/creators_instagram_novos.csv', import.meta.url);
const LEADS = JSON.parse(readFileSync(new URL('../src/data/realLeads.json', import.meta.url), 'utf8'));
const HASHTAGS = ['ugcbrasil', 'ugcbr', 'ugcbrazil', 'ugccreatorbrasil', 'creatorugc', 'criadoradeconteudougc', 'ugccreator', 'publipost'];
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const db = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : { tags: {}, profiles: {} };
const save = () => writeFileSync(CACHE, JSON.stringify(db));

// ---------- creator × marca ----------
const CREATOR = /\bugc\b|creator|criador[ae]? de conte[uú]do|influenc|parcerias?|publi|m[ií]dia ?kit|media ?kit|contato comercial|comercial:|collab|presskit|portf[oó]lio/i;
const BRAND = /\bloja\b|compre|comprar|frete|envio para|enviamos|atacado|varejo|cnpj|pedidos?|encomend|delivery|whats.*pedido|site oficial|loja oficial|cat[aá]logo|cupom de desconto da loja|distribuidora|ind[uú]stria|fábrica|fabrica|ltda|\bme\b|eireli/i;
const BRAND_CAT = /shopping|retail|brand|product\/service|clothing|cosmetics store|beauty, cosmetic|e-commerce|company|business|store|restaurant|food & beverage|health\/beauty$/i;
const PT = /[ãõçáéíóúâê]|\b(você|vocês|para|com|meu|minha|conteúdo|contato|parcerias?)\b/i;

export function classify(p) {
  const bio = `${p.biography || ''} ${p.fullName || ''}`;
  const cat = p.businessCategoryName || '';
  const isBrand = BRAND.test(bio) || (BRAND_CAT.test(cat) && !/creator|blogger|influencer|personal|public figure|artist|digital/i.test(cat));
  const isCreator = CREATOR.test(bio) || /creator|blogger|influencer|digital creator|public figure/i.test(cat);
  return { creator: isCreator && !isBrand, brand: isBrand, br: PT.test(bio) };
}
console.assert(classify({ biography: 'UGC creator ✨ parcerias: contato@x.com' }).creator, 'creator');
console.assert(!classify({ biography: 'Loja de roupas 🛍️ enviamos para todo Brasil' }).creator, 'marca');

async function actor(id, input) {
  const r = await fetch(`https://api.apify.com/v2/acts/${id}/run-sync-get-dataset-items?token=${TOKEN}&timeout=300`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  if (r.status === 402) throw new Error('sem créditos no Apify');
  if (!r.ok) throw new Error(`Apify ${r.status}: ${(await r.text()).slice(0, 150)}`);
  return r.json();
}

if (process.argv.includes('--apply')) {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const rows = readFileSync(OUT, 'utf8').trim().split('\n').slice(1).map((l) => JSON.parse(`[${l}]`));
  const { data: ex } = await sb.from('creators').select('instagram').neq('instagram', '');
  const known = new Set((ex || []).map((r) => (r.instagram || '').toLowerCase()));
  const novos = rows.filter((r) => !known.has(`@${r[0]}`)).map(([u, nome, seg, eng, cat, bio, email, link]) => ({
    professional_name: nome || u, bio, city: '', state: '', instagram: `@${u}`, tiktok: '', instagram_followers: seg,
    engagement_rate: eng || 0, operational_score: 0, tags: ['origem:instagram', 'UGC/publi'], specialties: [],
    email: email || null, media_kit_url: link || `https://www.instagram.com/${u}`, verification_status: 'unverified',
  }));
  for (let i = 0; i < novos.length; i += 200) {
    const { error } = await sb.from('creators').insert(novos.slice(i, i + 200));
    if (error) throw error;
  }
  console.log(`supabase: ${novos.length} creators novos do Instagram inseridos`);
  process.exit(0);
}

if (!TOKEN) { console.log('Falta APIFY_TOKEN no .env'); process.exit(1); }
const POSTS = Number(arg('--posts', 50));

// 1) hashtags → autores
for (const tag of HASHTAGS) {
  if ((db.tags[tag]?.limit || 0) >= POSTS) continue;
  const items = await actor('apify~instagram-hashtag-scraper', { hashtags: [tag], resultsLimit: POSTS });
  db.tags[tag] = { limit: POSTS, owners: [...new Set(items.map((i) => (i.ownerUsername || '').toLowerCase()).filter(Boolean))] };
  save();
  console.log(`#${tag}: ${items.length} posts, ${db.tags[tag].owners.length} autores`);
}

// 2) perfis (lotes de 25, só os ainda não lidos e fora da base atual)
const jaNaBase = new Set(LEADS.map((l) => (l.instagram || '').replace('@', '').toLowerCase()).filter(Boolean));
const owners = [...new Set(Object.values(db.tags).flatMap((t) => t.owners))].filter((u) => !db.profiles[u] && !jaNaBase.has(u));
console.log(`perfis novos para ler: ${owners.length}`);
for (let i = 0; i < owners.length; i += 25) {
  const lote = owners.slice(i, i + 25);
  const items = await actor('apify~instagram-profile-scraper', { usernames: lote });
  for (const p of items) {
    if (!p.username) continue;
    const posts = (p.latestPosts || []).slice(0, 12);
    const inter = posts.reduce((a, x) => a + Math.max(0, x.likesCount || 0) + (x.commentsCount || 0), 0);
    db.profiles[p.username.toLowerCase()] = {
      u: p.username.toLowerCase(), nome: p.fullName || '', seg: p.followersCount || 0, cat: p.businessCategoryName || '',
      bio: p.biography || '', email: p.businessEmail || '', link: p.externalUrl || '', priv: !!p.private,
      eng: p.followersCount && posts.length ? Math.round((inter / posts.length / p.followersCount) * 10000) / 100 : null,
      ...classify(p),
    };
  }
  for (const u of lote) db.profiles[u] ||= { u, missing: true };
  save();
  console.log(`  perfis ${Math.min(i + 25, owners.length)}/${owners.length}`);
}

// 3) filtro final: pessoa creator, BR, público, 1k+ seguidores
const all = Object.values(db.profiles).filter((p) => !p.missing);
const ok = all.filter((p) => p.creator && p.br && !p.priv && p.seg >= 1000).sort((a, b) => b.seg - a.seg);
const esc = (v) => JSON.stringify(v ?? '');
writeFileSync(OUT, ['usuario,nome,seguidores,engajamento,categoria,bio,email,link'].concat(ok.map((p) => [esc(p.u), esc(p.nome), p.seg, p.eng ?? 0, esc(p.cat), esc(p.bio.replace(/\s+/g, ' ')), esc(p.email), esc(p.link)].join(','))).join('\n'));
console.log(`perfis lidos: ${all.length} | marcas descartadas: ${all.filter((p) => p.brand).length} | creators BR (1k+): ${ok.length} -> data/creators_instagram_novos.csv`);
for (const p of ok.slice(0, 8)) console.log(`  @${p.u} · ${p.seg.toLocaleString('pt-BR')} seg · eng ${p.eng}% · ${p.bio.slice(0, 60).replace(/\s+/g, ' ')}`);
