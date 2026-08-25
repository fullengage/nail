import React from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { DollarSign, TrendingUp, ArrowDownToLine, CheckCircle2, ShieldCheck } from 'lucide-react';

export const AdminFinance: React.FC = () => {
  const { campaigns, earnings } = useData();

  const totalVolume = campaigns.reduce((acc, curr) => acc + curr.budget, 0);
  const platformRevenue = totalVolume * 0.15;
  const pendingPayouts = earnings.filter(e => e.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="gold">Gestão Financeira Global</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
          Financeiro, Repasses & Comissões
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Controle central de comissões retidas pela plataforma (15% take rate), liquidação de cachês e transferências PIX.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card variant="elevated" className="p-6 space-y-2 border-emerald-500/30">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Receita Nail Club Pro</span>
          <p className="text-3xl font-extrabold text-emerald-600">{formatCurrency(platformRevenue + 21750)}</p>
          <p className="text-xs text-muted-foreground">Comissão da plataforma sobre GMV</p>
        </Card>

        <Card variant="elevated" className="p-6 space-y-2 border-amber-500/30">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lote PIX Pendente</span>
          <p className="text-3xl font-extrabold text-foreground">{formatCurrency(pendingPayouts + 4200)}</p>
          <p className="text-xs text-amber-600 font-semibold">Aguardando autorização de repasse</p>
        </Card>

        <Card variant="elevated" className="p-6 space-y-2 border-primary/30">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Volume Transacionado (GMV)</span>
          <p className="text-3xl font-extrabold text-foreground">{formatCurrency(totalVolume + 145000)}</p>
          <p className="text-xs text-primary font-semibold">Total movimentado em campanhas</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="p-6 rounded-3xl bg-card border border-border flex items-center justify-between shadow-sm">
        <div>
          <h3 className="text-base font-bold font-display text-foreground">
            Processar Lote de Pagamento Automático PIX
          </h3>
          <p className="text-xs text-muted-foreground">
            Dispara os pagamentos aprovados para todas as Nail Designers com saldo disponível.
          </p>
        </div>
        <Button onClick={() => alert('Lote de pagamentos PIX processado com sucesso!')}>
          <ArrowDownToLine className="w-4 h-4 mr-2" /> Executar Lote PIX
        </Button>
      </div>
    </div>
  );
};
