import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Campaign, CreatorProfile, BrandProfile, Product, CampaignApplication, RetailPoint, CampaignParticipant, CreatorMetrics } from '../types/database';

// tabela de leads ainda não criada no banco (migração 20261004_leads_e_cache) → mensagem clara, não técnica
const friendlyLeadError = (error: { code?: string; message?: string }) =>
  error.code === 'PGRST205' || /schema cache|does not exist/i.test(error.message || '')
    ? 'Cadastro temporariamente indisponível. Tente novamente em alguns minutos.'
    : 'Não foi possível enviar agora. Confira os dados e tente novamente.';

// organização padrão (multiempresa ainda não ativado no login)
const ORG_ID = '00000000-0000-0000-0000-000000000001';

// Colunas públicas (migração 20261005_protege_contatos): e-mail, telefone e gerente só chegam
// para admin logado, pelas funções admin_*_contacts. Nunca usar select('*') nessas tabelas.
const CREATOR_COLS = 'id,user_id,professional_name,bio,city,state,instagram,tiktok,youtube,instagram_followers,tiktok_followers,youtube_followers,operational_score,engagement_rate,tags,specialties,techniques,media_kit_url,portfolio_cover_url,profile_completion,verification_status,created_at,updated_at';
// numeric do Postgres chega como texto
const numMetrics = (r: any): CreatorMetrics => ({ ...r, ...Object.fromEntries(['followers', 'avg_views', 'avg_likes', 'avg_comments', 'avg_shares', 'er_by_views', 'er_by_followers'].map((k) => [k, r[k] == null ? null : Number(r[k])])) });
const METRICS_COLS ='id,creator_id,platform,collected_at,followers,posts_analyzed,period_days,avg_views,avg_likes,avg_comments,avg_shares,er_by_views,er_by_followers,paid_posts_180d,top_hashtags,recent_posts';
const RETAIL_COLS = 'id,organization_id,name,trade_name,network,cnpj,type,city,state,address,status,created_at';

// junta os contatos (se o usuário for admin; para os demais a função devolve vazio)
async function withContacts<T extends { id: string }>(rows: T[], fn: string, args: Record<string, unknown> = {}): Promise<T[]> {
  if (!supabase || rows.length === 0) return rows;
  const byId = new Map<string, Record<string, unknown>>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.rpc(fn, args).range(from, from + 999);
    if (error || !data) break;
    (data as { id: string }[]).forEach((c) => byId.set(c.id, c));
    if ((data as unknown[]).length < 1000) break;
  }
  return byId.size ? rows.map((r) => ({ ...r, ...byId.get(r.id) })) : rows;
}

