import React, { useState, useMemo } from 'react';
import { TikTokLink } from '../../components/ui/TikTokLink';
import { useData } from '../../context/DataContext';
import { Campaign, PipelineStage, CampaignParticipant } from '../../types/database';
import { PIPELINE_STAGES } from '../../data/squadraData';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Package,
  Layers,
  Truck,
  Video,
  TrendingUp,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Eye,
  Award,
  ChevronRight,
  Filter,
  Plus,
  Trash2
} from 'lucide-react';
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
import { Button } from '../../components/ui/Button';

interface SquadraCampaignDetailProps {
  campaignId: string;
  onBack: () => void;
  onNavigatePublicApply?: (slug: string) => void;
}

export const SquadraCampaignDetail: React.FC<SquadraCampaignDetailProps> = ({
  campaignId,
  onBack,
  onNavigatePublicApply
}) => {
  const {
    campaigns,
    participants,
    shipments,
    submissions,
    updateCreatorStage,
    advanceSquadStage,
    addReviewComment,
    deleteCampaign
  } = useData();

  const campaign = campaigns.find(c => c.id === campaignId) || campaigns[0];

  // Abas: briefing, squad, logistics, content, performance
  const [activeTab, setActiveTab] = useState<'briefing' | 'squad' | 'logistics' | 'content' | 'performance'>('squad');

  // Modo de exibição do Squad: kanban vs tabela
  const [squadViewMode, setSquadViewMode] = useState<'kanban' | 'table'>('kanban');

  // Participantes desta campanha
  const campParticipants = useMemo(() => {
    if (!campaign) return [];
    return participants.filter(p => p.campaign_id === campaign.id);
  }, [participants, campaign?.id]);

  // Envios desta campanha
  const campShipments = useMemo(() => {
    if (!campaign) return [];
    return shipments.filter(s => s.campaign_id === campaign.id);
  }, [shipments, campaign?.id]);

  // Conteúdos desta campanha
  const campSubmissions = useMemo(() => {
    if (!campaign) return [];
    return submissions.filter(s => s.campaign_id === campaign.id);
  }, [submissions, campaign?.id]);

  if (!campaign) {
    return (
      <div className="p-12 text-center rounded-2xl bg-card border border-border max-w-md mx-auto my-12 space-y-4">
        <p className="text-sm font-semibold text-foreground">Campanha não encontrada ou excluída.</p>
        <Button onClick={onBack} className="bg-primary text-black font-bold">
          Voltar para Campanhas
        </Button>
      </div>
    );
  }

  // Comentário de revisão
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const handleSendComment = (contentId: string) => {
    const text = commentInputs[contentId];
    if (!text || !text.trim()) return;
    addReviewComment(contentId, text.trim(), 'Brand Manager');
    setCommentInputs({ ...commentInputs, [contentId]: '' });
  };

  // Performance mock 30 dias
  const PERFORMANCE_30D = [
    { day: 'Dia 1', views: 12000, gmv: 1800, clicks: 350 },
    { day: 'Dia 5', views: 35000, gmv: 5200, clicks: 890 },
    { day: 'Dia 10', views: 68000, gmv: 11400, clicks: 1820 },
    { day: 'Dia 15', views: 110000, gmv: 19800, clicks: 3200 },
    { day: 'Dia 20', views: 165000, gmv: 31200, clicks: 4900 },
    { day: 'Dia 25', views: 240000, gmv: 44000, clicks: 7100 },
    { day: 'Dia 30', views: 310000, gmv: 56800, clicks: 9400 }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header com navegação de volta */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-border hover:bg-muted text-foreground transition-all"
            title="Voltar para lista de campanhas"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Campanha Ativa</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{campaign.campaign_type.toUpperCase()}</span>
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground mt-0.5">
              {campaign.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onNavigatePublicApply && (
            <button
              onClick={() => onNavigatePublicApply(campaign.slug)}
              className="px-3.5 py-2 bg-card hover:bg-muted border border-border rounded-xl text-xs font-bold text-foreground flex items-center space-x-1.5 shadow-sm"
            >
              <span>Formulário Público</span>
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Tem certeza que deseja excluir permanentemente a campanha "${campaign.title}"?`)) {
                deleteCampaign(campaign.id);
                onBack();
              }
            }}
            className="px-3.5 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      {/* 2. Navegação em 5 Abas Obrigatórias */}
      <div className="flex border-b border-border space-x-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('briefing')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'briefing'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. Visão Geral & Briefing</span>
        </button>

        <button
          onClick={() => setActiveTab('squad')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'squad'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Squad ({campParticipants.length}) — Pipeline 14 Etapas</span>
        </button>

        <button
          onClick={() => setActiveTab('logistics')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'logistics'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>3. Logistics & Envios ({campShipments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'content'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>4. Mosaico de Conteúdo & Aprovação ({campSubmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'performance'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>5. Performance (30 Dias)</span>
        </button>
      </div>

      {/* ABA 1: VISÃO GERAL & BRIEFING */}
      {activeTab === 'briefing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <h3 className="text-base font-bold font-display text-foreground">Briefing & Objetivos</h3>
              <p className="text-xs text-foreground leading-relaxed">
                {campaign.description}
              </p>
              
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <span className="text-xs font-bold text-foreground">🎯 Objetivo da Marca:</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{campaign.objective}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <h3 className="text-base font-bold font-display text-foreground">Entregáveis & Regras de Criação</h3>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
                <span className="text-xs font-bold text-primary">📦 O que o Creator deve entregar:</span>
                <p className="text-xs text-foreground leading-relaxed">{campaign.deliverables_text}</p>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <span className="text-xs font-bold text-foreground">🔍 Requisitos de Qualificação:</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{campaign.requirements_text}</p>
              </div>
            </div>

          </div>

          <div className="space-y-6">
            
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <h3 className="text-base font-bold font-display text-foreground">Resumo Operacional</h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-muted-foreground">Vagas no Squad</span>
                  <span className="font-bold text-foreground">{campaign.occupied_slots || campParticipants.length} / {campaign.creator_slots}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-muted-foreground">Orçamento Total</span>
                  <span className="font-bold text-foreground">R$ {campaign.budget.toLocaleString('pt-BR')},00</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-muted-foreground">Remuneração Creator</span>
                  <span className="font-bold text-emerald-600">
                    {campaign.commission_value > 0 ? `R$ ${campaign.commission_value},00 fixo` : 'Envio de Produtos (Seeding)'}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-muted-foreground">Início</span>
                  <span className="font-semibold text-foreground">{campaign.start_date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Encerramento</span>
                  <span className="font-semibold text-foreground">{campaign.end_date}</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-bold text-muted-foreground block mb-2">Hashtags Obrigatórias:</span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">#UGC</Badge>
                  <Badge variant="secondary">#SquadUGC</Badge>
                  <Badge variant="secondary">#UnhasBlindadas</Badge>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ABA 2: SQUAD & PIPELINE DE 14 ETAPAS */}
      {activeTab === 'squad' && (
        <div className="space-y-4 animate-in fade-in">

          {/* Resumo do squad + próximo passo (avança o grupo inteiro de uma vez) */}
          {(() => {
            const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
            const total = campParticipants.reduce((acc, p) => acc + (p.fee ?? campaign.commission_value ?? 0), 0);
            const paid = campParticipants.filter((p) => p.stage === 'completed').reduce((acc, p) => acc + (p.fee ?? campaign.commission_value ?? 0), 0);
            const order = PIPELINE_STAGES.map((st) => st.id as string);
            const pending = campParticipants.filter((p) => p.stage !== 'completed');
            const current = order.find((id) => pending.some((p) => p.stage === id));
            const NEXT: Record<string, [string, string]> = {
              discovery: ['squad_approved', 'Aprovar no squad'],
              invited: ['squad_approved', 'Aprovar no squad'],
              applied: ['squad_approved', 'Aprovar no squad'],
              screening: ['squad_approved', 'Aprovar no squad'],
              squad_approved: ['briefing_sent', 'Enviar briefing'],
              briefing_sent: ['shipping', 'Registrar envio do produto'],
              shipping: ['delivered', 'Confirmar entrega do produto'],
              delivered: ['producing', 'Liberar produção do conteúdo'],
              producing: ['submitted', 'Marcar conteúdos recebidos'],
              submitted: ['reviewing', 'Iniciar revisão'],
              reviewing: ['approved', 'Aprovar conteúdos'],
              approved: ['published', 'Marcar como publicado / live feita'],
              published: ['completed', 'Concluir e pagar cachês'],
            };
            const next = current ? NEXT[current] : undefined;
            const atStage = current ? pending.filter((p) => p.stage === current).length : 0;
            const label = PIPELINE_STAGES.find((st) => st.id === current)?.label;
            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Creators no squad</p>
                  <p className="text-xl font-extrabold mt-1">{campParticipants.length} <span className="text-xs font-semibold text-muted-foreground">/ {campaign.creator_slots} vagas</span></p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Investimento em cachês</p>
                  <p className="text-xl font-extrabold mt-1">{brl(total)}</p>
                  <p className="text-[11px] text-muted-foreground">orçamento {brl(campaign.budget || 0)}{total > (campaign.budget || 0) ? ' · acima do orçamento' : ''}</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Já pago</p>
                  <p className="text-xl font-extrabold mt-1">{brl(paid)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(() => {
                      const ok = campParticipants.filter((p) => ['approved', 'published', 'completed'].includes(p.stage || '')).length;
                      return ok ? `${ok} conteúdos aprovados · ${brl(total / ok)} por conteúdo` : 'nenhum conteúdo aprovado ainda';
                    })()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-primary border-2 border-black flex flex-col justify-between gap-2">
                  {campParticipants.length === 0 ? (
                    <p className="text-xs font-bold text-black">Squad vazio. Vá em Creators, selecione e clique em "Criar Squad".</p>
                  ) : next ? (
                    <>
                      <p className="text-[10px] uppercase font-bold text-black/70">Próximo passo · {atStage} em "{label}"</p>
                      <button
                        onClick={() => advanceSquadStage(campaign.id, current as any, next[0] as any)}
                        className="rounded-full bg-black text-white text-xs font-bold px-4 py-2 hover:bg-white hover:text-black transition-colors"
                      >
                        {next[1]} ({atStage})
                      </button>
                    </>
                  ) : (
                    <p className="text-xs font-bold text-black">Campanha concluída: todos os creators pagos.</p>
                  )}
                </div>
              </div>
            );
          })()}
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-foreground">Pipeline do Squad (14 Etapas)</h3>
              <p className="text-xs text-muted-foreground">Acompanhamento de ponta a ponta: do convite ao pagamento final.</p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border">
                <button
                  onClick={() => setSquadViewMode('kanban')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    squadViewMode === 'kanban' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Kanban
                </button>
                <button
                  onClick={() => setSquadViewMode('table')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    squadViewMode === 'table' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Tabela
                </button>
              </div>
            </div>
          </div>

          {squadViewMode === 'kanban' ? (
            /* KANBAN DAS 14 ETAPAS (Scroll horizontal responsivo) */
            <div className="overflow-x-auto pb-4">
              <div className="flex space-x-3.5 min-w-[3400px]">
                {PIPELINE_STAGES.map((stage) => {
                  const stageParticipants = campParticipants.filter(p => (p.stage || 'discovery') === stage.id);

                  return (
                    <div
                      key={stage.id}
                      className="w-60 bg-muted/30 border border-border rounded-2xl p-3 flex flex-col shrink-0 min-h-[480px]"
                    >
                      {/* Topo da Coluna */}
                      <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2.5">
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                          <span className="text-xs font-bold text-foreground truncate">{stage.label}</span>
                        </div>
                        <span className="text-xs font-extrabold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {stageParticipants.length}
                        </span>
                      </div>

                      {/* Lista de Cards da Coluna */}
                      <div className="space-y-2.5 flex-1">
                        {stageParticipants.map((part) => (
                          <div
                            key={part.id}
                            className="p-3 bg-card border border-border hover:border-primary/40 rounded-xl shadow-sm space-y-2 group transition-all"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {(part.creator?.professional_name || 'CR').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground text-xs truncate">
                                  {part.creator?.professional_name || 'Creator'}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  <TikTokLink handle={part.creator?.tiktok} fallback={part.creator?.instagram} />
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/60">
                              <span className="font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                Score: {part.operational_score || 85}
                              </span>
                              <span className="text-muted-foreground">
                                {part.creator?.city}
                              </span>
                            </div>

                            {/* Seletor rápido de avançar etapa */}
                            <div className="pt-1">
                              <select
                                value={part.stage || 'discovery'}
                                onChange={(e) => updateCreatorStage(campaign.id, part.creator_id, e.target.value as PipelineStage)}
                                className="w-full text-[10px] bg-muted/60 border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none"
                              >
                                {PIPELINE_STAGES.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}

                        {stageParticipants.length === 0 && (
                          <div className="py-8 text-center text-muted-foreground text-[11px]">
                            Nenhum creator
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TABELA DO SQUAD */
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pl-2">Creator</th>
                      <th className="pb-3 text-left">Etapa Atual (14 Etapas)</th>
                      <th className="pb-3 text-center">Pontuação Operacional</th>
                      <th className="pb-3 text-left">Código Rastreio</th>
                      <th className="pb-3 text-left">Anotações</th>
                      <th className="pb-3 text-right pr-2">Avançar Etapa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {campParticipants.map((part) => {
                      const curStage = PIPELINE_STAGES.find(s => s.id === part.stage) || PIPELINE_STAGES[0];

                      return (
                        <tr key={part.id} className="hover:bg-muted/40 transition-colors">
                          
                          <td className="py-3 pl-2">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                                {(part.creator?.professional_name || 'CR').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">{part.creator?.professional_name}</p>
                                <p className="text-[11px] text-muted-foreground truncate"><TikTokLink handle={part.creator?.tiktok} /></p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 font-semibold text-foreground">
                            <span className="inline-flex items-center space-x-1.5">
                              <span className={`w-2 h-2 rounded-full ${curStage.color}`} />
                              <span>{curStage.label}</span>
                            </span>
                          </td>

                          <td className="py-3 text-center">
                            <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs">
                              {part.operational_score || 85} / 100
                            </span>
                          </td>

                          <td className="py-3 font-mono text-[11px] text-muted-foreground">
                            {part.tracking_code || '—'}
                          </td>

                          <td className="py-3 text-muted-foreground max-w-xs truncate">
                            {part.notes || 'Sem observações.'}
                          </td>

                          <td className="py-3 text-right pr-2">
                            <select
                              value={part.stage || 'discovery'}
                              onChange={(e) => updateCreatorStage(campaign.id, part.creator_id, e.target.value as PipelineStage)}
                              className="text-xs bg-background border border-border rounded-lg px-2 py-1 text-foreground"
                            >
                              {PIPELINE_STAGES.map((s) => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ABA 3: LOGISTICS & ENVIOS */}
      {activeTab === 'logistics' && (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-foreground">Gestão de Envios & Logística</h3>
              <p className="text-xs text-muted-foreground">Envio dos kits de produtos para os creators do Squad.</p>
            </div>
            <div className="text-xs text-muted-foreground">
              Total de Envios: <strong>{campShipments.length}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Destinatário (Creator)</th>
                  <th className="pb-3 text-left">Código de Rastreio</th>
                  <th className="pb-3 text-left">Transportadora</th>
                  <th className="pb-3 text-left">Endereço de Entrega</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right pr-2">Rastrear</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {campShipments.map((ship) => (
                  <tr key={ship.id} className="hover:bg-muted/40 transition-colors">
                    
                    <td className="py-3 pl-2 font-bold text-foreground">
                      {ship.creator_name}
                    </td>

                    <td className="py-3 font-mono font-semibold text-primary">
                      {ship.tracking_code}
                    </td>

                    <td className="py-3 text-foreground font-medium">
                      {ship.carrier}
                    </td>

                    <td className="py-3 text-muted-foreground">
                      {ship.address_street}, {ship.address_city} - {ship.address_state}
                    </td>

                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ship.status === 'delivered'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                      }`}>
                        {ship.status === 'delivered' ? 'Entregue' : 'Em Trânsito'}
                      </span>
                    </td>

                    <td className="py-3 text-right pr-2">
                      <a
                        href={`https://rastreamento.correios.com.br/app/index.php?codigo=${ship.tracking_code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-bold text-[11px] inline-flex items-center"
                      >
                        <span>Abrir</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 4: CONTENT & MOSAICO COM FLUXO DE APROVAÇÃO */}
      {activeTab === 'content' && (
        <div className="space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-base font-bold font-display text-foreground">Mosaico de Conteúdo & Revisões</h3>
            <p className="text-xs text-muted-foreground">Analise os criativos enviados pelos creators e forneça feedbacks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campSubmissions.map((sub) => (
              <div key={sub.id} className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
                
                {/* Cabeçalho do Creator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                      {(sub.creator?.professional_name || 'CR').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-xs">{sub.creator?.professional_name}</p>
                      <p className="text-[10px] text-muted-foreground">{sub.content_type.toUpperCase()}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    sub.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}>
                    {sub.status === 'approved' ? 'Aprovado' : 'Em Revisão'}
                  </span>
                </div>

                {/* Imagem / Mídia Kit Thumbnail */}
                <div className="relative rounded-xl overflow-hidden aspect-video bg-muted border border-border group">
                  <img
                    src={sub.media_url}
                    alt={sub.caption}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {sub.published_url && (
                    <a
                      href={sub.published_url}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 backdrop-blur text-white text-[10px] font-bold rounded-lg flex items-center space-x-1"
                    >
                      <Video className="w-3 h-3" />
                      <span>Ver Vídeo</span>
                    </a>
                  )}
                </div>

                {/* Legenda */}
                <p className="text-xs text-foreground line-clamp-2">
                  {sub.caption}
                </p>

                {/* Métricas do Conteúdo */}
                {sub.metrics && (
                  <div className="grid grid-cols-3 gap-1 py-2 bg-muted/40 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Views</span>
                      <span className="font-bold text-foreground">{sub.metrics.views.toLocaleString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Likes</span>
                      <span className="font-bold text-foreground">{sub.metrics.likes.toLocaleString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Vendas</span>
                      <span className="font-bold text-emerald-600">{sub.metrics.sales}</span>
                    </div>
                  </div>
                )}

                {/* Comentários de Feedback */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-[11px] font-bold text-muted-foreground block">Fluxo de Aprovação & Comentários:</span>
                  
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {(sub.reviews || []).map((rev) => (
                      <div key={rev.id} className="p-2 rounded-lg bg-muted/40 text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="font-bold text-foreground">{rev.author_name}</span>
                          <span className="text-[9px]">{new Date(rev.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-foreground">{rev.comment}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-1.5 pt-1">
                    <input
                      type="text"
                      value={commentInputs[sub.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [sub.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendComment(sub.id)}
                      placeholder="Adicionar feedback de aprovação..."
                      className="flex-1 px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none text-foreground"
                    />
                    <button
                      onClick={() => handleSendComment(sub.id)}
                      className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 5: PERFORMANCE (30 DIAS MOCK) */}
      {activeTab === 'performance' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border text-center">
              <span className="text-xs text-muted-foreground uppercase font-bold">Views Acumuladas</span>
              <p className="text-2xl font-bold font-display text-primary mt-1">310.000</p>
              <span className="text-[11px] text-emerald-600 font-semibold">+42% vs meta</span>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border text-center">
              <span className="text-xs text-muted-foreground uppercase font-bold">Cliques no Cupom</span>
              <p className="text-2xl font-bold font-display text-foreground mt-1">9.400</p>
              <span className="text-[11px] text-muted-foreground">CTR médio 3.03%</span>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border text-center">
              <span className="text-xs text-muted-foreground uppercase font-bold">Vendas Convertidas</span>
              <p className="text-2xl font-bold font-display text-emerald-600 mt-1">298 pedidos</p>
              <span className="text-[11px] text-muted-foreground">Ticket R$ 190,60</span>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border text-center">
              <span className="text-xs text-muted-foreground uppercase font-bold">GMV Total Gerado</span>
              <p className="text-2xl font-bold font-display text-foreground mt-1">R$ 56.800</p>
              <span className="text-[11px] text-emerald-600 font-semibold">ROI 4.2x</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="text-base font-bold font-display text-foreground">
              Tração Diária de Visualizações & GMV da Campanha
            </h3>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PERFORMANCE_30D}>
                  <defs>
                    <linearGradient id="colorViewsCamp" x1="0" y1="0" x2="0" y2="1">
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
                  />
                  <Area type="monotone" dataKey="views" stroke="#111111" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViewsCamp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
