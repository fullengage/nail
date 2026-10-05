import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, Package, Upload } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { OpportunityTerms } from '../../components/campaign/CampaignBuilder';
import { campaignFlow, compensationText, humanError, PAYMENT, STAGE, type Content, type FlowCampaign, type Participation } from '../../services/campaignFlow';
import type { Draft } from '../../lib/campaignDraft';

// Lado do creator ligado ao banco: oportunidades (com aceite), minhas campanhas (tarefas) e ganhos (só o que foi informado).
const br = (iso?: string | null) => (iso ? new Date(iso.length === 10 ? iso + 'T12:00' : iso).toLocaleDateString('pt-BR') : '—');
const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const asTerms = (c: FlowCampaign) => ({ intent: (c.intent || 'conteudo_marca') as Draft['intent'], deliverables: c.deliverables || {}, compensation: c.compensation || {}, product: c.product || {}, usage_rights: c.usage_rights || {}, brief: c.brief || {}, revisions_included: c.revisions_included, delivery_deadline: c.delivery_deadline || '', hashtag: c.hashtag || '', coupon: c.coupon || '' });

function useCreator() {
  const [state, setState] = useState<{ loading: boolean; me: string | null; err: string }>({ loading: true, me: null, err: '' });
  useEffect(() => {
    (async () => {
      try {
        const user = await campaignFlow.session();
        if (!user) return setState({ loading: false, me: null, err: '' });
        setState({ loading: false, me: await campaignFlow.myCreatorId(), err: '' });
      } catch (e) { setState({ loading: false, me: null, err: humanError(e) }); }
    })();
  }, []);
  return state;
}
const NeedLogin: React.FC = () => (
  <div className="p-6 rounded-2xl border border-dashed border-border text-center space-y-1">
    <p className="text-sm font-bold text-foreground">Entre com sua conta de creator para ver e aceitar campanhas.</p>
    <p className="text-xs text-muted-foreground">No modo demonstração (sem login) não há campanhas reais nem ganhos.</p>
  </div>
);
const Shell: React.FC<{ title: string; sub: string; children: React.ReactNode }> = ({ title, sub, children }) => (
  <div className="space-y-5 animate-in fade-in duration-300">
    <div className="border-b border-border pb-4"><h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">{title}</h1><p className="text-xs text-muted-foreground">{sub}</p></div>
    {children}
  </div>
);

