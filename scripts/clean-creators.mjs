// Reconstrói a base de creators SÓ com dados reais coletados (data/cliente.html).
// Nada é inventado: campo sem dado fica vazio. Instagram só quando o próprio creator
// o informa na bio ("Insta: @x", "IG: x") ou no link da bio (instagram.com/x).
// Uso: node --env-file=.env scripts/clean-creators.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const html = readFileSync(new URL('../data/cliente.html', import.meta.url), 'utf8');
const leads = JSON.parse(html.match(/window\.__LEADS__=(\[.*?\]);<\/script>/s)[1]);

export function instagramFrom(bio = '', linkBio = '') {
  // 1) link explícito instagram.com/handle (na bio ou no link da bio)
  const link = `${linkBio} ${bio}`.match(/instagram\.com\/([A-Za-z0-9._]{2,30})/i);
  if (link) return '@' + link[1].replace(/\.+$/, '');
  // 2) "insta/ig/instagram" seguido de @handle, ou de ":"/"-" + handle. Sem separador = frase comum, ignora.
  const m =
    bio.match(/\b(?:instagram|insta|ig)\b[^\S\n]*[:\-–]?\s*@([A-Za-z0-9._]{3,30})([^\n]*)/i) ||
    bio.match(/\b(?:instagram|insta|ig)\b[^\S\n]*[:\-–][^\S\n]*([A-Za-z0-9._]{3,30})([^\n]*)/i);
  if (!m) return '';
  const h = m[1].replace(/\.+$/, '');
  if (!/[a-z]/i.test(h) || /^\d+[a-z]?$/i.test(h)) return '';
  // "@Academia fitbrasil": handle com espaço no meio = ambíguo, melhor não chutar
  if (/^ [a-z]+\s*$/.test(m[2] || '')) return '';
  return '@' + h;
}

// auto-checagem do extrator
console.assert(instagramFrom('IG: @juliafit') === '@juliafit');
console.assert(instagramFrom('Me siga também no meu Instagram\n@anacarlagrossi') === '@anacarlagrossi');
console.assert(instagramFrom('Insta: @amandateixeira.m\n📧x') === '@amandateixeira.m');
console.assert(instagramFrom('', 'https://www.instagram.com/mariaa_eeduardasantos?igsh=1') === '@mariaa_eeduardasantos');
console.assert(instagramFrom('Treinos em casa') === '');
console.assert(instagramFrom('Me sigam no insta que posto minha rotina') === '');
console.assert(instagramFrom('500M no Instagram; 490M no Facebook') === '');
console.assert(instagramFrom('Instagram -@Academia fitbrasil') === '');
console.assert(instagramFrom('https://www.instagram.com/isadoraa_so?igsh=x') === '@isadoraa_so');
console.assert(instagramFrom('IG: joaodruziann\nx') === '@joaodruziann');

const clean = leads.map((l) => {
  const live = !!l.vende_live || l.nicho_principal === 'Vendas por live';
  const nichos = (l.nichos || []).length ? l.nichos : l.nicho_principal && l.nicho_principal !== 'Vendas por live' ? [l.nicho_principal] : [];
  return {
    professional_name: l.nome || l.usuario,
    bio: l.bio || '',
    city: '',
    state: '',
    instagram: instagramFrom(l.bio, l.link_bio),
    tiktok: '@' + l.usuario,
    youtube: '',
    instagram_followers: 0,
    tiktok_followers: l.seguidores || 0,
    youtube_followers: 0,
    operational_score: l.score_30mais || 0,
    engagement_rate: Math.min(l.engajamento || 0, 999),
    tags: [l.faixa, ...nichos, ...(live ? ['Vendas por live'] : [])].filter(Boolean),
    specialties: nichos,
    techniques: l.sinais_30mais || [],
    email: l.email || '',
    phone: l.whatsapp || '',
    media_kit_url: l.url || `https://www.tiktok.com/@${l.usuario}`,
    link_bio: l.link_bio || '',
    verification_status: l.verificado ? 'verified' : 'unverified',
    profile_completion: 0,
    faixa: l.faixa,
    nicho: l.nicho_principal,
    vende_por_live: live,
    ultimo_post: l.ultimo_post || '',
    media_views: l.media_views || 0,
  };
});

writeFileSync(new URL('../data/realLeads.json', import.meta.url), JSON.stringify(clean, null, 1));
console.log(`realLeads.json: ${clean.length} creators | instagram real: ${clean.filter((c) => c.instagram).length} | e-mail: ${clean.filter((c) => c.email).length} | whatsapp: ${clean.filter((c) => c.phone).length}`);

// Supabase: corrige as linhas existentes pelo @ do TikTok
if (process.env.VITE_SUPABASE_URL) {
  const sb = createClient(process.env.VITE_SUPABASE_URL, (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY));
  let ok = 0, fail = 0;
  for (let i = 0; i < clean.length; i += 20) {
    await Promise.all(clean.slice(i, i + 20).map(async (c) => {
      const { error, count } = await sb.from('creators').update({
        professional_name: c.professional_name, bio: c.bio || null, city: '', state: '',
        instagram: c.instagram, instagram_followers: 0, tiktok_followers: c.tiktok_followers,
        engagement_rate: c.engagement_rate, operational_score: c.operational_score,
        tags: c.tags, specialties: c.specialties, techniques: c.techniques,
        email: c.email || null, phone: c.phone || null, media_kit_url: c.media_kit_url,
        portfolio_cover_url: null, verification_status: c.verification_status, profile_completion: null,
      }, { count: 'exact' }).eq('tiktok', c.tiktok);
      if (error || !count) fail++; else ok++;
    }));
  }
  console.log(`supabase: ${ok} atualizados, ${fail} sem correspondência/erro`);
}
