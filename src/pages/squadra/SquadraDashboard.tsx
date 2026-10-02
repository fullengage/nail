import React from 'react';
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
  const { sourceCounts, creators, campaigns, retailPoints } = useData();

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
            <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Squadra Intelligence</span>
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

      {/* 2. KPIs de Origem da Base (Conforme documento do cliente) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
            Bases Mapeadas por Fonte & PDVs
          </p>
          <span className="text-[11px] text-muted-foreground">Atualizado em tempo real</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* Manicures */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/40 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Base Manicures</span>
              <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display text-foreground mt-2">
              {sourceCounts.manicures.toLocaleString('pt-BR')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center space-x-1">
              <span className="text-emerald-600 font-semibold">+100%</span>
              <span>auditadas no setor</span>
            </p>
          </div>

          {/* TikTok */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/40 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">TikTok Leads</span>
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-black flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display text-foreground mt-2">
              {sourceCounts.tiktok.toLocaleString('pt-BR')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center space-x-1">
              <span className="text-emerald-600 font-semibold">808</span>
              <span>perfis minerados</span>
            </p>
          </div>

          {/* Instagram */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/40 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Instagram UGC</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Instagram className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display text-foreground mt-2">
              {sourceCounts.instagram.toLocaleString('pt-BR')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center space-x-1">
              <span className="text-emerald-600 font-semibold">Qualificados</span>
              <span>para seeding</span>
            </p>
          </div>

          {/* PDVs */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/40 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Rede de PDVs</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display text-foreground mt-2">
              {sourceCounts.retail_points.toLocaleString('pt-BR')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center space-x-1">
              <span className="text-primary font-semibold">{retailPoints.length}</span>
              <span>no catálogo ativo</span>
            </p>
          </div>

          {/* Creators Únicos - DESTAQUE */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-card border-2 border-primary/40 shadow-sm col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">Creators Únicos</span>
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm shadow-primary/30">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display text-foreground mt-2">
              {sourceCounts.unique_creators.toLocaleString('pt-BR')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Deduplicados por @, e-mail e fone
            </p>
          </div>

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

      {/* 3. Métricas Globais de Impacto & Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Views Acumuladas */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Alcance Orgânico</p>
              <h3 className="text-lg font-bold font-display text-foreground flex items-center space-x-2 mt-0.5">
                <span>Evolução de Views UGC (30 Dias)</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> +34.8%
                </span>
              </h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-display text-primary">2.84M</p>
              <p className="text-[11px] text-muted-foreground">views registradas</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_DATA}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DFE82A" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#DFE82A" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  formatter={(val: any) => [`${val.toLocaleString('pt-BR')} views`, 'Alcance']}
                />
                <Area type="monotone" dataKey="views" stroke="#111111" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Vendas & GMV */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Conversão Comercial</p>
              <h3 className="text-lg font-bold font-display text-foreground mt-0.5">GMV Gerado</h3>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-3xl font-bold font-display text-foreground">R$ 258.450</p>
            <p className="text-xs text-muted-foreground">Vendas atribuídas via cupons e links de afiliados</p>
          </div>

          <div className="h-44 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PERFORMANCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }}
                  formatter={(val: any) => [`R$ ${val.toLocaleString('pt-BR')}`, 'GMV']}
                />
                <Bar dataKey="gmv" fill="#DFE82A" stroke="#111111" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Comissões pagas aos creators</span>
            <span className="font-bold text-foreground">R$ 31.014 (12%)</span>
          </div>
        </div>

      </div>

      {/* 4. Funil de Campanha (Pipeline de Conversão) */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Funil de Ativação</p>
            <h3 className="text-lg font-bold font-display text-foreground mt-0.5">
              Da Prospecção à Conversão Final
            </h3>
          </div>
          <button
            onClick={() => onNavigate('campaigns')}
            className="text-xs font-bold text-primary hover:underline flex items-center"
          >
            <span>Ver Pipeline Detalhado</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
          
          <div className="p-3 rounded-xl bg-muted/40 border border-border text-center space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground">1. Descoberta</span>
            <p className="text-lg font-extrabold text-foreground">18.359</p>
            <span className="text-[10px] text-muted-foreground block">Base global</span>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center space-y-1">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">2. Inscrições</span>
            <p className="text-lg font-extrabold text-blue-700 dark:text-blue-300">1.240</p>
            <span className="text-[10px] text-muted-foreground block">Taxa: 6.7%</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center space-y-1">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">3. Triagem</span>
            <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300">480</p>
            <span className="text-[10px] text-muted-foreground block">Score &gt; 70</span>
          </div>

          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center space-y-1">
            <span className="text-[11px] font-bold text-primary">4. No Squad</span>
            <p className="text-lg font-extrabold text-primary">180</p>
            <span className="text-[10px] text-muted-foreground block">Selecionados</span>
          </div>

          <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 text-center space-y-1">
            <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">5. Envios</span>
            <p className="text-lg font-extrabold text-orange-700 dark:text-orange-300">165</p>
            <span className="text-[10px] text-muted-foreground block">Com rastreio</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">6. Aprovados</span>
            <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">148</p>
            <span className="text-[10px] text-muted-foreground block">UGCs no ar</span>
          </div>

          <div className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/20 text-center space-y-1">
            <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400">7. Pedidos</span>
            <p className="text-lg font-extrabold text-pink-700 dark:text-pink-300">3.420</p>
            <span className="text-[10px] text-muted-foreground block">Conversões</span>
          </div>

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