// ---------------- oportunidades ----------------
export const CreatorOpportunitiesReal: React.FC = () => {
  const { loading, me, err } = useCreator();
  const [list, setList] = useState<FlowCampaign[]>([]);
  const [mine, setMine] = useState<Record<string, Participation>>({});
  const [open, setOpen] = useState<string | null>(() => new URLSearchParams(window.location.search).get('campanha'));
  const [accept, setAccept] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const load = useCallback(async () => {
    const [cs, ps] = await Promise.all([campaignFlow.openCampaigns(), campaignFlow.myParticipations()]);
    setMine(Object.fromEntries(ps.map((p) => [p.campaign_id, p])));
    // convites de campanhas abertas aparecem primeiro
    setList([...cs].sort((a, b) => Number(!!ps.find((p) => p.campaign_id === b.id && p.stage === 'invited')) - Number(!!ps.find((p) => p.campaign_id === a.id && p.stage === 'invited'))));
  }, []);
  useEffect(() => { if (me) load().catch((e) => setError(humanError(e))); }, [me, load]);

  if (loading) return <Shell title="Oportunidades" sub="Campanhas abertas para candidatura."><Loader2 className="w-5 h-5 animate-spin" /></Shell>;
  if (!me) return <Shell title="Oportunidades" sub="Campanhas abertas para candidatura.">{err ? <p className="text-xs text-red-700">{err}</p> : <NeedLogin />}</Shell>;
  const c = list.find((x) => x.id === open);

  const apply = async () => {
    if (!c || busy) return;
    setBusy(true); setError('');
    try { await campaignFlow.apply(c.id, c.terms_version, msg); setDone(`Candidatura enviada para “${c.title}”. Você aceitou as condições da versão ${c.terms_version} em ${new Date().toLocaleString('pt-BR')}. A marca vai decidir até ${br(c.selection_deadline)}.`); await load(); }
    catch (e) { setError(humanError(e)); } finally { setBusy(false); }
  };

  return (
    <Shell title="Oportunidades" sub="Leia as condições completas antes de aceitar.">
      {error && <p role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-700">{error}</p>}
      {done && <p role="status" className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-800">{done}</p>}
      {c ? (
        <div className="p-5 rounded-2xl bg-card border border-border space-y-4 max-w-2xl">
          <button className="text-xs text-muted-foreground underline" onClick={() => { setOpen(null); setDone(''); }}>← todas as oportunidades</button>
          <div className="flex gap-3 items-center">
            {c.product?.image_url ? <img src={c.product.image_url} alt="" className="w-16 h-16 rounded-xl object-cover border border-border" /> : <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center"><Package className="w-6 h-6 text-muted-foreground" /></div>}
            <div><h2 className="text-lg font-bold text-foreground">{c.title}</h2><p className="text-xs text-muted-foreground">{c.product?.name}{c.product?.url ? <> · <a className="underline" href={c.product.url} target="_blank" rel="noreferrer">ver produto</a></> : null}</p></div>
          </div>
          {c.product?.description && <p className="text-xs text-muted-foreground">{c.product.description}</p>}
          <OpportunityTerms d={asTerms(c)} />
          <p className="text-[11px] text-muted-foreground">Candidaturas até {br(c.application_deadline)} · seleção até {br(c.selection_deadline)} · condições versão {c.terms_version}</p>
          {mine[c.id] && mine[c.id].stage !== 'invited' ? (
            <p className="p-3 rounded-xl bg-muted/50 border border-border text-xs font-bold">Você já respondeu: {STAGE[mine[c.id].stage]?.label}. Acompanhe em “Minhas campanhas”.</p>
          ) : (
            <div className="space-y-2 border-t border-border pt-3">
              {mine[c.id]?.stage === 'invited' && <p className="text-xs font-bold text-foreground">A marca convidou você para esta campanha.</p>}
              <label htmlFor="msg" className="text-xs font-bold">Mensagem para a marca (opcional)</label>
              <textarea id="msg" rows={2} value={msg} onChange={(e) => setMsg(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border" placeholder="Ex.: já uso o produto e faço vídeos assim" />
              <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5" />Li e aceito as condições acima (entregas, prazo, remuneração e uso do conteúdo), versão {c.terms_version}.</label>
              <Button disabled={!accept || busy} onClick={apply}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}Aceitar e me candidatar</Button>
              <p className="text-[11px] text-muted-foreground">Candidatar-se não garante a vaga: a marca escolhe quem contratar.</p>
            </div>
          )}
        </div>
      ) : list.length === 0 ? <p className="text-xs text-muted-foreground p-6 rounded-2xl border border-dashed border-border text-center">Nenhuma campanha aberta agora.</p> : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((x) => (
            <li key={x.id} className="p-4 rounded-2xl bg-card border border-border space-y-1.5">
              {mine[x.id]?.stage === 'invited' && <span className="px-1.5 py-0.5 rounded bg-primary text-[10px] font-bold text-black border border-black">Convite para você</span>}
              {x.is_test && <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] font-bold text-amber-700">TESTE</span>}
              <p className="font-bold text-foreground">{x.title}</p>
              <p className="text-xs text-muted-foreground">{x.product?.name} · {compensationText(x.compensation, x.product)[0]}</p>
              <p className="text-[11px] text-muted-foreground">Entrega até {br(x.delivery_deadline)} · {x.deliverables?.must_publish ? 'precisa postar' : 'não precisa postar'}</p>
              <Button size="sm" variant="outline" onClick={() => { setOpen(x.id); setAccept(false); setDone(''); }}>{mine[x.id] && mine[x.id].stage !== 'invited' ? 'Ver' : 'Ver condições'}</Button>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
};

// ---------------- minhas campanhas: tarefas e próxima ação ----------------
const STEPS = ['Aceitar', 'Endereço', 'Receber produto', 'Produzir e entregar', 'Revisão', 'Concluído'];
function stepIndex(p: Participation, needsProduct: boolean) {
  if (p.stage === 'invited') return 0;
  if (p.stage === 'applied') return 0.5; // aceitou, aguarda a marca
  if (p.stage === 'shipping') return p.shipping ? 2 : 1;
  if (p.stage === 'producing' || p.stage === 'revision') return needsProduct ? 3 : 3;
  if (p.stage === 'submitted') return 4;
  return 5;
}

export const CreatorWorkReal: React.FC = () => {
  const { loading, me, err } = useCreator();
  const [rows, setRows] = useState<(Participation & { campaign: FlowCampaign | null })[]>([]);
  const [contents, setContents] = useState<Record<string, Content[]>>({});
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const load = useCallback(async () => {
    const ps = await campaignFlow.myParticipations();
    setRows(ps);
    const ks = await Promise.all(ps.map((p) => campaignFlow.contents(p.campaign_id, p.creator_id)));
    setContents(Object.fromEntries(ps.map((p, i) => [p.campaign_id, ks[i]])));
  }, []);
  useEffect(() => { if (me) load().catch((e) => setError(humanError(e))); }, [me, load]);

  if (loading) return <Shell title="Minhas campanhas" sub=""><Loader2 className="w-5 h-5 animate-spin" /></Shell>;
  if (!me) return <Shell title="Minhas campanhas" sub="">{err ? <p className="text-xs text-red-700">{err}</p> : <NeedLogin />}</Shell>;
  const run = async (fn: () => Promise<unknown>, msg: string) => { setError(''); try { await fn(); setOk(msg); await load(); } catch (e) { setError(humanError(e)); } };

  return (
    <Shell title="Minhas campanhas" sub="Sua próxima ação em cada campanha.">
      {error && <p role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-700">{error}</p>}
      {ok && <p role="status" className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-800">{ok}</p>}
      {rows.length === 0 && <p className="text-xs text-muted-foreground p-6 rounded-2xl border border-dashed border-border text-center">Você ainda não participa de nenhuma campanha. Veja as oportunidades abertas.</p>}
      {rows.map((p) => {
        const c = p.campaign; if (!c) return null;
        const needsProduct = !!c.compensation?.product;
        const idx = stepIndex(p, needsProduct);
        const steps = needsProduct ? STEPS : STEPS.filter((s) => s !== 'Endereço' && s !== 'Receber produto');
        const cur = needsProduct ? idx : idx >= 3 ? idx - 2 : Math.min(idx, 0.5);
        const ks = contents[c.id] || [];
        const lastReview = ks.flatMap((k) => k.reviews || []).filter((r) => r.decision === 'revision').pop();
        const ended = ['rejected', 'cancelled'].includes(p.stage);
        return (
          <article key={p.id} className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div><h2 className="font-bold text-foreground">{c.title}</h2><p className="text-[11px] text-muted-foreground">{c.product?.name} · entrega até {br(c.delivery_deadline)}{c.is_test ? ' · TESTE' : ''}</p></div>
              <span className="px-2 py-0.5 h-fit rounded-full bg-muted text-[11px] font-bold">{STAGE[p.stage]?.label || p.stage}</span>
            </div>
            {!ended && (
              <ol className="flex flex-wrap gap-1.5" aria-label="Etapas">
                {steps.map((s, i) => (
                  <li key={s} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${i < cur ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : Math.floor(cur) === i ? 'bg-primary text-black border-black' : 'text-muted-foreground border-border'}`}>
                    {i < cur ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}{s}
                  </li>
                ))}
              </ol>
            )}
            <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
              <p className="font-bold text-foreground">Próxima ação</p>
              {p.stage === 'invited' && <p>Leia as condições em “Oportunidades” e aceite para participar.</p>}
              {p.stage === 'applied' && <p>Você aceitou as condições (v{p.terms_version}, {br(p.terms_accepted_at)}). Aguarde a marca decidir até {br(c.selection_deadline)}.</p>}
              {p.stage === 'shipping' && !p.shipping && <ShippingForm onSave={(a) => run(() => campaignFlow.setShipping(c.id, a), 'Endereço enviado para a marca.')} />}
              {p.stage === 'shipping' && p.shipping && <p>Endereço enviado. Aguarde a marca enviar o produto.</p>}
              {(p.stage === 'producing' || p.stage === 'revision') && (
                <>
                  {p.shipping_note && <p className="mb-1">Produto enviado · rastreio: {p.shipping_note}</p>}
                  {p.stage === 'revision' && lastReview && <p className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30"><strong>Ajuste pedido pela marca:</strong> {lastReview.comment}</p>}
                  <SubmitForm mustPublish={!!c.deliverables?.must_publish && c.intent !== 'conteudo_marca'} version={(ks[0]?.version || 0) + 1}
                    onSubmit={(file, url, caption, prog) => run(() => campaignFlow.submit(c.id, p.creator_id, file, url, caption, prog), 'Entrega enviada. A marca foi avisada para revisar.')} />
                </>
              )}
              {p.stage === 'submitted' && <p>Entrega v{ks[0]?.version} enviada em {br(ks[0]?.submitted_at)}. Aguarde a revisão da marca.</p>}
              {(p.stage === 'approved' || p.stage === 'paid') && <p>Conteúdo aprovado. {PAYMENT[p.payment_status]}{p.payment_status === 'pago' ? ` em ${br(p.paid_at)}: ${p.payment_note}` : p.payment_status === 'pendente' ? ` · ${brl(Number(p.payment_amount || 0))} a receber da marca` : ''}.</p>}
              {p.stage === 'rejected' && <p>A marca não selecionou sua candidatura desta vez.</p>}
            </div>
            {ks.length > 0 && (
              <details className="text-xs"><summary className="cursor-pointer font-bold">Histórico de entregas ({ks.length})</summary>
                <ul className="mt-1 space-y-1">{ks.map((k) => <li key={k.id}>v{k.version} · {k.file_name || 'link'} · {br(k.submitted_at)} · {k.status === 'approved' ? 'aprovada' : k.status === 'revision_requested' ? 'ajuste pedido' : 'em revisão'}{(k.reviews || []).map((r) => <span key={r.id} className="block text-muted-foreground">↳ {r.comment}</span>)}</li>)}</ul>
              </details>
            )}
            {p.terms_snapshot && <details className="text-xs"><summary className="cursor-pointer font-bold">Condições que você aceitou (v{p.terms_version})</summary><div className="mt-2"><OpportunityTerms d={{ ...asTerms(c), ...p.terms_snapshot, intent: (c.intent || 'conteudo_marca') as Draft['intent'] } as never} /></div></details>}
          </article>
        );
      })}
    </Shell>
  );
};

const ShippingForm: React.FC<{ onSave: (a: Record<string, string>) => void }> = ({ onSave }) => {
  const [a, setA] = useState<Record<string, string>>({ name: '', zip: '', street: '', number: '', complement: '', district: '', city: '', state: '' });
  const f = (k: string, label: string, cls = '') => <label className={`text-[11px] ${cls}`}>{label}<input value={a[k]} onChange={(e) => setA({ ...a, [k]: e.target.value })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs" /></label>;
  const ok = a.name && a.zip && a.street && a.number && a.city && a.state;
  return (
    <div className="space-y-2">
      <p>Esta campanha envia produto. Informe o endereço de entrega (só a marca desta campanha vê).</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{f('name', 'Nome completo', 'col-span-2')}{f('zip', 'CEP')}{f('number', 'Número')}{f('street', 'Rua', 'col-span-2')}{f('complement', 'Complemento')}{f('district', 'Bairro')}{f('city', 'Cidade', 'col-span-2')}{f('state', 'UF')}</div>
      <Button size="sm" disabled={!ok} onClick={() => onSave(a)}>Enviar endereço</Button>
    </div>
  );
};

const SubmitForm: React.FC<{ mustPublish: boolean; version: number; onSubmit: (f: File | null, url: string, caption: string, prog: (m: string) => void) => Promise<void> }> = ({ mustPublish, version, onSubmit }) => {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState('');
  const can = (file || (mustPublish && url)) && (!mustPublish || url);
  return (
    <div className="space-y-2">
      <p>Envie o <strong>arquivo original</strong> do vídeo (versão {version}).{mustPublish ? ' Esta campanha também pede o link do post publicado.' : ' Não precisa publicar no seu perfil.'}</p>
      <input aria-label="Arquivo do vídeo" type="file" accept="video/*,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs" />
      {mustPublish && <input aria-label="Link do post" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/…" className="w-full px-2 py-1.5 rounded-lg border border-border bg-background" />}
      <input aria-label="Legenda ou observação" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Legenda ou observação (opcional)" className="w-full px-2 py-1.5 rounded-lg border border-border bg-background" />
      <Button size="sm" disabled={!can || !!busy} onClick={async () => { setBusy('Enviando…'); try { await onSubmit(file, url, caption, setBusy); } finally { setBusy(''); } }}>
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}{busy || 'Enviar entrega'}
      </Button>
    </div>
  );
};

// ---------------- ganhos: só o que existe ----------------
export const CreatorEarningsReal: React.FC = () => {
  const { loading, me, err } = useCreator();
  const [rows, setRows] = useState<(Participation & { campaign: FlowCampaign | null })[]>([]);
  useEffect(() => { if (me) campaignFlow.myParticipations().then(setRows).catch(() => {}); }, [me]);
  if (loading) return <Shell title="Ganhos" sub=""><Loader2 className="w-5 h-5 animate-spin" /></Shell>;
  if (!me) return <Shell title="Ganhos" sub="">{err ? <p className="text-xs text-red-700">{err}</p> : <NeedLogin />}</Shell>;
  const agreed = rows.filter((p) => p.hired_at && Number(p.fee) > 0);
  const pend = rows.filter((p) => p.payment_status === 'pendente');
  const paid = rows.filter((p) => p.payment_status === 'pago');
  const sum = (xs: Participation[], k: 'fee' | 'payment_amount') => xs.reduce((a, p) => a + Number(p[k] || 0), 0);
  return (
    <Shell title="Ganhos" sub="Cachês combinados, aprovados e pagos. Os pagamentos são feitos pela marca, fora da plataforma.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([['Cachê combinado', sum(agreed, 'fee'), `${agreed.length} contratação(ões)`], ['Aprovado · aguardando pagamento', sum(pend, 'payment_amount'), `${pend.length} pendente(s)`], ['Pago (informado pela marca)', sum(paid, 'payment_amount'), `${paid.length} pagamento(s)`]] as [string, number, string][]).map(([k, v, s]) => (
          <div key={k} className="p-4 rounded-2xl bg-card border border-border"><p className="text-[11px] font-bold uppercase text-muted-foreground">{k}</p><p className="text-2xl font-extrabold text-foreground">{brl(v)}</p><p className="text-[11px] text-muted-foreground">{s}</p></div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">Não existe saque pela plataforma: quando a marca paga, ela informa aqui a referência (ex.: PIX) e você confere na sua conta. Comissões de afiliado só aparecem quando houver vendas registradas.</p>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.filter((p) => p.hired_at).map((p) => (
          <li key={p.id} className="p-3 flex flex-wrap justify-between gap-2 text-xs"><span className="font-bold">{p.campaign?.title}</span><span>{brl(Number(p.payment_amount ?? p.fee ?? 0))} · {PAYMENT[p.payment_status]}{p.paid_at ? ` em ${br(p.paid_at)}` : ''}{p.payment_note ? ` · ${p.payment_note}` : ''}</span></li>
        ))}
        {rows.filter((p) => p.hired_at).length === 0 && <li className="p-4 text-xs text-muted-foreground">Nenhuma contratação ainda.</li>}
      </ul>
    </Shell>
  );
};
