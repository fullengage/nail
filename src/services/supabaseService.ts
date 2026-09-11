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
  }
};
