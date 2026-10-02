import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { CreatorProfile } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatNumber } from '../../lib/utils';
import {
  Search,
  MapPin,
  Sparkles,
  Send,
  Heart,
  CheckCircle2
} from 'lucide-react';
import { InstagramIcon } from '../../components/ui/InstagramIcon';
import { MOCK_PORTFOLIO } from '../../data/mockData';
import confetti from 'canvas-confetti';

export const BrandCreators: React.FC = () => {
  const { creators, campaigns, inviteCreatorToCampaign } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [activeCreator, setActiveCreator] = useState<CreatorProfile | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || '');
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const specialties = ['fibra de vidro', 'alongamento', 'gel', 'acrílico', 'esmaltação em gel', 'nail art'];

  const filteredCreators = creators.filter((c) => {
    const matchesSearch =
      c.professional_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.instagram.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === 'all' || c.specialties.includes(selectedSpecialty);
    const matchesState = selectedState === 'all' || c.state === selectedState;
    return matchesSearch && matchesSpecialty && matchesState;
  });

  const handleSendInvite = () => {
    if (!activeCreator) return;
    setInviteSent(true);
    setTimeout(() => {
      inviteCreatorToCampaign(activeCreator.id, selectedCampaignId || campaigns[0]?.id);
      setInviteSent(false);
      setInviteSuccess(true);
      confetti({ particleCount: 70, spread: 60 });
      setTimeout(() => {
        setInviteSuccess(false);
        setActiveCreator(null);
      }, 1500);
    }, 600);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="purple">Diretório de Talentos</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
          Explorar Nail Creators Verificadas
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Filtre por cidade, técnicas de mesa (fibra, gel, nail art) e tamanho de público. Convide diretamente para suas campanhas.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, @instagram ou cidade..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="h-11 px-3.5 rounded-xl border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary w-full sm:w-auto"
          >
            <option value="all">Todos os Estados</option>
            <option value="SP">São Paulo (SP)</option>
            <option value="RJ">Rio de Janeiro (RJ)</option>
            <option value="MG">Minas Gerais (MG)</option>
            <option value="PR">Paraná (PR)</option>
            <option value="RS">Rio Grande do Sul (RS)</option>
            <option value="BA">Bahia (BA)</option>
            <option value="DF">Distrito Federal (DF)</option>
          </select>
        </div>

        {/* Specialty Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSpecialty('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedSpecialty === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Todas as Técnicas ({creators.length})
          </button>
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                selectedSpecialty === spec
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Creators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCreators.map((creator) => (
          <Card key={creator.id} variant="elevated" className="space-y-4 p-5 flex flex-col justify-between border-border/80 group">
            <div className="space-y-3">
              <div className="relative h-48 -mx-5 -mt-5 rounded-t-2xl overflow-hidden bg-muted">
                <img
                  src={creator.portfolio_cover_url || 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500'}
                  alt={creator.professional_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <Badge variant="gold" size="sm">
                    {formatNumber(creator.instagram_followers)} seguidores
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm font-display text-foreground">
                  {creator.professional_name}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-primary font-semibold mt-0.5">
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>{creator.instagram}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {creator.city}/{creator.state} • {creator.years_experience} anos exp.
                </p>
              </div>

              <div className="flex flex-wrap gap-1">
                {creator.specialties.map((s) => (
                  <span key={s} className="px-2 py-0.5 text-[10px] bg-secondary rounded-md text-secondary-foreground font-medium capitalize">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Button size="sm" variant="ghost" onClick={() => setActiveCreator(creator)}>
                Ver Portfólio
              </Button>
              <Button size="sm" onClick={() => setActiveCreator(creator)}>
                Convidar para Campanha
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Creator Details & Invite Modal */}
      {activeCreator && (
        <Modal
          isOpen={!!activeCreator}
          onClose={() => setActiveCreator(null)}
          title={activeCreator.professional_name}
          description={`${activeCreator.city}/${activeCreator.state} • ${formatNumber(activeCreator.instagram_followers)} seguidores`}
          maxWidth="xl"
        >
          {inviteSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold font-display text-foreground">Convite VIP Enviado com Sucesso!</h3>
              <p className="text-xs text-muted-foreground">A creator foi notificada no painel e recebeu o convite para a campanha.</p>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Sobre a Creator</h4>
                <p className="text-xs text-foreground leading-relaxed">{activeCreator.bio}</p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {activeCreator.techniques.map((t) => (
                    <Badge key={t} variant="gold" size="sm">{t}</Badge>
                  ))}
                </div>
              </div>

              {/* Portfolio sample */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Trabalhos em Destaque no Portfólio
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {MOCK_PORTFOLIO.slice(0, 3).map((item) => (
                    <div key={item.id} className="relative rounded-xl overflow-hidden aspect-square bg-muted">
                      <img src={item.media_url} alt="Nail work" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur text-[10px] text-white px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5 fill-red-500 text-red-500" /> {item.likes_count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite Form */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                <h4 className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <Send className="w-4 h-4" /> Convidar Diretamente para Campanha
                </h4>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3.5 py-2 text-xs focus:ring-2 focus:ring-primary font-medium"
                >
                  {campaigns.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.title} (Cachê: R$ {camp.commission_value})
                    </option>
                  ))}
                </select>
                <Button className="w-full" size="sm" onClick={handleSendInvite} isLoading={inviteSent}>
                  Enviar Convite VIP com Cachê Garantido
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
