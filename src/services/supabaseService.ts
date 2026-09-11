import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Campaign, CreatorProfile, BrandProfile, Product, CampaignApplication } from '../types/database';

export const supabaseService = {
  // Check connection status
  async checkConnection(): Promise<{ connected: boolean; message: string; tableCount?: number }> {
    if (!isSupabaseConfigured || !supabase) {
      return { connected: false, message: 'Supabase não configurado no .env' };
    }
    try {
      const { data, error } = await supabase.from('ncp_profiles').select('count', { count: 'exact' });
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
      const { data, error } = await supabase.from('ncp_campaigns').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;
      return data as unknown as Campaign[];
    } catch {
      return null;
    }
  },

  // Fetch creator profiles from Supabase
  async getCreators(): Promise<CreatorProfile[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('ncp_creator_profiles').select('*');
      if (error || !data) return null;
      return data as unknown as CreatorProfile[];
    } catch {
      return null;
    }
  },

  // Fetch brand profiles from Supabase
  async getBrands(): Promise<BrandProfile[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('ncp_brand_profiles').select('*');
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
  async createCampaign(campaignData: any): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('ncp_campaigns').insert(campaignData);
      return !error;
    } catch {
      return false;
    }
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
        return { success: false, message: error.message };
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
        return { success: false, message: error.message };
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
      const { data, error } = await supabase
        .from('ncp_campaigns')
        .select('*')
        .in('status', ['open', 'published'])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as unknown as Campaign[];
    } catch {
      return [];
    }
  }
};

