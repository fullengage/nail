import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bynhmqpdwtsyvfcxutbo.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

async function run() {
  console.log('Reading data/cliente.html...');
  const html = fs.readFileSync('data/cliente.html', 'utf8');
  const match = html.match(/window\.__LEADS__\s*=\s*(\[.*?\]);/s);
  if (!match) {
    console.error('Could not find window.__LEADS__');
    return;
  }

  const rawLeads = JSON.parse(match[1]);
  console.log(`Found ${rawLeads.length} leads in cliente.html`);

  // Transform into Squadra creator format
  const creatorsToInsert = rawLeads.map((lead, index) => {
    // Generate an ID or let Supabase generate it
    return {
      professional_name: lead.nome || lead.usuario,
      bio: lead.bio || `Creator no TikTok @${lead.usuario}`,
      city: 'São Paulo', // Default city or derived
      state: 'SP',
      instagram: lead.link_bio && lead.link_bio.includes('instagram') ? lead.link_bio : `@${lead.usuario}`,
      tiktok: `@${lead.usuario}`,
      youtube: '',
      instagram_followers: Math.round((lead.seguidores || 1000) * 0.4),
      tiktok_followers: lead.seguidores || 0,
      youtube_followers: 0,
      operational_score: Number(lead.score_30mais || 75),
      engagement_rate: Number(lead.engajamento || 4.2),
      tags: [
        lead.faixa,
        lead.nicho_principal,
        ...(lead.nichos || []),
        ...(lead.sinais_30mais || [])
      ].filter(Boolean),
      specialties: lead.nichos || [lead.nicho_principal || 'UGC'],
      techniques: lead.sinais_30mais || [],
      email: lead.email || `${lead.usuario}@creator.squadra.app`,
      phone: lead.whatsapp || '',
      media_kit_url: lead.url || `https://www.tiktok.com/@${lead.usuario}`,
      verification_status: lead.verificado ? 'verified' : 'unverified',
      profile_completion: 95
    };
  });

  console.log(`Batch inserting ${creatorsToInsert.length} creators into Supabase...`);
  const chunkSize = 100;
  for (let i = 0; i < creatorsToInsert.length; i += chunkSize) {
    const chunk = creatorsToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('creators').insert(chunk);
    if (error) {
      console.error(`Error in chunk ${i}-${i + chunk.length}:`, error.message);
    } else {
      console.log(`Inserted ${i + chunk.length}/${creatorsToInsert.length}`);
    }
  }

  // Also write to src/data/realLeads.json for instant offline/demo caching
  fs.writeFileSync('src/data/realLeads.json', JSON.stringify(creatorsToInsert, null, 2));
  console.log('Saved src/data/realLeads.json successfully!');
}

run().catch(console.error);
