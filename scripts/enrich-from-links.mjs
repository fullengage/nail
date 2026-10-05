// Enriquecimento gratuito a partir de páginas PÚBLICAS:
// 1) página do TikTok (@usuario) → link da bio, seguidores, verificado
// 2) link da bio → Instagram / WhatsApp / e-mail, aceitos só quando há prova de que são do creator:
//    página agregadora de links (Linktree, Beacons…) colocada pelo próprio creator, ou página que aponta de volta pro TikTok dele.
// Preenche apenas campos vazios. Retomável: progresso em data/enrich-cache.json.
// Uso: node scripts/enrich-from-links.mjs            (coleta, A+B primeiro)
//      node --env-file=.env scripts/enrich-from-links.mjs --apply   (grava no realLeads.json e no Supabase)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const LEADS = new URL('../src/data/realLeads.json', import.meta.url);
const CACHE = new URL('../data/enrich-cache.json', import.meta.url);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const AGGREGATORS = /(linktr\.ee|beacons\.ai|bio\.link|lnk\.bio|linkbio|linkin\.bio|taplink|campsite\.bio|msha\.ke|linkme|carrd\.co|allmylinks|solo\.to|hoo\.be|snipfeed|stan\.store|link\.me|linkpop|koji|bento\.me|zaap|ppl\.ink)/i;
const IG_NOISE = /^(p|reel|reels|explore|accounts|stories|tv|linktr\.ee|linktree|beacons\.ai|beacons|biolink|taplink|stan\.store)$/i;
const MAIL_NOISE = /(linktr|linktree|beacons|sentry|example|wixpress|godaddy|cloudflare|\.png|\.jpg)/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = () => 1800 + Math.random() * 1500;
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const saveCache = () => writeFileSync(CACHE, JSON.stringify(cache, null, 1));

async function get(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9' }, redirect: 'follow', signal: ctl.signal });
    return { status: r.status, url: r.url, text: await r.text() };
  } finally {
    clearTimeout(t);
  }
}

export function parseTikTok(html) {
  const m = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/s);
  if (!m) return null;
  const u = JSON.parse(m[1])?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo;
  if (!u?.user) return null;
  return {
    bioLink: u.user.bioLink?.link || '',
    verified: !!u.user.verified,
    followers: u.stats?.followerCount ?? null,
    signature: u.user.signature || '',
  };
}

export function parseLinkPage(html, handle) {
  const ig = [...new Set([...html.matchAll(/instagram\.com\/([A-Za-z0-9._]{2,30})/gi)].map((m) => m[1].replace(/\.+$/, '').toLowerCase()))].filter((h) => !IG_NOISE.test(h));
  const phones = [...new Set([...html.matchAll(/(?:wa\.me\/|whatsapp\.com\/send\/?\?phone=|phone=)(\+?\d{10,15})/gi)].map((m) => m[1].replace(/\D/g, '')))];
  const mails = [...new Set([...html.matchAll(/mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi)].map((m) => m[1].toLowerCase()))].filter((e) => !MAIL_NOISE.test(e));
  const backlink = new RegExp(`tiktok\\.com/@${handle.replace(/[.]/g, '\\.')}(?![A-Za-z0-9._])`, 'i').test(html);
  // vários Instagrams diferentes = ambíguo; só aceita se um deles for o mesmo @ do TikTok
  const instagram = ig.length === 1 ? ig[0] : ig.includes(handle.toLowerCase()) ? handle.toLowerCase() : '';
  return { instagram, phone: phones.length === 1 ? phones[0] : '', email: mails.length === 1 ? mails[0] : '', backlink };
}

async function enrichOne(handle) {
  const tt = await get(`https://www.tiktok.com/@${handle}`);
  const info = parseTikTok(tt.text);
  if (!info) return { ok: false, reason: `tiktok ${tt.status} sem dados` };
  const out = { ok: true, ...info, instagram: '', phone: '', email: '', source: '' };
  const link = info.bioLink;
  if (!link) return out;
  const direct = link.match(/instagram\.com\/([A-Za-z0-9._]{2,30})/i);
  if (direct && !IG_NOISE.test(direct[1])) return { ...out, instagram: direct[1].toLowerCase(), source: 'bioLink' };
  const wa = link.match(/(?:wa\.me\/|phone=)(\+?\d{10,15})/i);
  if (wa) return { ...out, phone: wa[1].replace(/\D/g, ''), source: 'bioLink' };
  await sleep(800);
  try {
    const page = await get(link.startsWith('http') ? link : `https://${link}`);
    const p = parseLinkPage(page.text, handle);
    const trusted = AGGREGATORS.test(page.url) || AGGREGATORS.test(link) || p.backlink;
    if (trusted) return { ...out, instagram: p.instagram, phone: p.phone, email: p.email, source: p.backlink ? 'backlink' : 'agregador' };
    return { ...out, source: 'link sem prova' };
  } catch (e) {
    return { ...out, source: `link falhou: ${e.name}` };
  }
}

