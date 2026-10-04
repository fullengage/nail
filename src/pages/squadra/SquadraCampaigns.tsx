import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Campaign, CampaignType } from '../../types/database';
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
  Sparkles,
  Trash2
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { MissionSimulator } from '../../components/squadra/MissionSimulator';

// Tipos de campanha em linguagem simples, com entregas e perfil sugeridos
const CAMPAIGN_TYPES: Record<CampaignType, { label: string; hint: string; deliverables: string; requirements: string; fee: number }> = {
  live_commerce: {
    label: 'Live de vendas',
    hint: 'Creators vendem seu produto ao vivo (TikTok Shop / Instagram).',
    deliverables: '1 live de no mínimo 1h com o produto no carrinho e cupom exclusivo, + 3 cortes da live para anúncio.',
    requirements: 'Creators que já fazem live e têm audiência no nicho do produto.',
    fee: 300,
  },
  ugc: {
    label: 'Vídeos UGC',
    hint: 'Vídeos curtos (Reels/TikTok) para postar e usar em anúncios.',
    deliverables: '2 vídeos verticais de 30 a 60s mostrando o produto em uso.',
    requirements: 'Boa iluminação, áudio limpo e conteúdo no nicho do produto.',
    fee: 150,
  },
  product_seeding: {
    label: 'Envio de produto (seeding)',
    hint: 'Você envia o produto; o creator testa e posta mostrando o uso.',
    deliverables: '1 post ou sequência de stories com o produto em uso.',
    requirements: 'Creators do nicho com audiência engajada.',
    fee: 0,
  },
  affiliate: {
    label: 'Afiliados',
    hint: 'O creator ganha comissão por venda com link ou cupom próprio.',
    deliverables: 'Divulgação durante o período com link ou cupom rastreado.',
    requirements: 'Creators com histórico de vendas ou audiência que compra.',
    fee: 0,
  },
  paid_content: {
    label: 'Publicidade paga',
    hint: 'Post patrocinado no perfil do creator, com roteiro aprovado.',
    deliverables: '1 Reels/TikTok publicado no perfil + 3 stories com link.',
    requirements: 'Perfil com audiência alinhada ao público da marca.',
    fee: 500,
  },
};

const RIGHTS_OPTIONS = ['Sem uso em anúncios', '3 meses', '6 meses', '12 meses'];
const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

interface SquadraCampaignsProps {
  onNavigatePublicApply?: (slug: string) => void;
}

