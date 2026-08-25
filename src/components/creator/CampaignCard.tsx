import React from 'react';
import { Campaign } from '../../types/database';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { DollarSign, Gift, Calendar, Video, Sparkles } from 'lucide-react';
import { MOCK_BRANDS } from '../../data/mockData';

interface CampaignCardProps {
  campaign: Campaign;
  onApply: (campaign: Campaign) => void;
  isApplied?: boolean;
  applicationStatus?: string;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onApply,
  isApplied,
  applicationStatus,
}) => {
  const brand = campaign.brand || MOCK_BRANDS.find(b => b.id === campaign.brand_id) || MOCK_BRANDS[0];

  const typeLabels = {
    product_seeding: { label: 'Seeding de Produto', variant: 'secondary' as const },
    paid_content: { label: 'Conteúdo Pago + Cachê', variant: 'gold' as const },
    ugc: { label: 'Vídeo UGC', variant: 'purple' as const },
    affiliate: { label: 'Programa Afiliadas', variant: 'success' as const },
    live_commerce: { label: 'Live Commerce', variant: 'warning' as const },
  };

  const currentType = typeLabels[campaign.campaign_type] || typeLabels.paid_content;

  return (
    <Card variant="elevated" className="flex flex-col justify-between overflow-hidden border-border/70 group hover:border-primary/40">
      <div className="space-y-4">
        {/* Cover & Brand Badge */}
        <div className="relative h-44 -mx-6 -mt-6 overflow-hidden bg-muted">
          <img
            src={campaign.cover_url}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute top-3 left-3">
            <Badge variant={currentType.variant} className="shadow-md">
              {currentType.label}
            </Badge>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center space-x-2.5">
            <img
              src={brand.logo_url}
              alt={brand.brand_name}
              className="w-8 h-8 rounded-lg object-cover bg-white p-0.5 shadow ring-1 ring-white/40"
            />
            <span className="text-xs font-bold text-white drop-shadow truncate">
              {brand.brand_name}
            </span>
          </div>
        </div>

        {/* Campaign Info */}
        <div className="space-y-2">
          <h3 className="font-bold text-base font-display text-foreground leading-snug line-clamp-2">
            {campaign.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {campaign.description}
          </p>
        </div>

        {/* Value / Compensation Box */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-transparent border border-primary/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
              {campaign.commission_type === 'product_only' ? (
                <Gift className="w-4 h-4" />
              ) : (
                <DollarSign className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Remuneração</p>
              <p className="text-sm font-extrabold text-foreground">
                {campaign.commission_type === 'fixed'
                  ? `${formatCurrency(campaign.commission_value)} + Kit`
                  : campaign.commission_type === 'percentage'
                  ? `${campaign.commission_value}% Comissão`
                  : 'Kit Exclusivo'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Vagas</p>
            <p className="text-xs font-bold text-foreground">
              {campaign.occupied_slots || 0} / {campaign.creator_slots}
            </p>
          </div>
        </div>

        {/* Deliverables summary */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Video className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{campaign.deliverables_text}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Prazo: {formatDate(campaign.application_deadline)}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-5 pt-3 border-t border-border/70">
        {isApplied ? (
          <div className="flex items-center justify-between">
            <Badge
              variant={
                applicationStatus === 'approved'
                  ? 'success'
                  : applicationStatus === 'rejected'
                  ? 'outline'
                  : 'warning'
              }
              className="py-1 px-3"
            >
              {applicationStatus === 'approved'
                ? '✓ Selecionada'
                : applicationStatus === 'rejected'
                ? 'Não selecionada'
                : '⏳ Candidatura em análise'}
            </Badge>
            <Button size="sm" variant="ghost" onClick={() => onApply(campaign)}>
              Ver Detalhes
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            size="sm"
            onClick={() => onApply(campaign)}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Candidatar-se à Campanha
          </Button>
        )}
      </div>
    </Card>
  );
};
