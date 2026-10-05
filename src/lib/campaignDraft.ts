// Rascunho da campanha: modelos por objetivo, validação por campo, custo e salvamento local.
// Lógica pura (sem React) para ser testada e reaproveitada.
import type { Intent, Product, Deliverables, Compensation, Brief, UsageRights } from '../services/campaignFlow';

export interface Draft {
  client_ref: string;
  id?: string | null;          // id no banco depois do 1º salvamento
  step: 1 | 2 | 3;
  intent: Intent;
  title: string;
  titleTouched: boolean;       // nome sugerido até a pessoa editar
  objective: string;
  product: Product;
  creator_slots: number;
  deliverables: Deliverables;
  compensation: Compensation;
  application_deadline: string;
  selection_deadline: string;
  delivery_deadline: string;
  brief: Brief;
  hashtag: string;
  coupon: string;
  revisions_included: number;
  usage_rights: UsageRights;
  saved_at?: string;
}

const day = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

// o usuário escolhe o resultado, não o termo técnico
export const INTENTS: Record<Intent, { title: string; example: string; type: string; noun: string }> = {
  conteudo_marca: { title: 'Receber vídeos para usar nas minhas redes e anúncios', example: 'Ex.: 10 vídeos de 30s mostrando o produto em uso. O creator não precisa postar.', type: 'ugc', noun: 'Vídeos' },
  post_creator: { title: 'Creators postarem no perfil deles', example: 'Ex.: 1 Reels no perfil do creator falando do produto (publicidade).', type: 'paid_content', noun: 'Posts' },
  comissao: { title: 'Creators venderem por comissão', example: 'Ex.: 10% por venda com cupom ou link próprio de cada creator.', type: 'affiliate', noun: 'Afiliados' },
  live: { title: 'Uma live vendendo meu produto', example: 'Ex.: live de 1h no TikTok Shop com o produto no carrinho.', type: 'live_commerce', noun: 'Live' },
  seeding: { title: 'Enviar meu produto para testarem', example: 'Ex.: envio do kit para 20 creators conhecerem. Postar é opcional.', type: 'product_seeding', noun: 'Envio' },
};

export const OBJECTIVE_TEMPLATES: Record<Intent, string[]> = {
  conteudo_marca: ['Receber 10 vídeos em 30 dias', 'Ter 5 vídeos aprovados para anúncios'],
  post_creator: ['5 posts publicados em 15 dias', 'Divulgar o lançamento em 10 perfis'],
  comissao: ['Recrutar 20 afiliados em 30 dias', 'Vender 300 unidades com cupom'],
  live: ['3 lives de 1h em 30 dias', 'Vender 100 unidades ao vivo'],
  seeding: ['Enviar para 20 creators', 'Ter 10 creators testando o produto'],
};

