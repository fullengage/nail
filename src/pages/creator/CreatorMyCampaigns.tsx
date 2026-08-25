import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { SubmitContentModal } from '../../components/creator/SubmitContentModal';
import { formatDate, formatCurrency } from '../../lib/utils';
import {
  Inbox,
  CheckCircle,
  Truck,
  Video,
  Clock,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Upload
} from 'lucide-react';
import { Campaign, ContentType } from '../../types/database';

export const CreatorMyCampaigns: React.FC = () => {
  const { applications, participants, campaigns, submissions, submitContent } = useData();
  const [activeTab, setActiveTab] = useState('producing');
  const [submissionCampaign, setSubmissionCampaign] = useState<Campaign | null>(null);

  const creatorId = 'creator-1';

  // Filter datasets
  const myApplications = applications.filter((a) => a.creator_id === creatorId);
  const myParticipations = participants.filter((p) => p.creator_id === creatorId);
  const mySubmissions = submissions.filter((s) => s.creator_id === creatorId);

  const producingList = myParticipations.filter((p) => p.status === 'selected' || p.status === 'product_sent' || p.status === 'producing');
  const submittedList = myParticipations.filter((p) => p.status === 'submitted');
  const completedList = myParticipations.filter((p) => p.status === 'completed' || p.status === 'approved');

  const tabs = [
    { id: 'producing', label: 'Em Andamento / Gravação', count: producingList.length },
    { id: 'submitted', label: 'Conteúdos Enviados', count: submittedList.length },
    { id: 'completed', label: 'Concluídas & Pagas', count: completedList.length },
    { id: 'applications', label: 'Minhas Candidaturas', count: myApplications.length },
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="gold">Acompanhamento</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
          Minhas Campanhas & Entregas
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Acompanhe o status de envio dos produtos da marca, prazos e envie os links dos seus Reels e posts produzidos.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 1. EM ANDAMENTO / GRAVAÇÃO */}
      {activeTab === 'producing' && (
        <div className="space-y-4">
          {producingList.length === 0 ? (
            <Card className="text-center py-12 space-y-2">
              <p className="text-sm font-bold text-foreground">Você não possui campanhas em gravação no momento.</p>
              <p className="text-xs text-muted-foreground">Explore o catálogo e candidate-se às campanhas abertas.</p>
            </Card>
          ) : (
            producingList.map((part) => {
              const camp = campaigns.find((c) => c.id === part.campaign_id) || campaigns[0];
              return (
                <Card key={part.id} variant="elevated" className="border-primary/20 space-y-5 p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div className="flex items-start space-x-4">
                      <img
                        src={camp.cover_url}
                        alt={camp.title}
                        className="w-20 h-20 rounded-xl object-cover ring-1 ring-border"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="success" size="sm">
                            ✓ Selecionada pela Marca
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Cachê: <strong className="text-foreground">R$ {camp.commission_value}</strong>
                          </span>
                        </div>
                        <h3 className="text-base font-bold font-display text-foreground">{camp.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{camp.deliverables_text}</p>
                      </div>
                    </div>

                    <Button onClick={() => setSubmissionCampaign(camp)} className="w-full sm:w-auto shadow-md">
                      <Upload className="w-4 h-4 mr-1.5" />
                      Enviar Conteúdo Produzido
                    </Button>
                  </div>

                  {/* Tracking & Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-muted/40 p-4 rounded-xl border border-border">
                    <div className="space-y-1">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-primary" /> Envio dos Produtos
                      </span>
                      <p className="font-bold text-foreground">
                        {part.tracking_code ? `Correios: ${part.tracking_code}` : 'Aguardando postagem'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Prazo de Entrega
                      </span>
                      <p className="font-bold text-foreground">Até 10 dias após recebimento</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-purple-500" /> Entregáveis
                      </span>
                      <p className="font-bold text-foreground">1x Reels + 3x Stories</p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* 2. CONTEÚDOS ENVIADOS / EM AVALIAÇÃO */}
      {activeTab === 'submitted' && (
        <div className="space-y-4">
          {submittedList.length === 0 ? (
            <Card className="text-center py-12 space-y-2">
              <p className="text-sm font-bold text-foreground">Nenhum conteúdo aguardando aprovação no momento.</p>
            </Card>
          ) : (
            submittedList.map((part) => {
              const camp = campaigns.find((c) => c.id === part.campaign_id) || campaigns[0];
              const sub = mySubmissions.find((s) => s.campaign_id === camp.id);
              return (
                <Card key={part.id} variant="elevated" className="p-6 space-y-4 border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={camp.cover_url}
                        alt={camp.title}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                      <div>
                        <Badge variant="warning" size="sm">
                          ⏳ Aguardando Aprovação da Marca
                        </Badge>
                        <h4 className="font-bold text-sm text-foreground mt-1">{camp.title}</h4>
                      </div>
                    </div>

                    {sub?.published_url && (
                      <a
                        href={sub.published_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Ver Post Enviado
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl">
                    A marca está analisando sua publicação. Assim que validada, o cachê de <strong>R$ {camp.commission_value}</strong> será liberado no seu extrato.
                  </p>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* 3. CONCLUÍDAS & PAGAS */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedList.length === 0 ? (
            <Card className="text-center py-12 space-y-2">
              <p className="text-sm font-bold text-foreground">Você ainda não possui campanhas concluídas.</p>
            </Card>
          ) : (
            completedList.map((part) => {
              const camp = campaigns.find((c) => c.id === part.campaign_id) || campaigns[0];
              return (
                <Card key={part.id} variant="elevated" className="p-6 border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <Badge variant="success" size="sm">✓ Concluída & Paga</Badge>
                      <h4 className="font-bold text-sm text-foreground mt-1">{camp.title}</h4>
                      <p className="text-xs text-muted-foreground">Cachê de R$ {camp.commission_value} depositado.</p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-600">+ R$ {camp.commission_value},00</span>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* 4. CANDIDATURAS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {myApplications.map((app) => {
            const camp = campaigns.find((c) => c.id === app.campaign_id) || campaigns[0];
            return (
              <Card key={app.id} variant="elevated" className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <img
                    src={camp.cover_url}
                    alt={camp.title}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="space-y-1">
                    <Badge
                      variant={
                        app.status === 'approved'
                          ? 'success'
                          : app.status === 'rejected'
                          ? 'outline'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {app.status === 'approved'
                        ? '✓ Aprovada'
                        : app.status === 'rejected'
                        ? 'Não Selecionada'
                        : '⏳ Em Análise pela Marca'}
                    </Badge>
                    <h4 className="font-bold text-sm text-foreground">{camp.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 italic">"{app.message}"</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">
                    Candidatou-se em {formatDate(app.applied_at)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Content Modal */}
      {submissionCampaign && (
        <SubmitContentModal
          campaign={submissionCampaign}
          isOpen={!!submissionCampaign}
          onClose={() => setSubmissionCampaign(null)}
          onSubmit={(campId, type, mediaUrl, pubUrl, cap) => {
            submitContent(campId, type, mediaUrl, pubUrl, cap);
            setActiveTab('submitted');
          }}
        />
      )}
    </div>
  );
};
