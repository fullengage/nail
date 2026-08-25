import React, { useState, useRef } from 'react';
import { Campaign, ContentType } from '../../types/database';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Video, Link as LinkIcon, Sparkles, CheckCircle2, Upload, UploadCloud } from 'lucide-react';
import { storageService } from '../../services/storageService';
import confetti from 'canvas-confetti';

interface SubmitContentModalProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    campaignId: string,
    contentType: ContentType,
    mediaUrl: string,
    publishedUrl: string,
    caption: string
  ) => void;
}

export const SubmitContentModal: React.FC<SubmitContentModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [contentType, setContentType] = useState<ContentType>('instagram_reel');
  const [publishedUrl, setPublishedUrl] = useState('https://www.instagram.com/reel/C3_mock_camilanails/');
  const [mediaUrl, setMediaUrl] = useState(
    'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80'
  );
  const [caption, setCaption] = useState(
    'Unhas perfeitas com os novos lançamentos da @bellavittacosmeticos! 💅✨ Apaixonada nessa pigmentação e brilho espelhado que dura 30 dias. Cupom CAMILA10 na bio! #publi #BellaVittaNails'
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!campaign) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalMediaUrl = mediaUrl;
    if (selectedFile) {
      const res = await storageService.uploadFile(selectedFile, 'submissions');
      if (res.url) finalMediaUrl = res.url;
    }

    setTimeout(() => {
      onSubmit(campaign.id, contentType, finalMediaUrl, publishedUrl, caption);
      setIsSubmitting(false);
      setIsSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSuccess ? undefined : 'Enviar Conteúdo Produzido'}
      maxWidth="lg"
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold font-display text-foreground">
            Conteúdo Enviado para Avaliação! 🎬
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            A marca foi notificada para analisar seu post. Assim que aprovado, seu pagamento será
            automaticamente liberado no painel.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="p-3.5 bg-muted/60 rounded-xl border border-border flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Campanha</p>
              <p className="text-xs font-bold text-foreground">{campaign.title}</p>
            </div>
            <span className="text-xs text-primary font-bold">Passo 3/3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
                Tipo de Conteúdo
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="instagram_reel">Instagram Reel</option>
                <option value="story">Instagram Stories (Sequência)</option>
                <option value="tiktok">TikTok Video</option>
                <option value="ugc">Vídeo UGC Bruto</option>
                <option value="youtube">YouTube Vídeo / Shorts</option>
              </select>
            </div>

            <Input
              label="Link da Publicação (Reels / TikTok)"
              value={publishedUrl}
              onChange={(e) => setPublishedUrl(e.target.value)}
              placeholder="https://instagram.com/reel/..."
              required
            />
          </div>

          {/* Media upload / screenshot */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
              Arquivo / Comprovante do Post (Upload para Supabase Storage)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
            {filePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border h-36">
                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview('');
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white text-xs hover:bg-black/80"
                >
                  Trocar Arquivo
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary rounded-xl p-4 text-center cursor-pointer transition-colors bg-muted/30 hover:bg-muted/60 space-y-1"
              >
                <UploadCloud className="w-5 h-5 mx-auto text-primary" />
                <p className="text-xs font-bold text-foreground">Clique para anexar print ou thumbnail do post</p>
                <p className="text-[10px] text-muted-foreground">Formatos JPG, PNG ou MP4</p>
              </div>
            )}
          </div>

          <Textarea
            label="Legenda Utilizada na Publicação"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            required
          />

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              <Upload className="w-4 h-4 mr-1.5" />
              Enviar para Aprovação
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
