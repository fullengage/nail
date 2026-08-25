import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { ContentApprovalCard } from '../../components/brand/ContentApprovalCard';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import confetti from 'canvas-confetti';

export const BrandContent: React.FC = () => {
  const { submissions, approveContentSubmission } = useData();
  const [activeTab, setActiveTab] = useState('all');

  const pendingSubs = submissions.filter((s) => s.status === 'submitted');
  const approvedSubs = submissions.filter((s) => s.status === 'approved');

  const tabs = [
    { id: 'all', label: 'Todos os Conteúdos', count: submissions.length },
    { id: 'submitted', label: 'Aguardando Avaliação', count: pendingSubs.length },
    { id: 'approved', label: 'Aprovados & Publicados', count: approvedSubs.length },
  ];

  const currentList =
    activeTab === 'all'
      ? submissions
      : activeTab === 'submitted'
      ? pendingSubs
      : approvedSubs;

  const handleApprove = (id: string) => {
    approveContentSubmission(id);
    confetti({ particleCount: 80, spread: 70 });
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="purple">Moderação de Mídia</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
          Conteúdos Produzidos & Métricas de Performance
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Valide os vídeos, Reels e Stories produzidos pelas creators contratadas e acompanhe as métricas de engajamento e conversão de vendas em tempo real.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Submissions List */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <Card className="text-center py-12 space-y-2">
            <p className="text-sm font-bold text-foreground">Nenhum conteúdo nesta aba.</p>
          </Card>
        ) : (
          currentList.map((sub) => (
            <ContentApprovalCard
              key={sub.id}
              submission={sub}
              onApprove={handleApprove}
            />
          ))
        )}
      </div>
    </div>
  );
};
