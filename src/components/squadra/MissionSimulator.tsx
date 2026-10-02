import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { 
  Users, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Video, 
  TrendingUp, 
  Award, 
  Zap,
  DollarSign
} from 'lucide-react';
import { Button } from '../ui/Button';

interface MissionSimulatorProps {
  onApplyBudget?: (params: {
    pricePerVideo: number;
    creatorCount: number;
    totalBudget: number;
    recommendedRank: string;
  }) => void;
  className?: string;
}

export const MissionSimulator: React.FC<MissionSimulatorProps> = ({
  onApplyBudget,
  className = ''
}) => {
  const { creators } = useData();

  // 1. Régua 1: Investimento por vídeo/creator (R$ 60 a R$ 1.000)
  const [investmentPerVideo, setInvestmentPerVideo] = useState<number>(125);

  // 2. Régua 2: Quantidade de creators por missão (1 a 50)
  const [creatorCount, setCreatorCount] = useState<number>(10);

  // Modo de cobrança: Missão Pontual vs Assinatura Mensal Recorrente
  const [billingCycle, setBillingCycle] = useState<'mission' | 'monthly'>('monthly');

  // Cálculo do total
  const totalAmount = useMemo(() => {
    return investmentPerVideo * creatorCount;
  }, [investmentPerVideo, creatorCount]);

  // Ranking dinâmico da curadoria com base no valor por vídeo
  const rankMeta = useMemo(() => {
    if (investmentPerVideo < 100) {
      return {
        tier: 'Rank C • Micro UGC',
        scoreRange: 'Score 50 a 65',
        badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        textColor: 'text-zinc-400',
        description: 'Creators iniciantes focados em volume de vídeos, unboxing e primeiros reviews de produto.',
        minFollowers: '1k a 10k seguidores',
        estimatedViews: creatorCount * 12000,
      };
    } else if (investmentPerVideo <= 200) {
      return {
        tier: 'Rank B • UGC Prata',
        scoreRange: 'Score 65 a 80',
        badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        textColor: 'text-blue-400',
        description: 'Creators consolidados com boa oratória, iluminação adequada, storytelling e retenção comprovada.',
        minFollowers: '10k a 50k seguidores',
        estimatedViews: creatorCount * 35000,
      };
    } else if (investmentPerVideo <= 400) {
      return {
        tier: 'Rank A • Top Performers (Gold)',
        scoreRange: 'Score 80 a 92',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        textColor: 'text-amber-400',
        description: 'Criadores de alta conversão, autoridade no nicho, especialistas em hooks e vídeos para anúncios pagos (Ad-ready).',
        minFollowers: '50k a 200k seguidores',
        estimatedViews: creatorCount * 95000,
      };
    } else {
      return {
        tier: 'Rank S • Elite / Black Creator',
        scoreRange: 'Score 92 a 100',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        textColor: 'text-emerald-400',
        description: 'Influenciadores e UGCs de alto impacto, especialistas em Live Commerce de vendas, presença de palco e autoridade nacional.',
        minFollowers: '200k+ seguidores',
        estimatedViews: creatorCount * 280000,
      };
    }
  }, [investmentPerVideo, creatorCount]);

  // Contagem de creators elegíveis na base real
  const eligibleCreatorsCount = useMemo(() => {
    return creators.length;
  }, [creators]);

  const handleAction = () => {
    if (onApplyBudget) {
      onApplyBudget({
        pricePerVideo: investmentPerVideo,
        creatorCount,
        totalBudget: totalAmount,
        recommendedRank: rankMeta.tier
      });
    } else {
      alert(`Simulação gravada: ${creatorCount} Creators no ${rankMeta.tier} por R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-[#0a0a0c] border border-zinc-800 p-6 sm:p-8 text-white shadow-2xl ${className}`}>
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header com Missões e subtítulo fiel ao print */}
      <div className="relative z-10 text-center max-w-xl mx-auto space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Curadoria Ativa Squadra • Modelo de Assinatura & Missão</span>
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
          Missões
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Simule abaixo o quanto deseja pagar por vídeo e quantos creators precisa por missão
        </p>

        {/* Toggle Missão Pontual vs Assinatura Mensal */}
        <div className="inline-flex p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-semibold mt-3">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              billingCycle === 'monthly'
                ? 'bg-primary text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Assinatura Mensal (Squad Contínuo)
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('mission')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              billingCycle === 'mission'
                ? 'bg-primary text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Missão Pontual
          </button>
        </div>
      </div>

      {/* Sliders Container */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-8 bg-zinc-950/70 border border-zinc-850 p-6 sm:p-7 rounded-2xl backdrop-blur-md">
        
        {/* Régua 1: Investimento por Vídeo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-left">
            <span className="text-sm sm:text-base font-bold text-zinc-300">
              Investimento por vídeo:
            </span>
            <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
              R$ {investmentPerVideo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min={60}
              max={800}
              step={15}
              value={investmentPerVideo}
              onChange={(e) => setInvestmentPerVideo(Number(e.target.value))}
              className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
            <span>R$ 60,00 (Micro)</span>
            <span>R$ 200,00 (Prata)</span>
            <span>R$ 400,00 (Ouro)</span>
            <span>R$ 800,00+ (Elite)</span>
          </div>

          {/* Feedback do Rank Selecionado */}
          <div className="mt-2 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${rankMeta.badgeColor}`}>
                  {rankMeta.tier}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">{rankMeta.scoreRange}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-snug">
                {rankMeta.description}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-zinc-500 block">Alcance típico:</span>
              <span className="text-xs font-bold text-zinc-300 font-mono">{rankMeta.minFollowers}</span>
            </div>
          </div>
        </div>

        {/* Régua 2: Quantidade de Creators */}
        <div className="space-y-3 pt-2 border-t border-zinc-850">
          <div className="flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-base font-bold text-zinc-300">
                Creators por missão:
              </span>
              <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
                {creatorCount}
              </span>
            </div>

            {/* Ícones de Creators que crescem visualmente com a régua */}
            <div className="flex items-center space-x-0.5 text-emerald-400 max-w-[200px] overflow-hidden justify-end">
              {Array.from({ length: Math.min(creatorCount, 16) }).map((_, i) => (
                <span key={i} className="text-sm leading-none select-none animate-in zoom-in-75">
                  👤
                </span>
              ))}
              {creatorCount > 16 && (
                <span className="text-[11px] font-bold font-mono pl-1 text-emerald-400">
                  +{creatorCount - 16}
                </span>
              )}
            </div>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={creatorCount}
              onChange={(e) => setCreatorCount(Number(e.target.value))}
              className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
            <span>1 Creator (Teste)</span>
            <span>10 Creators (Squad Padrão)</span>
            <span>25 Creators (Escala)</span>
            <span>50 Creators (Massivo)</span>
          </div>
        </div>

        {/* Card de Total com Estilo Fiel ao Print do Cliente */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-zinc-800">
          
          <div className="space-y-1 text-left">
            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 block">
              {billingCycle === 'monthly' ? 'Investimento Mensal da Assinatura' : 'Orçamento Total da Missão'}
            </span>
            <div className="inline-block px-5 py-2 rounded-xl bg-zinc-900 border-2 border-emerald-500/80 shadow-lg shadow-emerald-500/10">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                Total: R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {billingCycle === 'monthly' && (
              <span className="text-[10px] text-zinc-500 block pl-1">
                Inclui curadoria, substituição de creator e suporte de entrega.
              </span>
            )}
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <Button
              onClick={handleAction}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span>{billingCycle === 'monthly' ? 'Contratar Squad Mensal' : 'Criar Esta Missão'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </Button>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Curadoria ativa + garantia de entrega
            </span>
          </div>

        </div>

      </div>

      {/* Grid Informativo dos Benefícios da Curadoria */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mt-6 text-left">
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Ranking Verificado</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            Nossa curadoria audita seguidores, engajamento e histórico real antes de liberar a vaga.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
            <Video className="w-4 h-4 text-primary" />
            <span>{creatorCount} Vídeos Garantidos</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            Acompanhamento logístico de envio de amostras até a aprovação final do conteúdo.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>~{rankMeta.estimatedViews.toLocaleString('pt-BR')} Views</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            Alcance projetado somando a audiência curada dos {creatorCount} criadores contratados.
          </p>
        </div>
      </div>

    </div>
  );
};
