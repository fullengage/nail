import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CampaignCard } from '../../components/creator/CampaignCard';
import { ApplyModal } from '../../components/creator/ApplyModal';
import { formatCurrency, formatNumber } from '../../lib/utils';
import {
  DollarSign,
  Briefcase,
  Sparkles,
  TrendingUp,
  Compass,
  ArrowRight,
  CheckCircle2,
  Gift,
  Video,
  Clock,
  Play
} from 'lucide-react';
import { Campaign } from '../../types/database';

interface CreatorDashboardProps {
  onNavigate: (view: string) => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ onNavigate }) => {
  const { user, creatorProfile } = useAuth();
  const { campaigns, applications, participants, earnings, courses, applyToCampaign } = useData();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Statistics
  const activeApplications = applications.filter((a) => a.creator_id === 'creator-1');
  const activeParticipations = participants.filter((p) => p.creator_id === 'creator-1');
  const myEarnings = earnings.filter((e) => e.creator_id === 'creator-1');

  const totalEarned = myEarnings.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingEarned = myEarnings.filter(e => e.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const availableEarned = myEarnings.filter(e => e.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 text-left">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary/15 via-amber-500/10 to-transparent border border-primary/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Bem-vinda de volta, {user?.full_name.split(' ')[0]}!
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
            Painel da Nail Creator
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Você tem <strong>{campaigns.length} campanhas ativas</strong> de marcas esperando por criadoras como você.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => onNavigate('creator-campaigns')}>
            <Compass className="w-4 h-4 mr-1.5" />
            Explorar Campanhas
          </Button>
          <Button variant="outline" onClick={() => onNavigate('creator-portfolio')}>
            Meu Portfólio
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="space-y-2 p-5 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Disponível</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{formatCurrency(availableEarned)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Liberado para saque PIX
          </p>
        </Card>

        <Card variant="elevated" className="space-y-2 p-5 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Cachês Pendentes</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{formatCurrency(pendingEarned)}</p>
          <p className="text-[11px] text-muted-foreground">Aguardando entrega/aprovação</p>
        </Card>

        <Card variant="elevated" className="space-y-2 p-5 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Em Andamento</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{activeParticipations.length}</p>
          <p className="text-[11px] text-primary font-semibold">Campanhas selecionadas</p>
        </Card>

        <Card variant="elevated" className="space-y-2 p-5 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Candidaturas</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{activeApplications.length}</p>
          <p className="text-[11px] text-muted-foreground">Solicitações enviadas</p>
        </Card>
      </div>

      {/* Active Participations & Delivery Tracking */}
      {activeParticipations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-display text-foreground">
                Suas Campanhas em Andamento
              </h2>
              <p className="text-xs text-muted-foreground">
                Acompanhe o envio do produto e o prazo para enviar o vídeo/post.
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('creator-my-campaigns')}>
              Ver Todas <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeParticipations.map((part) => {
              const camp = campaigns.find((c) => c.id === part.campaign_id) || campaigns[0];
              return (
                <Card key={part.id} variant="elevated" className="p-5 border-primary/20 space-y-4">
                  <div className="flex items-start space-x-3">
                    <img
                      src={camp.cover_url}
                      alt={camp.title}
                      className="w-16 h-16 rounded-xl object-cover ring-1 ring-border"
                    />
                    <div className="space-y-1">
                      <Badge variant="gold" size="sm">
                        {part.status === 'producing' ? '🎬 Produzindo Conteúdo' : '✓ Conteúdo Enviado'}
                      </Badge>
                      <h4 className="font-bold text-sm text-foreground">{camp.title}</h4>
                      {part.tracking_code && (
                        <p className="text-xs text-muted-foreground">
                          Rastreio Correios: <strong className="text-primary">{part.tracking_code}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Remuneração: <strong className="text-foreground">R$ {camp.commission_value}</strong>
                    </span>
                    <Button size="sm" onClick={() => onNavigate('creator-my-campaigns')}>
                      <Video className="w-3.5 h-3.5 mr-1" /> Enviar Entrega
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Campaigns */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-foreground">
              Campanhas Recomendadas para Seu Perfil
            </h2>
            <p className="text-xs text-muted-foreground">
              Com base nas suas especialidades em fibra de vidro e nail art.
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onNavigate('creator-campaigns')}>
            Ver Catálogo Completo <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.slice(0, 3).map((camp) => (
            <CampaignCard
              key={camp.id}
              campaign={camp}
              onApply={(c) => setSelectedCampaign(c)}
              isApplied={applications.some((a) => a.campaign_id === camp.id && a.creator_id === 'creator-1')}
            />
          ))}
        </div>
      </div>

      {/* Nail Academy Featured */}
      <div className="p-6 rounded-3xl bg-card border border-border/80 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <Badge variant="purple" size="sm">Nail Academy</Badge>
          <h3 className="text-lg font-bold font-display text-foreground">
            Aprenda a gravar vídeos de alta retenção no celular
          </h3>
          <p className="text-xs text-muted-foreground max-w-xl">
            Aumente suas chances de aprovação nas campanhas com os cursos gratuitos da nossa academia.
          </p>
        </div>
        <Button onClick={() => onNavigate('creator-academy')}>
          <Play className="w-4 h-4 mr-2 fill-current" /> Acessar Cursos Gratuitos
        </Button>
      </div>

      {/* Apply Modal */}
      {selectedCampaign && (
        <ApplyModal
          campaign={selectedCampaign}
          isOpen={!!selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onSubmit={(campId, pitch) => applyToCampaign(campId, pitch)}
          isAlreadyApplied={applications.some((a) => a.campaign_id === selectedCampaign.id && a.creator_id === 'creator-1')}
        />
      )}
    </div>
  );
};