const BRIEF_TEMPLATES: Record<Intent, Brief> = {
  conteudo_marca: { show: 'Mostre o produto em uso no dia a dia, o resultado e por que você gosta dele.', identify: 'Mostre a embalagem com o nome da marca nos primeiros 3 segundos.', deliver: 'Vídeo vertical (9:16), 30–60s, sem música com direitos autorais. Envie o arquivo original.' },
  post_creator: { show: 'Conte sua experiência real com o produto e mostre ele em uso.', identify: 'Marque o perfil da marca e use “#publi” na legenda.', deliver: 'Publique no seu perfil e envie o link do post + o arquivo do vídeo.' },
  comissao: { show: 'Mostre o produto e explique o benefício principal. Chame para comprar com seu cupom.', identify: 'Use seu cupom/link exclusivo em todos os conteúdos.', deliver: 'Divulgue durante o período da campanha. As vendas são contadas pelo seu cupom.' },
  live: { show: 'Demonstre o produto ao vivo, responda dúvidas e mostre a oferta.', identify: 'Produto no carrinho/link da live e menção à marca no início.', deliver: 'Live no horário combinado + envie o link ou a gravação.' },
  seeding: { show: 'Teste o produto com calma e conte o que achou.', identify: 'Se postar, marque o perfil da marca.', deliver: 'Postar é opcional. Se postar, envie o link.' },
};
const COMP_DEFAULTS: Record<Intent, Compensation> = {
  conteudo_marca: { fee: 150, product: true },
  post_creator: { fee: 400, product: true },
  comissao: { commission_pct: 10, commission_base: 'valor pago pelo cliente, sem frete', tracking: 'cupom exclusivo', payment_terms: 'mensal, 30 dias após a venda, descontados cancelamentos e devoluções', product: true },
  live: { fee: 300, product: true, commission_pct: 0 },
  seeding: { product: true },
};
const DELIV_DEFAULTS: Record<Intent, Deliverables> = {
  conteudo_marca: { per_creator: 2, format: 'Vertical 9:16', duration: '30–60s', must_publish: false },
  post_creator: { per_creator: 1, network: 'Instagram', format: 'Reels', must_publish: true, post_days: 30 },
  comissao: { per_creator: 0, must_publish: false },
  live: { per_creator: 1, live_platform: 'TikTok Shop', live_minutes: 60, must_publish: true },
  seeding: { per_creator: 0, must_publish: false, ship_note: 'Postar é opcional' },
};
const RIGHTS_DEFAULTS: Record<Intent, UsageRights> = {
  conteudo_marca: { organic: true, brand_ads: true, creator_ads: false, months: 6 },
  post_creator: { organic: true, brand_ads: false, creator_ads: false, months: 3 },
  comissao: { organic: false, brand_ads: false, creator_ads: false, months: 0 },
  live: { organic: true, brand_ads: false, creator_ads: false, months: 3 },
  seeding: { organic: true, brand_ads: false, creator_ads: false, months: 0 },
};

export const uuid = () => (globalThis.crypto?.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));

export function newDraft(intent: Intent = 'conteudo_marca'): Draft {
  return {
    client_ref: uuid(), id: null, step: 1, intent, title: '', titleTouched: false, objective: '',
    product: { name: '', url: '', image_url: '', description: '' }, creator_slots: 5,
    deliverables: { ...DELIV_DEFAULTS[intent] }, compensation: { ...COMP_DEFAULTS[intent] },
    application_deadline: day(7), selection_deadline: day(10), delivery_deadline: day(24),
    brief: { ...BRIEF_TEMPLATES[intent] }, hashtag: '', coupon: '', revisions_included: 1, usage_rights: { ...RIGHTS_DEFAULTS[intent] },
  };
}
// trocar o objetivo aplica os modelos daquele tipo, sem apagar o produto
export function applyIntent(d: Draft, intent: Intent): Draft {
  return { ...d, intent, deliverables: { ...DELIV_DEFAULTS[intent] }, compensation: { ...COMP_DEFAULTS[intent] }, brief: { ...BRIEF_TEMPLATES[intent] }, usage_rights: { ...RIGHTS_DEFAULTS[intent] }, title: d.titleTouched ? d.title : suggestTitle(intent, d.product.name) };
}
export const suggestTitle = (intent: Intent, product?: string) => `${INTENTS[intent].noun}${product ? ` · ${product}` : ''}`;

