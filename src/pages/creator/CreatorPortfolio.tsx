import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { PortfolioGallery } from '../../components/creator/PortfolioGallery';
import { Badge } from '../../components/ui/Badge';
import { Sparkles, Eye, Share2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const CreatorPortfolio: React.FC = () => {
  const { portfolio, addPortfolioItem } = useData();
  const { creatorProfile } = useAuth();

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="gold">Portfólio Digital</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
            Galeria de Trabalhos & Nail Art
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Seu portfólio é visualizado diretamente pelas marcas ao avaliar suas candidaturas. Mantenha-o sempre atualizado.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Link público do seu portfólio copiado!');
          }}
        >
          <Share2 className="w-4 h-4 mr-1.5" /> Compartilhar Portfólio
        </Button>
      </div>

      {/* Gallery Component */}
      <PortfolioGallery
        items={portfolio}
        onAddItem={(url, cap, tech) => addPortfolioItem(url, cap, tech)}
        isEditable={true}
      />
    </div>
  );
};
