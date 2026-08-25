import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { CampaignWizard } from '../../components/brand/CampaignWizard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { PlusCircle, Calendar, Users, DollarSign, ArrowRight } from 'lucide-react';

interface BrandCampaignsProps {
  onNavigate: (view: string) => void;
  openCreateWizard?: boolean;
}

export const BrandCampaigns: React.FC<BrandCampaignsProps> = ({ onNavigate, openCreateWizard = false }) => {
  const { campaigns, createCampaign } = useData();
  const [isCreating, setIsCreating] = useState(openCreateWizard);

  const brandCampaigns = campaigns.filter((c) => c.brand_id === 'brand-1' || c.brand_id === 'brand-2');

  if (isCreating) {
    return (
      <div className="space-y-6 text-left">
        <CampaignWizard
          onCreate={(campData) => {
            createCampaign(campData);
            setIsCreating(false);
          }}
          onCancel={() => setIsCreating(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="gold">Gestão de Campanhas</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
            Campanhas da Sua Marca
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Acompanhe o desempenho, vagas preenchidas e conteúdos de cada ação ativa.
          </p>
        </div>

        <Button onClick={() => setIsCreating(true)} className="shadow-md">
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Nova Campanha
        </Button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brandCampaigns.map((camp) => (
          <Card key={camp.id} variant="elevated" className="space-y-4 p-5 flex flex-col justify-between border-border/80">
            <div className="space-y-4">
              <div className="relative h-40 -mx-5 -mt-5 rounded-t-2xl overflow-hidden bg-muted">
                <img
                  src={camp.cover_url}
                  alt={camp.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="gold" size="sm">
                    {camp.campaign_type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-base font-display text-foreground leading-snug">
                  {camp.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {camp.description}
                </p>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <span>Vagas Preenchidas:</span>
                  <strong className="text-foreground">{camp.occupied_slots} / {camp.creator_slots}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Orçamento Total:</span>
                  <strong className="text-emerald-600">{formatCurrency(camp.budget)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Prazo Limite:</span>
                  <span className="text-foreground">{formatDate(camp.application_deadline)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Button size="sm" variant="ghost" onClick={() => onNavigate('brand-applications')}>
                Ver Candidaturas
              </Button>
              <Button size="sm" onClick={() => onNavigate('brand-content')}>
                Conteúdos ({camp.occupied_slots || 0})
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
