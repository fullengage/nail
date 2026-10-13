// Recupera e-mail, WhatsApp e Instagram de creators a partir do que JÁ FOI RASPADO (sem gastar Apify).
//
// Por que existe: o enriquecimento do Instagram guardou bio e link de ~1.700 perfis em data/ig-cache.json,
// mas o --apply só gravou seguidores e engajamento. Bio e link de bio (onde fica o contato) nunca chegaram ao banco.
//
// Fontes lidas (as que existirem):
//   data/ig-cache.json        (enrich-instagram-apify: bio, link)
//   data/ig-descoberta.json   (buscar-creators-instagram: bio, businessEmail, link)
//   data/tt-descoberta.json   (buscar-creators-tiktok: bio, link de bio)
//   data/enrich-cache.json    (enrich-from-links: instagram, whatsapp, e-mail achados no link de bio)
//   data/apify/**/*.json      (datasets baixados do Apify: authorMeta.signature/bioLink e biography/externalUrl)
//
// Regras: só preenche campo VAZIO (nunca sobrescreve); e-mail ou WhatsApp só entram se aparecem no perfil do
// próprio creator (bio ou link de bio); quando um perfil mostra mais de um e-mail, fica de fora (ambíguo).
//
// Uso: node --env-file=.env scripts/extrair-contatos-dos-caches.mjs           (só mostra e gera data/contatos-recuperados.csv)
//      node --env-file=.env scripts/extrair-contatos-dos-caches.mjs --apply   (grava no Supabase)
// .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';

const DATA = new URL('../data/', import.meta.url);
const SB_URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes('--apply');

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const MAIL_NOISE = /(linktr|linktree|beacons|sentry|example|wixpress|godaddy|cloudflare|\.png|\.jpg|\.webp|@2x)/i;
const WA_LINK = /(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=|whatsapp\.com\/send\?phone=)\+?(\d{10,13})/i;
// telefone escrito na bio: (11) 98765-4321, 11 98765 4321, +55 11 987654321
const PHONE_TXT = /(?:\+?55[\s.-]?)?\(?([1-9]\d)\)?[\s.-]?(9\d{4})[\s.-]?(\d{4})\b/;
const IG_IN_TEXT = /(?:instagram\.com\/|(?:^|[\s:|•])(?:ig|insta|instagram)\s*[:\-]?\s*@)([a-z0-9._]{2,30})/i;
const IG_NOISE = /^(p|reel|reels|explore|accounts|stories|tv)$/i;

const h = (x) => String(x || '').replace(/^@/, '').replace(/^https?:\/\/(www\.)?(tiktok|instagram)\.com\/@?/i, '').split(/[/?#\s]/)[0].trim().toLowerCase();
const read = (name) => (existsSync(new URL(name, DATA)) ? JSON.parse(readFileSync(new URL(name, DATA), 'utf8')) : null);

// Telefone brasileiro em 55 + DDD + celular com 9 dígitos (13 dígitos: 55 + DDD + 9 + 8 dígitos).
// wa.me traz o código do país: aceita só se começar com 55 (rejeita +1 e outros países).
// Telefone escrito na bio é local: DDD de 11 a 99 + número, recebe o 55.
function brPhone(raw, comPais) {
  const d = String(raw || '').replace(/\D/g, '');
  if (comPais) return /^55[1-9]\d9\d{8}$/.test(d) ? d : '';
  return /^[1-9][1-9]9\d{8}$/.test(d) ? `55${d}` : '';
}

function contactsFrom(...texts) {
  const t = texts.filter(Boolean).join(' \n ');
  const mails = [...new Set((t.match(EMAIL) || []).map((m) => m.toLowerCase().replace(/\.$/, '')).filter((m) => !MAIL_NOISE.test(m)))];
  const wa = t.match(WA_LINK);
  const ph = t.match(PHONE_TXT);
  const ig = t.match(IG_IN_TEXT);

  let instagram = '';
  if (ig && !IG_NOISE.test(ig[1])) {
    const candidate = ig[1].toLowerCase().replace(/\.$/, '');
    // Se o @ é seguido por espaço e outra palavra (ex.: @Academia fitbrasil, @lenny concepter), era nome composto, não handle
    const idx = t.indexOf(ig[0]);
    const after = idx >= 0 ? t.slice(idx + ig[0].length) : '';
    const hasSpaceContinuation = /^\s+[a-z0-9]/i.test(after);
    if (!hasSpaceContinuation && candidate.length >= 3) {
      instagram = candidate;
    }
  }

  return {
    email: mails.length === 1 ? mails[0] : '',
    phone: (wa && brPhone(wa[1], true)) || (ph ? brPhone(`${ph[1]}${ph[2]}${ph[3]}`) : ''),
    instagram,
  };
}

// achados por rede: tiktok → {email, phone, instagram, fonte}; instagram → {email, phone, fonte}
const tt = new Map();
const ig = new Map();
const add = (map, handle, c, fonte) => {
  if (!handle || !(c.email || c.phone || c.instagram)) return;
  const cur = map.get(handle) || {};
  if (c.phone && !/^55[1-9]\d9\d{8}$/.test(c.phone)) c.phone = '';
  if (c.instagram && !/^[a-z0-9._]{2,30}$/i.test(c.instagram)) c.instagram = '';
  for (const k of ['email', 'phone', 'instagram']) if (!cur[k] && c[k]) { cur[k] = c[k]; cur[`${k}_fonte`] = fonte; }
  map.set(handle, cur);
};

const fontes = {};
const conta = (f, n) => (fontes[f] = (fontes[f] || 0) + n);

const igCache = read('ig-cache.json');
if (igCache) for (const [u, c] of Object.entries(igCache)) if (c?.ok) { add(ig, u, contactsFrom(c.bio, c.link), 'ig-cache'); conta('ig-cache.json', 1); }

const igDesc = read('ig-descoberta.json');
if (igDesc?.profiles) for (const p of Object.values(igDesc.profiles)) if (!p.missing) {
  const c = contactsFrom(p.bio, p.link);
  if (!c.email && p.email) c.email = String(p.email).toLowerCase();
  add(ig, p.u, c, 'ig-descoberta'); conta('ig-descoberta.json', 1);
}

const ttDesc = read('tt-descoberta.json');
if (ttDesc?.authors) for (const a of Object.values(ttDesc.authors)) { add(tt, a.u, contactsFrom(a.bio, typeof a.link === 'string' ? a.link : ''), 'tt-descoberta'); conta('tt-descoberta.json', 1); }

const enrich = read('enrich-cache.json');
if (enrich) for (const [u, c] of Object.entries(enrich)) if (c?.ok) {
  add(tt, h(u), { email: c.email || '', phone: c.phone || '', instagram: c.instagram || '' }, 'link-da-bio');
  add(tt, h(u), contactsFrom(c.signature, c.bioLink), 'tt-bio');
  conta('enrich-cache.json', 1);
}

// datasets do Apify baixados (qualquer subpasta)
function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = new URL(f, dir);
    return statSync(p).isDirectory() ? walk(new URL(`${f}/`, dir)) : f.endsWith('.json') ? [p] : [];
  });
}
for (const file of walk(new URL('apify/', DATA))) {
  let items;
  try { items = JSON.parse(readFileSync(file, 'utf8')); } catch { continue; }
  if (!Array.isArray(items)) continue;
  conta('data/apify', items.length);
  for (const it of items) {
    const m = it.authorMeta;
    if (m?.name) add(tt, h(m.name), contactsFrom(m.signature, m.bioLink?.link || m.bioLink), 'apify-tiktok');
    if (it.username && ('biography' in it || 'externalUrl' in it)) {
      const c = contactsFrom(it.biography, it.externalUrl, ...(it.externalUrls || []).map((x) => x?.url));
      if (!c.email && it.businessEmail) c.email = String(it.businessEmail).toLowerCase();
      add(ig, h(it.username), c, 'apify-instagram');
    }
  }
}

