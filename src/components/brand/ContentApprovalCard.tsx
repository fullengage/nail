import React from 'react';
import { ContentSubmission } from '../../types/database';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatNumber, formatCurrency, formatDate } from '../../lib/utils';
import { Eye, Heart, MessageCircle, Share2, MousePointerClick, ShoppingBag, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';
import { MOCK_CREATORS, MOCK_CAMPAIGNS } from '../../data/mockData';

interface ContentApprovalCardProps {
  submission: ContentSubmission;
  onApprove: (submissionId: string) => void;
}

export const ContentApprovalCard: React.FC<ContentApprovalCardProps> = ({
  submission,
  onApprove,
}) => {
  const creator = MOCK_CREATORS.find((c) => c.id === submission.creator_id) || MOCK_CREATORS[0];
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === submission.campaign_id) || MOCK_CAMPAIGNS[0];
  const metrics = submission.metrics;

  return (
    <Card variant="elevated" className="space-y-4 border-border/80">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm text-foreground">{creator.professional_name}</span>
            <Badge variant="purple" size="sm">
              {submission.content_type.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Campanha: <strong className="text-foreground">{campaign.title}</strong>
          </p>
        </div>

        <span className="text-xs text-muted-foreground">
          Enviado em {formatDate(submission.submitted_at)}
        </span>
      </div>

      {/* Media & Caption Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Preview image */}
        <div className="relative rounded-xl overflow-hidden bg-muted group max-h-52">
          <img
            src={submission.media_url}
            alt="Preview"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          <a
            href={submission.published_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
          >
            <ExternalLink className="w-4 h-4" /> Abrir no Instagram
          </a>
        </div>

        {/* Caption & Details */}
        <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Legenda e Hashtags</p>
            <p className="text-xs text-foreground bg-muted/40 p-3 rounded-xl border border-border/60 leading-relaxed italic">
              "{submission.caption}"
            </p>
          </div>

          {/* Live / Simulated Metrics */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10 text-center">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3 text-primary" /> Visualizações
                </span>
                <p className="text-sm font-extrabold text-foreground">{formatNumber(metrics.views)}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10 text-center">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" /> Curtidas
                </span>
                <p className="text-sm font-extrabold text-foreground">{formatNumber(metrics.likes)}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10 text-center">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <MousePointerClick className="w-3 h-3 text-amber-500" /> Cliques Link
                </span>
                <p className="text-sm font-extrabold text-foreground">{formatNumber(metrics.clicks)}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-emerald-600" /> Vendas ({metrics.sales})
                </span>
                <p className="text-sm font-extrabold text-emerald-600">{formatCurrency(metrics.revenue)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer & Approval */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <a
          href={submission.published_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Ver Post Oficial ao Vivo
        </a>

        {submission.status === 'submitted' ? (
          <Button
            size="sm"
            onClick={() => onApprove(submission.id)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Aprovar Conteúdo & Liberar Cachê
          </Button>
        ) : (
          <Badge variant="success" className="py-1 px-3">
            ✓ Conteúdo Aprovado & Cachê Pago
          </Badge>
        )}
      </div>
    </Card>
  );
};
