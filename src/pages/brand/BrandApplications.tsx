import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { CandidateReviewCard } from '../../components/brand/CandidateReviewCard';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { CreatorProfile } from '../../types/database';
import { Modal } from '../../components/ui/Modal';
import { Heart } from 'lucide-react';
import { MOCK_PORTFOLIO } from '../../data/mockData';
import confetti from 'canvas-confetti';

export const BrandApplications: React.FC = () => {
  const { applications, approveApplication, rejectApplication } = useData();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedCreatorForPortfolio, setSelectedCreatorForPortfolio] = useState<CreatorProfile | null>(null);

  const pendingApps = applications.filter((a) => a.status === 'pending');
  const approvedApps = applications.filter((a) => a.status === 'approved');
  const rejectedApps = applications.filter((a) => a.status === 'rejected');

  const tabs = [
    { id: 'pending', label: 'Candidaturas Pendentes', count: pendingApps.length },
    { id: 'approved', label: 'Creators Aprovadas', count: approvedApps.length },
    { id: 'rejected', label: 'Recusadas', count: rejectedApps.length },
  ];

  const currentList =
    activeTab === 'pending'
      ? pendingApps
      : activeTab === 'approved'
      ? approvedApps
      : rejectedApps;

  const handleApprove = (appId: string) => {
    approveApplication(appId);
    confetti({ particleCount: 70, spread: 60 });
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="gold">Seleção & Curadoria</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
          Candidaturas Recebidas para Suas Campanhas
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Avalie as propostas de conteúdo enviadas pelas Nail Designers, verifique a audiência e aprove os melhores talentos para representar sua marca.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Applications list */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <Card className="text-center py-12 space-y-2">
            <p className="text-sm font-bold text-foreground">
              Nenhuma candidatura encontrada nesta aba.
            </p>
          </Card>
        ) : (
          currentList.map((app) => (
            <CandidateReviewCard
              key={app.id}
              application={app}
              onApprove={handleApprove}
              onReject={(id) => rejectApplication(id)}
              onViewPortfolio={(creator) => setSelectedCreatorForPortfolio(creator)}
            />
          ))
        )}
      </div>

      {/* Portfolio Viewer Modal */}
      {selectedCreatorForPortfolio && (
        <Modal
          isOpen={!!selectedCreatorForPortfolio}
          onClose={() => setSelectedCreatorForPortfolio(null)}
          title={`Portfólio de ${selectedCreatorForPortfolio.professional_name}`}
          description={`${selectedCreatorForPortfolio.city}/${selectedCreatorForPortfolio.state} • ${selectedCreatorForPortfolio.years_experience} anos de experiência`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{selectedCreatorForPortfolio.bio}</p>
            <div className="grid grid-cols-2 gap-3">
              {MOCK_PORTFOLIO.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-xl overflow-hidden aspect-square bg-muted relative group">
                  <img src={item.media_url} alt="Nail sample" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white text-[10px]">
                    <p className="font-semibold line-clamp-2">{item.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
