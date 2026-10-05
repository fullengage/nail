import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, CloudOff, Eye, Loader2, Package, Rocket, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { campaignFlow, compensationText, rightsText, humanError, loadRules, paymentFlowText, DEFAULT_RULES, type Intent, type SquadRules } from '../../services/campaignFlow';

// regras da Squad (taxa e prazos) lidas do banco
export function useRules(): SquadRules {
  const [r, setR] = useState<SquadRules>(DEFAULT_RULES);
  useEffect(() => { loadRules().then(setR); }, []);
  return r;
}
import { Draft, Errors, INTENTS, OBJECTIVE_TEMPLATES, applyIntent, clearLocal, cost, loadLocal, newDraft, saveLocal, suggestTitle, validate, validateAll } from '../../lib/campaignDraft';

// Assistente de campanha em 3 passos: produto e resultado → participantes, remuneração e prazos → briefing e revisão.
// Salva sozinho (neste aparelho na hora e no banco a cada pausa). Nunca publica um rascunho sem o clique em "Publicar".

const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const inputCls = (err?: string) => `w-full px-3 py-2.5 text-sm rounded-xl bg-background border ${err ? 'border-red-500 ring-1 ring-red-500/40' : 'border-border'} focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground`;

const Field: React.FC<{ id: string; label: string; hint?: string; error?: string; children: React.ReactNode }> = ({ id, label, hint, error, children }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-xs font-bold text-foreground">{label}</label>
    {children}
    {error ? <p id={`${id}-err`} role="alert" className="text-[11px] font-semibold text-red-600">{error}</p> : hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
  </div>
);

type SaveState = 'idle' | 'local' | 'saving' | 'saved' | 'offline' | 'noauth';

interface Props {
  initial?: Draft | null;
  onClose: () => void;
  onPublished: (id: string, title: string) => void;
}

export const CampaignBuilder: React.FC<Props> = ({ initial, onClose, onPublished }) => {
  const [d, setD] = useState<Draft>(() => initial || loadLocal() || newDraft());
  const [errors, setErrors] = useState<Errors>({});
  const [save, setSave] = useState<SaveState>('idle');
  const [saveMsg, setSaveMsg] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const resumed = useRef(!!(initial || loadLocal()));

  const set = (patch: Partial<Draft>) => { dirty.current = true; setD((prev) => ({ ...prev, ...patch })); };
  const setIn = <K extends 'product' | 'deliverables' | 'compensation' | 'brief' | 'usage_rights'>(k: K, patch: Partial<Draft[K]>) => {
    dirty.current = true;
    setD((prev) => {
      const next = { ...prev, [k]: { ...prev[k], ...patch } } as Draft;
      // nome sugerido acompanha o produto até a pessoa editar
      if (k === 'product' && !prev.titleTouched) next.title = suggestTitle(prev.intent, (patch as { name?: string }).name ?? prev.product.name);
      return next;
    });
  };

  // salvamento automático: local imediato, banco depois de 1,2s sem digitar
  useEffect(() => {
    saveLocal(d);
    if (!dirty.current) return;
    setSave('local');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const user = await campaignFlow.session().catch(() => null);
      if (!user) { setSave('noauth'); return; }
      setSave('saving');
      try {
        const id = await campaignFlow.saveDraft({ ...draftToRow(d), client_ref: d.client_ref }, d.id);
        if (id !== d.id) setD((prev) => ({ ...prev, id }));
        setSave('saved');
      } catch (e) {
        setSave('offline');
        setSaveMsg(humanError(e));
      }
    }, 1200);
    return () => window.clearTimeout(timer.current);
  }, [d]);

  const goTo = (step: 1 | 2 | 3) => {
    // voltar é livre; avançar exige o essencial do passo atual
    if (step > d.step) {
      const e = validate(d, d.step);
      setErrors(e);
      if (Object.keys(e).length) { focusFirst(e); return; }
    }
    setErrors({});
    set({ step });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const publish = async () => {
    if (publishing) return; // clique repetido
    const e = validateAll(d);
    setErrors(e);
    if (Object.keys(e).length) {
      const firstStep = Object.keys(validate(d, 1)).length ? 1 : Object.keys(validate(d, 2)).length ? 2 : 3;
      set({ step: firstStep as 1 | 2 | 3 });
      setTimeout(() => focusFirst(e), 50);
      return;
    }
    setPublishing(true);
    setPublishError('');
    try {
      const user = await campaignFlow.session();
      if (!user) throw new Error('Entre com sua conta de empresa para publicar. O rascunho continua salvo neste aparelho.');
      const id = await campaignFlow.saveDraft({ ...draftToRow(d), client_ref: d.client_ref }, d.id);
      await campaignFlow.publish(id);
      clearLocal();
      onPublished(id, d.title);
    } catch (err) {
      setPublishError(humanError(err));
    } finally {
      setPublishing(false);
    }
  };

  const rules = useRules();
  const c = useMemo(() => cost(d, rules.fee_pct), [d, rules.fee_pct]);
  const intent = INTENTS[d.intent];
  const isCommission = Number(d.compensation.commission_pct) > 0 || d.intent === 'comissao';

  return (
    <div className="space-y-5 animate-in fade-in duration-300 max-w-3xl mx-auto">
      {/* cabeçalho + indicador de salvamento */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"><ArrowLeft className="w-3.5 h-3.5" /> Voltar às campanhas</button>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">{d.id || resumed.current ? 'Continuar campanha' : 'Nova campanha'}</h1>
          {resumed.current && d.saved_at && <p className="text-[11px] text-muted-foreground">Rascunho retomado de onde você parou.</p>}
        </div>
        <SaveBadge state={save} msg={saveMsg} />
      </div>

      {/* passos */}
      <ol className="grid grid-cols-3 gap-2" aria-label="Etapas">
        {['Produto e resultado', 'Creators, pagamento e prazos', 'Briefing e revisão'].map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const active = d.step === n, done = d.step > n;
          return (
            <li key={label}>
              <button type="button" onClick={() => goTo(n)} aria-current={active ? 'step' : undefined}
                className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition ${active ? 'border-black bg-primary text-black' : done ? 'border-border bg-card text-foreground' : 'border-border bg-card text-muted-foreground'}`}>
                <span className="block text-[10px] uppercase opacity-70">Passo {n}{done ? ' ✓' : ''}</span>{label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-5">
        {d.step === 1 && (
          <>
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-foreground mb-1">O que você quer com esta campanha?</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(INTENTS) as Intent[]).map((k) => (
                  <label key={k} className={`p-3 rounded-xl border cursor-pointer transition ${d.intent === k ? 'border-black bg-primary/30 ring-1 ring-black' : 'border-border hover:border-foreground/40'}`}>
                    <input type="radio" name="intent" className="sr-only" checked={d.intent === k} onChange={() => { dirty.current = true; setD((p) => applyIntent(p, k)); }} />
                    <span className="block text-sm font-bold text-foreground">{INTENTS[k].title}</span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">{INTENTS[k].example}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="product.name" label="Produto" error={errors['product.name']} hint="Nome como o cliente conhece.">
                <input id="product.name" className={inputCls(errors['product.name'])} value={d.product.name || ''} onChange={(e) => setIn('product', { name: e.target.value })} placeholder="Ex.: Sérum Vitamina C 30ml" aria-invalid={!!errors['product.name']} />
              </Field>
              <Field id="product.url" label="Link do produto (opcional)" error={errors['product.url']}>
                <input id="product.url" type="url" className={inputCls(errors['product.url'])} value={d.product.url || ''} onChange={(e) => setIn('product', { url: e.target.value })} placeholder="https://sualoja.com.br/produto" />
              </Field>
              <Field id="product.image_url" label="Imagem do produto (link, opcional)">
                <input id="product.image_url" type="url" className={inputCls()} value={d.product.image_url || ''} onChange={(e) => setIn('product', { image_url: e.target.value })} placeholder="https://…/foto.jpg" />
              </Field>
              <Field id="product.description" label="Descrição breve (opcional)">
                <input id="product.description" className={inputCls()} value={d.product.description || ''} onChange={(e) => setIn('product', { description: e.target.value })} placeholder="Para que serve, em uma frase" />
              </Field>
            </div>

            <Field id="title" label="Nome da campanha" error={errors.title} hint="Sugerimos um nome; edite se quiser.">
              <input id="title" className={inputCls(errors.title)} value={d.title} onChange={(e) => set({ title: e.target.value, titleTouched: true })} />
            </Field>

            <Field id="objective" label="Objetivo (opcional)" hint="Uma meta com número ajuda a medir. Escolha um modelo ou escreva.">
              <input id="objective" className={inputCls()} value={d.objective} onChange={(e) => set({ objective: e.target.value })} placeholder={OBJECTIVE_TEMPLATES[d.intent][0]} />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {OBJECTIVE_TEMPLATES[d.intent].map((t) => (
                  <button key={t} type="button" onClick={() => set({ objective: t })} className="px-2.5 py-1 rounded-full border border-border text-[11px] hover:border-black">{t}</button>
                ))}
              </div>
            </Field>
          </>
        )}

        {d.step === 2 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="creator_slots" label="Quantos creators?" error={errors.creator_slots}>
                <input id="creator_slots" type="number" min={1} className={inputCls(errors.creator_slots)} value={d.creator_slots} onChange={(e) => set({ creator_slots: Number(e.target.value) })} />
              </Field>
              {d.intent === 'conteudo_marca' && (
                <Field id="deliverables.per_creator" label="Vídeos por creator" error={errors['deliverables.per_creator']}>
                  <input id="deliverables.per_creator" type="number" min={1} className={inputCls(errors['deliverables.per_creator'])} value={d.deliverables.per_creator ?? 1} onChange={(e) => setIn('deliverables', { per_creator: Number(e.target.value) })} />
                </Field>
              )}
            </div>

            {/* campos que mudam conforme o objetivo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {d.intent === 'conteudo_marca' && (<>
                <Field id="deliverables.format" label="Formato"><select id="deliverables.format" className={inputCls()} value={d.deliverables.format} onChange={(e) => setIn('deliverables', { format: e.target.value })}>{['Vertical 9:16', 'Quadrado 1:1', 'Horizontal 16:9'].map((o) => <option key={o}>{o}</option>)}</select></Field>
                <Field id="deliverables.duration" label="Duração"><select id="deliverables.duration" className={inputCls()} value={d.deliverables.duration} onChange={(e) => setIn('deliverables', { duration: e.target.value })}>{['15–30s', '30–60s', '60–90s'].map((o) => <option key={o}>{o}</option>)}</select></Field>
                <Field id="must_publish" label="Precisa postar no perfil?"><select id="must_publish" className={inputCls()} value={d.deliverables.must_publish ? 'sim' : 'nao'} onChange={(e) => setIn('deliverables', { must_publish: e.target.value === 'sim' })}><option value="nao">Não, só enviar o arquivo</option><option value="sim">Sim, postar também</option></select></Field>
              </>)}
              {d.intent === 'post_creator' && (<>
                <Field id="deliverables.network" label="Rede"><select id="deliverables.network" className={inputCls()} value={d.deliverables.network} onChange={(e) => setIn('deliverables', { network: e.target.value })}>{['Instagram', 'TikTok', 'YouTube'].map((o) => <option key={o}>{o}</option>)}</select></Field>
                <Field id="deliverables.format" label="Formato"><select id="deliverables.format" className={inputCls()} value={d.deliverables.format} onChange={(e) => setIn('deliverables', { format: e.target.value })}>{['Reels', 'Vídeo no feed', 'Stories (3)', 'Carrossel'].map((o) => <option key={o}>{o}</option>)}</select></Field>
                <Field id="deliverables.post_days" label="Post fica no ar por (dias)"><input id="deliverables.post_days" type="number" min={1} className={inputCls()} value={d.deliverables.post_days ?? 30} onChange={(e) => setIn('deliverables', { post_days: Number(e.target.value) })} /></Field>
              </>)}
              {d.intent === 'live' && (<>
                <Field id="deliverables.live_platform" label="Plataforma"><select id="deliverables.live_platform" className={inputCls()} value={d.deliverables.live_platform} onChange={(e) => setIn('deliverables', { live_platform: e.target.value })}>{['TikTok Shop', 'Instagram Live', 'YouTube'].map((o) => <option key={o}>{o}</option>)}</select></Field>
                <Field id="deliverables.live_minutes" label="Duração (min)"><input id="deliverables.live_minutes" type="number" min={15} className={inputCls()} value={d.deliverables.live_minutes ?? 60} onChange={(e) => setIn('deliverables', { live_minutes: Number(e.target.value) })} /></Field>
              </>)}
              {d.intent === 'seeding' && (
                <Field id="deliverables.ship_note" label="O creator precisa postar?"><select id="deliverables.ship_note" className={inputCls()} value={d.deliverables.must_publish ? 'sim' : 'nao'} onChange={(e) => setIn('deliverables', { must_publish: e.target.value === 'sim', ship_note: e.target.value === 'sim' ? 'Postar é obrigatório' : 'Postar é opcional' })}><option value="nao">Não, é só para conhecerem</option><option value="sim">Sim, 1 post obrigatório</option></select></Field>
              )}
            </div>

            {/* remuneração: combinações reais, nada de "cachê zero" sem explicação */}
            <fieldset className="space-y-3 p-4 rounded-xl border border-border">
              <legend className="px-1 text-xs font-bold text-foreground">Como o creator é pago</legend>
              {errors.compensation && <p role="alert" className="text-[11px] font-semibold text-red-600">{errors.compensation}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field id="compensation.fee" label="Cachê por creator (R$)" error={errors['compensation.fee']} hint="0 se não houver cachê.">
                  <input id="compensation.fee" type="number" min={0} className={inputCls(errors['compensation.fee'])} value={d.compensation.fee ?? 0} onChange={(e) => setIn('compensation', { fee: Number(e.target.value) })} />
                </Field>
                <Field id="compensation.product" label="Envia o produto?">
                  <select id="compensation.product" className={inputCls()} value={d.compensation.product ? 'sim' : 'nao'} onChange={(e) => setIn('compensation', { product: e.target.value === 'sim' })}><option value="sim">Sim, o creator fica com ele</option><option value="nao">Não</option></select>
                </Field>
                {d.compensation.product && (
                  <Field id="product.value" label="Valor do produto (R$, opcional)" hint="Ajuda a calcular o custo.">
                    <input id="product.value" type="number" min={0} className={inputCls()} value={d.product.value ?? ''} onChange={(e) => setIn('product', { value: Number(e.target.value) || undefined })} />
                  </Field>
                )}
              </div>
              {(isCommission || d.intent === 'live') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-border/60">
                  <Field id="compensation.commission_pct" label="Comissão por venda (%)" error={errors['compensation.commission_pct']} hint={d.intent === 'live' ? 'Opcional na live.' : undefined}>
                    <input id="compensation.commission_pct" type="number" min={0} max={100} className={inputCls(errors['compensation.commission_pct'])} value={d.compensation.commission_pct ?? 0} onChange={(e) => setIn('compensation', { commission_pct: Number(e.target.value) })} />
                  </Field>
                  {Number(d.compensation.commission_pct) > 0 && (<>
                    <Field id="compensation.commission_base" label="Sobre qual valor?"><input id="compensation.commission_base" className={inputCls()} value={d.compensation.commission_base || ''} onChange={(e) => setIn('compensation', { commission_base: e.target.value })} placeholder="valor pago pelo cliente, sem frete" /></Field>
                    <Field id="compensation.tracking" label="Como as vendas são contadas?" error={errors['compensation.tracking']}><input id="compensation.tracking" className={inputCls(errors['compensation.tracking'])} value={d.compensation.tracking || ''} onChange={(e) => setIn('compensation', { tracking: e.target.value })} placeholder="cupom exclusivo por creator" /></Field>
                    <Field id="compensation.payment_terms" label="Quando a comissão é paga?" error={errors['compensation.payment_terms']} hint="Inclua cancelamentos e devoluções.">
                      <input id="compensation.payment_terms" className={inputCls(errors['compensation.payment_terms'])} value={d.compensation.payment_terms || ''} onChange={(e) => setIn('compensation', { payment_terms: e.target.value })} />
                    </Field>
                  </>)}
                </div>
              )}
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field id="application_deadline" label="Candidaturas até"><input id="application_deadline" type="date" className={inputCls()} value={d.application_deadline} onChange={(e) => set({ application_deadline: e.target.value })} /></Field>
              <Field id="selection_deadline" label="Seleção até" error={errors.selection_deadline}><input id="selection_deadline" type="date" className={inputCls(errors.selection_deadline)} value={d.selection_deadline} onChange={(e) => set({ selection_deadline: e.target.value })} /></Field>
              <Field id="delivery_deadline" label="Entrega até" error={errors.delivery_deadline}><input id="delivery_deadline" type="date" className={inputCls(errors.delivery_deadline)} value={d.delivery_deadline} onChange={(e) => set({ delivery_deadline: e.target.value })} /></Field>
            </div>

            {/* custo: conhecido × a definir */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-1" aria-live="polite">
              <p className="font-bold text-foreground">Custo conhecido: {brl(c.known)} se todas as entregas forem aprovadas</p>
              <p className="text-muted-foreground">{d.creator_slots} creators × {brl(Number(d.compensation.fee) || 0)} de cachê = {brl(c.fees)} + taxa Squad UGC de {rules.fee_pct}% ({brl(c.squadFee)}){c.product ? ` + ${brl(c.product)} em produtos` : ''}. Você só paga o cachê e a taxa das entregas que aprovar.</p>
              {c.pending.length > 0 && <p className="text-muted-foreground">Ainda não definido: {c.pending.join(', ')}.</p>}
            </div>
          </>
        )}

        {d.step === 3 && (
          <>
            <p className="text-xs text-muted-foreground">Briefing curto: 3 respostas. Já preenchemos um exemplo para “{intent.title.toLowerCase()}”. Edite à vontade.</p>
            <Field id="brief.show" label="1. O que mostrar ou falar" error={errors['brief.show']}>
              <textarea id="brief.show" rows={3} className={inputCls(errors['brief.show'])} value={d.brief.show || ''} onChange={(e) => setIn('brief', { show: e.target.value })} />
            </Field>
            <Field id="brief.identify" label="2. Como identificar a marca">
              <textarea id="brief.identify" rows={2} className={inputCls()} value={d.brief.identify || ''} onChange={(e) => setIn('brief', { identify: e.target.value })} />
            </Field>
            <Field id="brief.deliver" label="3. O que entregar e quando" hint={`Prazo de entrega: ${new Date(d.delivery_deadline + 'T12:00').toLocaleDateString('pt-BR')}.`}>
              <textarea id="brief.deliver" rows={2} className={inputCls()} value={d.brief.deliver || ''} onChange={(e) => setIn('brief', { deliver: e.target.value })} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="hashtag" label="Hashtag (opcional)"><input id="hashtag" className={inputCls()} value={d.hashtag} onChange={(e) => set({ hashtag: e.target.value })} placeholder="#suamarca" /></Field>
              {(isCommission || d.intent === 'live') && (
                <Field id="coupon" label="Cupom base" error={errors.coupon} hint="Cada creator recebe uma variação (ex.: SERUM-ANA)."><input id="coupon" className={inputCls(errors.coupon)} value={d.coupon} onChange={(e) => set({ coupon: e.target.value.toUpperCase() })} placeholder="SERUM10" /></Field>
              )}
            </div>

            {/* opções avançadas recolhidas */}
            <div className="rounded-xl border border-border">
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} aria-expanded={showAdvanced} className="w-full flex items-center justify-between p-3 text-xs font-bold text-foreground">
                Opções avançadas: uso do conteúdo, revisões, referências e restrições <ChevronDown className={`w-4 h-4 transition ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
              {showAdvanced && (
                <div className="p-3 pt-0 space-y-4">
                  <fieldset className="space-y-2">
                    <legend className="text-xs font-bold text-foreground">Como a marca pode usar o conteúdo</legend>
                    {([['organic', 'Repostar nas redes e site da marca (orgânico)'], ['brand_ads', 'Usar em anúncios da marca'], ['creator_ads', 'Anúncios pela conta do creator (Spark Ads / parceria paga)']] as const).map(([k, label]) => (
                      <label key={k} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!d.usage_rights[k]} onChange={(e) => setIn('usage_rights', { [k]: e.target.checked })} /> {label}</label>
                    ))}
                    <label className="flex items-center gap-2 text-xs">Por
                      <select className="px-2 py-1 rounded-lg border border-border bg-background" value={d.usage_rights.months ?? 0} onChange={(e) => setIn('usage_rights', { months: Number(e.target.value) })}>
                        {[0, 3, 6, 12].map((m) => <option key={m} value={m}>{m ? `${m} meses` : 'sem uso'}</option>)}
                      </select> a partir da aprovação</label>
                  </fieldset>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="revisions_included" label="Revisões incluídas por creator"><input id="revisions_included" type="number" min={0} max={5} className={inputCls()} value={d.revisions_included} onChange={(e) => set({ revisions_included: Number(e.target.value) })} /></Field>
                    <Field id="brief.technical" label="Requisitos técnicos"><input id="brief.technical" className={inputCls()} value={d.brief.technical || ''} onChange={(e) => setIn('brief', { technical: e.target.value })} placeholder="Ex.: 1080p, luz natural, sem legenda queimada" /></Field>
                    <Field id="brief.references" label="Referências (links)"><input id="brief.references" className={inputCls()} value={d.brief.references || ''} onChange={(e) => setIn('brief', { references: e.target.value })} /></Field>
                    <Field id="brief.restrictions" label="O que NÃO fazer"><input id="brief.restrictions" className={inputCls()} value={d.brief.restrictions || ''} onChange={(e) => setIn('brief', { restrictions: e.target.value })} placeholder="Ex.: não citar concorrentes" /></Field>
                    <Field id="brief.materials" label="Materiais da marca (link da pasta)"><input id="brief.materials" className={inputCls()} value={d.brief.materials || ''} onChange={(e) => setIn('brief', { materials: e.target.value })} /></Field>
                  </div>
                </div>
              )}
            </div>

            {/* resumo antes de publicar */}
            <Summary d={d} known={c.known} pending={c.pending} rules={rules} />
            <button type="button" onClick={() => setShowPreview(true)} className="text-xs font-bold text-foreground underline inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Ver como o creator vai ver</button>
          </>
        )}
      </div>

      {publishError && <p role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-700">{publishError}</p>}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => (d.step === 1 ? onClose() : goTo((d.step - 1) as 1 | 2))}><ArrowLeft className="w-4 h-4" />{d.step === 1 ? 'Sair (fica salvo)' : 'Voltar'}</Button>
        {d.step < 3
          ? <Button onClick={() => goTo((d.step + 1) as 2 | 3)}>Continuar <ArrowRight className="w-4 h-4" /></Button>
          : <Button onClick={publish} disabled={publishing} aria-busy={publishing}>{publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}{publishing ? 'Publicando…' : 'Publicar campanha'}</Button>}
      </div>

      {showPreview && <CreatorPreview d={d} onClose={() => setShowPreview(false)} />}
    </div>
  );
};

function draftToRow(d: Draft) {
  return {
    title: d.title, objective: d.objective, intent: d.intent, campaign_type: INTENTS[d.intent].type, product: d.product,
    deliverables: d.deliverables, compensation: d.compensation, brief: d.brief, usage_rights: d.usage_rights,
    hashtag: d.hashtag ? (d.hashtag.startsWith('#') ? d.hashtag : `#${d.hashtag}`) : '', coupon: d.coupon,
    creator_slots: d.creator_slots, revisions_included: d.revisions_included,
    application_deadline: d.application_deadline, selection_deadline: d.selection_deadline, delivery_deadline: d.delivery_deadline,
  };
}

function focusFirst(e: Errors) {
  const k = Object.keys(e)[0];
  if (k) (document.getElementById(k) as HTMLElement | null)?.focus();
}

const SaveBadge: React.FC<{ state: SaveState; msg: string }> = ({ state, msg }) => {
  const map: Record<SaveState, [string, string]> = {
    idle: ['', ''], local: ['Salvando…', 'text-muted-foreground'], saving: ['Salvando…', 'text-muted-foreground'],
    saved: ['Salvo', 'text-emerald-700'], noauth: ['Salvo neste aparelho', 'text-amber-700'], offline: ['Sem conexão: salvo neste aparelho', 'text-amber-700'],
  };
  const [label, cls] = map[state];
  if (!label) return null;
  return (
    <span role="status" title={msg} className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold ${cls}`}>
      {state === 'saved' ? <Check className="w-3.5 h-3.5" /> : state === 'offline' || state === 'noauth' ? <CloudOff className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}{label}
    </span>
  );
};

export const Summary: React.FC<{ d: Draft; known: number; pending: string[]; rules: SquadRules }> = ({ d, known, pending, rules }) => {
  const rows: [string, React.ReactNode][] = [
    ['Produto', d.product.name || '—'],
    ['Objetivo', d.objective || 'Não informado'],
    ['Entregas', deliverablesText(d)],
    ['Participantes', `${d.creator_slots} creators`],
    ['Remuneração', compensationText(d.compensation, d.product).join(' ')],
    ['Prazos', `Candidaturas até ${br(d.application_deadline)} · seleção até ${br(d.selection_deadline)} · entrega até ${br(d.delivery_deadline)}`],
    ['Direitos de uso', rightsText(d.usage_rights).join(' ')],
    ['Revisões', `${d.revisions_included} por creator`],
    ['Custo conhecido', `${brl(known)} (cachês + taxa Squad de ${rules.fee_pct}%)${pending.length ? ` · a definir: ${pending.join(', ')}` : ''}`],
    ['Aprovação e pagamento', paymentFlowText(rules)],
  ];
  return (
    <div className="rounded-xl border-2 border-black p-4 space-y-2">
      <p className="text-xs font-bold uppercase text-foreground">Resumo antes de publicar</p>
      <dl className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-3 gap-y-1.5 text-xs">
        {rows.map(([k, v]) => (<React.Fragment key={k}><dt className="font-bold text-muted-foreground">{k}</dt><dd className="text-foreground">{v}</dd></React.Fragment>))}
      </dl>
      <p className="text-[11px] text-muted-foreground">Publicar abre as candidaturas. Ninguém é contratado até você escolher.</p>
    </div>
  );
};

const br = (iso?: string | null) => (iso ? new Date(iso + 'T12:00').toLocaleDateString('pt-BR') : '—');
export function deliverablesText(d: Pick<Draft, 'intent' | 'deliverables'>): string {
  const x = d.deliverables;
  switch (d.intent) {
    case 'conteudo_marca': return `${x.per_creator || 1} vídeo(s) ${x.format || ''} de ${x.duration || '30–60s'} por creator. ${x.must_publish ? 'Também postar no perfil.' : 'Não precisa postar: enviar o arquivo original.'}`;
    case 'post_creator': return `${x.per_creator || 1} ${x.format || 'post'} no ${x.network || 'Instagram'} do creator, no ar por ${x.post_days || 30} dias + arquivo do vídeo.`;
    case 'live': return `Live de ${x.live_minutes || 60} min no ${x.live_platform || 'TikTok Shop'}.`;
    case 'comissao': return 'Divulgação com cupom/link próprio durante a campanha.';
    case 'seeding': return `Recebe o produto para testar. ${x.must_publish ? '1 post obrigatório.' : 'Postar é opcional.'}`;
  }
  return '—';
}

const CreatorPreview: React.FC<{ d: Draft; onClose: () => void }> = ({ d, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Prévia para o creator" onClick={onClose}>
    <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase text-muted-foreground">Prévia · como o creator vê</p><button onClick={onClose} aria-label="Fechar"><X className="w-4 h-4" /></button></div>
      <div className="flex gap-3 items-center">
        {d.product.image_url ? <img src={d.product.image_url} alt="" className="w-14 h-14 rounded-xl object-cover border border-border" /> : <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center"><Package className="w-6 h-6 text-muted-foreground" /></div>}
        <div><h3 className="font-bold text-foreground">{d.title}</h3><p className="text-xs text-muted-foreground">{d.product.name}</p></div>
      </div>
      <OpportunityTerms d={d} />
    </div>
  </div>
);

// bloco de condições: o mesmo na prévia e na tela real do creator
export const OpportunityTerms: React.FC<{ d: Pick<Draft, 'intent' | 'deliverables' | 'compensation' | 'product' | 'usage_rights' | 'brief' | 'revisions_included' | 'delivery_deadline' | 'hashtag' | 'coupon'> }> = ({ d }) => {
  const rules = useRules();
  return (
  <dl className="space-y-2 text-xs">
    {([
      ['O que entregar', deliverablesText(d)],
      ['Precisa postar no seu perfil?', d.deliverables.must_publish ? 'Sim' : 'Não'],
      ['O que mostrar', d.brief.show],
      ['Como identificar a marca', [d.brief.identify, d.hashtag && `Hashtag ${d.hashtag}`, d.coupon && `Cupom base ${d.coupon}`].filter(Boolean).join(' · ')],
      ['Remuneração', compensationText(d.compensation, d.product).join(' ')],
      ['Prazo de entrega', br(d.delivery_deadline)],
      ['Revisões incluídas', `${d.revisions_included}`],
      ['Uso do seu conteúdo', rightsText(d.usage_rights).join(' ')],
      ['Pagamento', `Quem paga você é a Squad UGC, por PIX, em até ${rules.payout_business_days} dias úteis depois que a marca paga a Squad (a marca tem ${rules.brand_payment_days} dias após aprovar). Se a marca não revisar sua entrega em ${rules.review_business_days} dias úteis, ela é aprovada automaticamente.`],
      d.brief.restrictions ? ['Não fazer', d.brief.restrictions] : null,
      d.brief.technical ? ['Requisitos técnicos', d.brief.technical] : null,
    ].filter(Boolean) as [string, string][]).map(([k, v]) => (
      <div key={k}><dt className="font-bold text-foreground">{k}</dt><dd className="text-muted-foreground">{v || '—'}</dd></div>
    ))}
  </dl>
  );
};
