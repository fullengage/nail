import React, { useMemo, useState, useEffect } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { TikTokLink } from '../../components/ui/TikTokLink';
import { useData } from '../../context/DataContext';
import {
  Users,
  Video,
  Store,
  Sparkles,
  TrendingUp,
  Eye,
  DollarSign,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Package,
  Layers,
  Award
} from 'lucide-react';
import { Instagram } from '../../components/ui/Icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Badge } from '../../components/ui/Badge';
import { MissionSimulator } from '../../components/squadra/MissionSimulator';
import { BrandLeadsInbox } from '../../components/squadra/BrandLeadsInbox';

interface SquadraDashboardProps {
  onNavigate: (view: string) => void;
}

// Mock de 30 dias de performance
const PERFORMANCE_DATA = [
  { day: '01/09', views: 85000, gmv: 9200 },
  { day: '05/09', views: 120000, gmv: 14500 },
  { day: '10/09', views: 195000, gmv: 22800 },
  { day: '15/09', views: 240000, gmv: 29400 },
  { day: '20/09', views: 380000, gmv: 45000 },
  { day: '25/09', views: 490000, gmv: 58200 },
  { day: '30/09', views: 610000, gmv: 71000 },
  { day: '02/10', views: 720000, gmv: 88500 }
];

