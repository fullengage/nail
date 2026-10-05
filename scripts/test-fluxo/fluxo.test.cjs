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
  const ap = await q1(U.ugc, 'select c.rights_until, c.review_due_at, cc.payment_status, cc.payment_amount, cc.squad_fee_amount, cc.brand_total, cc.brand_due_at from contents c join campaign_creators cc on cc.creator_id=c.creator_id where c.version=2');
  check('G: direito de uso com vencimento', !!ap.rights_until);
  check('entrega tem prazo de revisão', !!ap.review_due_at);
  check('G: cobrança à marca = cachê 200 + taxa 15% (30) = 230', ap.payment_status === 'aguardando_marca' && Number(ap.squad_fee_amount) === 30 && Number(ap.brand_total) === 230, JSON.stringify(ap));
  const dias = Math.round((new Date(ap.brand_due_at) - Date.now()) / 86400000);
  check('G: marca tem 7 dias para pagar', dias === 7, String(dias));
  check('taxa congelada na campanha', Number((await q1('service', 'select squad_fee_pct from campaigns where id=$1', [camp])).squad_fee_pct) === 15);
  // G: marca paga a Squad → admin confirma → admin repassa
  check('creator não informa pagamento da marca', /permissão/.test((await erro(() => as(db, U.ugc, `select brand_report_payment($1,'x')`, [cc.id]))) || ''));
  check('marca: informar exige referência', /referência/.test((await erro(() => as(db, U.marca, `select brand_report_payment($1,'')`, [cc.id]))) || ''));
  check('marca informa que pagou', (await q1(U.marca, `select brand_report_payment($1,'PIX à Squad 05/10 ID E1') s`, [cc.id])).s === 'informado');
  check('admin avisado do pagamento', (await q1(U.admin, `select count(*)::int n from squad_notifications where title='Marca informou pagamento'`)).n === 1);
  check('marca não confirma o próprio pagamento', /Squad UGC confirma/.test((await erro(() => as(db, U.marca, `select admin_payment($1,'received')`, [cc.id]))) || ''));
  check('repasse antes do recebimento falha', /Confirme primeiro/.test((await erro(() => as(db, U.admin, `select admin_payment($1,'payout','x')`, [cc.id]))) || ''));
  check('admin confirma recebimento', (await q1(U.admin, `select admin_payment($1,'received') s`, [cc.id])).s === 'recebido');
  check('prazo de repasse aberto', !!(await q1('service', 'select payout_due_at from campaign_creators where id=$1', [cc.id])).payout_due_at);
  check('repasse exige referência', /referência/.test((await erro(() => as(db, U.admin, `select admin_payment($1,'payout','')`, [cc.id]))) || ''));
  check('G: admin registra repasse', (await q1(U.admin, `select admin_payment($1,'payout','PIX ao creator ID E2') s`, [cc.id])).s === 'repassado');
  const fim = await q1(U.ugc, 'select payment_status, payment_note, stage from campaign_creators where id=$1', [cc.id]);
  check('G: creator vê repassado', fim.payment_status === 'repassado' && fim.payment_note === 'PIX ao creator ID E2' && fim.stage === 'paid', JSON.stringify(fim));
  check('G: creator notificado do repasse', (await q1(U.ugc, `select count(*)::int n from squad_notifications where title='Cachê pago pela Squad'`)).n === 1);
  check('admin_payment repetido não duplica', (await q1(U.admin, `select admin_payment($1,'payout','de novo') s`, [cc.id])).s === 'repassado');
  // aprovação automática após o prazo de revisão + cobrança em atraso
  const [c2] = await as(db, U.marca, `insert into campaigns (organization_id,title,slug,intent,campaign_type,creator_slots,product,brief,compensation)
     values ('00000000-0000-0000-0000-000000000001','Vídeos 2','v-2','conteudo_marca','ugc',1,'{"name":"Sérum"}','{"show":"Mostre o produto"}','{"fee":100}') returning id`);
  await as(db, U.marca, 'select campaign_publish($1)', [c2.id]);
  await as(db, U.ugc, 'select creator_apply($1, 1)', [c2.id]);
  const cc2 = await q1(U.marca, 'select id from campaign_creators where campaign_id=$1', [c2.id]);
  await as(db, U.marca, `select brand_participant($1,'hire')`, [cc2.id]);
  const p3 = `${c2.id}/${me}/v1.mp4`;
  await as(db, U.ugc, `insert into storage.objects (bucket_id,name) values ('campanhas',$1)`, [p3]);
  await as(db, U.ugc, `select creator_submit($1,$2,'v1.mp4','video/mp4')`, [c2.id, p3]);
  check('antes do prazo nada aprova sozinho', (await q1(U.ugc, 'select squad_run_deadlines() n')).n === 0);
  await as(db, 'service', `update contents set review_due_at = now() - interval '1 minute' where campaign_id=$1`, [c2.id]);
  check('prazo vencido: roda', (await q1(U.ugc, 'select squad_run_deadlines() n')).n === 1);
  const auto = await q1(U.marca, 'select k.status, k.auto_approved, cc.payment_status, cc.brand_total from contents k join campaign_creators cc on cc.campaign_id=k.campaign_id where k.campaign_id=$1', [c2.id]);
  check('aprovado automaticamente e cobrado', auto.status === 'approved' && auto.auto_approved && auto.payment_status === 'aguardando_marca' && Number(auto.brand_total) === 115, JSON.stringify(auto));
  check('creator vê o motivo da aprovação automática', /prazo de revisão/.test((await q1(U.ugc, `select comment from content_reviews where decision='approved' order by created_at desc limit 1`)).comment));
  await as(db, 'service', `update campaign_creators set brand_due_at = now() - interval '1 day' where id=$1`, [cc2.id]);
  await as(db, U.ugc, 'select squad_run_deadlines()');
  await as(db, U.ugc, 'select squad_run_deadlines()');
  check('atraso avisa admin uma vez só', (await q1(U.admin, `select count(*)::int n from squad_notifications where title='Cobrança em atraso'`)).n === 1);
  check('atraso avisa a marca', (await q1(U.marca, `select count(*)::int n from squad_notifications where title='Pagamento em atraso'`)).n === 1);
  // dias úteis: sexta + 5 dias úteis = sexta seguinte
  check('5 dias úteis a partir de sexta = sexta seguinte', (await q1('service', `select to_char(add_business_days('2026-10-02 10:00'::timestamptz, 5), 'YYYY-MM-DD') d`)).d === '2026-10-09');
  check('taxa ajustável só pelo admin', !!(await erro(async () => { const r = await as(db, U.marca, `update squad_settings set value=1 where key='fee_pct' returning key`); if (!r.length) throw new Error('bloqueado'); })));
  check('visitante lê a taxa', Number((await q1(null, `select squad_setting('fee_pct') v`)).v) === 15);
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
  // contagem de contatos sem expor contato (seed: 2 creators com e-mail e telefone + 1 de teste sem)
  const cnt = (await q1(null, 'select squad_contact_counts() c')).c;
  check('contagem de contatos para o painel', cnt.any === 2 && cnt.email === 2 && cnt.phone === 2, JSON.stringify(cnt));
  check('visitante continua sem ler e-mail', !!(await erro(() => as(db, null, 'select email from creators'))));
  console.log(`\n${ok} verificações OK, ${falhas.length} falhas`);
  falhas.forEach((f) => console.log('  ✗', f));
  process.exit(falhas.length ? 1 : 0);
})().catch((e) => { console.log('ERRO', e.message); process.exit(1); });