// ---------- auto-checagem dos parsers ----------
{
  const lt = '<a href="https://www.instagram.com/personal_rafaelrosa/"></a><a href="https://wa.me/5511963347249"></a><a href="https://www.tiktok.com/@personal_rafaelrosa?lang=pt"></a><a href="https://instagram.com/linktr.ee"></a>';
  const r = parseLinkPage(lt, 'personal_rafaelrosa');
  console.assert(r.instagram === 'personal_rafaelrosa' && r.phone === '5511963347249' && r.backlink, 'parseLinkPage', r);
  console.assert(parseLinkPage('instagram.com/a_b instagram.com/c_d', 'x').instagram === '', 'ambíguo deve ser vazio');
}

const leads = JSON.parse(readFileSync(LEADS, 'utf8'));
const prio = (l) => (/^[AB]/.test(l.faixa || '') ? 0 : 1);

if (!process.argv.includes('--apply')) {
  const queue = [...leads].sort((a, b) => prio(a) - prio(b)).map((l) => l.tiktok.replace(/^@/, '')).filter((h) => !cache[h]?.ok);
  console.log(`a coletar: ${queue.length} (já no cache: ${Object.values(cache).filter((c) => c.ok).length})`);
  let fails = 0;
  for (const [i, h] of queue.entries()) {
    try {
      const r = await enrichOne(h);
      cache[h] = { ...r, at: new Date().toISOString() };
      fails = r.ok ? 0 : fails + 1;
      if (r.instagram || r.phone || r.email) console.log(`[${i + 1}/${queue.length}] @${h}: ig=${r.instagram} wa=${r.phone} mail=${r.email} (${r.source})`);
    } catch (e) {
      cache[h] = { ok: false, reason: String(e) };
      fails++;
    }
    saveCache();
    if (fails >= 8) {
      console.log('8 falhas seguidas: provável bloqueio do TikTok. Parando; rode de novo mais tarde para retomar.');
      break;
    }
    if ((i + 1) % 25 === 0) console.log(`… ${i + 1}/${queue.length}`);
    await sleep(jitter());
  }
  const ok = Object.values(cache).filter((c) => c.ok);
  console.log(`fim da coleta: ${ok.length} lidos | com link na bio: ${ok.filter((c) => c.bioLink).length} | ig: ${ok.filter((c) => c.instagram).length} | wa: ${ok.filter((c) => c.phone).length} | email: ${ok.filter((c) => c.email).length}`);
} else {
  // aplica no realLeads.json e no Supabase — só preenche campos vazios
  let filled = { instagram: 0, phone: 0, email: 0, link: 0 };
  const updates = [];
  for (const l of leads) {
    const c = cache[l.tiktok.replace(/^@/, '')];
    if (!c?.ok) continue;
    const before = JSON.stringify(l);
    if (!l.instagram && c.instagram) { l.instagram = '@' + c.instagram; filled.instagram++; }
    if (!l.phone && c.phone) { l.phone = c.phone; filled.phone++; }
    if (!l.email && c.email) { l.email = c.email; filled.email++; }
    if (!l.link_bio && c.bioLink) { l.link_bio = c.bioLink; filled.link++; }
    if (c.followers) l.tiktok_followers = c.followers;
    l.verification_status = c.verified ? 'verified' : 'unverified';
    if (JSON.stringify(l) !== before) updates.push(l);
  }
  writeFileSync(LEADS, JSON.stringify(leads, null, 1));
  console.log(`realLeads.json: +${filled.instagram} instagram, +${filled.phone} whatsapp, +${filled.email} e-mail, +${filled.link} links de bio (${updates.length} creators alterados)`);
  if (process.env.VITE_SUPABASE_URL) {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(process.env.VITE_SUPABASE_URL, (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY));
    let ok = 0;
    for (const l of updates) {
      const { error } = await sb.from('creators').update({
        instagram: l.instagram, phone: l.phone || null, email: l.email || null,
        tiktok_followers: l.tiktok_followers, verification_status: l.verification_status,
      }).eq('tiktok', l.tiktok);
      if (!error) ok++;
    }
    console.log(`supabase: ${ok}/${updates.length} atualizados`);
  }
}