console.log('fontes lidas (perfis/itens):', fontes);
console.log(`perfis com algum contato: TikTok ${tt.size} | Instagram ${ig.size}`);
if (!SB_URL || !KEY) { console.log('Falta VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env: parei antes de cruzar com a base.'); process.exit(1); }

async function sb(path, init = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? null : r.json();
}
const creators = [];
for (let f = 0; ; f += 1000) {
  const rows = await sb('creators?select=id,professional_name,tiktok,instagram,email,phone,tags&order=created_at', { headers: { Range: `${f}-${f + 999}` } });
  creators.push(...rows);
  if (rows.length < 1000) break;
}

const updates = [];
const csv = ['creator_id,nome,tiktok,instagram,tiktok_shop,campo,valor,fonte'];
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const ganho = { email: 0, phone: 0, instagram: 0 };
const ganhoShop = { email: 0, phone: 0, instagram: 0 };
let shopTotal = 0, shopSemEmail = 0;
for (const c of creators) {
  const shop = (c.tags || []).includes('TikTok Shop');
  if (shop) { shopTotal++; if (!c.email) shopSemEmail++; }
  const fromTT = tt.get(h(c.tiktok)) || {};
  const igHandle = h(c.instagram) || fromTT.instagram || '';
  const fromIG = ig.get(igHandle) || {};
  const patch = {};
  for (const k of ['email', 'phone']) {
    const v = fromTT[k] || fromIG[k];
    if (!c[k] && v) { patch[k] = v; csv.push([c.id, c.professional_name, c.tiktok, igHandle, shop, k, v, fromTT[k] ? fromTT[`${k}_fonte`] : fromIG[`${k}_fonte`]].map(esc).join(',')); }
  }
  if (!c.instagram && fromTT.instagram) { patch.instagram = `@${fromTT.instagram}`; csv.push([c.id, c.professional_name, c.tiktok, fromTT.instagram, shop, 'instagram', fromTT.instagram, fromTT.instagram_fonte].map(esc).join(',')); }
  if (Object.keys(patch).length) {
    updates.push({ id: c.id, patch });
    for (const k of Object.keys(patch)) { ganho[k]++; if (shop) ganhoShop[k]++; }
  }
}
writeFileSync(new URL('contatos-recuperados.csv', DATA), csv.join('\n'));
console.log(`base: ${creators.length} creators | TikTok Shop: ${shopTotal} (sem e-mail hoje: ${shopSemEmail})`);
console.log(`a preencher (só campos vazios): e-mail +${ganho.email}, WhatsApp +${ganho.phone}, Instagram +${ganho.instagram} em ${updates.length} creators`);
console.log(`  desses, TikTok Shop: e-mail +${ganhoShop.email}, WhatsApp +${ganhoShop.phone}, Instagram +${ganhoShop.instagram}`);
console.log('lista para conferir: data/contatos-recuperados.csv (fora do git)');

if (!APPLY) { console.log('modo leitura: nada gravado. Rode com --apply para gravar.'); process.exit(0); }
let ok = 0;
for (const u of updates) {
  try { await sb(`creators?id=eq.${u.id}`, { method: 'PATCH', body: JSON.stringify(u.patch), headers: { Prefer: 'return=minimal' } }); ok++; } catch (e) { console.log(`falha em ${u.id}: ${e.message}`); }
}
console.log(`gravados: ${ok}/${updates.length}`);
