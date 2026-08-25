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
  }
};
