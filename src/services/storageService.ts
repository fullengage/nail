import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UploadResult {
  url: string | null;
  path?: string;
  error?: string;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'application/pdf',
];

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export const storageService = {
  /**
   * Uploads a media file (image/video) to Supabase Storage.
   * Uses 'ncp-media' for public portfolio and 'ncp-private' for campaign submissions/receipts.
   * Path format: `${userId}/${folder}/${timestamp}-${random}.${ext}`
   */
  async uploadFile(
    file: File,
    folder = 'portfolio',
    userId?: string,
    isPrivate = false
  ): Promise<UploadResult> {
    // 1. Client-side MIME Type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        url: null,
        error: `Formato de arquivo não suportado (${file.type}). Use JPG, PNG, WEBP, MP4 ou MOV.`,
      };
    }

    // 2. Client-side File Size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        url: null,
        error: 'Arquivo muito grande. O tamanho máximo permitido é de 100 MB.',
      };
    }

    const bucketName = isPrivate ? 'ncp-private' : 'ncp-media';
    const userFolder = userId ? userId : 'anonymous';
    const fileExt = file.name.split('.').pop() || (file.type.includes('video') ? 'mp4' : 'jpg');
    const fileName = `${userFolder}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.warn(`Supabase storage upload error (${bucketName}):`, error.message);
        } else if (data) {
          if (isPrivate) {
            // Generate temporary signed URL for private bucket
            const { data: signedData, error: signError } = await supabase.storage
              .from('ncp-private')
              .createSignedUrl(data.path, 3600); // 1 hora de acesso

            if (signedData?.signedUrl) {
              return { url: signedData.signedUrl, path: data.path };
            }
          } else {
            // Public URL for public bucket
            const { data: publicUrlData } = supabase.storage
              .from('ncp-media')
              .getPublicUrl(data.path);

            if (publicUrlData?.publicUrl) {
              return { url: publicUrlData.publicUrl, path: data.path };
            }
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
        resolve({ url: reader.result as string, path: fileName });
      };
      reader.onerror = () => {
        resolve({ url: URL.createObjectURL(file), path: fileName });
      };
      reader.readAsDataURL(file);
    });
  },

  /**
   * Retrieves a signed URL for private objects in 'ncp-private'
   */
  async getPrivateFileUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.storage
        .from('ncp-private')
        .createSignedUrl(path, expiresInSeconds);
      if (error || !data) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  },
};
