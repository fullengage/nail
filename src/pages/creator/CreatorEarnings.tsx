import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatCurrency, formatDate, formatNumber } from '../../lib/utils';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  Sparkles,
  MousePointerClick,
  ShoppingBag
} from 'lucide-react';
import { MOCK_AFFILIATES } from '../../data/mockData';
import confetti from 'canvas-confetti';

export const CreatorEarnings: React.FC = () => {
  const { earnings, requestPixWithdrawal } = useData();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [pixKey, setPixKey] = useState('camila@example.com');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const creatorId = 'creator-1';
  const myEarnings = earnings.filter((e) => e.creator_id === creatorId);

  const totalEarned = myEarnings.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingEarned = myEarnings
    .filter((e) => e.status === 'pending')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const availableEarned = myEarnings
    .filter((e) => e.status === 'approved')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    requestPixWithdrawal(creatorId, pixKey);
    setWithdrawSuccess(true);
    confetti({ particleCount: 80, spread: 60 });
    setTimeout(() => {
      setWithdrawSuccess(false);
      setIsWithdrawModalOpen(false);
    }, 2000);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="gold">Financeiro & Monetização</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
            Extrato de Ganhos & Afiliadas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Acompanhe o faturamento de suas campanhas e comissões geradas por links de indicação.
          </p>
        </div>

        <Button
          onClick={() => setIsWithdrawModalOpen(true)}
          disabled={availableEarned <= 0}
          className="shadow-lg shadow-primary/20"
        >
          <DollarSign className="w-4 h-4 mr-1.5" />
          Solicitar Saque PIX ({formatCurrency(availableEarned)})
        </Button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card variant="elevated" className="p-6 space-y-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Disponível para Saque</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{formatCurrency(availableEarned)}</p>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Transferência em até 24h úteis
          </p>
        </Card>

        <Card variant="elevated" className="p-6 space-y-2 border-amber-500/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Cachês Pendentes</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{formatCurrency(pendingEarned)}</p>
          <p className="text-xs text-muted-foreground">Liberado após aprovação do post</p>
        </Card>

        <Card variant="elevated" className="p-6 space-y-2 border-primary/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Ganhos Históricos</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{formatCurrency(totalEarned)}</p>
          <p className="text-xs text-primary font-semibold">Total acumulado na plataforma</p>
        </Card>
      </div>

      {/* Affiliate Program Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-foreground">
              Seus Links de Afiliada & Cupons de Desconto
            </h2>
            <p className="text-xs text-muted-foreground">
              Compartilhe com suas seguidoras e alunas para ganhar comissões automáticas em cada compra.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_AFFILIATES.map((aff) => (
            <Card key={aff.id} variant="elevated" className="p-5 border-border/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <Badge variant="gold" size="sm">Cupom: {aff.code}</Badge>
                  <h4 className="font-bold text-sm text-foreground mt-1">Top Coat Diamante Glass 15ml</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground font-semibold">Comissão</span>
                  <p className="text-sm font-extrabold text-primary">{aff.commission_percentage}% por venda</p>
                </div>
              </div>

              {/* Link Box */}
              <div className="flex items-center space-x-2 bg-muted/60 p-2.5 rounded-xl border border-border">
                <input
                  type="text"
                  readOnly
                  value={aff.url}
                  className="bg-transparent text-xs font-mono text-foreground flex-1 focus:outline-none truncate"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aff.url);
                    alert('Link de afiliada copiado!');
                  }}
                  className="px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copiar
                </button>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 rounded-lg bg-muted/40">
                  <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                    <MousePointerClick className="w-3 h-3 text-primary" /> Cliques
                  </span>
                  <p className="font-bold text-foreground mt-0.5">{formatNumber(aff.clicks)}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/40">
                  <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-emerald-600" /> Pedidos
                  </span>
                  <p className="font-bold text-foreground mt-0.5">{aff.orders}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300">Lucro Gerado</span>
                  <p className="font-bold text-emerald-600 mt-0.5">{formatCurrency(aff.commission_generated)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Earnings History Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-display text-foreground">
          Histórico Detalhado de Lançamentos
        </h2>

        <Card variant="elevated" className="p-0 overflow-hidden border-border/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Data</th>
                  <th className="p-3.5">Origem / Campanha</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {myEarnings.map((earn) => (
                  <tr key={earn.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 font-medium text-muted-foreground">{formatDate(earn.created_at)}</td>
                    <td className="p-3.5 font-bold text-foreground">{earn.campaign_title || 'Comissão de Afiliada'}</td>
                    <td className="p-3.5">
                      <span className="capitalize">{earn.earning_type === 'campaign' ? 'Cachê de Vídeo' : earn.earning_type}</span>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          earn.status === 'paid'
                            ? 'success'
                            : earn.status === 'approved'
                            ? 'gold'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {earn.status === 'paid' ? 'Pago' : earn.status === 'approved' ? 'Disponível' : 'Pendente'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-foreground">
                      {formatCurrency(earn.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Withdraw Modal */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title={withdrawSuccess ? undefined : 'Solicitar Saque PIX'}
        description={withdrawSuccess ? undefined : `Valor disponível: ${formatCurrency(availableEarned)}`}
      >
        {withdrawSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold font-display text-foreground">Saque Solicitado!</h3>
            <p className="text-xs text-muted-foreground">
              O valor de {formatCurrency(availableEarned)} será transferido para sua chave PIX em até 24 horas úteis.
            </p>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-4">
            <Input
              label="Chave PIX (E-mail, CPF, Telefone ou Aleatória)"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              required
            />
            <div className="p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground space-y-1">
              <p>• Sem taxa de transferência no plano Nail Creator PRO.</p>
              <p>• Pagamentos processados de segunda a sexta.</p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsWithdrawModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Confirmar Saque</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