export const SquadraDashboard: React.FC<SquadraDashboardProps> = ({ onNavigate }) => {
  const { creators, campaigns, participants, sourceCounts, retailPoints } = useData();
  // KPIs reais: contados na base de creators e no banco de PDVs (nada de número fixo)
  const realKpis = useMemo(() => {
    const has = (c: any, tag: string) => (c.tags || []).includes(tag);
    return {
      creators: creators.length,
      qualified: creators.filter((c) => has(c, 'A - Prioritário') || has(c, 'B - Qualificado')).length,
      instagram: creators.filter((c) => !!c.instagram).length,
      contact: creators.filter((c) => !!c.email || !!c.phone).length,
      live: creators.filter((c) => c.accepts_live_campaigns || has(c, 'Vendas por live')).length,
    };
  }, [creators]);
  // funil e investimento a partir dos squads reais
  const funnel = useMemo(() => {
    const after = (st: string | undefined, list: string[]) => list.includes(st || '');
    const SHIPPED = ['shipping', 'delivered', 'producing', 'submitted', 'reviewing', 'approved', 'published', 'completed'];
    const APPROVED = ['approved', 'published', 'completed'];
    const IN_SQUAD = ['squad_approved', 'briefing_sent', ...SHIPPED];
    const fee = (p: any) => p.fee ?? campaigns.find((c) => c.id === p.campaign_id)?.commission_value ?? 0;
    const sq = participants.filter((p) => after(p.stage, IN_SQUAD));
    return {
      base: realKpis.creators,
      qualified: realKpis.qualified,
      inSquad: new Set(sq.map((p) => p.creator_id)).size,
      shipped: participants.filter((p) => after(p.stage, SHIPPED)).length,
      approved: participants.filter((p) => after(p.stage, APPROVED)).length,
      completed: participants.filter((p) => p.stage === 'completed').length,
      openCampaigns: campaigns.filter((c) => c.status === 'open' || c.status === 'in_progress').length,
      investment: sq.reduce((acc, p) => acc + fee(p), 0),
      paid: participants.filter((p) => p.stage === 'completed').reduce((acc, p) => acc + fee(p), 0),
    };
  }, [participants, campaigns, realKpis]);
  const [pdvTotals, setPdvTotals] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    supabaseService.countRetailByType().then(setPdvTotals);
  }, []);

  // Top creators ordenados por pontuação operacional
  const topCreators = [...creators]
    .sort((a, b) => (b.operational_score || 0) - (a.operational_score || 0))
    .slice(0, 8);

  const activeCampaignsCount = campaigns.filter(c => c.status === 'open' || c.status === 'in_progress').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header do Painel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Squad UGC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground mt-1">
            Dashboard Executivo
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Visão unificada das bases de prospecção, pipeline de campanhas e volume de negócios.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('creators')}
            className="px-3.5 py-2 bg-card hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all shadow-sm flex items-center space-x-1.5"
          >
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Explorar Creators</span>
          </button>
          <button
            onClick={() => onNavigate('campaigns')}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-black rounded-full border-2 border-black text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campanhas Ativas ({activeCampaignsCount})</span>
          </button>
        </div>
      </div>

      {/* Leads de marcas vindos do site (só admin lê) */}

      <BrandLeadsInbox />


      {/* 2. Bases Mapeadas por Fonte & PDVs (Atualizado em tempo real) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
              Bases Mapeadas por Fonte & PDVs
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Atualizado em tempo real
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">Deduplicação automática por @ e e-mail</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[
            {
              label: 'Com contato comercial',
              value: sourceCounts.contact,
              sub: sourceCounts.contact == null ? 'Contagem disponível após a migração 20261006' : `${(sourceCounts.contact_email ?? 0).toLocaleString('pt-BR')} com e-mail · ${(sourceCounts.contact_phone ?? 0).toLocaleString('pt-BR')} com telefone/WhatsApp`,
              icon: <Sparkles className="w-4 h-4" />,
              highlight: false,
            },
            {
              label: 'Creators no TikTok',
              value: sourceCounts.tiktok,
              sub: `${sourceCounts.tiktok_shop.toLocaleString('pt-BR')} vendem no TikTok Shop`,
              icon: <Video className="w-4 h-4" />,
              highlight: false,
            },
            {
              label: 'Creators no Instagram',
              value: sourceCounts.instagram,
              sub: 'Perfil confirmado',
              icon: <Instagram className="w-4 h-4" />,
              highlight: false,
            },
            {
              label: 'Rede de PDVs',
              value: sourceCounts.retail_points,
              sub: 'Redes com 10+ lojas (Receita Federal)',
              icon: <Store className="w-4 h-4" />,
              highlight: false,
            },
            {
              label: 'Creators na base',
              value: sourceCounts.unique_creators,
              sub: 'Brasileiros, sem marcas ou lojas',
              icon: <Users className="w-4 h-4" />,
              highlight: true,
            },
          ].map((k) => (
            <div
              key={k.label}
              className={`p-4 rounded-2xl border shadow-sm transition-all ${
                k.highlight
                  ? 'bg-primary border-2 border-black text-black'
                  : 'bg-card border-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${k.highlight ? 'text-black' : 'text-muted-foreground'}`}>
                  {k.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    k.highlight ? 'bg-black text-primary' : 'bg-muted text-foreground'
                  }`}
                >
                  {k.icon}
                </div>
              </div>
              <p className="text-2xl font-bold font-display mt-2">
                {k.value == null ? '—' : k.value.toLocaleString('pt-BR')}
              </p>
              <p className={`text-[11px] mt-1 ${k.highlight ? 'text-black/70' : 'text-muted-foreground'}`}>
                {k.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2.1. Simulador de Missões com 2 Réguas (Curadoria & Ranking) */}
      <div>
        <MissionSimulator
          onApplyBudget={(params) => {
            onNavigate('campaigns');
          }}
        />
      </div>

      {/* 3. Resultados de campanha: só números reais (views/vendas entram quando houver conteúdo publicado) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Campanhas</p>
            <h3 className="text-lg font-bold font-display text-foreground mt-0.5">Investimento e squads</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Campanhas abertas', funnel.openCampaigns.toLocaleString('pt-BR')],
              ['Creators em squads', funnel.inSquad.toLocaleString('pt-BR')],
              ['Investimento em cachês', funnel.investment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })],
              ['Já pago', funnel.paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })],
            ].map(([l, v]) => (
              <div key={l} className="p-3 rounded-xl bg-muted/40 border border-border">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{l}</p>
                <p className="text-xl font-extrabold mt-1">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Alcance e vendas</p>
          <h3 className="text-lg font-bold font-display text-foreground">Views, GMV e comissões</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Aparecem aqui assim que os primeiros conteúdos forem publicados e as vendas por cupom ou link de afiliado começarem a ser registradas.
            Nada de número estimado.
          </p>
          <button onClick={() => onNavigate('campaigns')} className="text-xs font-bold text-primary hover:underline flex items-center pt-1">
            <span>Ir para campanhas</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      {/* 4. Funil real: da base mapeada ao creator pago */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Funil de ativação</p>
            <h3 className="text-lg font-bold font-display text-foreground mt-0.5">Da base mapeada ao creator pago</h3>
          </div>
          <button onClick={() => onNavigate('campaigns')} className="text-xs font-bold text-primary hover:underline flex items-center">
            <span>Ver pipeline detalhado</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {[
            ['1. Base mapeada', funnel.base, 'creators na base'],
            ['2. Qualificados', funnel.qualified, 'faixa A + B'],
            ['3. No squad', funnel.inSquad, 'aprovados em campanha'],
            ['4. Produto enviado', funnel.shipped, 'envio em diante'],
            ['5. Conteúdo aprovado', funnel.approved, 'aprovado/publicado'],
            ['6. Concluído e pago', funnel.completed, 'cachê liberado'],
          ].map(([l, v, sub]) => (
            <div key={l as string} className="p-3 rounded-xl bg-muted/40 border border-border text-center space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground">{l}</span>
              <p className="text-lg font-extrabold text-foreground">{(v as number).toLocaleString('pt-BR')}</p>
              <span className="text-[10px] text-muted-foreground block">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Tabela de Top Creators (Ordenados por Pontuação Operacional) */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Ranking de Qualificação</p>
            <h3 className="text-lg font-bold font-display text-foreground mt-0.5">
              Top Creators por Pontuação Operacional
            </h3>
          </div>
          <button
            onClick={() => onNavigate('creators')}
            className="text-xs font-bold text-primary hover:underline flex items-center"
          >
            <span>Ver todos os {creators.length} creators</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3 pl-1">Creator</th>
                <th className="pb-3 text-center">Pontuação Operacional</th>
                <th className="pb-3 text-right">Seguidores TikTok</th>
                <th className="pb-3 text-center">Engajamento</th>
                <th className="pb-3 text-left">Nicho Principal</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right pr-1">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {topCreators.map((creator, i) => (
                <tr key={creator.id} className="hover:bg-muted/40 transition-colors group">
                  
                  {/* Creator */}
                  <td className="py-3 pl-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-[11px] font-bold text-muted-foreground w-4">#{i + 1}</span>
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20">
                        {creator.professional_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{creator.professional_name}</p>
                        <p className="text-[11px] text-muted-foreground font-medium truncate"><TikTokLink handle={creator.tiktok} /></p>
                      </div>
                    </div>
                  </td>

                  {/* Pontuação Operacional */}
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Award className="w-3 h-3 mr-1" />
                      {creator.operational_score || 85} / 100
                    </span>
                  </td>

                  {/* Seguidores */}
                  <td className="py-3 text-right font-semibold text-foreground">
                    {(creator.tiktok_followers || 0).toLocaleString('pt-BR')}
                  </td>

                  {/* Engajamento */}
                  <td className="py-3 text-center font-semibold text-emerald-600">
                    {creator.engagement_rate || 4.2}%
                  </td>

                  {/* Nicho */}
                  <td className="py-3">
                    <Badge variant="secondary" size="sm">
                      {creator.specialties?.[0] || 'Bem-estar'}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td className="py-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      Qualificado
                    </span>
                  </td>

                  {/* Ação */}
                  <td className="py-3 text-right pr-1">
                    <button
                      onClick={() => onNavigate('creators')}
                      className="px-2.5 py-1 rounded-lg bg-card hover:bg-primary hover:text-black border border-border text-[11px] font-bold transition-all"
                    >
                      Ver Perfil
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
