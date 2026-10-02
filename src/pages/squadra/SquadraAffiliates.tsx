import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { SQUADRA_AFFILIATES } from '../../data/squadraData';
import { AffiliateLink } from '../../types/database';
import { TikTokLink, tiktokUrl } from '../../components/ui/TikTokLink';
import {
  DollarSign,
  TrendingUp,
  Award,
  Link,
  Copy,
  CheckCircle2,
  ExternalLink,
  Download,
  Filter
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

// @ do TikTok do creator → https://www.tiktok.com/@handle
const affTiktok = (aff: AffiliateLink) => tiktokUrl(aff.creator?.tiktok);

export const SquadraAffiliates: React.FC = () => {
  const [affiliatesList, setAffiliatesList] = useState(SQUADRA_AFFILIATES);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const totalGmv = affiliatesList.reduce((acc, a) => acc + a.revenue, 0);
  const totalCommission = affiliatesList.reduce((acc, a) => acc + a.commission_generated, 0);
  const totalOrders = affiliatesList.reduce((acc, a) => acc + a.orders, 0);

  // Ordenar por faturamento GMV para o ranking
  const rankedAffiliates = [...affiliatesList].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            Afiliados & Creator Commerce
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Rastreamento de vendas por cupom/link exclusivo, repasses comissionados e ranking de conversão.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="secondary" className="flex items-center space-x-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Vendas CSV</span>
          </Button>
        </div>
      </div>

      {/* 2. KPIs Globais de Afiliados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">GMV Gerado (Vendas)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            R$ {totalGmv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-muted-foreground">Atribuído a cupons de creators</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Pedidos</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            {totalOrders} pedidos
          </p>
          <span className="text-[11px] text-muted-foreground">Ticket médio R$ 189,90</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Comissões a Pagar</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-display text-emerald-600">
            R$ {totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-muted-foreground">Média de 12% por transação</span>
        </div>

      </div>

      {/* 3. Ranking & Tabela de Afiliados */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-foreground">Ranking de Afiliados por Vendas</h3>
            <p className="text-xs text-muted-foreground">Links, cupons exclusivos e status de pagamento de comissão.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Posição & Creator</th>
                <th className="pb-3 text-left">Código / Cupom</th>
                <th className="pb-3 text-right">Cliques no Link</th>
                <th className="pb-3 text-right">Pedidos Convertidos</th>
                <th className="pb-3 text-right">GMV Gerado</th>
                <th className="pb-3 text-right">Comissão Total</th>
                <th className="pb-3 text-center">Status Pagamento</th>
                <th className="pb-3 text-right pr-2">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rankedAffiliates.map((aff, i) => (
                <tr key={aff.id} className="hover:bg-muted/40 transition-colors">
                  
                  {/* Pos & Creator */}
                  <td className="py-3 pl-2">
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                        i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{aff.creator?.professional_name || `Creator #${aff.creator_id.replace('creator-', '')}`}</p>
                        <TikTokLink handle={aff.creator?.tiktok} className="text-[11px] text-muted-foreground" />
                      </div>
                    </div>
                  </td>

                  {/* Cupom */}
                  <td className="py-3">
                    <button
                      onClick={() => handleCopy(aff.code)}
                      className="px-2 py-1 bg-muted hover:bg-muted/80 rounded-lg text-xs font-mono font-bold text-primary flex items-center space-x-1"
                      title="Copiar cupom"
                    >
                      <span>{aff.code}</span>
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    </button>
                    {copiedCode === aff.code && (
                      <span className="text-[10px] text-emerald-600 block mt-0.5">Copiado!</span>
                    )}
                  </td>

                  {/* Cliques */}
                  <td className="py-3 text-right text-muted-foreground font-semibold">
                    {aff.clicks}
                  </td>

                  {/* Pedidos */}
                  <td className="py-3 text-right font-semibold text-foreground">
                    {aff.orders}
                  </td>

                  {/* GMV */}
                  <td className="py-3 text-right font-extrabold text-foreground">
                    R$ {aff.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Comissão */}
                  <td className="py-3 text-right font-bold text-emerald-600">
                    R$ {aff.commission_generated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({aff.commission_percentage}%)
                  </td>

                  {/* Status Pagamento */}
                  <td className="py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      i % 2 === 0
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}>
                      {i % 2 === 0 ? 'Pago via PIX' : 'Aprovado'}
                    </span>
                  </td>

                  {/* Ação */}
                  <td className="py-3 text-right pr-2">
                    <a
                      href={affTiktok(aff) || aff.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline font-bold text-[11px] inline-flex items-center"
                    >
                      <span>{affTiktok(aff) ? 'TikTok' : 'Link'}</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
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
