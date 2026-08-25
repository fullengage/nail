import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatNumber, formatDate } from '../../lib/utils';
import {
  Briefcase,
  Users,
  Video,
  Eye,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Inbox,
  ShoppingBag,
  Building2
} from 'lucide-react';

interface BrandDashboardProps {
  onNavigate: (view: string) => void;
}

export const BrandDashboard: React.FC<BrandDashboardProps> = ({ onNavigate }) => {
  const { user, brandProfile } = useAuth();
  const { campaigns, applications, participants, submissions } = useData();

  const brandCampaigns = campaigns.filter((c) => c.brand_id === 'brand-1');
  const pendingApps = applications.filter((a) => a.status === 'pending');
  const pendingSubs = submissions.filter((s) => s.status === 'submitted');

  // Metrics aggregation
  const totalViews = submissions.reduce((acc, curr) => acc + (curr.metrics?.views || 0), 0);
  const totalSales = submissions.reduce((acc, curr) => acc + (curr.metrics?.sales || 0), 0);
  const totalRevenue = submissions.reduce((acc, curr) => acc + (curr.metrics?.revenue || 0), 0);

  return (
    <div className="space-y-8 text-left">
      {/* Brand Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-primary/10 to-transparent border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" /> {brandProfile?.brand_name || 'BellaVitta Cosméticos'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
            Painel da Marca Parceira
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            Gerencie suas campanhas de marketing de influência, aprove candidaturas de Nail Creators e acompanhe o retorno de vendas e alcance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => onNavigate('brand-create-campaign')} className="shadow-lg">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Lançar Nova Campanha
          </Button>
          <Button variant="outline" onClick={() => onNavigate('brand-creators')}>
            Explorar Creators
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card variant="elevated" className="p-5 space-y-2 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Campanhas Ativas</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{brandCampaigns.length}</p>
          <p className="text-[11px] text-primary font-semibold">Campanhas em andamento</p>
        </Card>

        <Card variant="elevated" className="p-5 space-y-2 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Creators Ativas</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{participants.length + 8}</p>
          <p className="text-[11px] text-muted-foreground">Parcerias fechadas</p>
        </Card>

        <Card variant="elevated" className="p-5 space-y-2 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Conteúdos Gerados</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{submissions.length + 14}</p>
          <p className="text-[11px] text-amber-600 font-semibold">Reels, UGC & Stories</p>
        </Card>

        <Card variant="elevated" className="p-5 space-y-2 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Visualizações</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{formatNumber(totalViews + 185000)}</p>
          <p className="text-[11px] text-muted-foreground">Alcance total gerado</p>
        </Card>

        <Card variant="elevated" className="p-5 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Vendas Diretas</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalRevenue + 12840)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">{totalSales + 142} pedidos gerados</p>
        </Card>
      </div>

      {/* Action Alerts (Pending applications & content) */}
      {(pendingApps.length > 0 || pendingSubs.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pendingApps.length > 0 && (
            <div
              onClick={() => onNavigate('brand-applications')}
              className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between cursor-pointer hover:bg-amber-100/60 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    {pendingApps.length} Nova(s) Candidatura(s) para Avaliar
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Clique para revisar perfis e aprovar manicures.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-600" />
            </div>
          )}

          {pendingSubs.length > 0 && (
            <div
              onClick={() => onNavigate('brand-content')}
              className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-center justify-between cursor-pointer hover:bg-purple-100/60 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">
                    {pendingSubs.length} Conteúdo(s) Aguardando Aprovação
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-400">
                    Confira os Reels enviados pelas creators.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-600" />
            </div>
          )}
        </div>
      )}

      {/* Active Campaigns Management List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-foreground">
              Suas Campanhas no Ar
            </h2>
            <p className="text-xs text-muted-foreground">
              Acompanhe o preenchimento das vagas e o orçamento alocado.
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onNavigate('brand-campaigns')}>
            Ver Todas <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brandCampaigns.map((camp) => (
            <Card key={camp.id} variant="elevated" className="p-5 space-y-4 border-border/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <img
                    src={camp.cover_url}
                    alt={camp.title}
                    className="w-16 h-16 rounded-xl object-cover ring-1 ring-border"
                  />
                  <div>
                    <Badge variant="gold" size="sm">
                      {camp.campaign_type.replace('_', ' ')}
                    </Badge>
                    <h4 className="font-bold text-sm text-foreground mt-1">{camp.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Prazo: {formatDate(camp.application_deadline)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress of slots */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Vagas Preenchidas</span>
                  <span className="text-foreground">
                    {camp.occupied_slots} de {camp.creator_slots} Creators
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(camp.occupied_slots! / camp.creator_slots) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                <span className="text-muted-foreground">
                  Orçamento: <strong className="text-foreground">{formatCurrency(camp.budget)}</strong>
                </span>
                <Button size="sm" variant="outline" onClick={() => onNavigate('brand-applications')}>
                  Ver Candidaturas
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