export type Errors = Partial<Record<string, string>>;
export function validate(d: Draft, step: 1 | 2 | 3): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!d.product.name?.trim()) e['product.name'] = 'Diga qual é o produto (ex.: Sérum Vitamina C 30ml).';
    if (d.product.url && !/^https?:\/\/\S+\.\S+/.test(d.product.url)) e['product.url'] = 'Link inválido. Comece com https://';
    if (d.title.trim().length < 3) e.title = 'Dê um nome à campanha (pode usar o sugerido).';
  }
  if (step === 2) {
    if (!(d.creator_slots >= 1)) e.creator_slots = 'Quantos creators você quer? Mínimo 1.';
    const c = d.compensation;
    const fee = Number(c.fee) || 0, pct = Number(c.commission_pct) || 0;
    if (fee < 0) e['compensation.fee'] = 'O cachê não pode ser negativo.';
    if (fee <= 0 && !c.product && pct <= 0) e.compensation = 'Escolha pelo menos uma forma de remuneração: cachê, produto ou comissão.';
    if (pct > 0 && !c.payment_terms?.trim()) e['compensation.payment_terms'] = 'Explique quando a comissão é paga e o que acontece com cancelamentos e devoluções.';
    if (pct > 0 && !c.tracking?.trim()) e['compensation.tracking'] = 'Como as vendas serão contadas? (cupom, link…)';
    if (pct > 100) e['compensation.commission_pct'] = 'Percentual acima de 100%.';
    if (d.intent === 'conteudo_marca' && !(Number(d.deliverables.per_creator) >= 1)) e['deliverables.per_creator'] = 'Quantos vídeos cada creator entrega?';
    if (d.application_deadline > d.delivery_deadline) e.delivery_deadline = 'A entrega precisa ser depois do fim das candidaturas.';
    if (d.selection_deadline < d.application_deadline) e.selection_deadline = 'A seleção vem depois das candidaturas.';
  }
  if (step === 3) {
    if ((d.brief.show || '').trim().length < 10) e['brief.show'] = 'Escreva em uma frase o que o creator deve mostrar ou falar.';
    if (d.intent === 'comissao' && !d.coupon.trim() && !/link/i.test(d.compensation.tracking || '')) e.coupon = 'Para comissão, informe o cupom base (cada creator recebe o seu) ou use link.';
  }
  return e;
}
export const validateAll = (d: Draft): Errors => ({ ...validate(d, 1), ...validate(d, 2), ...validate(d, 3) });

// custo: o que já se sabe × o que depende de resultado. A taxa da Squad incide só sobre cachês aprovados.
export function cost(d: Draft, feePct = 0) {
  const slots = Math.max(0, Number(d.creator_slots) || 0);
  const fees = slots * (Number(d.compensation.fee) || 0);
  const product = d.compensation.product ? slots * (Number(d.product.value) || 0) : 0;
  const squadFee = Math.round(fees * feePct) / 100;
  const pending: string[] = [];
  if (d.compensation.product && !d.product.value) pending.push('valor dos produtos enviados');
  if (d.compensation.product) pending.push('frete de envio');
  if (Number(d.compensation.commission_pct) > 0) pending.push(`comissão de ${d.compensation.commission_pct}% sobre as vendas (depende do resultado)`);
  return { fees, squadFee, product, known: fees + squadFee + product, pending };
}

// ---------- salvamento local (sobrevive a recarregar e a falha de rede) ----------
const KEY = 'squad_campaign_draft_v1';
export const loadLocal = (): Draft | null => { try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch { return null; } };
export const saveLocal = (d: Draft) => { try { localStorage.setItem(KEY, JSON.stringify({ ...d, saved_at: new Date().toISOString() })); } catch { /* cota cheia */ } };
export const clearLocal = () => { try { localStorage.removeItem(KEY); } catch { /* */ } };

// campanha publicada → novo rascunho com os mesmos campos (duplicar)
export function duplicateFrom(c: { intent: Intent | null; title: string; objective: string | null; product: Product; deliverables: Deliverables; compensation: Compensation; brief: Brief; usage_rights: UsageRights; hashtag: string | null; coupon: string | null; creator_slots: number; revisions_included: number }): Draft {
  const base = newDraft((c.intent || 'conteudo_marca') as Intent);
  return { ...base, title: `${c.title} (cópia)`, titleTouched: true, objective: c.objective || '', product: { ...c.product }, deliverables: { ...c.deliverables }, compensation: { ...c.compensation }, brief: { ...c.brief }, usage_rights: { ...c.usage_rights }, hashtag: c.hashtag || '', coupon: c.coupon || '', creator_slots: c.creator_slots, revisions_included: c.revisions_included };
}
