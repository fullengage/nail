// Fluxo real da campanha (Empresa ⇄ Creator ⇄ Admin) sobre o banco — migração 20261006_fluxo_campanha.
// Toda mudança de estado passa por funções no servidor (publicar, aceitar, entregar, revisar, pagar).
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type Intent = 'conteudo_marca' | 'post_creator' | 'comissao' | 'live' | 'seeding';
export type CampaignStatus = 'draft' | 'open' | 'selecting' | 'in_progress' | 'completed' | 'cancelled';
export type Stage = 'invited' | 'applied' | 'hired' | 'shipping' | 'producing' | 'submitted' | 'revision' | 'approved' | 'paid' | 'rejected' | 'cancelled' | string;

export interface Product { name?: string; url?: string; image_url?: string; description?: string; value?: number }
export interface Deliverables { per_creator?: number; format?: string; duration?: string; must_publish?: boolean; network?: string; post_days?: number; live_platform?: string; live_minutes?: number; ship_note?: string }
export interface Compensation { fee?: number; product?: boolean; commission_pct?: number; commission_base?: string; tracking?: string; payment_terms?: string }
export interface Brief { show?: string; identify?: string; deliver?: string; references?: string; restrictions?: string; materials?: string; technical?: string }
export interface UsageRights { organic?: boolean; brand_ads?: boolean; creator_ads?: boolean; months?: number }

export interface FlowCampaign {
  id: string; title: string; slug: string; status: CampaignStatus; intent: Intent | null; campaign_type: string;
  objective: string | null; product: Product; deliverables: Deliverables; compensation: Compensation; brief: Brief; usage_rights: UsageRights;
  hashtag: string | null; coupon: string | null; creator_slots: number; revisions_included: number; terms_version: number;
  application_deadline: string | null; selection_deadline: string | null; delivery_deadline: string | null;
  owner_id: string | null; client_ref: string | null; is_test: boolean; published_at: string | null; created_at: string; updated_at: string;
}
export interface Participation {
  id: string; campaign_id: string; creator_id: string; stage: Stage; fee: number | null; message: string | null;
  invited_at: string | null; applied_at: string | null; hired_at: string | null;
  terms_version: number | null; terms_snapshot: Record<string, any> | null; terms_accepted_at: string | null;
  shipping: Record<string, string> | null; shipping_note: string | null;
  payment_status: 'nao_devido' | 'pendente' | 'pago'; payment_amount: number | null; paid_at: string | null; payment_note: string | null; payment_proof_path: string | null;
  creator?: { id: string; professional_name: string; instagram: string | null; tiktok: string | null; instagram_followers: number | null; tiktok_followers: number | null; engagement_rate: number | null; specialties: string[] | null; tags: string[] | null; city: string | null; state: string | null } | null;
}
export interface Content {
  id: string; campaign_id: string; creator_id: string; version: number; status: 'reviewing' | 'revision_requested' | 'approved' | string;
  file_path: string | null; file_name: string | null; mime: string | null; published_url: string | null; caption: string | null;
  submitted_at: string; approved_at: string | null; rights_until: string | null;
  reviews?: { id: string; comment: string; decision: string; created_at: string }[];
}
export interface Notification { id: string; title: string; body: string | null; link: string | null; campaign_id: string | null; read_at: string | null; created_at: string }

const CAMPAIGN_COLS = 'id,title,slug,status,intent,campaign_type,objective,product,deliverables,compensation,brief,usage_rights,hashtag,coupon,creator_slots,revisions_included,terms_version,application_deadline,selection_deadline,delivery_deadline,owner_id,client_ref,is_test,published_at,created_at,updated_at';
const CREATOR_PUBLIC = 'id,professional_name,instagram,tiktok,instagram_followers,tiktok_followers,engagement_rate,specialties,tags,city,state';
const BUCKET = 'campanhas';
const ORG_ID = '00000000-0000-0000-0000-000000000001';

export const flowReady = () => isSupabaseConfigured && !!supabase;

