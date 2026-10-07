import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bynhmqpdwtsyvfcxutbo.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

async function run() {
  const raw = fs.readFileSync('data/realLeads.json', 'utf-8');
  const leads = JSON.parse(raw);
  console.log(`Updating ${leads.length} leads in Supabase with prioritized XLSX data...`);

  let updated = 0;
  for (let i = 0; i < leads.length; i += 20) {
    const chunk = leads.slice(i, i + 20);
    for (const l of chunk) {
      if (!l.tiktok) continue;
      const { error } = await supabase
        .from('creators')
        .update({
          operational_score: l.operational_score,
          engagement_rate: l.engagement_rate,
          email: l.email || null,
          phone: l.phone || null,
          bio: l.bio || null,
          media_kit_url: l.media_kit_url || null,
          tags: l.tags || [],
          specialties: l.specialties || [],
          verification_status: l.verification_status || 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('tiktok', l.tiktok);

      if (!error) {
        updated++;
      } else {
        console.error(`Error updating ${l.tiktok}:`, error.message);
      }
    }
  }

  console.log(`Successfully updated ${updated} creators in Supabase!`);
}

run().catch(console.error);
