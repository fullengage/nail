import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { CampaignCard } from '../../components/creator/CampaignCard';
import { ApplyModal } from '../../components/creator/ApplyModal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Campaign, CampaignType } from '../../types/database';
import { Search, Filter, Sparkles, DollarSign, Gift } from 'lucide-react';

export const CreatorCampaigns: React.FC = () => {
  const { campaigns, applications, applyToCampaign } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesSearch =
      camp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || camp.campaign_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="gold">Oportunidades Disponíveis</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
          Campanhas Abertas para Nail Creators
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Explore parcerias com marcas de esmaltes, géis, cabines e ferramentas. Envie sua proposta e receba produtos e cachês.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por marca, produto, técnica..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-background/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'paid_content', label: 'Cachê Pago' },
            { id: 'ugc', label: 'Vídeo UGC' },
            { id: 'affiliate', label: 'Afiliadas' },
            { id: 'product_seeding', label: 'Seeding / Permuta' },
            { id: 'live_commerce', label: 'Live Commerce' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === type.id
                  ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((camp) => {
          const app = applications.find(
            (a) => a.campaign_id === camp.id && a.creator_id === 'creator-1'
          );
          return (
            <CampaignCard
              key={camp.id}
              campaign={camp}
              onApply={(c) => setSelectedCampaign(c)}
              isApplied={!!app}
              applicationStatus={app?.status}
            />
          );
        })}
      </div>

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-16 space-y-3 bg-card rounded-2xl border border-border">
          <p className="text-sm font-bold text-foreground">Nenhuma campanha encontrada com esses filtros.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedType('all');
            }}
            className="text-xs text-primary font-bold hover:underline"
          >
            Limpar filtros e ver todas as campanhas
          </button>
        </div>
      )}

      {/* Apply Modal */}
      {selectedCampaign && (
        <ApplyModal
          campaign={selectedCampaign}
          isOpen={!!selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onSubmit={(campId, pitch) => applyToCampaign(campId, pitch)}
          isAlreadyApplied={applications.some(
            (a) => a.campaign_id === selectedCampaign.id && a.creator_id === 'creator-1'
          )}
        />
      )}
    </div>
  );
};
