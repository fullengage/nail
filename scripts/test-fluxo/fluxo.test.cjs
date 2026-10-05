// Teste de ponta a ponta do fluxo de campanha no banco (critérios C–J + afiliados)
const { seeded, as, U } = require('./seed.cjs');
let ok = 0;
const falhas = [];
const check = (nome, cond, extra = '') => { if (cond) ok++; else falhas.push(`${nome} ${extra}`); };
const erro = async (fn) => { try { await fn(); return null; } catch (e) { return e.message; } };
const q1 = async (who, sql, p = []) => (await as(db, who, sql, p))[0];
let db;
(async () => {
  db = await seeded();
  const ref = 'bbbbbbbb-0000-0000-0000-000000000001';
  const ins = (who) => as(db, who, `insert into campaigns (organization_id, title, slug, client_ref, intent, campaign_type, creator_slots, revisions_included)
     values ('00000000-0000-0000-0000-000000000001','Vídeos do Sérum','serum-1',$1,'conteudo_marca','ugc',2,1)
     on conflict (client_ref) do nothing returning id`, [ref]);
  // J: rascunho com client_ref; repetir (clique duplo / reenvio) não duplica
  const [c1] = await ins(U.marca);
  const dup = await ins(U.marca);
  const camp = c1.id;
  check('J: rascunho criado', !!camp);
  check('J: reenvio não duplica', dup.length === 0);
  check('J: 1 campanha só', (await q1('service', 'select count(*)::int n from campaigns')).n === 1);
  const st = await q1('service', 'select status, owner_id from campaigns');
  check('A: nasce rascunho e com dono', st.status === 'draft' && st.owner_id === U.marca.sub, JSON.stringify(st));
  // I: outra empresa e visitante não veem o rascunho nem editam
  check('I: outra marca não vê rascunho', (await as(db, U.marca2, 'select id from campaigns')).length === 0);
  check('I: visitante não vê rascunho', (await as(db, null, 'select id from campaigns')).length === 0);
  await as(db, U.marca2, `update campaigns set title='hack' where id=$1`, [camp]);
  check('I: outra marca não edita', (await q1('service', 'select title from campaigns')).title === 'Vídeos do Sérum');
  check('creator não cria campanha', !!(await erro(() => as(db, U.ugc, `insert into campaigns (title, slug) values ('x','x')`))));
  // publicar valida o essencial
  check('publicar sem produto falha', /produto/.test((await erro(() => as(db, U.marca, 'select campaign_publish($1)', [camp]))) || ''));
  await as(db, U.marca, `update campaigns set product='{"name":"Sérum Vitamina C"}', brief='{"show":"Mostre a textura e o antes/depois"}',
     compensation='{"fee":200}', usage_rights='{"organic":true,"brand_ads":true,"creator_ads":false,"months":6}',
     deliverables='{"per_creator":1,"must_publish":false}' where id=$1`, [camp]);
  check('status não muda por update direto', !!(await erro(() => as(db, U.marca, `update campaigns set status='completed' where id=$1`, [camp]))));
  check('C: publica', (await q1(U.marca, 'select campaign_publish($1) s', [camp])).s === 'open');
  check('C: publicar de novo não muda', (await q1(U.marca, 'select campaign_publish($1) s', [camp])).s === 'open');
  check('H: visitante vê publicada', (await as(db, null, 'select id from campaigns')).length === 1);
  // creator de teste (não o real)
  const me = (await q1(U.ugc, 'select my_creator_id() id')).id;
  check('demo usa creator [TESTE]', me === '00000000-0000-0000-0000-0000000000c1', me);
  // D: condições + aceite
  check('D: aceite com versão velha falha', /atualizadas/.test((await erro(() => as(db, U.ugc, 'select creator_apply($1, 99)', [camp]))) || ''));
  check('D: candidata e aceita', (await q1(U.ugc, `select creator_apply($1, 1, 'Topo!') s`, [camp])).s === 'applied');
  const cc = await q1(U.ugc, 'select * from campaign_creators');
  check('D: aceite registrado', cc && cc.terms_accepted_at && cc.terms_accepted_by === U.ugc.sub && cc.terms_version === 1 && cc.terms_snapshot?.usage_rights?.months === 6);
  check('marca notificada', (await q1(U.marca, 'select title from squad_notifications'))?.title === 'Nova candidatura');
  check('creator não altera o próprio pagamento', !!(await erro(() => as(db, U.ugc, `update campaign_creators set payment_status='pago'`))));
  check('marca não altera pagamento direto', !!(await erro(() => as(db, U.marca, `update campaign_creators set payment_status='pago'`))));
  // I: outra empresa não vê participantes nem age
  check('I: outra marca não vê candidatos', (await as(db, U.marca2, 'select id from campaign_creators')).length === 0);
  check('I: outra marca não contrata', /permissão/.test((await erro(() => as(db, U.marca2, `select brand_participant($1,'hire')`, [cc.id]))) || ''));
  check('contatos de creator bloqueados p/ marca', !!(await erro(() => as(db, U.marca, 'select email from creators'))));
  // contratar
  check('contrata → produzindo', (await q1(U.marca, `select brand_participant($1,'hire') s`, [cc.id])).s === 'producing');
  check('campanha → em produção', (await q1('service', 'select status from campaigns')).status === 'in_progress');
  // E: upload do original no storage, sem publicar
  const path = `${camp}/${me}/v1-serum.mp4`;
  const upErr = await erro(() => as(db, U.ugc, `insert into storage.objects (bucket_id,name) values ('campanhas',$1)`, [path]));
  check('E: creator sobe arquivo na própria pasta', !upErr, upErr || '');
  check('E: creator não sobe na pasta de outro', !!(await erro(() => as(db, U.ugc, `insert into storage.objects (bucket_id,name) values ('campanhas',$1)`, [`${camp}/11111111-0000-0000-0000-000000000001/x.mp4`]))));
  check('E: entrega v1 sem link de post', (await q1(U.ugc, `select creator_submit($1,$2,'v1-serum.mp4','video/mp4') v`, [camp, path])).v === 1);
  check('marca vê o arquivo', (await as(db, U.marca, `select name from storage.objects`)).length === 1);
  check('I: outra marca não vê o arquivo', (await as(db, U.marca2, `select name from storage.objects`)).length === 0);
  // F: ajuste com motivo → nova versão → aprova
  const v1 = (await q1(U.marca, 'select id from contents')).id;
  check('F: ajuste sem motivo falha', /ajustado/.test((await erro(() => as(db, U.marca, `select brand_review($1,'revision','')`, [v1]))) || ''));
  check('F: pede ajuste', (await q1(U.marca, `select brand_review($1,'revision','Mostrar o rótulo no início') s`, [v1])).s === 'revision');
  check('F: creator vê o motivo', (await q1(U.ugc, `select comment from content_reviews`))?.comment === 'Mostrar o rótulo no início');
  const p2 = `${camp}/${me}/v2-serum.mp4`;
  await as(db, U.ugc, `insert into storage.objects (bucket_id,name) values ('campanhas',$1)`, [p2]);
  check('F: nova versão = 2', (await q1(U.ugc, `select creator_submit($1,$2,'v2-serum.mp4','video/mp4') v`, [camp, p2])).v === 2);
  check('F: histórico mantém v1', (await as(db, U.marca, 'select version from contents order by version')).map((r) => r.version).join() === '1,2');
  const v2 = (await q1(U.marca, 'select id from contents where version=2')).id;
  check('F: limite de revisões respeitado', /revisões incluídas/.test((await erro(() => as(db, U.marca, `select brand_review($1,'revision','de novo')`, [v2]))) || ''));
  check('F: aprova', (await q1(U.marca, `select brand_review($1,'approved','Perfeito') s`, [v2])).s === 'approved');
  const ap = await q1(U.ugc, 'select c.rights_until, cc.payment_status, cc.payment_amount from contents c join campaign_creators cc on cc.creator_id=c.creator_id where c.version=2');
  check('G: direito de uso com vencimento', !!ap.rights_until);
  check('G: pagamento pendente R$200', ap.payment_status === 'pendente' && Number(ap.payment_amount) === 200, JSON.stringify(ap));
  // G: pagamento manual
  check('creator não marca pago', /permissão/.test((await erro(() => as(db, U.ugc, `select brand_mark_paid($1,'x')`, [cc.id]))) || ''));
  check('pago exige nota', /Informe/.test((await erro(() => as(db, U.marca, `select brand_mark_paid($1,'')`, [cc.id]))) || ''));
  check('G: marca confirma pagamento', (await q1(U.marca, `select brand_mark_paid($1,'PIX 05/10 ID E123') s`, [cc.id])).s === 'pago');
  check('G: creator vê pago', (await q1(U.ugc, 'select payment_status, payment_note from campaign_creators')).payment_note === 'PIX 05/10 ID E123');
  check('G: creator notificado', (await q1(U.ugc, `select count(*)::int n from squad_notifications`)).n >= 4);
  // afiliados: comissão exige regra de pagamento
  const af = await q1(U.marca, `insert into campaigns (organization_id,title,slug,intent,campaign_type,product,brief,compensation)
     values ('00000000-0000-0000-0000-000000000001','Afiliados Sérum','af-1','comissao','affiliate','{"name":"Sérum"}','{"show":"Use o cupom"}','{"commission_pct":10}') returning id`);
  check('afiliado: sem regra de pagamento falha', /comissão/.test((await erro(() => as(db, U.marca, 'select campaign_publish($1)', [af.id]))) || ''));
  await as(db, U.marca, `update campaigns set compensation='{"commission_pct":10,"commission_base":"valor pago sem frete","tracking":"cupom","payment_terms":"30 dias após a venda, descontadas devoluções"}', coupon='SERUM10' where id=$1`, [af.id]);
  check('afiliado: publica', (await q1(U.marca, 'select campaign_publish($1) s', [af.id])).s === 'open');
  await as(db, U.marca, `update campaigns set compensation = compensation || '{"commission_pct":12}' where id=$1`, [af.id]);
  check('mudar condições cria versão 2', (await q1('service', 'select terms_version from campaigns where id=$1', [af.id])).terms_version === 2);
  await as(db, 'service', `update campaigns set is_test=true where id=$1`, [af.id]);
  check('H: campanha de teste oculta p/ visitante', (await as(db, null, 'select id from campaigns where id=$1', [af.id])).length === 0);
  console.log(`\n${ok} verificações OK, ${falhas.length} falhas`);
  falhas.forEach((f) => console.log('  ✗', f));
  process.exit(falhas.length ? 1 : 0);
})().catch((e) => { console.log('ERRO', e.message); process.exit(1); });
