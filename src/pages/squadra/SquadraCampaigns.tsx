import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Campaign } from '../../types/database';
import { SquadraCampaignDetail } from './SquadraCampaignDetail';
import {
  Briefcase,
  Plus,
  Calendar,
  Users,
  DollarSign,
  Layers,
  ArrowRight,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { MissionSimulator } from '../../components/squadra/MissionSimulator';

interface SquadraCampaignsProps {
  onNavigatePublicApply?: (slug: string) => void;
}

export const SquadraCampaigns: React.FC<SquadraCampaignsProps> = ({ onNavigatePublicApply }) => {
  const { campaigns, createCampaign } = useData();

  // Campanha selecionada para detalhe (/campaigns/:id)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Filtro de status
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'draft'>('all');

  // Wizard de criação em etapas
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    title: '',
    slug: '',
    description: '',
    objective: '',
    campaign_type: 'ugc' as const,
    cover_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800',
    creator_slots: 20,
    budget: 30000,
    commission_type: 'fixed' as const,
    commission_value: 400,
    requirements_text: 'Mínimo 5.000 seguidores no TikTok ou Instagram. Boa iluminação e foco em rotina ou beleza.',
    deliverables_text: '1x Vídeo no TikTok ou Reels + 3x Stories com link rastreado e cupom.',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    application_deadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  });

  const filteredCampaigns = campaigns.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const handleFinishWizard = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaign({
      ...wizardData,
      brand_id: 'brand-1',
      slug: wizardData.slug || wizardData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      status: 'open',
      occupied_slots: 0
    });
    setIsWizardOpen(false);
    setWizardStep(1);
  };

  // Se houver uma campanha selecionada, renderiza o detalhe com as 5 abas
  if (selectedCampaignId) {
    return (
      <SquadraCampaignDetail
        campaignId={selectedCampaignId}
        onBack={() => setSelectedCampaignId(null)}
        onNavigatePublicApply={onNavigatePublicApply}
      />
    );
  }

  // Toggle do simulador de missões
  const [showSimulator, setShowSimulator] = useState(true);

  const handleApplySimulator = (params: {
    pricePerVideo: number;
    creatorCount: number;
    totalBudget: number;
    recommendedRank: string;
  }) => {
    setWizardData(prev => ({
      ...prev,
      commission_value: params.pricePerVideo,
      creator_slots: params.creatorCount,
      budget: params.totalBudget,
      title: `Squad UGC ${params.recommendedRank.split('•')[0].trim()} (${params.creatorCount} Creators)`,
      requirements_text: `Curadoria Squadra: Seleção exclusiva de criadores com ${params.recommendedRank}. Mínimo 10.000 seguidores e engajamento acima de 3%.`
    }));
    setIsWizardOpen(true);
    setWizardStep(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            Campanhas & Squads
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gestão de campanhas ativas, alocação de squads e pipeline de produção UGC com curadoria.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            onClick={() => setShowSimulator(!showSimulator)}
            className="text-xs font-bold border-zinc-700 hover:bg-muted"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            {showSimulator ? 'Ocultar Simulador' : 'Simulador de Missões'}
          </Button>

          <Button onClick={() => setIsWizardOpen(true)} className="flex items-center space-x-1.5 shadow-md shadow-primary/20">
            <Plus className="w-4 h-4" />
            <span>Criar Campanha</span>
          </Button>
        </div>
      </div>

      {/* 1.1. Simulador de Missões com 2 Réguas (Fiel ao print do cliente) */}
      {showSimulator && (
        <div className="transition-all animate-in fade-in zoom-in-95">
          <MissionSimulator onApplyBudget={handleApplySimulator} />
        </div>
      )}

      {/* 2. Filtros de Status */}
      <div className="flex border-b border-border space-x-2 pb-px overflow-x-auto">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
            statusFilter === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Todas ({campaigns.length})
        </button>
        <button
          onClick={() => setStatusFilter('open')}
          className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
            statusFilter === 'open' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Abertas ({campaigns.filter(c => c.status === 'open').length})
        </button>
        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
            statusFilter === 'in_progress' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Em Produção ({campaigns.filter(c => c.status === 'in_progress').length})
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
            statusFilter === 'completed' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Concluídas ({campaigns.filter(c => c.status === 'completed').length})
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
            statusFilter === 'draft' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Rascunhos ({campaigns.filter(c => c.status === 'draft').length})
        </button>
      </div>

      {/* 3. Grid de Cards de Campanhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((camp) => (
          <div
            key={camp.id}
            onClick={() => setSelectedCampaignId(camp.id)}
            className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4"
          >
            <div className="space-y-3">
              
              <div className="relative rounded-xl overflow-hidden aspect-video bg-muted border border-border">
                <img
                  src={camp.cover_url}
                  alt={camp.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                />
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${
                  camp.status === 'open'
                    ? 'bg-emerald-500 text-white'
                    : camp.status === 'in_progress'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  {camp.status === 'open' ? 'Aberta' : camp.status === 'in_progress' ? 'Em Andamento' : camp.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {camp.campaign_type.toUpperCase()}
                </span>
                <h3 className="text-base font-bold font-display text-foreground group-hover:text-primary transition-colors line-clamp-1 mt-0.5">
                  {camp.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {camp.description}
                </p>
              </div>

            </div>

            <div className="space-y-3 pt-3 border-t border-border/60">
              
              {/* Barra de Ocupação do Squad */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-primary" /> Vagas no Squad
                  </span>
                  <span className="text-foreground">
                    {camp.occupied_slots || 0} / {camp.creator_slots}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((camp.occupied_slots || 0) / camp.creator_slots) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Orçamento e Ação */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Orçamento</span>
                  <span className="font-bold text-foreground">
                    R$ {camp.budget.toLocaleString('pt-BR')}
                  </span>
                </div>

                <span className="text-primary font-bold text-xs group-hover:translate-x-1 transition-transform flex items-center">
                  <span>Abrir Squad</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* 4. Wizard de Criação em Etapas */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Criação em Etapas</span>
                <h3 className="font-bold font-display text-foreground text-lg">Nova Campanha UGC</h3>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Visual */}
            <div className="flex items-center justify-between text-xs font-bold border-b border-border pb-3">
              <span className={wizardStep === 1 ? 'text-primary' : 'text-muted-foreground'}>1. Dados Básicos</span>
              <span>→</span>
              <span className={wizardStep === 2 ? 'text-primary' : 'text-muted-foreground'}>2. Briefing</span>
              <span>→</span>
              <span className={wizardStep === 3 ? 'text-primary' : 'text-muted-foreground'}>3. Squad & Vagas</span>
              <span>→</span>
              <span className={wizardStep === 4 ? 'text-primary' : 'text-muted-foreground'}>4. Revisão</span>
            </div>

            <form onSubmit={handleFinishWizard} className="space-y-4 text-xs">
              
              {/* ETAPA 1: Dados Básicos */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Título da Campanha *</label>
                    <input
                      type="text"
                      required
                      value={wizardData.title}
                      onChange={(e) => setWizardData({ ...wizardData, title: e.target.value })}
                      placeholder="Ex: Lançamento Gel Diamante"
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Objetivo Principal *</label>
                    <input
                      type="text"
                      required
                      value={wizardData.objective}
                      onChange={(e) => setWizardData({ ...wizardData, objective: e.target.value })}
                      placeholder="Ex: Gerar 50 vídeos de UGC e 500 conversões"
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Tipo de Campanha</label>
                      <select
                        value={wizardData.campaign_type}
                        onChange={(e) => setWizardData({ ...wizardData, campaign_type: e.target.value as any })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                      >
                        <option value="ugc">UGC (Reels & TikTok)</option>
                        <option value="product_seeding">Product Seeding</option>
                        <option value="paid_content">Paid Content</option>
                        <option value="live_commerce">Live Commerce</option>
                        <option value="affiliate">Afiliados & Vendas</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Orçamento Estimado (R$)</label>
                      <input
                        type="number"
                        value={wizardData.budget}
                        onChange={(e) => setWizardData({ ...wizardData, budget: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 2: Briefing */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Descrição do Briefing *</label>
                    <textarea
                      rows={3}
                      required
                      value={wizardData.description}
                      onChange={(e) => setWizardData({ ...wizardData, description: e.target.value })}
                      placeholder="Instruções completas para os creators..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Entregáveis Obrigatórios</label>
                    <textarea
                      rows={2}
                      value={wizardData.deliverables_text}
                      onChange={(e) => setWizardData({ ...wizardData, deliverables_text: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Requisitos de Creator</label>
                    <textarea
                      rows={2}
                      value={wizardData.requirements_text}
                      onChange={(e) => setWizardData({ ...wizardData, requirements_text: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                    />
                  </div>
                </div>
              )}

              {/* ETAPA 3: Squad & Vagas */}
              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Número de Vagas no Squad</label>
                      <input
                        type="number"
                        value={wizardData.creator_slots}
                        onChange={(e) => setWizardData({ ...wizardData, creator_slots: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Cachê Fixo por Creator (R$)</label>
                      <input
                        type="number"
                        value={wizardData.commission_value}
                        onChange={(e) => setWizardData({ ...wizardData, commission_value: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Início da Campanha</label>
                      <input
                        type="date"
                        value={wizardData.start_date}
                        onChange={(e) => setWizardData({ ...wizardData, start_date: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Fim da Campanha</label>
                      <input
                        type="date"
                        value={wizardData.end_date}
                        onChange={(e) => setWizardData({ ...wizardData, end_date: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 4: Revisão */}
              {wizardStep === 4 && (
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Título:</span>
                    <span className="font-bold text-foreground">{wizardData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-bold text-foreground">{wizardData.campaign_type.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vagas:</span>
                    <span className="font-bold text-foreground">{wizardData.creator_slots} creators</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orçamento:</span>
                    <span className="font-bold text-foreground">R$ {wizardData.budget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cachê / Creator:</span>
                    <span className="font-bold text-emerald-600">R$ {wizardData.commission_value}</span>
                  </div>
                </div>
              )}

              {/* Botões do Wizard */}
              <div className="flex justify-between pt-3 border-t border-border">
                {wizardStep > 1 ? (
                  <Button type="button" variant="secondary" onClick={() => setWizardStep(s => s - 1)}>
                    Voltar
                  </Button>
                ) : (
                  <Button type="button" variant="secondary" onClick={() => setIsWizardOpen(false)}>
                    Cancelar
                  </Button>
                )}

                {wizardStep < 4 ? (
                  <Button type="button" onClick={() => setWizardStep(s => s + 1)}>
                    Avançar
                  </Button>
                ) : (
                  <Button type="submit">
                    Publicar Campanha
                  </Button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
