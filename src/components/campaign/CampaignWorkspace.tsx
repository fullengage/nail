import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Copy, Download, Loader2, Package, RefreshCw, Search, Send, ShieldCheck, Users, Video } from 'lucide-react';
import { Button } from '../ui/Button';
import { useData } from '../../context/DataContext';
import { campaignFlow, CAMPAIGN_STATUS, STAGE, PAYMENT, rightsText, compensationText, humanError, isOverdue, loadRules, paymentFlowText, DEFAULT_RULES, type Content, type FlowCampaign, type Participation, type SquadRules } from '../../services/campaignFlow';
import { useAuth } from '../../context/AuthContext';
import { audienceQuality, followersOf } from '../../lib/creatorQuality';
import { deliverablesText } from './CampaignBuilder';
import type { CreatorProfile } from '../../types/database';

const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const br = (iso?: string | null) => (iso ? new Date(iso.length === 10 ? iso + 'T12:00' : iso).toLocaleDateString('pt-BR') : '—');
const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000).toLocaleString('pt-BR')} mil` : String(n));

// por que recomendamos: só com dado que existe (nada de "compatibilidade" inventada)
function reasons(c: CreatorProfile, intent: string | null): string[] {
  const r: string[] = [];
  const q = audienceQuality(c);
  const tags = c.tags || [];
  if (intent === 'comissao' || intent === 'live') {
    if (tags.includes('TikTok Shop')) r.push('Vende no TikTok Shop');
    if (tags.includes('Vendas por live') || c.accepts_live_campaigns) r.push('Já faz live de vendas');
  }
  if (intent === 'conteudo_marca' && (tags.includes('UGC/publi') || tags.includes('UGC'))) r.push('Se apresenta como creator UGC');
  if (intent === 'post_creator' && followersOf(c)) r.push(`${fmt(followersOf(c))} seguidores`);
  if (q.key === 'alta' || q.key === 'real') r.push(`${q.label} (${c.engagement_rate}%)`);
  if (c.specialties?.[0]) r.push(`Nicho: ${c.specialties[0]}`);
  return r;
}

export const CampaignWorkspace: React.FC<{ campaignId: string; onBack: () => void; onEditDraft: (c: FlowCampaign) => void; onDuplicate: (c: FlowCampaign) => void; justPublished?: boolean }> = ({ campaignId, onBack, onEditDraft, onDuplicate, justPublished }) => {
  const { creators } = useData();
  const { role } = useAuth();
  const isAdmin = role === 'admin_master' || role === 'admin';
  const [rules, setRules] = useState<SquadRules>(DEFAULT_RULES);
  const [camp, setCamp] = useState<FlowCampaign | null>(null);
  const [parts, setParts] = useState<Participation[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  // curadoria: só a Squad (admin) seleciona creators
  const [tab, setTab] = useState<'acompanhar' | 'selecionar'>(justPublished && isAdmin ? 'selecionar' : 'acompanhar');

  const load = useCallback(async () => {
    setErr('');
    try {
      await campaignFlow.runDeadlines(); // aprova entregas vencidas e marca atrasos antes de mostrar
      const [c, p, k, r] = await Promise.all([campaignFlow.get(campaignId), campaignFlow.participants(campaignId, isAdmin), campaignFlow.contents(campaignId), loadRules()]);
      setRules(r);
      setCamp(c); setParts(p); setContents(k);
    } catch (e) { setErr(humanError(e)); } finally { setLoading(false); }
  }, [campaignId, isAdmin]);
  useEffect(() => { load(); }, [load]);

  const act = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    if (busy) return;
    setBusy(key); setErr('');
    try { await fn(); setToast(ok); setTimeout(() => setToast(''), 3500); await load(); } catch (e) { setErr(humanError(e)); } finally { setBusy(null); }
  };

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Carregando campanha…</div>;
  if (!camp) return <div className="py-20 text-center space-y-3"><p className="text-sm text-muted-foreground">{err || 'Campanha não encontrada.'}</p><Button variant="outline" onClick={onBack}>Voltar</Button></div>;

  const st = CAMPAIGN_STATUS[camp.status] || CAMPAIGN_STATUS.draft;
  const by = (s: string[]) => parts.filter((p) => s.includes(p.stage));
  const hired = parts.filter((p) => p.hired_at && !['rejected', 'cancelled'].includes(p.stage));
  const approvedContents = contents.filter((k) => k.status === 'approved');
  // investimento = o que a marca já pagou à Squad (cachê + taxa), confirmado pelo admin
  const paid = parts.filter((p) => ['recebido', 'repassado'].includes(p.payment_status)).reduce((a, p) => a + Number(p.brand_total || 0), 0);
  const publicLink = `${window.location.origin}/creator/oportunidades?campanha=${camp.id}`;

  // pendências com responsável, prazo e ação
  const toScreen = contents.filter((k) => k.status === 'squad_review');
  const toReview = contents.filter((k) => k.status === 'reviewing');
  const pend: { who: string; text: string; due?: string | null; go?: () => void }[] = [];
  if (camp.status === 'draft') pend.push({ who: 'Você', text: 'Publicar a campanha', go: () => onEditDraft(camp) });
  if (isAdmin && ['open', 'selecting'].includes(camp.status) && parts.length === 0) pend.push({ who: 'Você', text: 'Convidar creators recomendados', due: camp.application_deadline, go: () => setTab('selecionar') });
  if (!isAdmin && ['open', 'selecting', 'in_progress'].includes(camp.status) && hired.length < camp.creator_slots) pend.push({ who: 'Squad UGC', text: `Selecionar e contratar os creators (${hired.length}/${camp.creator_slots})`, due: camp.selection_deadline });
  if (!isAdmin && camp.compensation?.product && camp.status !== 'draft') pend.push({ who: 'Você', text: 'Enviar os produtos para a Squad UGC (ela repassa aos creators)' });
  isAdmin && by(['applied']).length && pend.push({ who: 'Você', text: `${by(['applied']).length} candidatura(s) para avaliar`, due: camp.selection_deadline, go: () => document.getElementById('sec-applied')?.scrollIntoView({ behavior: 'smooth' }) });
  isAdmin && by(['shipping']).filter((p) => p.shipping).length && pend.push({ who: 'Você', text: `Enviar produto para ${by(['shipping']).filter((p) => p.shipping).length} creator(s)`, go: () => document.getElementById('sec-shipping')?.scrollIntoView({ behavior: 'smooth' }) });
  isAdmin && toScreen.length && pend.push({ who: 'Você', text: `${toScreen.length} entrega(s) para filtrar antes da marca`, go: () => document.getElementById('sec-review')?.scrollIntoView({ behavior: 'smooth' }) });
  !isAdmin && by(['submitted']).length > toReview.length && pend.push({ who: 'Squad UGC', text: 'Conferir entregas antes de enviar para você' });
  toReview.length && pend.push({ who: isAdmin ? 'Marca' : 'Você', text: `${toReview.length} entrega(s) para revisar`, due: toReview.map((k) => k.review_due_at).sort()[0], go: isAdmin ? undefined : () => document.getElementById('sec-review')?.scrollIntoView({ behavior: 'smooth' }) });
  const toPay = parts.filter((p) => p.payment_status === 'aguardando_marca' && !p.brand_reported_at);
  toPay.length && pend.push({ who: 'Você', text: `${toPay.length} pagamento(s) à Squad${toPay.some(isOverdue) ? ' (em atraso!)' : ''}`, due: toPay.map((p) => p.brand_due_at).sort()[0], go: () => document.getElementById('sec-pay')?.scrollIntoView({ behavior: 'smooth' }) });
  isAdmin && parts.filter((p) => p.payment_status === 'aguardando_marca' && p.brand_reported_at).length && pend.push({ who: 'Você', text: `Confirmar recebimento de ${parts.filter((p) => p.payment_status === 'aguardando_marca' && p.brand_reported_at).length} pagamento(s) da marca`, go: () => document.getElementById('sec-pay')?.scrollIntoView({ behavior: 'smooth' }) });
  isAdmin && parts.filter((p) => p.payment_status === 'recebido').length && pend.push({ who: 'Você', text: `Repassar ${parts.filter((p) => p.payment_status === 'recebido').length} cachê(s) aos creators`, due: parts.filter((p) => p.payment_status === 'recebido').map((p) => p.payout_due_at).sort()[0], go: () => document.getElementById('sec-pay')?.scrollIntoView({ behavior: 'smooth' }) });
  !isAdmin && parts.filter((p) => p.payment_status === 'aguardando_marca' && p.brand_reported_at).length && pend.push({ who: 'Squad UGC', text: 'Confirmar o recebimento do seu pagamento' });
  !isAdmin && parts.filter((p) => p.payment_status === 'recebido').length && pend.push({ who: 'Squad UGC', text: 'Repassar o cachê aos creators', due: parts.filter((p) => p.payment_status === 'recebido').map((p) => p.payout_due_at).sort()[0] });
  by(['invited']).length && pend.push({ who: 'Creators', text: `${by(['invited']).length} convidado(s) ainda não responderam`, due: camp.application_deadline });
  by(['producing', 'revision', 'shipping']).length && pend.push({ who: 'Creators', text: `${by(['producing', 'revision']).length} produzindo / ajustando`, due: camp.delivery_deadline });

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-border pb-4">
        <div className="space-y-1">
          <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Campanhas</button>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">{camp.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${st.cls}`}>{st.label}</span>
            {camp.is_test && <span className="px-2 py-0.5 rounded-full border text-[11px] font-bold bg-amber-500/10 text-amber-700 border-amber-500/30">TESTE</span>}
            <span className="text-[11px] text-muted-foreground">{st.hint}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {camp.status === 'draft' && <Button size="sm" onClick={() => onEditDraft(camp)}>Continuar e publicar</Button>}
          {isAdmin && camp.status !== 'draft' && <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(publicLink); setToast('Link copiado'); setTimeout(() => setToast(''), 2500); }}><Copy className="w-3.5 h-3.5" />Copiar link público</Button>}
          {isAdmin && camp.status === 'open' && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act('sel', () => campaignFlow.setStatus(camp.id, 'selecting'), 'Candidaturas encerradas')}>Encerrar candidaturas</Button>}
          {['in_progress', 'selecting'].includes(camp.status) && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => window.confirm('Concluir a campanha? Pagamentos pendentes continuam visíveis.') && act('done', () => campaignFlow.setStatus(camp.id, 'completed'), 'Campanha concluída')}>Concluir</Button>}
          <Button size="sm" variant="ghost" onClick={() => onDuplicate(camp)}>Duplicar</Button>
          <Button size="sm" variant="ghost" onClick={load} aria-label="Atualizar"><RefreshCw className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      {justPublished && (
        <div className="p-4 rounded-2xl bg-primary/40 border-2 border-black">
          <p className="font-bold text-foreground">{isAdmin ? 'Campanha publicada. Agora selecione ou convide creators.' : 'Campanha publicada. A Squad UGC vai selecionar os creators.'}</p>
          <p className="text-xs text-foreground/80">{isAdmin ? 'Publicada não quer dizer contratada: os creators leem as condições, aceitam e a Squad escolhe quem contratar.' : 'Você acompanha aqui quem foi contratado, revisa os vídeos que a Squad aprovar e faz o pagamento.'}</p>
        </div>
      )}
      {toast && <div role="status" className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-700">{toast}</div>}
      {err && <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-700">{err}</div>}

      {/* números operacionais verificáveis */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {([
          ...(isAdmin ? [
            ['Convidados', by(['invited']).length + parts.filter((p) => p.invited_at && p.stage !== 'invited').length],
            ['Aceitaram as condições', parts.filter((p) => p.terms_accepted_at).length],
          ] : []),
          ['Contratados', `${hired.length}/${camp.creator_slots}`],
          ['Conteúdos entregues', contents.length ? new Set(contents.map((k) => k.creator_id)).size : 0],
          ['Aprovados', approvedContents.length],
          ['Pago à Squad', brl(paid)],
        ] as [string, React.ReactNode][]).map(([k, v]) => (
          <div key={k} className="p-3 rounded-xl bg-card border border-border"><p className="text-[10px] uppercase font-bold text-muted-foreground">{k}</p><p className="text-lg font-extrabold text-foreground">{v}</p></div>
        ))}
      </div>
      {approvedContents.length > 0 && paid > 0 && <p className="text-[11px] text-muted-foreground">Custo por conteúdo aprovado (pago à Squad ÷ aprovados): <strong>{brl(paid / approvedContents.length)}</strong>. Vendas e cliques só aparecem quando houver uma fonte conectada.</p>}

      {isAdmin && (
        <div className="flex gap-2 border-b border-border">
          {([['acompanhar', 'Acompanhar'], ['selecionar', 'Selecionar e convidar creators']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 text-xs font-bold border-b-2 ${tab === k ? 'border-black text-foreground' : 'border-transparent text-muted-foreground'}`}>{l}</button>
          ))}
        </div>
      )}

      {isAdmin && tab === 'selecionar' && <Selector camp={camp} creators={creators} parts={parts} busy={busy} onInvite={(ids) => act('inv', () => campaignFlow.invite(camp.id, ids), `${ids.length} creator(s) convidado(s). Eles veem o convite ao entrar; nenhum e-mail foi enviado.`)} />}

      {tab === 'acompanhar' && (
        <div className="space-y-5">
          {/* pendências */}
          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-sm font-bold text-foreground">Pendências</h2>
            {pend.length === 0 ? <p className="text-xs text-muted-foreground">Nada pendente agora.</p> : (
              <ul className="divide-y divide-border">
                {pend.map((p, i) => (
                  <li key={i} className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span><span className={`mr-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${p.who === 'Você' ? 'bg-black text-white' : 'bg-muted text-muted-foreground'}`}>{p.who}</span>{p.text}{p.due ? <span className="text-muted-foreground"> · até {br(p.due)}</span> : null}</span>
                    {p.who === 'Você' && p.go && <Button size="sm" variant="outline" onClick={p.go}>Resolver</Button>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {isAdmin && <>
            <Section id="sec-applied" title="Candidatos e aceites" empty="Nenhuma candidatura ainda." items={by(['invited', 'applied'])}>
              {(p) => (
                <Row key={p.id} p={p} extra={p.terms_accepted_at ? `Aceitou as condições v${p.terms_version} em ${br(p.terms_accepted_at)}${p.message ? ` · “${p.message}”` : ''}` : 'Convite enviado · aguardando resposta'}>
                  {p.stage === 'applied' && <>
                    <Button size="sm" disabled={!!busy} onClick={() => act(p.id, () => campaignFlow.participant(p.id, 'hire'), 'Creator contratado')}>Contratar</Button>
                    <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => act(p.id, () => campaignFlow.participant(p.id, 'reject'), 'Candidatura recusada')}>Recusar</Button>
                  </>}
                </Row>
              )}
            </Section>

            <Section id="sec-shipping" title="Envio de produtos (a marca manda para a Squad)" empty="Nenhum envio pendente." items={by(['shipping'])}>
              {(p) => <ShipRow key={p.id} p={p} busy={busy} onShip={(note) => act(p.id, () => campaignFlow.participant(p.id, 'shipped', note), 'Envio informado ao creator')} />}
            </Section>
          </>}

          <Section id="sec-production" title={isAdmin ? 'Em produção' : 'Creators contratados pela Squad'} empty={isAdmin ? 'Ninguém produzindo agora.' : 'A Squad UGC ainda está selecionando os creators.'} items={isAdmin ? by(['producing', 'revision']) : hired}>
            {(p) => <Row key={p.id} p={p} extra={isAdmin
              ? (p.stage === 'revision' ? 'Ajustando após pedido' : `Entrega até ${br(camp.delivery_deadline)}`)
              : [p.creator?.instagram, p.creator?.tiktok].filter(Boolean).join(' · ') || undefined} />}
          </Section>

          <section id="sec-review" className="p-4 rounded-2xl bg-card border border-border space-y-3">
            <h2 className="text-sm font-bold text-foreground">Entregas e revisões</h2>
            {!isAdmin && <p className="text-[11px] text-muted-foreground">A Squad UGC confere cada vídeo antes; aqui chegam só os que passaram.</p>}
            {contents.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma entrega recebida.</p> : (
              [...new Set(contents.map((k) => k.creator_id))].map((cid) => (
                <ReviewBlock key={cid} camp={camp} part={parts.find((p) => p.creator_id === cid)} versions={contents.filter((k) => k.creator_id === cid)} busy={busy} isAdmin={isAdmin}
                  onDecide={(id, decision, comment) => act(id, () => campaignFlow.review(id, decision, comment), decision === 'approved' ? 'Entrega aprovada' : 'Ajuste solicitado ao creator')}
                  onScreen={(id, decision, comment) => act(id, () => campaignFlow.screen(id, decision, comment), decision === 'forward' ? 'Entrega encaminhada à marca' : 'Ajuste solicitado ao creator')} />
              ))
            )}
          </section>

          <section id="sec-pay" className="p-4 rounded-2xl bg-card border border-border space-y-3">
            <h2 className="text-sm font-bold text-foreground">Pagamentos</h2>
            <p className="text-[11px] text-muted-foreground">{paymentFlowText(rules)} O pagamento é feito fora do sistema (PIX/transferência para a Squad UGC); aqui fica o registro de cada etapa. Nada é cobrado automaticamente.</p>
            {parts.filter((p) => p.payment_status !== 'nao_devido').length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma cobrança ainda: ela é gerada quando uma entrega é aprovada.</p> :
              parts.filter((p) => p.payment_status !== 'nao_devido').map((p) => (
                <PayRow key={p.id} p={p} busy={busy} isAdmin={isAdmin}
                  onReport={(note, file) => act(p.id, () => campaignFlow.reportPayment(p.id, camp.id, p.creator_id, note, file), 'Pagamento informado. A Squad vai confirmar o recebimento.')}
                  onAdmin={(action, note, file) => act(p.id, () => campaignFlow.adminPayment(p.id, action, camp.id, p.creator_id, note, file), action === 'received' ? 'Recebimento confirmado. Prazo de repasse aberto.' : 'Repasse registrado e creator avisado.')} />
              ))}
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" />Direitos de uso</h2>
            <ul className="text-xs text-muted-foreground list-disc pl-4">{rightsText(camp.usage_rights).map((t) => <li key={t}>{t}</li>)}</ul>
            {approvedContents.length > 0 && (
              <ul className="text-xs divide-y divide-border">
                {approvedContents.map((k) => (
                  <li key={k.id} className="py-1.5 flex justify-between gap-2"><span>{parts.find((p) => p.creator_id === k.creator_id)?.creator?.professional_name} · v{k.version} · {k.file_name || 'post'}</span>
                    <span className="font-bold text-foreground">{k.rights_until ? `pode usar até ${br(k.rights_until)}` : 'uso conforme condições (sem prazo de anúncio)'}</span></li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-muted-foreground">Os textos de condições e autorização de uso precisam de revisão jurídica antes da operação real.</p>
          </section>

          <details className="p-4 rounded-2xl bg-card border border-border text-xs">
            <summary className="font-bold cursor-pointer">Condições publicadas (versão {camp.terms_version})</summary>
            <dl className="mt-2 space-y-1.5">
              <div><dt className="font-bold">Produto</dt><dd className="text-muted-foreground">{camp.product?.name}</dd></div>
              <div><dt className="font-bold">Entregas</dt><dd className="text-muted-foreground">{deliverablesText({ intent: (camp.intent || 'conteudo_marca') as never, deliverables: camp.deliverables || {} })}</dd></div>
              <div><dt className="font-bold">Remuneração</dt><dd className="text-muted-foreground">{compensationText(camp.compensation, camp.product).join(' ')}</dd></div>
              <div><dt className="font-bold">Briefing</dt><dd className="text-muted-foreground">{[camp.brief?.show, camp.brief?.identify, camp.brief?.deliver].filter(Boolean).join(' · ')}</dd></div>
              <div><dt className="font-bold">Prazos</dt><dd className="text-muted-foreground">Candidaturas até {br(camp.application_deadline)} · entrega até {br(camp.delivery_deadline)} · {camp.revisions_included} revisão(ões)</dd></div>
            </dl>
          </details>
        </div>
      )}
    </div>
  );
};

function Section({ id, title, empty, items, children }: { id: string; title: string; empty: string; items: Participation[]; children: (p: Participation) => React.ReactNode }) {
  return (
    <section id={id} className="p-4 rounded-2xl bg-card border border-border space-y-2">
      <h2 className="text-sm font-bold text-foreground">{title} <span className="text-muted-foreground font-normal">({items.length})</span></h2>
      {items.length === 0 ? <p className="text-xs text-muted-foreground">{empty}</p> : <ul className="divide-y divide-border">{items.map(children)}</ul>}
    </section>
  );
}
function Row({ p, extra, children }: { p: Participation; extra?: string; children?: React.ReactNode }) {
  const s = STAGE[p.stage] || { label: p.stage };
  return (
    <li className="py-2.5 flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{p.creator?.professional_name || 'Creator'} <span className="ml-1 px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold text-muted-foreground">{s.label}</span></p>
        {extra && <p className="text-[11px] text-muted-foreground">{extra}</p>}
      </div>
      <div className="flex gap-2">{children}</div>
    </li>
  );
}
function ShipRow({ p, busy, onShip }: { p: Participation; busy: string | null; onShip: (note: string) => void }) {
  const [note, setNote] = useState('');
  const a = p.shipping;
  return (
    <Row p={p} extra={a ? `Enviar para: ${[a.name, a.street, a.number, a.complement, a.district, a.city, a.state, a.zip].filter(Boolean).join(', ')}` : 'Aguardando o creator informar o endereço'}>
      {a && <>
        <input aria-label="Código de rastreio" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Rastreio (opcional)" className="px-2 py-1 text-xs rounded-lg border border-border bg-background w-36" />
        <Button size="sm" disabled={!!busy} onClick={() => onShip(note)}><Package className="w-3.5 h-3.5" />Produto enviado</Button>
      </>}
    </Row>
  );
}
// cada etapa do dinheiro, com quem age: marca informa → Squad (admin) confirma → Squad repassa
function PayRow({ p, busy, isAdmin, onReport, onAdmin }: { p: Participation; busy: string | null; isAdmin: boolean; onReport: (note: string, file: File | null) => void; onAdmin: (a: 'received' | 'payout', note: string, file: File | null) => void }) {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const late = isOverdue(p);
  const form = (label: string, ph: string, onGo: () => void, needNote = true) => (
    <div className="flex flex-wrap gap-2 items-center">
      <input aria-label="Referência" value={note} onChange={(e) => setNote(e.target.value)} placeholder={ph} className="flex-1 min-w-[180px] px-2 py-1.5 rounded-lg border border-border bg-background" />
      <input aria-label="Comprovante" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[11px]" />
      <Button size="sm" disabled={!!busy || (needNote && !note.trim())} onClick={onGo}>{label}</Button>
    </div>
  );
  return (
    <div className={`p-3 rounded-xl border text-xs space-y-2 ${late ? 'border-red-500/50 bg-red-500/5' : 'border-border'}`}>
      <div className="flex flex-wrap justify-between gap-2">
        <span className="font-bold">{p.creator?.professional_name}</span>
        <strong className={p.payment_status === 'repassado' ? 'text-emerald-700' : late ? 'text-red-700' : 'text-amber-700'}>{late ? 'Em atraso · ' : ''}{PAYMENT[p.payment_status]}</strong>
      </div>
      <p className="text-muted-foreground">Cachê {brl(Number(p.payment_amount || 0))} + taxa Squad {brl(Number(p.squad_fee_amount || 0))} = <strong className="text-foreground">{brl(Number(p.brand_total || 0))}</strong> a pagar à Squad{p.brand_due_at ? ` até ${br(p.brand_due_at)}` : ''}.</p>
      <ol className="space-y-0.5 text-muted-foreground">
        <li>{p.brand_reported_at ? '✓' : '○'} Marca pagou a Squad{p.brand_reported_at ? ` (informado em ${br(p.brand_reported_at)}: ${p.brand_payment_note}${p.brand_proof_path ? ', com comprovante' : ''})` : ''}</li>
        <li>{p.brand_paid_at ? '✓' : '○'} Squad confirmou o recebimento{p.brand_paid_at ? ` em ${br(p.brand_paid_at)}` : ''}</li>
        <li>{p.payment_status === 'repassado' ? '✓' : '○'} Squad pagou o creator{p.paid_at ? ` em ${br(p.paid_at)}: ${p.payment_note}` : p.payout_due_at ? ` (prazo: ${br(p.payout_due_at)})` : ''}</li>
      </ol>
      {!isAdmin && p.payment_status === 'aguardando_marca' && !p.brand_reported_at && form('Informar que paguei', 'Ex.: PIX à Squad 05/10, ID E123…', () => onReport(note, file))}
      {isAdmin && p.payment_status === 'aguardando_marca' && form('Confirmar recebimento da marca', 'Referência conferida no extrato (opcional)', () => onAdmin('received', note, file), false)}
      {isAdmin && p.payment_status === 'recebido' && form('Registrar repasse ao creator', 'Ex.: PIX ao creator, ID E456…', () => onAdmin('payout', note, file))}
    </div>
  );
}
const CONTENT_STATUS: Record<string, string> = { squad_review: 'Em triagem pela Squad', reviewing: 'Aguardando revisão da marca', revision_requested: 'Ajuste pedido', approved: 'Aprovado' };
function ReviewBlock({ camp, part, versions, busy, isAdmin, onDecide, onScreen }: { camp: FlowCampaign; part?: Participation; versions: Content[]; busy: string | null; isAdmin: boolean; onDecide: (id: string, d: 'approved' | 'revision', comment?: string) => void; onScreen: (id: string, d: 'forward' | 'revision', comment?: string) => void }) {
  const [comment, setComment] = useState('');
  const [preview, setPreview] = useState<Record<string, string>>({});
  const latest = versions[0];
  // ajustes pedidos pela Squad na triagem não contam nas revisões da marca
  const used = versions.flatMap((v) => v.reviews || []).filter((r) => r.decision === 'revision').length;
  const open = async (k: Content, download = false) => {
    if (!k.file_path) return;
    const url = await campaignFlow.fileUrl(k.file_path, download);
    if (!url) return;
    if (download) window.open(url, '_blank'); else setPreview((p) => ({ ...p, [k.id]: url }));
  };
  return (
    <div className="p-3 rounded-xl border border-border space-y-2">
      <p className="text-sm font-bold text-foreground">{part?.creator?.professional_name || 'Creator'} <span className="text-[11px] font-normal text-muted-foreground">· {versions.length} versão(ões) · revisões usadas {used}/{camp.revisions_included}</span></p>
      {versions.map((k) => (
        <div key={k.id} className={`p-2 rounded-lg border ${k.id === latest.id ? 'border-black' : 'border-border opacity-80'} text-xs space-y-1`}>
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-bold">v{k.version} · {k.file_name || 'link'} · {br(k.submitted_at)}</span>
            <span className={k.status === 'approved' ? 'text-emerald-700 font-bold' : k.status === 'revision_requested' ? 'text-amber-700 font-bold' : 'font-bold'}>{k.status === 'approved' && k.auto_approved ? 'Aprovado automaticamente (prazo)' : k.status === 'reviewing' && !isAdmin ? 'Aguardando sua revisão' : CONTENT_STATUS[k.status] || k.status}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {k.file_path && <button className="underline inline-flex items-center gap-1" onClick={() => open(k)}><Video className="w-3.5 h-3.5" />Ver vídeo</button>}
            {k.file_path && <button className="underline inline-flex items-center gap-1" onClick={() => open(k, true)}><Download className="w-3.5 h-3.5" />Baixar original</button>}
            {k.published_url && <a className="underline" href={k.published_url} target="_blank" rel="noreferrer">Ver post publicado</a>}
          </div>
          {preview[k.id] && (k.mime?.startsWith('image') ? <img src={preview[k.id]} alt={`Entrega v${k.version}`} className="max-h-80 rounded-lg" /> : <video src={preview[k.id]} controls className="max-h-80 rounded-lg w-full bg-black" />)}
          {k.caption && <p className="text-muted-foreground">Legenda: {k.caption}</p>}
          {(k.reviews || []).map((r) => <p key={r.id} className="text-muted-foreground">↳ {r.decision === 'revision' ? 'Ajuste pedido' : r.decision === 'squad_revision' ? 'Ajuste pedido pela Squad' : r.decision === 'approved' ? 'Aprovação' : 'Comentário'}: {r.comment}</p>)}
        </div>
      ))}
      {isAdmin && latest.status === 'squad_review' && (
        <div className="space-y-2">
          <label htmlFor={`s-${latest.id}`} className="text-xs font-bold">Comentário para o creator (triagem da Squad)</label>
          <textarea id={`s-${latest.id}`} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Obrigatório para pedir ajuste. A marca não vê esta versão." className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!!busy} onClick={() => onScreen(latest.id, 'forward')}><Send className="w-3.5 h-3.5" />Encaminhar à marca</Button>
            <Button size="sm" variant="outline" disabled={!!busy || !comment.trim()} onClick={() => onScreen(latest.id, 'revision', comment)}>Pedir ajuste (não gasta revisão da marca)</Button>
          </div>
        </div>
      )}
      {latest.status === 'reviewing' && (
        <div className="space-y-2">
          <label htmlFor={`c-${latest.id}`} className="text-xs font-bold">Comentário para o creator</label>
          <textarea id={`c-${latest.id}`} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Obrigatório para pedir ajuste: diga o que mudar." className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!!busy} onClick={() => onDecide(latest.id, 'approved', comment)}><CheckCircle2 className="w-3.5 h-3.5" />Aprovar</Button>
            <Button size="sm" variant="outline" disabled={!!busy || !comment.trim() || used >= camp.revisions_included} onClick={() => onDecide(latest.id, 'revision', comment)}>Pedir ajuste</Button>
            {used >= camp.revisions_included && <span className="text-[11px] text-muted-foreground self-center">Revisões incluídas esgotadas.</span>}
            {latest.review_due_at && <span className="text-[11px] font-bold text-amber-700 self-center">Se não revisar até {br(latest.review_due_at)}, a entrega é aprovada automaticamente.</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// seleção derivada do briefing: filtros iniciais pelo objetivo, motivo explícito por creator
function Selector({ camp, creators, parts, busy, onInvite }: { camp: FlowCampaign; creators: CreatorProfile[]; parts: Participation[]; busy: string | null; onInvite: (ids: string[]) => void }) {
  const [q, setQ] = useState('');
  const [onlyReal, setOnlyReal] = useState(true);
  const [focus, setFocus] = useState<'auto' | 'shop' | 'ugc' | 'audience'>('auto');
  // vindos da tela de Creators ("criar campanha com estes creators")
  const [picked, setPicked] = useState<string[]>(() => {
    const v = sessionStorage.getItem('squad_pending_invites');
    if (!v) return [];
    sessionStorage.removeItem('squad_pending_invites');
    try { return JSON.parse(v); } catch { return []; }
  });
  const inCampaign = new Map(parts.map((p) => [p.creator_id, p.stage]));
  const canInvite = ['open', 'selecting', 'in_progress'].includes(camp.status);
  const list = useMemo(() => {
    const f = focus === 'auto' ? (camp.intent === 'comissao' || camp.intent === 'live' ? 'shop' : camp.intent === 'conteudo_marca' ? 'ugc' : 'audience') : focus;
    const ql = q.trim().toLowerCase();
    return creators
      .filter((c) => !(c.tags || []).includes('teste') || c.professional_name.startsWith('[TESTE]'))
      .filter((c) => !ql || `${c.professional_name} ${c.tiktok} ${c.instagram} ${c.bio} ${(c.specialties || []).join(' ')}`.toLowerCase().includes(ql))
      .filter((c) => !onlyReal || ['alta', 'real'].includes(audienceQuality(c).key))
      .filter((c) => f !== 'shop' || (c.tags || []).some((t) => t === 'TikTok Shop' || t === 'Vendas por live'))
      .filter((c) => f !== 'ugc' || (c.tags || []).some((t) => t === 'UGC/publi' || t === 'UGC'))
      .sort((a, b) => (Number(b.engagement_rate) || 0) * Math.log10(followersOf(b) + 10) - (Number(a.engagement_rate) || 0) * Math.log10(followersOf(a) + 10))
      .slice(0, 60);
  }, [creators, q, onlyReal, focus, camp.intent]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <div className="space-y-3">
      {!canInvite && <p className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-800">Publique a campanha para convidar creators.</p>}
      <div className="p-3 rounded-2xl bg-card border border-border flex flex-wrap gap-2 items-center text-xs">
        <div className="relative flex-1 min-w-[180px]"><Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" /><input aria-label="Buscar creators" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, @, nicho…" className="w-full pl-8 pr-2 py-2 rounded-xl border border-border bg-background" /></div>
        <select aria-label="Foco" value={focus} onChange={(e) => setFocus(e.target.value as never)} className="px-2 py-2 rounded-xl border border-border bg-background">
          <option value="auto">Sugerido pelo briefing</option><option value="ugc">Creators UGC (vídeo para a marca)</option><option value="audience">Audiência (post no perfil)</option><option value="shop">Vendem por live / TikTok Shop</option>
        </select>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={onlyReal} onChange={(e) => setOnlyReal(e.target.checked)} />Só audiência real (1%+)</label>
      </div>
      <p className="text-[11px] text-muted-foreground">Perfis <strong>mapeados</strong> são públicos e ainda não confirmaram nada. Ao convidar, eles passam a <strong>convidados</strong>; só viram <strong>contratados</strong> depois de aceitar as condições e você confirmar.</p>
      {picked.length > 0 && (
        <div className="sticky top-2 z-10 p-3 rounded-xl bg-primary border-2 border-black flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
          <span>{picked.length} selecionado(s): {picked.map((id) => creators.find((c) => c.id === id)?.professional_name).join(', ')}</span>
          <Button size="sm" variant="gold" disabled={!!busy || !canInvite} onClick={() => { onInvite(picked); setPicked([]); }}><Send className="w-3.5 h-3.5" />Convidar selecionados</Button>
        </div>
      )}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {list.map((c) => {
          const st = inCampaign.get(c.id);
          const why = reasons(c, camp.intent);
          return (
            <li key={c.id} className={`p-3 rounded-xl border ${picked.includes(c.id) ? 'border-black bg-primary/20' : 'border-border bg-card'} flex gap-3`}>
              <input type="checkbox" aria-label={`Selecionar ${c.professional_name}`} disabled={!!st} checked={picked.includes(c.id)} onChange={() => toggle(c.id)} className="mt-1" />
              <div className="min-w-0 text-xs space-y-0.5">
                <p className="font-bold text-sm text-foreground truncate">{c.professional_name}</p>
                <p className="text-muted-foreground truncate">{[c.tiktok, c.instagram].filter(Boolean).join(' · ')} · {fmt(followersOf(c))} seguidores</p>
                <p className="text-foreground">{why.length ? `Por quê: ${why.join(' · ')}` : 'Sem dados suficientes para recomendar (avalie o perfil).'}</p>
                <p className="text-[10px] font-bold text-muted-foreground">{st ? STAGE[st]?.label || st : 'Mapeado (não confirmado)'}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="w-4 h-4" />Nenhum creator com esses filtros. Tente desmarcar “só audiência real”.</p>}
    </div>
  );
}
