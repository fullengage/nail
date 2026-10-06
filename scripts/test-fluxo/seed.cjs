const { boot, as } = require('./harness.cjs');
const U = { admin: { sub: '33f30490-e7c0-43f6-9520-f505282ec817', email: 'admin@squadra.app' },
  marca: { sub: '4fce1846-f3ef-45c3-97cf-efc391c4641d', email: 'empresa@squadra.app' },
  ugc: { sub: '5f179845-3113-4351-a6ae-68c8a49f4624', email: 'ugc@squadra.app' },
  marca2: { sub: 'aaaaaaaa-0000-0000-0000-000000000002', email: 'outra@marca.com' } };
async function seeded() {
  const db = await boot(['20261002_squadra_mvp.sql']);
  await db.exec(`
    insert into organizations (id,name,slug) values ('00000000-0000-0000-0000-000000000001','Squadra Global','squadra');
    insert into profiles (id,auth_user_id,email,full_name,role) values
      ('00000000-0000-0000-0000-000000000001','${U.admin.sub}','admin@squadra.app','Admin','admin_master'),
      ('00000000-0000-0000-0000-000000000002','${U.marca.sub}','empresa@squadra.app','Empresa','brand_admin'),
      ('00000000-0000-0000-0000-000000000003','${U.ugc.sub}','ugc@squadra.app','UGC','creator'),
      ('00000000-0000-0000-0000-000000000004','${U.marca2.sub}','outra@marca.com','Outra Marca','brand_admin');
    insert into creators (id,user_id,professional_name,city,state,instagram,email,phone) values
      ('f4ed01f7-791b-4979-9e11-150200c02f12','00000000-0000-0000-0000-000000000003','Dicas de mulher (REAL)','','','@real','real@x.com','11999'),
      ('11111111-0000-0000-0000-000000000001',null,'Creator Mapeado','','','@mapeado','map@x.com','11888');
  `);
  for (const f of ['20261004_leads_e_cache.sql', '20261005_protege_contatos.sql', '20261006_fluxo_campanha.sql', '20261007_creator_metrics.sql', '20261008_curadoria_squad.sql']) {
    const sql = require('fs').readFileSync(require('path').join(__dirname, '../../src/supabase/migrations/', f), 'utf8').replace(/NOTIFY pgrst[^;]*;/gi, '');
    try { await db.exec(sql); } catch (e) { throw new Error(f + ': ' + e.message); }
  }
  return db;
}
module.exports = { seeded, as, U };
