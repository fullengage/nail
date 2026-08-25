import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UploadResult {
  url: string | null;
  error?: string;
}

export const storageService = {
  /**
   * Uploads a media file (image/video) to Supabase Storage bucket 'ncp-media'
   * Falls back to local Object URL or DataURL if Supabase is offline.
   */
  async uploadFile(file: File, folder = 'portfolio'): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('ncp-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.warn('Supabase storage upload error, using local fallback:', error.message);
        } else if (data) {
          const { data: publicUrlData } = supabase.storage
            .from('ncp-media')
            .getPublicUrl(data.path);

          if (publicUrlData?.publicUrl) {
            return { url: publicUrlData.publicUrl };
          }
        }
      } catch (e: any) {
        console.warn('Storage exception, using local fallback:', e.message);
      }
    }

    // Local Base64 / Blob fallback for offline and instant preview
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ url: reader.result as string });
      };
      reader.onerror = () => {
        resolve({ url: URL.createObjectURL(file) });
      };
      reader.readAsDataURL(file);
    });
  }
};