export const SquadraCampaigns: React.FC<SquadraCampaignsProps> = ({ onNavigatePublicApply }) => {
  const { campaigns, createCampaign, deleteCampaign } = useData();

  // Campanha selecionada para detalhe (/campaigns/:id)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(() => {
    // vindo de "Criar Squad" na tela de Creators: abre a campanha direto
    const id = sessionStorage.getItem('squadra_open_campaign');
    if (id) sessionStorage.removeItem('squadra_open_campaign');
    return id;
  });

  // Filtro de status
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'draft'>('all');

  // Wizard de criação em etapas
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const emptyWizard = () => ({
    title: '',
    slug: '',
    description: '',
    objective: '',
    campaign_type: 'live_commerce' as CampaignType,
    cover_url: '',
    creator_slots: 10,
    budget: 0,
    commission_type: 'fixed' as const,
    commission_value: CAMPAIGN_TYPES.live_commerce.fee,
    requirements_text: CAMPAIGN_TYPES.live_commerce.requirements,
    deliverables_text: CAMPAIGN_TYPES.live_commerce.deliverables,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    application_deadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    // briefing simples (máx. 3 instruções) + marcação + direito de uso
    hashtag: '',
    coupon: '',
    usage_rights: '6 meses',
  });
  const [wizardData, setWizardData] = useState(emptyWizard);
  // orçamento = vagas × cachê: sempre consistente, nada digitado à parte
  const wizardBudget = (wizardData.creator_slots || 0) * (wizardData.commission_value || 0);

  const filteredCampaigns = campaigns.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  // validação por passo: só avança com o essencial preenchido
  const stepError = (step: number): string | null => {
    if (step === 1) {
      if (wizardData.title.trim().length < 3) return 'Dê um nome à campanha.';
      if (wizardData.objective.trim().length < 3) return 'Escreva um objetivo que dê para medir (ex.: vender 300 kits em 30 dias).';
    }
    if (step === 2) {
      if (!wizardData.creator_slots || wizardData.creator_slots < 1) return 'Informe quantos creators você quer no squad.';
      if (wizardData.commission_value < 0) return 'O cachê não pode ser negativo.';
      if (wizardData.end_date < wizardData.start_date) return 'A data de fim precisa ser depois do início.';
    }
    if (step === 3 && wizardData.description.trim().length < 10) return 'Escreva o que o creator deve mostrar ou falar.';
    return null;
  };
  const [wizardTried, setWizardTried] = useState(false);
  const goNext = () => {
    setWizardTried(true);
    if (!stepError(wizardStep)) {
      setWizardTried(false);
      setWizardStep(st => st + 1);
    }
  };

  const closeWizard = () => {
    setIsWizardOpen(false);
    setWizardStep(1);
    setWizardTried(false);
    setWizardData(emptyWizard());
  };

  const [publishing, setPublishing] = useState(false);
  const handleFinishWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardTried(true);
    if (stepError(3) || publishing) return;
    setPublishing(true);
    const { hashtag, coupon, usage_rights, ...camp } = wizardData;
    const marcacao = [hashtag && `Hashtag: ${hashtag.startsWith('#') ? hashtag : '#' + hashtag}`, coupon && `Cupom: ${coupon.toUpperCase()}`].filter(Boolean).join(' · ');
    const id = await createCampaign({
      ...camp,
      // briefing em até 3 instruções, como recomendam os guias de UGC
      deliverables_text: [camp.deliverables_text, marcacao, `Direito de uso em anúncios: ${usage_rights}`].filter(Boolean).join('\n'),
      budget: wizardBudget,
      brand_id: 'brand-1',
      slug: camp.slug || camp.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      status: 'open',
      occupied_slots: 0
    });
    setPublishing(false);
    closeWizard();
    // abre a campanha recém-criada: o próximo passo (montar o squad) aparece lá
    setSelectedCampaignId(id);
  };

  // Toggle do simulador de missões (hooks antes de qualquer return)
  const [showSimulator, setShowSimulator] = useState(false);

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
      title: prev.title || `Squad ${params.recommendedRank.split('•')[0].trim()} (${params.creatorCount} creators)`,
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
            {showSimulator ? 'Fechar simulador de preço' : 'Simular preço'}
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

      {/* 3. Grid de Cards de Campanhas ou Empty State */}
      {filteredCampaigns.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-dashed border-border flex flex-col items-center justify-center max-w-lg mx-auto my-8 space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold font-display text-foreground">
              {statusFilter === 'all'
                ? 'Nenhuma campanha criada ainda'
                : `Nenhuma campanha com status "${statusFilter === 'open' ? 'Aberta' : statusFilter === 'in_progress' ? 'Em Produção' : statusFilter === 'completed' ? 'Concluída' : 'Rascunho'}"`}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {statusFilter === 'all'
                ? 'Sua conta está limpa e pronta para começar. Crie sua primeira campanha para recrutar creators qualificados e gerenciar squads.'
                : 'Alterne o filtro de status acima ou crie uma nova campanha.'}
            </p>
          </div>
          <Button
            onClick={() => {
              setWizardData(emptyWizard());
              setWizardStep(1);
              setIsWizardOpen(true);
            }}
            className="mt-2 bg-primary text-black font-bold border-2 border-black rounded-full px-5 py-2 hover:bg-primary/90 shadow-md flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Minha Primeira Campanha</span>
          </Button>
        </div>
      ) : (
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
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Deseja excluir a campanha "${camp.title}"?`)) {
                          deleteCampaign(camp.id);
                        }
                      }}
                      title="Excluir campanha"
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
      )}

      {/* 4. Assistente de criação: 3 passos (objetivo → squad e valores → briefing simples) */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Passo {wizardStep} de 3</span>
                <h3 className="font-bold font-display text-foreground text-lg">
                  {wizardStep === 1 ? 'O que você quer conseguir?' : wizardStep === 2 ? 'Quantos creators e quanto pagar' : 'Briefing em 3 instruções'}
                </h3>
              </div>
              <button type="button" onClick={closeWizard} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-1.5">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= wizardStep ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>

            <form onSubmit={handleFinishWizard} className="space-y-4 text-xs">

              {/* PASSO 1: tipo + nome + objetivo mensurável */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.keys(CAMPAIGN_TYPES) as CampaignType[]).map((t) => {
                      const info = CAMPAIGN_TYPES[t];
                      const on = wizardData.campaign_type === t;
                      return (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setWizardData({ ...wizardData, campaign_type: t, deliverables_text: info.deliverables, requirements_text: info.requirements, commission_value: info.fee })}
                          className={`text-left p-3 rounded-xl border-2 transition-colors ${on ? 'border-black bg-primary' : 'border-border hover:border-foreground'}`}
                        >
                          <p className="font-bold text-sm text-foreground">{info.label}</p>
                          <p className={`mt-0.5 ${on ? 'text-black/70' : 'text-muted-foreground'}`}>{info.hint}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Nome da campanha</label>
                    <input
                      type="text"
                      value={wizardData.title}
                      onChange={(e) => setWizardData({ ...wizardData, title: e.target.value })}
                      placeholder="Ex.: Lançamento Kit Verão nas lives"
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Objetivo (com número, para dar para medir)</label>
                    <input
                      type="text"
                      value={wizardData.objective}
                      onChange={(e) => setWizardData({ ...wizardData, objective: e.target.value })}
                      placeholder="Ex.: vender 300 kits em 30 dias / receber 40 vídeos para anúncio"
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                    />
                  </div>
                </div>
              )}

              {/* PASSO 2: vagas, cachê, prazo — orçamento calculado */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Creators no squad</label>
                      <input
                        type="number"
                        min={1}
                        value={wizardData.creator_slots}
                        onChange={(e) => setWizardData({ ...wizardData, creator_slots: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Cachê por creator (R$)</label>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={wizardData.commission_value}
                        onChange={(e) => setWizardData({ ...wizardData, commission_value: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                      />
                      <p className="text-[10px] text-muted-foreground">0 = só envio de produto ou comissão</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Começa em</label>
                      <input type="date" value={wizardData.start_date} onChange={(e) => setWizardData({ ...wizardData, start_date: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Termina em</label>
                      <input type="date" value={wizardData.end_date} onChange={(e) => setWizardData({ ...wizardData, end_date: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground" />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary border-2 border-black text-black">
                    <p className="text-[10px] uppercase font-bold">Orçamento em cachês</p>
                    <p className="text-2xl font-extrabold">{brl(wizardBudget)}</p>
                    <p>{wizardData.creator_slots || 0} creators × {brl(wizardData.commission_value)}. O cachê só é liberado depois que você aprova o conteúdo.</p>
                  </div>
                  <button type="button" onClick={() => setShowSimulator(true)} className="underline text-muted-foreground hover:text-foreground">
                    Não sabe quanto pagar? Use o simulador de preço
                  </button>
                </div>
              )}

              {/* PASSO 3: briefing em 3 instruções + direito de uso + revisão */}
              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">1. O que criar (mostrar ou falar)</label>
                    <textarea
                      rows={3}
                      value={wizardData.description}
                      onChange={(e) => setWizardData({ ...wizardData, description: e.target.value })}
                      placeholder="Ex.: mostrar o produto em uso, falar dos 3 benefícios e chamar para o cupom no carrinho."
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">2. Como marcar a marca</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={wizardData.hashtag} onChange={(e) => setWizardData({ ...wizardData, hashtag: e.target.value.replace(/\s+/g, '') })} placeholder="#hashtagdacampanha" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground" />
                      <input value={wizardData.coupon} onChange={(e) => setWizardData({ ...wizardData, coupon: e.target.value.replace(/\s+/g, '') })} placeholder="CUPOM (opcional)" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground uppercase" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">3. Entregas e prazo de cada creator</label>
                    <textarea rows={2} value={wizardData.deliverables_text} onChange={(e) => setWizardData({ ...wizardData, deliverables_text: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Direito de uso dos vídeos em anúncios</label>
                    <div className="flex flex-wrap gap-1.5">
                      {RIGHTS_OPTIONS.map((r) => (
                        <button type="button" key={r} onClick={() => setWizardData({ ...wizardData, usage_rights: r })} className={`px-3 py-1.5 rounded-full border-2 font-semibold ${wizardData.usage_rights === r ? 'border-black bg-primary text-black' : 'border-border text-muted-foreground'}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Fica registrado no briefing que o creator aceita ao entrar no squad.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-1">
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Campanha</span><strong className="text-right">{wizardData.title}</strong></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><strong>{CAMPAIGN_TYPES[wizardData.campaign_type]?.label}</strong></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Squad</span><strong>{wizardData.creator_slots} creators × {brl(wizardData.commission_value)}</strong></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Orçamento em cachês</span><strong>{brl(wizardBudget)}</strong></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Período</span><strong>{wizardData.start_date.split('-').reverse().join('/')} a {wizardData.end_date.split('-').reverse().join('/')}</strong></div>
                  </div>
                  <p className="text-muted-foreground">Depois de publicar, a campanha abre e você monta o squad em <strong>Creators → selecionar → Criar Squad</strong>.</p>
                </div>
              )}

              {wizardTried && stepError(wizardStep) && (
                <p className="text-red-600 font-semibold">{stepError(wizardStep)}</p>
              )}

              <div className="flex justify-between pt-3 border-t border-border">
                {wizardStep > 1 ? (
                  <Button type="button" variant="secondary" onClick={() => { setWizardTried(false); setWizardStep(st => st - 1); }}>Voltar</Button>
                ) : (
                  <Button type="button" variant="secondary" onClick={closeWizard}>Cancelar</Button>
                )}
                {wizardStep < 3 ? (
                  <Button type="button" onClick={goNext}>Continuar</Button>
                ) : (
                  <Button type="submit" disabled={publishing}>{publishing ? 'Salvando…' : 'Publicar campanha'}</Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