export const supabaseService = {
  // Check connection status
  async checkConnection(): Promise<{ connected: boolean; message: string; tableCount?: number }> {
    if (!isSupabaseConfigured || !supabase) {
      return { connected: false, message: 'Supabase não configurado no .env' };
    }
    try {
      const { data, error } = await supabase.from('organizations').select('id');
      if (error) {
        return { connected: false, message: `Erro ao conectar: ${error.message}` };
      }
      return { connected: true, message: 'Conectado ao Supabase com sucesso!', tableCount: data?.length ?? 0 };
    } catch (e: any) {
      return { connected: false, message: e.message || 'Falha de conexão' };
    }
  },

  // Fetch campaigns from Supabase
  async getCampaigns(): Promise<Campaign[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;
      return data as unknown as Campaign[];
    } catch {
      return null;
    }
  },

  // PDVs reais (com CNPJ). Linhas sem CNPJ são o seed antigo de demonstração e ficam de fora.
  async getRetailPoints(): Promise<RetailPoint[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('retail_points').select(RETAIL_COLS).not('cnpj', 'is', null).order('created_at', { ascending: false });
      if (error || !data) return null;
      return withContacts(data as unknown as RetailPoint[], 'admin_retail_contacts');
    } catch {
      return null;
    }
  },

  // Consulta paginada de PDVs no banco (base grande: filtros e contagem rodam no servidor)
  async queryRetailPoints(opts: { q?: string; state?: string; type?: string; page: number; pageSize: number }): Promise<{ rows: RetailPoint[]; total: number } | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      let query = supabase.from('retail_points').select(RETAIL_COLS, { count: 'exact' }).not('cnpj', 'is', null);
      const q = (opts.q || '').trim().replace(/[,()*%]/g, ' ');
      if (q) {
        const digits = q.replace(/\D/g, '');
        query = digits.length >= 8
          ? query.ilike('cnpj', `%${digits.split('').join('%')}%`) // ignora . / - do CNPJ formatado
          : query.or(`name.ilike.%${q}%,trade_name.ilike.%${q}%,city.ilike.%${q}%`);
      }
      if (opts.state && opts.state !== 'all') query = query.eq('state', opts.state);
      if (opts.type && opts.type !== 'all') query = query.eq('type', opts.type);
      const from = (opts.page - 1) * opts.pageSize;
      const { data, count, error } = await query.order('name').range(from, from + opts.pageSize - 1);
      if (error || !data) return null;
      return { rows: data as unknown as RetailPoint[], total: count ?? data.length };
    } catch {
      return null;
    }
  },

  // Linhas enxutas de PDV (rede, tipo, cidade, UF) para agregar por rede no navegador.
  // PostgREST devolve no máx. 1000 por chamada: busca as páginas em paralelo.
  async retailSlim(opts: { state?: string; type?: string }): Promise<{ network: string; type: string; city: string; state: string }[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const base = () => {
        let q = supabase!.from('retail_points').select('network,type,city,state', { count: 'exact' }).not('cnpj', 'is', null);
        if (opts.state && opts.state !== 'all') q = q.eq('state', opts.state);
        if (opts.type && opts.type !== 'all') q = q.eq('type', opts.type);
        return q;
      };
      const first = await base().order('id').range(0, 999);
      if (first.error || !first.data) return null;
      const total = first.count ?? first.data.length;
      const pages = Math.ceil(total / 1000);
      const rest = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, i) => base().order('id').range((i + 1) * 1000, (i + 2) * 1000 - 1)));
      return [first, ...rest].flatMap((r) => (r.data || []) as any[]);
    } catch {
      return null;
    }
  },

  // Lojas de uma rede (detalhe para o time Squad UGC)
  async retailStoresOf(network: string, state?: string): Promise<RetailPoint[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    let q = supabase.from('retail_points').select(RETAIL_COLS).eq('network', network).not('cnpj', 'is', null);
    if (state && state !== 'all') q = q.eq('state', state);
    const { data, error } = await q.order('state').order('city').limit(1000);
    return error || !data ? null : withContacts(data as unknown as RetailPoint[], 'admin_retail_contacts', { p_network: network });
  },

  // Totais reais por tipo de PDV (para os cards do topo)
  async countRetailByType(): Promise<Record<string, number> | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const types = ['cosmetics', 'pharmacy', 'salon', 'distributor', 'perfumery'];
      const res = await Promise.all(types.map((t) =>
        supabase!.from('retail_points').select('id', { count: 'exact', head: true }).not('cnpj', 'is', null).eq('type', t)
      ));
      const out: Record<string, number> = {};
      types.forEach((t, i) => { out[t] = res[i].count || 0; });
      out.total = Object.values(out).reduce((a, b) => a + b, 0);
      return out;
    } catch {
      return null;
    }
  },

  async retailCnpjExists(cnpjFormatted: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    const { count } = await supabase.from('retail_points').select('id', { count: 'exact', head: true }).eq('cnpj', cnpjFormatted);
    return (count || 0) > 0;
  },

  // Grava PDVs novos e devolve as linhas salvas (com id do banco)
  async saveRetailPoints(points: Omit<RetailPoint, 'id' | 'created_at'>[]): Promise<RetailPoint[] | null> {
    if (!isSupabaseConfigured || !supabase || points.length === 0) return null;
    try {
      const rows = points.map((p) => ({ ...p, cnpj: p.cnpj || null, phone: p.phone || null, email: p.email || null, manager_name: p.manager_name || null, address: p.address || null }));
      const { data, error } = await supabase.from('retail_points').insert(rows).select(RETAIL_COLS);
      if (error || !data) return null;
      return data as unknown as RetailPoint[];
    } catch {
      return null;
    }
  },

  // Histórico de métricas do creator (creator_metrics, mais recente primeiro). Só para usuários logados.
  async getCreatorMetrics(creatorId: string): Promise<{ rows: CreatorMetrics[]; error: 'migracao' | 'login' | null }> {
    if (!isSupabaseConfigured || !supabase) return { rows: [], error: null };
    const { data, error } = await supabase.from('creator_metrics').select(METRICS_COLS).eq('creator_id', creatorId).order('collected_at', { ascending: false }).limit(60);
    if (error) return { rows: [], error: /schema cache|does not exist|PGRST20/i.test(error.message) ? 'migracao' : 'login' };
    return { rows: (data || []).map(numMetrics), error: null };
  },

  // BI: última medição de cada creator por rede (admin). Pagina até acabar.
  async getLatestMetrics(): Promise<{ rows: CreatorMetrics[]; error: 'migracao' | 'login' | null }> {
    if (!isSupabaseConfigured || !supabase) return { rows: [], error: null };
    const all: CreatorMetrics[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from('creator_metrics').select(METRICS_COLS).order('collected_at', { ascending: false }).range(from, from + 999);
      if (error) return { rows: [], error: /schema cache|does not exist|PGRST20/i.test(error.message) ? 'migracao' : 'login' };
      all.push(...(data || []).map(numMetrics));
      if (!data || data.length < 1000) break;
    }
    const seen = new Set<string>();
    return { rows: all.filter((r) => !seen.has(r.creator_id + r.platform) && !!seen.add(r.creator_id + r.platform)), error: null };
  },

  // Fetch creator profiles from Supabase
  async getCreators(): Promise<CreatorProfile[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      // o PostgREST devolve no máximo 1000 linhas por chamada: pagina até acabar
      const all: CreatorProfile[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from('creators').select(CREATOR_COLS).order('created_at').range(from, from + 999);
        if (error || !data) return all.length ? withContacts(all, 'admin_creator_contacts') : null;
        all.push(...(data as unknown as CreatorProfile[]));
        if (data.length < 1000) return withContacts(all, 'admin_creator_contacts');
      }
    } catch {
      return null;
    }
  },

  // Fetch brand profiles from Supabase
  async getBrands(): Promise<BrandProfile[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('brands').select('*');
      if (error || !data) return null;
      return data as unknown as BrandProfile[];
    } catch {
      return null;
    }
  },

  // Insert application
  async applyToCampaign(campaignId: string, creatorId: string, message: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('ncp_campaign_applications').insert({
        campaign_id: campaignId,
        creator_id: creatorId,
        message,
        status: 'pending',
      });
      return !error;
    } catch {
      return false;
    }
  },

  // Insert campaign
  // Grava a campanha na tabela real (public.campaigns) e devolve a linha com o id (uuid) do banco
  async createCampaign(c: Partial<Campaign>): Promise<Campaign | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const isUuid = (v?: string) => !!v && /^[0-9a-f-]{36}$/i.test(v);
      const row = {
        organization_id: ORG_ID,
        brand_id: isUuid(c.brand_id) ? c.brand_id : null,
        title: c.title,
        slug: `${c.slug || 'campanha'}-${Math.random().toString(36).slice(2, 6)}`, // slug é UNIQUE no banco
        description: c.description || null,
        objective: c.objective || null,
        campaign_type: c.campaign_type || 'ugc',
        cover_url: c.cover_url || null,
        start_date: c.start_date,
        end_date: c.end_date,
        application_deadline: c.application_deadline || c.start_date,
        creator_slots: c.creator_slots || 0,
        occupied_slots: c.occupied_slots || 0,
        budget: c.budget || 0,
        commission_type: c.commission_type || 'fixed',
        commission_value: c.commission_value || 0,
        requirements_text: c.requirements_text || null,
        deliverables_text: c.deliverables_text || null,
        status: c.status || 'open',
      };
      const { data, error } = await supabase.from('campaigns').insert(row).select('*').single();
      if (error || !data) return null;
      return data as unknown as Campaign;
    } catch {
      return null;
    }
  },

  async updateCampaign(id: string, patch: Partial<Campaign>): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    const { error } = await supabase.from('campaigns').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
    return !error;
  },

  async deleteCampaign(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      await supabase.from('campaign_creators').delete().eq('campaign_id', id);
      await supabase.from('campaign_applications').delete().eq('campaign_id', id);
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // ---------- Squad (public.campaign_creators) ----------
  // A tabela ainda não tem coluna de cachê: ele vai codificado em notes como "cache=150;" (ver migração 20261004_leads_e_cache).
  async getParticipants(): Promise<CampaignParticipant[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('campaign_creators').select('*');
      if (error || !data) return null;
      return (data as any[]).map((r) => {
        const m = /cache=([\d.]+);/.exec(r.notes || '');
        return {
          id: r.id, campaign_id: r.campaign_id, creator_id: r.creator_id, stage: r.stage, status: r.status,
          operational_score: Number(r.operational_score ?? 0),
          fee: r.fee != null ? Number(r.fee) : m ? Number(m[1]) : undefined,
          notes: (r.notes || '').replace(/cache=[\d.]+;\s*/, ''),
          created_at: r.created_at, updated_at: r.updated_at,
        } as CampaignParticipant;
      });
    } catch {
      return null;
    }
  },

  async addParticipants(parts: CampaignParticipant[]): Promise<CampaignParticipant[] | null> {
    if (!isSupabaseConfigured || !supabase || parts.length === 0) return null;
    try {
      const rows = parts.map((p) => ({
        campaign_id: p.campaign_id, creator_id: p.creator_id, stage: p.stage || 'squad_approved', status: p.status || 'selected',
        operational_score: p.operational_score ?? 0,
        notes: `${p.fee != null ? `cache=${p.fee}; ` : ''}${p.notes || ''}`.trim(),
      }));
      const { data, error } = await supabase.from('campaign_creators').upsert(rows, { onConflict: 'campaign_id,creator_id' }).select('*');
      if (error || !data) return null;
      const byCreator = new Map((data as any[]).map((r) => [`${r.campaign_id}|${r.creator_id}`, r.id]));
      return parts.map((p) => ({ ...p, id: byCreator.get(`${p.campaign_id}|${p.creator_id}`) || p.id }));
    } catch {
      return null;
    }
  },

  async updateParticipantStage(campaignId: string, filter: { creatorId?: string; fromStage?: string }, stage: string, status?: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    let q = supabase.from('campaign_creators').update({ stage, ...(status ? { status } : {}), updated_at: new Date().toISOString() }).eq('campaign_id', campaignId);
    if (filter.creatorId) q = q.eq('creator_id', filter.creatorId);
    if (filter.fromStage) q = q.eq('stage', filter.fromStage);
    const { error } = await q;
    return !error;
  },

  // Approve content submission and release earning via Security Definer RPC
  async approveSubmissionAndReleaseEarning(submissionId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }
    try {
      const { data, error } = await supabase.rpc('ncp_approve_submission_and_release_earning', {
        p_submission_id: submissionId,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Mark earning as paid via Security Definer RPC
  async markEarningPaid(earningId: string, receiptUrl?: string, notes?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }
    try {
      const { data, error } = await supabase.rpc('ncp_mark_earning_paid', {
        p_earning_id: earningId,
        p_receipt_url: receiptUrl || null,
        p_notes: notes || null,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Submit Brand Lead (Founding Brands Program)
  async submitBrandLead(lead: {
    name: string;
    company: string;
    role?: string;
    email: string;
    whatsapp: string;
    category?: string;
    sales_channel?: string;
    budget_tier?: string;
    origin?: string;
    notes?: string;
  }): Promise<{ success: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true, message: 'Lead gravado em modo local' };
    }
    try {
      const { error } = await supabase.from('ncp_brand_leads').insert([lead]);
      if (error) {
        console.error('Erro ao salvar lead de marca:', error);
        return { success: false, message: friendlyLeadError(error) };
      }

      // Optional webhook notification
      const webhookUrl = import.meta.env.VITE_LEADS_WEBHOOK_URL;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'brand_lead', data: lead, timestamp: new Date().toISOString() })
        }).catch((err) => console.warn('Falha silenciosa ao disparar webhook de lead:', err));
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // Pedidos/leads de marca para o time Squad UGC (RLS: só admin logado lê)
  async getBrandLeads(origin?: string): Promise<{ rows: any[]; error?: 'sem_tabela' | 'sem_permissao' }> {
    if (!isSupabaseConfigured || !supabase) return { rows: [] };
    let q = supabase.from('ncp_brand_leads').select('*').order('created_at', { ascending: false }).limit(200);
    if (origin) q = q.eq('origin', origin);
    const { data, error } = await q;
    if (error) return { rows: [], error: error.code === 'PGRST205' ? 'sem_tabela' : 'sem_permissao' };
    return { rows: data || [] };
  },

  // Submit Creator Waitlist Entry
  async submitCreatorWaitlist(entry: {
    name: string;
    city?: string;
    state?: string;
    techniques?: string[];
    instagram: string;
    whatsapp: string;
  }): Promise<{ success: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true, message: 'Inscrição gravada em modo local' };
    }
    try {
      const { error } = await supabase.from('ncp_creator_waitlist').insert([entry]);
      if (error) {
        console.error('Erro ao salvar lista de espera de creator:', error);
        return { success: false, message: friendlyLeadError(error) };
      }

      // Optional webhook notification
      const webhookUrl = import.meta.env.VITE_LEADS_WEBHOOK_URL;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'creator_waitlist', data: entry, timestamp: new Date().toISOString() })
        }).catch((err) => console.warn('Falha silenciosa ao disparar webhook de waitlist:', err));
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // Fetch Featured Creators with explicit consent
  async getFeaturedCreators(): Promise<CreatorProfile[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('ncp_creator_profiles')
        .select('*')
        .eq('is_featured', true)
        .not('featured_consent_at', 'is', null);

      if (error || !data) return [];
      return data as unknown as CreatorProfile[];
    } catch {
      return [];
    }
  },

  // Fetch Public Open Campaigns
  async getPublicCampaigns(): Promise<Campaign[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      // campanhas reais abertas (o banco esconde rascunhos e campanhas de teste de visitantes)
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .in('status', ['open', 'selecting'])
        .order('published_at', { ascending: false })
        .limit(6);

      if (error || !data) return [];
      return (data as any[]).map((c) => ({ ...c, cover_url: c.cover_url || c.product?.image_url || '', description: c.description || c.brief?.show || '' })) as unknown as Campaign[];
    } catch {
      return [];
    }
  }
};

