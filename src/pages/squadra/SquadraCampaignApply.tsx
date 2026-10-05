import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  Video,
  FileText,
  ArrowLeft,
  Paperclip,
  Check
} from 'lucide-react';
import { Instagram } from '../../components/ui/Icons';
import { Button } from '../../components/ui/Button';

interface SquadraCampaignApplyProps {
  slug?: string;
  onNavigate?: (view: string) => void;
}

export const SquadraCampaignApply: React.FC<SquadraCampaignApplyProps> = ({ slug, onNavigate }) => {
  const { campaigns } = useData();
  const querySlug = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('slug') || new URLSearchParams(window.location.search).get('campanha')) : null;
  const targetSlug = slug || querySlug;
  const campaign = campaigns.find(c => c.slug === targetSlug || c.id === targetSlug) || campaigns[0];

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    instagram: '',
    tiktok: '',
    followers: '',
    city: '',
    state: 'SP',
    message: '',
    mediaKitUrl: '',
    fileName: ''
  });

  const [submitted, setSubmitted] = useState(false);

  if (!campaign) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-display text-foreground">Campanha Não Encontrada</h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Nenhuma campanha aberta para inscrições públicas foi encontrada no momento ou as vagas já foram preenchidas.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          {onNavigate && (
            <Button onClick={() => onNavigate('landing')} variant="outline">
              Voltar ao Início
            </Button>
          )}
          {onNavigate && (
            <Button onClick={() => onNavigate('campaigns')}>
              Ver Campanhas no Painel
            </Button>
          )}
        </div>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        fileName: file.name,
        mediaKitUrl: `https://storage.squadra.app/mediakits/${file.name}`
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold font-display text-foreground">Inscrição Enviada com Sucesso!</h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Recebemos o seu perfil e mídia kit para a campanha <strong>"{campaign.title}"</strong>. Nossa equipe de curadoria analisará o seu perfil e entrará em contato via WhatsApp e e-mail.
        </p>
        <div className="pt-4">
          <Button onClick={() => setSubmitted(false)}>Enviar Nova Inscrição</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-300">
      
      {/* Topo / Voltar */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('campaigns')}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao painel</span>
        </button>
      )}

      {/* Banner da Campanha */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase">
            Inscrição Pública
          </span>
          <span className="text-xs text-muted-foreground">• Squad UGC Oficial</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
          {campaign.title}
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {campaign.description}
        </p>
        
        <div className="flex flex-wrap gap-4 pt-2 text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px]">Cachê Estimado</span>
            <span className="font-bold text-foreground">
              {(campaign.commission_value || 0) > 0 ? `R$ ${campaign.commission_value},00 fixo` : 'Envio de Produtos'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">Prazo de Inscrição</span>
            <span className="font-bold text-foreground">{campaign.application_deadline || 'A definir'}</span>
          </div>
        </div>
      </div>

      {/* Formulário de Inscrição */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-5 text-xs">
        <h2 className="text-lg font-bold font-display text-foreground">Preencha seus dados de Creator</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Nome Completo *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ex: Camila Rodriguez"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">E-mail Profissional *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seu@email.com"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">WhatsApp com DDD *</label>
            <input
              type="text"
              required
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="(11) 98765-4321"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Total de Seguidores</label>
            <input
              type="number"
              value={formData.followers}
              onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
              placeholder="Ex: 45000"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center space-x-1">
              <Instagram className="w-3.5 h-3.5 text-pink-600" />
              <span>@ do Instagram *</span>
            </label>
            <input
              type="text"
              required
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="@seu.perfil"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center space-x-1">
              <Video className="w-3.5 h-3.5 text-foreground" />
              <span>@ do TikTok</span>
            </label>
            <input
              type="text"
              value={formData.tiktok}
              onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
              placeholder="@seutiktok"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Cidade *</label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Ex: São Paulo"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Estado (UF) *</label>
            <input
              type="text"
              maxLength={2}
              required
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
              placeholder="SP"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
            />
          </div>
        </div>

        {/* Upload de Mídia Kit */}
        <div className="space-y-2">
          <label className="font-semibold text-foreground block">
            Upload do Mídia Kit ou Portfólio (PDF ou Imagem)
          </label>
          <label className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-muted/20 transition-all text-center">
            <Upload className="w-6 h-6 text-muted-foreground mb-2" />
            <span className="font-bold text-foreground">
              {formData.fileName ? formData.fileName : 'Clique para selecionar seu Mídia Kit'}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              Formatos aceitos: PDF, PNG, JPG (máx. 15MB)
            </span>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-foreground">Por que você gostaria de participar desta campanha?</label>
          <textarea
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Conte um pouco sobre seu estilo de conteúdo e afinidade com o produto..."
            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full py-3 text-sm font-bold shadow-md shadow-primary/20">
            Confirmar e Enviar Candidatura
          </Button>
        </div>
      </form>

    </div>
  );
};
