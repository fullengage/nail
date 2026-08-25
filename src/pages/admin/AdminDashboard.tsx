import React from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatNumber } from '../../lib/utils';
import {
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  DollarSign
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { creators, brands, campaigns, applications, submissions } = useData();

  const totalGMV = campaigns.reduce((acc, curr) => acc + curr.budget, 0);
  const platformFee = totalGMV * 0.15; // 15% taxa da plataforma

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900/20 via-primary/10 to-transparent border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Administração Central Nail Club Pro
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
            Painel Executivo da Plataforma
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Visão consolidada de crescimento de creators, marcas parceiras, liquidação financeira e moderação de campanhas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => onNavigate('admin-moderation-campaigns')}>
            Moderar Campanhas
          </Button>
          <Button variant="outline" onClick={() => onNavigate('admin-finance')}>
            Financeiro & Repasses
          </Button>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="p-5 space-y-2 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Creators Cadastradas</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{creators.length + 840}</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> +18% este mês
          </p>
        </Card>

        <Card variant="elevated" className="p-5 space-y-2 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Marcas Ativas</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{brands.length + 24}</p>
          <p className="text-[11px] text-muted-foreground">Empresas do setor nail</p>
        </Card>

        <Card variant="elevated" className="p-5 space-y-2 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Volume Movimentado</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{formatCurrency(totalGMV + 145000)}</p>
          <p className="text-[11px] text-muted-foreground">GMV Total de campanhas</p>
        </Card>

        <Card variant="elevated" className="p-5 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Receita da Plataforma</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{formatCurrency(platformFee + 21750)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Take rate médio 15%</p>
        </Card>
      </div>

      {/* Moderation Fast Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="elevated" className="p-6 space-y-4 border-border/80">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-bold text-base font-display text-foreground">
              Creators em Análise de Verificação
            </h3>
            <Badge variant="gold" size="sm">3 Pendentes</Badge>
          </div>

          <div className="space-y-3">
            {creators.slice(0, 3).map((c) => (
              <div key={c.id} className="p-3 bg-muted/40 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary font-bold flex items-center justify-center">
                    💅
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{c.professional_name}</p>
                    <p className="text-muted-foreground">{c.city}/{c.state} • {formatNumber(c.instagram_followers)} seg.</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => alert(`Creator ${c.professional_name} aprovada!`)}>
                  Verificar
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="elevated" className="p-6 space-y-4 border-border/80">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-bold text-base font-display text-foreground">
              Campanhas em Moderação
            </h3>
            <Badge variant="purple" size="sm">Revisão Rápida</Badge>
          </div>

          <div className="space-y-3">
            {campaigns.slice(0, 3).map((camp) => (
              <div key={camp.id} className="p-3 bg-muted/40 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-foreground truncate max-w-[220px]">{camp.title}</p>
                  <p className="text-muted-foreground">Orçamento: {formatCurrency(camp.budget)}</p>
                </div>
                <Badge variant="success" size="sm">✓ Aprovada</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
