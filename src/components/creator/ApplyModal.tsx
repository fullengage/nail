import React, { useState } from 'react';
import { Campaign } from '../../types/database';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/utils';
import { Sparkles, CheckCircle2, Video, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ApplyModalProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (campaignId: string, message: string) => void;
  isAlreadyApplied?: boolean;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onSubmit,
  isAlreadyApplied,
}) => {
  const [pitch, setPitch] = useState(
    'Olá! Adoro os produtos da marca e tenho o público perfeito para essa campanha. Vou produzir um conteúdo de altíssima qualidade com iluminação profissional e foco na durabilidade!'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!campaign) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      onSubmit(campaign.id, pitch);
      setIsSubmitting(false);
      setIsSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
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
      title={isSuccess ? undefined : 'Candidatura para Campanha'}
      maxWidth="lg"
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold font-display text-foreground">
            Candidatura Enviada com Sucesso! 🎉
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            A marca foi notificada da sua proposta. Você pode acompanhar o status na aba{' '}
            <strong className="text-foreground">Minhas Campanhas</strong>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campaign Summary Header */}
          <div className="p-4 rounded-xl bg-muted/60 border border-border/80 flex items-start space-x-4">
            <img
              src={campaign.cover_url}
              alt={campaign.title}
              className="w-20 h-20 rounded-lg object-cover ring-1 ring-border"
            />
            <div className="space-y-1">
              <Badge variant="gold" size="sm">
                {campaign.campaign_type === 'paid_content'
                  ? 'Conteúdo Pago'
                  : campaign.campaign_type === 'ugc'
                  ? 'Vídeo UGC'
                  : 'Parceria'}
              </Badge>
              <h4 className="font-bold text-sm text-foreground">{campaign.title}</h4>
              <p className="text-xs font-semibold text-primary">
                Cachê / Benefício:{' '}
                {campaign.commission_type === 'fixed'
                  ? `${formatCurrency(campaign.commission_value)} + Kit`
                  : campaign.commission_type === 'percentage'
                  ? `${campaign.commission_value}% Comissão`
                  : 'Kit de Produtos'}
              </p>
            </div>
          </div>

          {/* Deliverables & Requirements check */}
          <div className="space-y-3 text-xs bg-card p-4 rounded-xl border border-border">
            <h5 className="font-bold text-foreground flex items-center gap-1.5">
              <Video className="w-4 h-4 text-primary" /> O que você irá entregar:
            </h5>
            <p className="text-muted-foreground leading-relaxed pl-5">{campaign.deliverables_text}</p>

            <h5 className="font-bold text-foreground flex items-center gap-1.5 pt-2 border-t border-border">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Requisitos da Campanha:
            </h5>
            <p className="text-muted-foreground leading-relaxed pl-5">{campaign.requirements_text}</p>
          </div>

          {/* Pitch Message */}
          <Textarea
            label="Mensagem para a Marca (Seu Diferencial / Ideia de Conteúdo)"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            rows={4}
            required
            helperText="Explique como você pretende gravar o conteúdo e por que seu público vai amar."
          />

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isAlreadyApplied}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              {isAlreadyApplied ? 'Já Candidatada' : 'Confirmar e Enviar Candidatura'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
