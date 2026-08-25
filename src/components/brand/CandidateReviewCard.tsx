import React from 'react';
import { CampaignApplication, CreatorProfile } from '../../types/database';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatNumber, formatDate } from '../../lib/utils';
import { Check, X, MapPin, Sparkles, ExternalLink } from 'lucide-react';
import { InstagramIcon } from '../ui/InstagramIcon';
import { MOCK_CREATORS, MOCK_PROFILES, MOCK_CAMPAIGNS } from '../../data/mockData';

interface CandidateReviewCardProps {
  application: CampaignApplication;
  onApprove: (applicationId: string) => void;
  onReject: (applicationId: string) => void;
  onViewPortfolio?: (creator: CreatorProfile) => void;
}

export const CandidateReviewCard: React.FC<CandidateReviewCardProps> = ({
  application,
  onApprove,
  onReject,
  onViewPortfolio,
}) => {
  const creator = MOCK_CREATORS.find((c) => c.id === application.creator_id) || MOCK_CREATORS[0];
  const user = MOCK_PROFILES.find((p) => p.id === creator.user_id) || MOCK_PROFILES[0];
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === application.campaign_id) || MOCK_CAMPAIGNS[0];

  return (
    <Card variant="elevated" className="border-border/80 space-y-4 hover:border-primary/40 transition-all">
      {/* Header with Applicant & Campaign */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center space-x-3">
          <img
            src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
            alt={creator.professional_name}
            className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary/30"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-sm text-foreground">{creator.professional_name}</h4>
              <Badge variant="gold" size="sm">
                {creator.verification_status === 'verified' ? '✓ Verificada' : 'Creator'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-primary" /> {creator.city}/{creator.state} • {creator.years_experience} anos exp.
            </p>
          </div>
        </div>

        {/* Social Metrics */}
        <div className="flex items-center space-x-3 bg-muted/60 px-3 py-1.5 rounded-xl border border-border/50 text-xs">
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground block font-semibold">Instagram</span>
            <span className="font-bold text-foreground flex items-center gap-1">
              <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />
              {formatNumber(creator.instagram_followers)}
            </span>
          </div>
          <div className="w-px h-6 bg-border"></div>
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground block font-semibold">TikTok</span>
            <span className="font-bold text-foreground">{formatNumber(creator.tiktok_followers)}</span>
          </div>
        </div>
      </div>

      {/* Campaign target badge */}
      <div className="text-xs text-muted-foreground">
        <span>Candidatura para: </span>
        <strong className="text-foreground">{campaign.title}</strong>
        <span className="ml-2 text-muted-foreground/60">• {formatDate(application.applied_at)}</span>
      </div>

      {/* Applicant Proposal / Message */}
      <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1">
        <span className="font-bold text-foreground flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Proposta da Creator:
        </span>
        <p className="text-muted-foreground italic leading-relaxed">
          "{application.message}"
        </p>
      </div>

      {/* Specialties Badges */}
      <div className="flex flex-wrap gap-1.5">
        {creator.specialties.map((spec) => (
          <span key={spec} className="px-2 py-0.5 rounded-md bg-secondary text-[11px] font-medium text-secondary-foreground">
            {spec}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <button
          type="button"
          onClick={() => onViewPortfolio && onViewPortfolio(creator)}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Ver Portfólio Completo
        </button>

        <div className="flex items-center space-x-2">
          {application.status === 'pending' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(application.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Recusar
              </Button>
              <Button
                size="sm"
                onClick={() => onApprove(application.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="w-4 h-4 mr-1" />
                Aprovar Creator
              </Button>
            </>
          ) : (
            <Badge
              variant={application.status === 'approved' ? 'success' : 'outline'}
              className="py-1 px-3 text-xs"
            >
              {application.status === 'approved' ? '✓ Aprovada para Campanha' : 'Recusada'}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
