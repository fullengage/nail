import React, { useState } from 'react';
import { Campaign, CampaignType, CommissionType } from '../../types/database';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Sparkles, CheckCircle2, DollarSign, Users, Calendar, Video, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CampaignWizardProps {
  onCreate: (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export const CampaignWizard: React.FC<CampaignWizardProps> = ({ onCreate, onCancel }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('paid_content');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1000&q=80');
  const [creatorSlots, setCreatorSlots] = useState(10);
  const [commissionType, setCommissionType] = useState<CommissionType>('fixed');
  const [commissionValue, setCommissionValue] = useState(350);
  const [budget, setBudget] = useState(3500);
  const [requirementsText, setRequirementsText] = useState('Mínimo 5k seguidores, fotos e vídeos nítidos, foco em unhas de gel ou fibra.');
  const [deliverablesText, setDeliverablesText] = useState('1x Reels de 30-60s com unboxing e aplicação + 3x Stories com link do produto.');
  const [deadline, setDeadline] = useState('2025-04-15');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      brand_id: 'brand-1',
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      objective,
      campaign_type: campaignType,
      cover_url: coverUrl,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      application_deadline: new Date(deadline).toISOString(),
      creator_slots: Number(creatorSlots),
      occupied_slots: 0,
      budget: Number(budget),
      commission_type: commissionType,
      commission_value: Number(commissionValue),
      requirements_text: requirementsText,
      deliverables_text: deliverablesText,
      status: 'open',
    });
    confetti({ particleCount: 100, spread: 70 });
  };

  return (
    <Card variant="elevated" className="max-w-3xl mx-auto p-6 sm:p-8">
      {/* Wizard Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
        <div>
          <Badge variant="gold" size="sm">
            Nova Campanha
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground mt-1">
            Lançar Campanha para Nail Creators
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Defina o objetivo, cachê, produtos e perfil desejado de manicures.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-primary">Etapa {step} de 3</span>
          <div className="flex gap-1.5 mt-1">
            <div className={`h-1.5 w-6 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`h-1.5 w-6 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`h-1.5 w-6 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Basic Info & Type */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <Input
              label="Título da Campanha"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lançamento Linha Top Coat Diamante — Reels & Teste"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-2">
                Tipo de Campanha
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'paid_content', label: 'Conteúdo Pago + Cachê', desc: 'Creators recebem valor fixo por vídeo + produto' },
                  { id: 'ugc', label: 'UGC Vídeos & Anúncios', desc: 'Vídeos autênticos para uso nos anúncios da marca' },
                  { id: 'product_seeding', label: 'Seeding / Permuta', desc: 'Envio gratuito de kits para experimentação' },
                  { id: 'affiliate', label: 'Programa de Afiliadas', desc: 'Comissão percentual sobre cada venda gerada' },
                  { id: 'live_commerce', label: 'Live Commerce', desc: 'Lives demonstrativas com cupom exclusivo' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setCampaignType(type.id as CampaignType)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      campaignType === type.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                        : 'border-border bg-card hover:bg-muted/40'
                    }`}
                  >
                    <p className="text-xs font-bold text-foreground">{type.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Descrição Completa da Campanha"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique os diferenciais do produto e o que as creators devem destacar..."
              rows={3}
              required
            />

            <Input
              label="URL da Imagem de Capa"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              helperText="Insira imagem atraente em proporção horizontal (16:9)"
              required
            />

            <div className="flex justify-end pt-4">
              <Button
                type="button"
                onClick={() => {
                  if (!title || !description) alert('Preencha os campos obrigatórios.');
                  else setStep(2);
                }}
              >
                Próxima Etapa: Orçamento e Vagas →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Budget, Slots & Deliverables */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
                  Formato de Remuneração
                </label>
                <select
                  value={commissionType}
                  onChange={(e) => setCommissionType(e.target.value as CommissionType)}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="fixed">Cachê Fixo (R$) + Envio de Produto</option>
                  <option value="percentage">Comissão em Vendas (% Afiliada)</option>
                  <option value="product_only">Apenas Envio do Produto (Seeding)</option>
                </select>
              </div>

              {commissionType === 'fixed' && (
                <Input
                  label="Valor do Cachê por Creator (R$)"
                  type="number"
                  value={commissionValue}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCommissionValue(val);
                    setBudget(val * creatorSlots);
                  }}
                  required
                />
              )}

              {commissionType === 'percentage' && (
                <Input
                  label="Porcentagem de Comissão (%)"
                  type="number"
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(Number(e.target.value))}
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Quantidade de Vagas (Creators)"
                type="number"
                value={creatorSlots}
                onChange={(e) => {
                  const slots = Number(e.target.value);
                  setCreatorSlots(slots);
                  if (commissionType === 'fixed') setBudget(commissionValue * slots);
                }}
                required
              />

              <Input
                label="Prazo Final de Candidaturas"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>

            <Textarea
              label="Entregas Exigidas (Deliverables)"
              value={deliverablesText}
              onChange={(e) => setDeliverablesText(e.target.value)}
              rows={2}
              required
            />

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                ← Voltar
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Próxima Etapa: Requisitos de Perfil →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Requirements & Final Review */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <Textarea
              label="Requisitos Desejados para as Creators"
              value={requirementsText}
              onChange={(e) => setRequirementsText(e.target.value)}
              placeholder="Ex: Mínimo 5.000 seguidores, gravação com luz branca, experiência com unhas em gel..."
              rows={3}
              required
            />

            <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                Resumo da Campanha
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <p><strong>Título:</strong> {title}</p>
                <p><strong>Tipo:</strong> {campaignType}</p>
                <p><strong>Vagas:</strong> {creatorSlots} Nail Creators</p>
                <p><strong>Cachê / Benefício:</strong> R$ {commissionValue}</p>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                ← Voltar
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Publicar Campanha Agora
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
};