// erro do Postgres/PostgREST → frase para o usuário (as funções do banco já falam português)
export function humanError(e: unknown): string {
  const m = (e as { message?: string })?.message || String(e || '');
  if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Sem conexão. Seus dados estão salvos neste aparelho; tente de novo.';
  if (/JWT|not authenticated|permission denied|row-level security/i.test(m)) return 'Entre com sua conta para continuar.';
  if (/schema cache|does not exist|PGRST20/i.test(m)) return 'Recurso ainda não ativado no banco (migração 20261006 pendente).';
  return m.replace(/^.*?ERROR:\s*/, '');
}
async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(humanError(error));
  return data as T;
}
const slugify = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export const campaignFlow = {
  async session() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
  },

  // ---------- campanhas ----------
  async myCampaigns(): Promise<FlowCampaign[]> {
    const user = await this.session();
    if (!supabase || !user) return [];
    const { data, error } = await supabase.from('campaigns').select(CAMPAIGN_COLS).eq('owner_id', user.id).order('updated_at', { ascending: false });
    if (error) throw new Error(humanError(error));
    return (data || []) as FlowCampaign[];
  },
  async openCampaigns(): Promise<FlowCampaign[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('campaigns').select(CAMPAIGN_COLS).in('status', ['open', 'selecting']).order('published_at', { ascending: false });
    if (error) throw new Error(humanError(error));
    return (data || []) as FlowCampaign[];
  },
  async get(id: string): Promise<FlowCampaign | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('campaigns').select(CAMPAIGN_COLS).eq('id', id).maybeSingle();
    if (error) throw new Error(humanError(error));
    return data as FlowCampaign | null;
  },
  // rascunho: cria uma vez (client_ref evita duplicar em clique duplo/rede) e depois só atualiza
  async saveDraft(draft: Partial<FlowCampaign> & { client_ref: string }, id?: string | null): Promise<string> {
    if (!supabase) throw new Error('Supabase não configurado');
    const row = {
      title: draft.title || 'Campanha sem nome', objective: draft.objective || null, intent: draft.intent, campaign_type: draft.campaign_type || 'ugc',
      product: draft.product || {}, deliverables: draft.deliverables || {}, compensation: draft.compensation || {}, brief: draft.brief || {},
      usage_rights: draft.usage_rights || {}, hashtag: draft.hashtag || null, coupon: draft.coupon || null,
      creator_slots: draft.creator_slots || 1, revisions_included: draft.revisions_included ?? 1,
      application_deadline: draft.application_deadline || null, selection_deadline: draft.selection_deadline || null, delivery_deadline: draft.delivery_deadline || null,
      // campos legados lidos pelas telas antigas
      commission_value: draft.compensation?.fee || 0, budget: (draft.creator_slots || 0) * (draft.compensation?.fee || 0),
      commission_type: draft.compensation?.fee ? 'fixed' : draft.compensation?.commission_pct ? 'percentage' : 'product_only',
      description: draft.brief?.show || null,
    };
    if (id) {
      const { error } = await supabase.from('campaigns').update(row).eq('id', id);
      if (error) throw new Error(humanError(error));
      return id;
    }
    const slug = `${slugify(row.title) || 'campanha'}-${draft.client_ref.slice(0, 6)}`;
    const { data, error } = await supabase.from('campaigns')
      .upsert({ ...row, slug, client_ref: draft.client_ref, organization_id: ORG_ID, status: 'draft' }, { onConflict: 'client_ref', ignoreDuplicates: true })
      .select('id');
    if (error) throw new Error(humanError(error));
    if (data?.[0]?.id) return data[0].id;
    // já existia (reenvio): busca pelo client_ref
    const { data: ex } = await supabase.from('campaigns').select('id').eq('client_ref', draft.client_ref).maybeSingle();
    if (!ex) throw new Error('Não foi possível salvar o rascunho.');
    await supabase.from('campaigns').update(row).eq('id', ex.id);
    return ex.id;
  },
  publish: (id: string) => rpc<string>('campaign_publish', { p_campaign: id }),
  setStatus: (id: string, status: CampaignStatus) => rpc<string>('campaign_set_status', { p_campaign: id, p_status: status }),
  async removeDraft(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('campaigns').delete().eq('id', id).eq('status', 'draft');
    if (error) throw new Error(humanError(error));
  },

  // ---------- participantes ----------
  async participants(campaignId: string): Promise<Participation[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('campaign_creators').select('*').eq('campaign_id', campaignId).order('updated_at', { ascending: false });
    if (error) throw new Error(humanError(error));
    const rows = (data || []) as Participation[];
    const ids = [...new Set(rows.map((r) => r.creator_id))];
    if (ids.length) {
      const { data: cs } = await supabase.from('creators').select(CREATOR_PUBLIC).in('id', ids);
      const byId = new Map((cs || []).map((c: any) => [c.id, c]));
      rows.forEach((r) => { r.creator = byId.get(r.creator_id) || null; });
    }
    return rows;
  },
  async myParticipations(): Promise<(Participation & { campaign: FlowCampaign | null })[]> {
    if (!supabase) return [];
    const me = await rpc<string | null>('my_creator_id', {}).catch(() => null);
    if (!me) return [];
    const { data, error } = await supabase.from('campaign_creators').select('*').eq('creator_id', me).order('updated_at', { ascending: false });
    if (error) throw new Error(humanError(error));
    const rows = (data || []) as (Participation & { campaign: FlowCampaign | null })[];
    const ids = [...new Set(rows.map((r) => r.campaign_id))];
    if (ids.length) {
      const { data: cs } = await supabase.from('campaigns').select(CAMPAIGN_COLS).in('id', ids);
      const byId = new Map((cs || []).map((c: any) => [c.id, c]));
      rows.forEach((r) => { r.campaign = (byId.get(r.campaign_id) as FlowCampaign) || null; });
    }
    return rows;
  },
  myCreatorId: () => rpc<string | null>('my_creator_id', {}),
  invite: (campaignId: string, creatorIds: string[]) => rpc<number>('brand_invite', { p_campaign: campaignId, p_creators: creatorIds }),
  apply: (campaignId: string, termsVersion: number, message?: string) => rpc<string>('creator_apply', { p_campaign: campaignId, p_terms_version: termsVersion, p_message: message || null }),
  participant: (ccId: string, action: 'hire' | 'reject' | 'shipped', note?: string) => rpc<string>('brand_participant', { p_cc: ccId, p_action: action, p_note: note || null }),
  setShipping: (campaignId: string, shipping: Record<string, string>) => rpc<void>('creator_set_shipping', { p_campaign: campaignId, p_shipping: shipping }),

  // ---------- entregas ----------
  async contents(campaignId: string, creatorId?: string): Promise<Content[]> {
    if (!supabase) return [];
    let q = supabase.from('contents').select('*').eq('campaign_id', campaignId);
    if (creatorId) q = q.eq('creator_id', creatorId);
    const { data, error } = await q.order('version', { ascending: false });
    if (error) throw new Error(humanError(error));
    const rows = (data || []) as Content[];
    if (rows.length) {
      const { data: rv } = await supabase.from('content_reviews').select('id,content_id,comment,decision,created_at').in('content_id', rows.map((r) => r.id)).order('created_at');
      rows.forEach((r) => { r.reviews = (rv || []).filter((x: any) => x.content_id === r.id) as Content['reviews']; });
    }
    return rows;
  },
  // sobe o arquivo original para campanhas/<campanha>/<creator>/ e registra a entrega
  async submit(campaignId: string, creatorId: string, file: File | null, postUrl?: string, caption?: string, onProgress?: (msg: string) => void): Promise<number> {
    if (!supabase) throw new Error('Supabase não configurado');
    let path: string | null = null;
    if (file) {
      if (file.size > 500 * 1024 * 1024) throw new Error('Arquivo maior que 500 MB. Envie uma versão comprimida.');
      onProgress?.('Enviando arquivo…');
      path = `${campaignId}/${creatorId}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_')}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw new Error(humanError(error));
    }
    onProgress?.('Registrando entrega…');
    return rpc<number>('creator_submit', { p_campaign: campaignId, p_file_path: path, p_file_name: file?.name || null, p_mime: file?.type || null, p_post_url: postUrl || null, p_caption: caption || null });
  },
  async fileUrl(path: string, download = false): Promise<string | null> {
    if (!supabase) return null;
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600, download ? { download: true } : undefined);
    return data?.signedUrl ?? null;
  },
  review: (contentId: string, decision: 'approved' | 'revision', comment?: string) => rpc<string>('brand_review', { p_content: contentId, p_decision: decision, p_comment: comment || null }),
  async markPaid(ccId: string, campaignId: string, creatorId: string, note: string, proof?: File | null): Promise<string> {
    let proofPath: string | null = null;
    if (proof && supabase) {
      proofPath = `${campaignId}/${creatorId}/pagamento-${Date.now()}-${proof.name.replace(/[^\w.-]+/g, '_')}`;
      const { error } = await supabase.storage.from(BUCKET).upload(proofPath, proof, { contentType: proof.type });
      if (error) throw new Error(humanError(error));
    }
    return rpc<string>('brand_mark_paid', { p_cc: ccId, p_note: note, p_proof_path: proofPath });
  },

  // ---------- notificações internas ----------
  async notifications(): Promise<Notification[]> {
    if (!supabase || !(await this.session())) return [];
    const { data } = await supabase.from('squad_notifications').select('id,title,body,link,campaign_id,read_at,created_at').order('created_at', { ascending: false }).limit(30);
    return (data || []) as Notification[];
  },
  async markRead(id: string) {
    if (!supabase) return;
    await supabase.from('squad_notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  },
};

// ---------- textos de estado (uma fonte só para empresa, creator e admin) ----------
export const CAMPAIGN_STATUS: Record<string, { label: string; hint: string; cls: string }> = {
  draft: { label: 'Rascunho', hint: 'Só você vê. Publique quando estiver pronta.', cls: 'bg-muted text-muted-foreground border-border' },
  open: { label: 'Publicada · recebendo candidaturas', hint: 'Creators podem se candidatar. Ninguém foi contratado ainda.', cls: 'bg-sky-500/10 text-sky-700 border-sky-500/30' },
  selecting: { label: 'Em seleção', hint: 'Candidaturas encerradas: escolha quem contratar.', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
  in_progress: { label: 'Em produção', hint: 'Há creators contratados produzindo.', cls: 'bg-violet-500/10 text-violet-700 border-violet-500/30' },
  completed: { label: 'Concluída', hint: 'Campanha encerrada.', cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
  cancelled: { label: 'Cancelada', hint: '', cls: 'bg-red-500/10 text-red-700 border-red-500/30' },
};
export const STAGE: Record<string, { label: string; who: 'marca' | 'creator' | '—'; next: string }> = {
  invited: { label: 'Convidado', who: 'creator', next: 'Creator precisa ler as condições e aceitar' },
  applied: { label: 'Aceitou as condições', who: 'marca', next: 'Contratar ou recusar' },
  hired: { label: 'Contratado', who: 'creator', next: 'Produzir o conteúdo' },
  shipping: { label: 'Aguardando produto', who: 'marca', next: 'Enviar o produto (o creator informa o endereço)' },
  producing: { label: 'Produzindo', who: 'creator', next: 'Entregar o conteúdo' },
  submitted: { label: 'Entregue · aguardando revisão', who: 'marca', next: 'Aprovar ou pedir ajuste' },
  revision: { label: 'Ajuste solicitado', who: 'creator', next: 'Enviar nova versão' },
  approved: { label: 'Aprovado', who: 'marca', next: 'Pagar e informar o pagamento' },
  paid: { label: 'Pago', who: '—', next: 'Concluído' },
  rejected: { label: 'Não selecionado', who: '—', next: '' },
  cancelled: { label: 'Cancelado', who: '—', next: '' },
};
export const PAYMENT: Record<string, string> = { nao_devido: 'Sem cachê a pagar', pendente: 'Pagamento pendente', pago: 'Pago (informado pela marca)' };

// direitos de uso em texto claro (orgânico ≠ anúncio da marca ≠ anúncio pela conta do creator)
export function rightsText(r: UsageRights = {}): string[] {
  const out: string[] = [];
  out.push(r.organic ? 'A marca pode repostar nas redes e site dela (orgânico).' : 'Sem uso orgânico pela marca.');
  out.push(r.brand_ads ? 'A marca pode usar em anúncios da própria marca.' : 'Sem uso em anúncios da marca.');
  out.push(r.creator_ads ? 'Anúncios usando a conta/identidade do creator (ex.: Spark Ads, parceria paga).' : 'Sem anúncios pela conta do creator.');
  if (r.organic || r.brand_ads || r.creator_ads) out.push(r.months ? `Prazo: ${r.months} meses a partir da aprovação de cada vídeo.` : 'Prazo: indeterminado (combine antes!).');
  return out;
}
export function compensationText(c: Compensation = {}, product?: Product): string[] {
  const out: string[] = [];
  if (c.fee) out.push(`Cachê de ${c.fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por creator, pago após a aprovação.`);
  if (c.product) out.push(`Recebe o produto${product?.name ? ` (${product.name})` : ''}${product?.value ? `, valor aprox. ${product.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}.`);
  if (c.commission_pct) out.push(`Comissão de ${c.commission_pct}% sobre ${c.commission_base || 'as vendas'}${c.tracking ? `, rastreada por ${c.tracking}` : ''}.`);
  if (c.payment_terms) out.push(`Pagamento: ${c.payment_terms}`);
  if (!out.length) out.push('Remuneração ainda não definida.');
  return out;
}
