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
  Heart
} from 'lucide-react';
import { InstagramIcon } from '../../components/ui/InstagramIcon';
import { MOCK_PROFILES, MOCK_PORTFOLIO } from '../../data/mockData';

export const BrandCreators: React.FC = () => {
  const { creators } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [activeCreator, setActiveCreator] = useState<CreatorProfile | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

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
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      alert('Convite exclusivo enviado para a Nail Creator!');
    }, 1200);
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
                ? 'bg-primary text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Todas as Especialidades
          </button>
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                selectedSpecialty === spec
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Creators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCreators.map((creator) => {
          const user = MOCK_PROFILES.find((p) => p.id === creator.user_id) || MOCK_PROFILES[0];
          return (
            <Card
              key={creator.id}
              variant="elevated"
              className="p-5 space-y-4 border-border/80 hover:border-primary/40 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                    alt={creator.professional_name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/30"
                  />
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {creator.professional_name}
                      </h4>
                      <Badge variant="gold" size="sm">✓</Badge>
                    </div>
                    <p className="text-xs text-primary font-semibold truncate">{creator.instagram}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" /> {creator.city}/{creator.state} • {creator.years_experience} anos exp.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {creator.bio}
                </p>

                {/* Metrics Badges */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs bg-muted/40 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold">Instagram</span>
                    <span className="font-bold text-foreground flex items-center justify-center gap-1">
                      <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />
                      {formatNumber(creator.instagram_followers)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold">TikTok</span>
                    <span className="font-bold text-foreground">
                      {formatNumber(creator.tiktok_followers)}
                    </span>
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1">
                  {creator.specialties.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-medium text-secondary-foreground">
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
          );
        })}
      </div>

      {/* Creator Details & Portfolio Modal */}
      {activeCreator && (
        <Modal
          isOpen={!!activeCreator}
          onClose={() => setActiveCreator(null)}
          title={activeCreator.professional_name}
          description={`${activeCreator.city}/${activeCreator.state} • ${formatNumber(activeCreator.instagram_followers)} seguidores`}
          maxWidth="xl"
        >
          <div className="space-y-6">
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
              <select className="w-full h-11 rounded-xl border border-input bg-background px-3.5 py-2 text-xs focus:ring-2 focus:ring-primary">
                <option>Lançamento Coleção Primavera — Reels & Swatches</option>
                <option>Desafio Gel Builder 21 Dias de Resistência</option>
                <option>Live Commerce Especial: Cabine SunPro 48W</option>
              </select>
              <Button className="w-full" size="sm" onClick={handleSendInvite} isLoading={inviteSent}>
                Enviar Convite VIP com Cachê Garantido
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
