// Importa os leads reais do TikTok (data/cliente.html) para public.creators.
// ponytail: creator_social_accounts fica de fora (RLS sem insert p/ anon; dados já estão em creators).
// Uso: node --env-file=.env scripts/seed-creators.mjs   (idempotente: pula @ já existentes)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const html = readFileSync(new URL('../data/cliente.html', import.meta.url), 'utf8');
const leads = JSON.parse(html.match(/window\.__LEADS__=(\[.*?\]);<\/script>/s)[1]);

const { data: existing, error: e0 } = await sb.from('creators').select('tiktok');
if (e0) throw e0;
const seen = new Set(existing.map(r => r.tiktok));
const novos = leads.filter(l => !seen.has('@' + l.usuario));

for (let i = 0; i < novos.length; i += 200) {
  const lote = novos.slice(i, i + 200);
  const { error } = await sb.from('creators').insert(lote.map(l => ({
    professional_name: l.nome || l.usuario,
    bio: l.bio || null,
    city: '', state: '', // ponytail: dado não coletado no scraping
    instagram: '',
    tiktok: '@' + l.usuario,
    tiktok_followers: l.seguidores,
    engagement_rate: Math.min(l.engajamento, 999),
    operational_score: l.score_30mais,
    tags: [`faixa:${l.faixa[0]}`, ...(l.sinais_30mais || []), ...(l.vende_live ? ['vende_live'] : [])],
    specialties: l.nichos?.length ? l.nichos : [l.nicho_principal],
    email: l.email || null,
    phone: l.whatsapp || null,
    profile_completion: null,
    verification_status: 'unverified',
  })));
  if (error) throw error;

  console.log(`+${lote.length}`);
}
console.log(`ok: ${novos.length} inseridos, ${leads.length - novos.length} já existiam`);
