import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { SQUADRA_AFFILIATES } from '../../data/squadraData';
import { AffiliateLink, AffiliateProposal, AffiliateApplication } from '../../types/database';
import { TikTokLink, tiktokUrl } from '../../components/ui/TikTokLink';
import {
  DollarSign,
  TrendingUp,
  Award,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  ExternalLink,
  Download,
  Plus,
  Sparkles,
  ShoppingBag,
  Tag,
  Check,
  X,
  Clock,
  Layers,
  Users,
  Eye,
  Trash2,
  PauseCircle,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

// @ do TikTok do creator → https://www.tiktok.com/@handle
const affTiktok = (aff: AffiliateLink) => tiktokUrl(aff.creator?.tiktok);

export const SquadraAffiliates: React.FC = () => {
  const {
    creators,
    affiliateProposals,
    affiliateApplications,
    createAffiliateProposal,
    updateAffiliateProposal,
    deleteAffiliateProposal,
    approveAffiliateApplication,
    rejectAffiliateApplication
  } = useData();
  const { role } = useAuth();
  const canExportCsv = role === 'admin_master' || role === 'admin';

  // Tabs de navegação
  const [activeTab, setActiveTab] = useState<'proposals' | 'applications' | 'tracking'>('proposals');

  // Filtro de proposta selecionada para visualização de candidaturas
  const [selectedProposalFilter, setSelectedProposalFilter] = useState<string>('all');
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Modal de Nova Proposta
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    title: '',
    product_name: '',
    product_image_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800',
    product_price: 199.90,
    commission_type: 'percentage' as 'percentage' | 'fixed',
    commission_value: 15,
    default_coupon: 'MEUCUPOM15',
    store_url: 'https://loja.minhamarca.com.br/produto',
    description: '',
    rules: 'Vídeos autênticos com boa iluminação demonstrando o uso. Proibido divulgar em sites de cupons agregadores.',
    benefits: 'Amostra grátis enviada para os top afiliados. Comissão transferida via PIX quinzenalmente.'
  });

  // Modal / Confirmação de Aprovação de Creator com Cupom
  const [approvingApp, setApprovingApp] = useState<AffiliateApplication | null>(null);
  const [customCouponInput, setCustomCouponInput] = useState('');

  // Rastreamento & Ranking
  const [rawAffiliates] = useState(SQUADRA_AFFILIATES);
  const affiliatesList = useMemo(() => {
    const byHandle = new Map(creators.map((c) => [(c.tiktok || '').toLowerCase(), c]));
    return rawAffiliates.map((a) => ({ ...a, creator: byHandle.get((a.creator?.tiktok || '').toLowerCase()) || a.creator }));
  }, [rawAffiliates, creators]);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const totalGmv = affiliatesList.reduce((acc, a) => acc + a.revenue, 0);
  const totalCommission = affiliatesList.reduce((acc, a) => acc + a.commission_generated, 0);
  const totalOrders = affiliatesList.reduce((acc, a) => acc + a.orders, 0);
  const rankedAffiliates = useMemo(() => [...affiliatesList].sort((a, b) => b.revenue - a.revenue), [affiliatesList]);

  // Contadores
  const pendingApplicationsCount = useMemo(() => {
    return affiliateApplications.filter(a => a.status === 'pending').length;
  }, [affiliateApplications]);

  // Candidaturas enriquecidas com dados do creator da base
  const enrichedApplications = useMemo(() => {
    const creatorsMap = new Map(creators.map(c => [c.id, c]));
    return affiliateApplications.map(app => ({
      ...app,
      creatorData: creatorsMap.get(app.creator_id)
    }));
  }, [affiliateApplications, creators]);

  const filteredApplications = useMemo(() => {
    return enrichedApplications.filter(app => {
      const matchesProposal = selectedProposalFilter === 'all' || app.proposal_id === selectedProposalFilter;
      const matchesStatus = appStatusFilter === 'all' || app.status === appStatusFilter;
      return matchesProposal && matchesStatus;
    });
  }, [enrichedApplications, selectedProposalFilter, appStatusFilter]);

  // Submit Nova Proposta
  const handleCreateProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalForm.title || !proposalForm.product_name) return;

    createAffiliateProposal({
      brand_id: 'brand-current',
      brand_name: 'Minha Marca',
      title: proposalForm.title,
      description: proposalForm.description || `Programa de afiliação para o produto ${proposalForm.product_name}.`,
      product_name: proposalForm.product_name,
      product_image_url: proposalForm.product_image_url,
      product_price: Number(proposalForm.product_price) || 0,
      commission_type: proposalForm.commission_type,
      commission_value: Number(proposalForm.commission_value) || 10,
      default_coupon: proposalForm.default_coupon.toUpperCase().trim(),
      store_url: proposalForm.store_url,
      rules: proposalForm.rules,
      benefits: proposalForm.benefits,
      status: 'active'
    });

    setIsNewProposalModalOpen(false);
    setProposalForm({
      title: '',
      product_name: '',
      product_image_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800',
      product_price: 199.90,
      commission_type: 'percentage',
      commission_value: 15,
      default_coupon: 'MEUCUPOM15',
      store_url: 'https://loja.minhamarca.com.br/produto',
      description: '',
      rules: 'Vídeos autênticos com boa iluminação demonstrando o uso.',
      benefits: 'Amostra grátis enviada para os top afiliados. Comissão via PIX.'
    });
  };

  const handleOpenApproveModal = (app: AffiliateApplication) => {
    setApprovingApp(app);
    setCustomCouponInput(app.requested_coupon || 'CUPOM15');
  };

  const handleConfirmApproval = () => {
    if (!approvingApp) return;
    approveAffiliateApplication(approvingApp.id, customCouponInput.toUpperCase().trim());
    setApprovingApp(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header com Modelo Invertido */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              Afiliados & Creator Commerce
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              Modelo Invertido
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl">
            Publique suas ofertas de produtos, cupons e percentuais de comissão. Em vez de garimpar creators um a um, 
            <strong> os creators escolhem sua marca</strong> e enviam solicitações para vender seus produtos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => setIsNewProposalModalOpen(true)}
            className="flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Proposta de Venda</span>
          </Button>

          {canExportCsv && (
            <Button variant="secondary" className="flex items-center space-x-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Abas de Navegação Principal */}
      <div className="flex items-center space-x-2 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'proposals'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Minhas Ofertas & Propostas</span>
          <span className="ml-1 px-2 py-0.2 rounded-full text-xs bg-muted text-foreground font-mono">
            {affiliateProposals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'applications'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Solicitações de Creators ("Você é Escolhido")</span>
          {pendingApplicationsCount > 0 ? (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-bold animate-pulse">
              {pendingApplicationsCount} novas
            </span>
          ) : (
            <span className="ml-1 px-2 py-0.2 rounded-full text-xs bg-muted text-muted-foreground font-mono">
              {affiliateApplications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'tracking'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Afiliados Ativos & Rastreamento de Vendas</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: MINHAS PROPOSTAS & ANÚNCIOS DE VENDA */}
      {/* ========================================================================= */}
      {activeTab === 'proposals' && (
        <div className="space-y-6">
          {/* Card Explicativo do Modelo Invertido */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Como Funciona a Atração de Creators:</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                1. Você cadastra o produto e define a comissão (ex: 15% ou R$ 35 fixo por venda).<br />
                2. A proposta é divulgada no marketplace para os 808+ creators da base qualificada.<br />
                3. Creators interessados analisam o produto e enviam propostas de divulgação solicitando um cupom exclusivo.<br />
                4. Você aprova com 1 clique e acompanha as vendas, cliques e repasses em tempo real.
              </p>
            </div>
            <Button
              onClick={() => setIsNewProposalModalOpen(true)}
              className="shrink-0 text-xs flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publicar Oferta</span>
            </Button>
          </div>

          {/* Grid de Propostas */}
          {affiliateProposals.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
              <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">Nenhuma proposta de afiliação publicada ainda</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Crie sua primeira proposta de produto com cupom para permitir que creators da base escolham divulgar sua marca.
              </p>
              <Button onClick={() => setIsNewProposalModalOpen(true)} className="text-xs">
                Publicar Primeira Proposta
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {affiliateProposals.map((prop) => {
                const propApps = affiliateApplications.filter(a => a.proposal_id === prop.id);
                const pendingApps = propApps.filter(a => a.status === 'pending');

                return (
                  <div
                    key={prop.id}
                    className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 shadow-sm transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Header do Card */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={prop.product_image_url}
                            alt={prop.product_name}
                            className="w-12 h-12 rounded-xl object-cover border border-border shadow-xs"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {prop.brand_name}
                            </span>
                            <h3 className="font-bold text-base text-foreground line-clamp-1 leading-snug">
                              {prop.title}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            prop.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}>
                            {prop.status === 'active' ? 'Ativa no Feed' : 'Pausada'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {prop.description}
                      </p>

                      {/* Dados Comerciais */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40 border border-border/60 text-center">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Preço Produto</span>
                          <span className="text-xs font-bold text-foreground font-mono">
                            R$ {prop.product_price.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Comissão Creator</span>
                          <span className="text-xs font-extrabold text-emerald-600 font-mono">
                            {prop.commission_type === 'percentage'
                              ? `${prop.commission_value}% por venda`
                              : `R$ ${prop.commission_value.toFixed(2)} fixo`}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Cupom Padrão</span>
                          <span className="text-xs font-bold text-primary font-mono">
                            {prop.default_coupon}
                          </span>
                        </div>
                      </div>

                      {/* Regras e Benefícios */}
                      <div className="space-y-1.5 text-[11px] text-muted-foreground">
                        {prop.benefits && (
                          <div className="flex items-start space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span><strong>Benefícios:</strong> {prop.benefits}</span>
                          </div>
                        )}
                        {prop.rules && (
                          <div className="flex items-start space-x-1.5">
                            <Tag className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span><strong>Regras:</strong> {prop.rules}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer com Estatísticas & Ações */}
                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1 font-semibold">
                          <Users className="w-3.5 h-3.5" />
                          <span>{prop.total_affiliates_count} afiliados</span>
                        </span>
                        <span className="flex items-center space-x-1 font-semibold text-emerald-600">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{prop.total_sales_count} vendas</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedProposalFilter(prop.id);
                            setActiveTab('applications');
                          }}
                          className={`text-xs flex items-center space-x-1.5 ${
                            pendingApps.length > 0 ? 'border-amber-500/40 text-amber-600 bg-amber-500/10' : ''
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Candidaturas</span>
                          {pendingApps.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                              {pendingApps.length}
                            </span>
                          )}
                        </Button>

                        <button
                          onClick={() => updateAffiliateProposal(prop.id, { status: prop.status === 'active' ? 'paused' : 'active' })}
                          title={prop.status === 'active' ? 'Pausar proposta' : 'Ativar proposta'}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          {prop.status === 'active' ? (
                            <PauseCircle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <PlayCircle className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja excluir esta proposta de afiliação?')) {
                              deleteAffiliateProposal(prop.id);
                            }
                          }}
                          title="Excluir proposta"
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: SOLICITAÇÕES RECEBIDAS ("VOCÊ É ESCOLHIDO") */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* Cabeçalho da Aba */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground flex items-center space-x-2">
                <span>Creators que Escolheram Vender sua Marca</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  {filteredApplications.length} solicitações
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Estes profissionais analisaram suas condições comerciais e pediram autorização para atuar como afiliados oficiais.
              </p>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedProposalFilter}
                onChange={(e) => setSelectedProposalFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Todas as Propostas</option>
                {affiliateProposals.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>

              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Apenas Pendentes</option>
                <option value="approved">Apenas Aprovados</option>
                <option value="rejected">Apenas Recusados</option>
              </select>
            </div>
          </div>

          {/* Lista de Solicitações */}
          {filteredApplications.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-2">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
              <h4 className="text-sm font-bold text-foreground">Nenhuma solicitação encontrada com estes filtros</h4>
              <p className="text-xs text-muted-foreground">
                Quando novos creators se candidatarem para suas propostas ativas, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => {
                const creator = app.creatorData;
                const isPending = app.status === 'pending';
                const isApproved = app.status === 'approved';

                return (
                  <div
                    key={app.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-card border-amber-500/30 shadow-xs'
                        : isApproved
                        ? 'bg-card border-emerald-500/30'
                        : 'bg-muted/20 border-border opacity-70'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Perfil do Creator */}
                      <div className="flex items-start space-x-3.5">
                        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                          {creator?.professional_name?.charAt(0) || 'C'}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h4 className="font-bold text-sm text-foreground">
                              {creator?.professional_name || 'Creator Solicitante'}
                            </h4>
                            <TikTokLink handle={creator?.tiktok} className="text-xs text-muted-foreground" />
                            {creator?.city && creator?.state && (
                              <span className="text-[11px] text-muted-foreground">
                                • {creator.city}/{creator.state}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                            <span>
                              <strong>{((creator?.tiktok_followers || creator?.instagram_followers) || 15400).toLocaleString('pt-BR')}</strong> seguidores
                            </span>
                            <span>•</span>
                            <span className="text-emerald-600 font-semibold">
                              Engajamento {creator?.engagement_rate ? `${creator.engagement_rate}%` : '4.8%'}
                            </span>
                            <span>•</span>
                            <span className="text-[11px] bg-muted px-2 py-0.5 rounded-md font-medium text-foreground">
                              Para: {app.proposal_title}
                            </span>
                          </div>

                          {/* Pitch / Mensagem do Creator */}
                          <div className="mt-2 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground leading-relaxed">
                            <span className="font-bold text-primary block text-[10px] uppercase tracking-wider mb-1">
                              💬 Proposta de Divulgação do Creator:
                            </span>
                            "{app.message}"
                          </div>

                          {/* Cupom Solicitado */}
                          <div className="flex items-center space-x-2 text-xs pt-1">
                            <span className="text-muted-foreground">Cupom Sugerido pelo Creator:</span>
                            <span className="font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                              {app.requested_coupon || 'CUPOM'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status & Ações */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5 shrink-0">
                        {isPending ? (
                          <>
                            <Button
                              onClick={() => handleOpenApproveModal(app)}
                              className="text-xs flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aprovar & Gerar Cupom</span>
                            </Button>

                            <Button
                              variant="secondary"
                              onClick={() => rejectAffiliateApplication(app.id)}
                              className="text-xs flex items-center space-x-1 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Recusar</span>
                            </Button>
                          </>
                        ) : isApproved ? (
                          <div className="text-right space-y-1">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              <span>Afiliado Aprovado</span>
                            </span>
                            <span className="text-[11px] text-muted-foreground block font-mono">
                              Cupom Ativo: <strong>{app.requested_coupon}</strong>
                            </span>
                          </div>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                            Recusado
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: AFILIADOS ATIVOS & RASTREAMENTO DE VENDAS */}
      {/* ========================================================================= */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          {/* 3.1 KPIs Globais de Afiliados */}
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

          {/* 3.2 Ranking & Tabela de Afiliados */}
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
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CRIAR NOVA PROPOSTA DE AFILIAÇÃO (CREATOR COMMERCE) */}
      {/* ========================================================================= */}
      {isNewProposalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-lg text-foreground">Nova Oferta de Afiliação (Creator Commerce)</h3>
                <p className="text-xs text-muted-foreground">Publique para que creators escolham vender seus produtos.</p>
              </div>
              <button
                onClick={() => setIsNewProposalModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProposalSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Título do Anúncio de Afiliação *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Programa de Embaixadoras: Kit Blindagem Gel Diamante"
                  value={proposalForm.title}
                  onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Nome do Produto Principal *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kit Esmaltação em Gel Pro"
                    value={proposalForm.product_name}
                    onChange={(e) => setProposalForm({ ...proposalForm, product_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Preço de Venda do Produto (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={proposalForm.product_price}
                    onChange={(e) => setProposalForm({ ...proposalForm, product_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Tipo de Comissão</label>
                  <select
                    value={proposalForm.commission_type}
                    onChange={(e) => setProposalForm({ ...proposalForm, commission_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">
                    {proposalForm.commission_type === 'percentage' ? 'Valor da Comissão (%)' : 'Valor da Comissão (R$)'} *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={proposalForm.commission_value}
                    onChange={(e) => setProposalForm({ ...proposalForm, commission_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Cupom Sugerido</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PROMO15"
                    value={proposalForm.default_coupon}
                    onChange={(e) => setProposalForm({ ...proposalForm, default_coupon: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Link da Loja / Página do Produto</label>
                <input
                  type="url"
                  placeholder="https://sualoja.com.br/produto"
                  value={proposalForm.store_url}
                  onChange={(e) => setProposalForm({ ...proposalForm, store_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Regras de Divulgação</label>
                <textarea
                  rows={2}
                  value={proposalForm.rules}
                  onChange={(e) => setProposalForm({ ...proposalForm, rules: e.target.value })}
                  placeholder="Ex: Vídeos no TikTok/Reels, Stories semanais. Não permitido sites agregadores."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Benefícios Exclusivos para o Creator</label>
                <textarea
                  rows={2}
                  value={proposalForm.benefits}
                  onChange={(e) => setProposalForm({ ...proposalForm, benefits: e.target.value })}
                  placeholder="Ex: Amostras grátis a cada 5 vendas, grupo VIP de suporte com a marca, repasse via PIX."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border">
                <Button type="button" variant="secondary" onClick={() => setIsNewProposalModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground">
                  Publicar Proposta no Marketplace
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: APROVAR CREATOR E GERAR CUPOM OFICIAL */}
      {/* ========================================================================= */}
      {approvingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-foreground">Aprovar Afiliado & Liberar Cupom</h3>
              </div>
              <button
                onClick={() => setApprovingApp(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                Você está aprovando o creator para divulgar <strong>{approvingApp.proposal_title}</strong>.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Definir Código do Cupom Oficial</label>
                <input
                  type="text"
                  required
                  value={customCouponInput}
                  onChange={(e) => setCustomCouponInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground font-mono font-bold text-sm focus:ring-1 focus:ring-primary outline-none"
                  placeholder="EXEMPLO15"
                />
                <span className="text-[11px] text-muted-foreground">
                  Este cupom será vinculado aos relatórios de conversão e link de checkout do afiliado.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setApprovingApp(null)}>
                Voltar
              </Button>
              <Button
                onClick={handleConfirmApproval}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirmar & Ativar Cupom
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

