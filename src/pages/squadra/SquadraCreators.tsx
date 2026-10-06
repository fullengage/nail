import React, { useState, useMemo } from 'react';
import { TikTokLink, InstagramLink } from '../../components/ui/TikTokLink';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CreatorProfile } from '../../types/database';
import {
  Search,
  Filter,
  Download,
  Upload,
  UserPlus,
  Tag,
  CheckSquare,
  Square,
  LayoutGrid,
  List,
  Video,
  Mail,
  Phone,
  Award,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  DollarSign,
  CreditCard,
  QrCode,
  Receipt,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  Copy
} from 'lucide-react';
import { Instagram } from '../../components/ui/Icons';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CampaignType } from '../../types/database';
import { audienceQuality, followersOf, sizeOf, SIZES, SizeKey } from '../../lib/creatorQuality';
import { useRules } from '../../components/campaign/CampaignBuilder';
import { CreatorAnalytics } from '../../components/creator/CreatorAnalytics';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';

const QualityBadge: React.FC<{ c: CreatorProfile }> = ({ c }) => {
  const q = audienceQuality(c);
  return (
    <span title={q.why} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${q.cls}`}>
      <ShieldCheck className="w-3 h-3" />{q.label}{c.engagement_rate ? ` · ${c.engagement_rate}%` : ''}
    </span>
  );
};

interface SquadraCreatorsProps {
  onNavigate?: (view: string) => void;
}

export const SquadraCreators: React.FC<SquadraCreatorsProps> = ({ onNavigate }) => {
  const { creators, campaigns, addCreatorTags, createSquadFromCreators, importCreatorsCsv, addCreator, deleteCreator, createCampaign } = useData();
  const { role } = useAuth();
  // contato direto (e-mail/WhatsApp) é só do time Squad UGC: empresas nunca veem, nem vazio
  const canSeeContacts = role === 'admin_master' || role === 'admin';
  // Importar e Exportar CSV são restritos exclusivamente ao Admin Geral (evita vazamento de base para empresas/contratantes)
  const canManageCsv = role === 'admin_master' || role === 'admin';
  const rules = useRules();

  // Estados de visualização e filtros
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [minFollowers, setMinFollowers] = useState<string>('');
  const [platform, setPlatform] = useState<'all' | 'tiktok' | 'instagram' | 'both'>('all');
  const [size, setSize] = useState<'all' | SizeKey>('all');
  const [quality, setQuality] = useState<'all' | 'real' | 'alta'>('all');
  const [maxFollowers, setMaxFollowers] = useState<string>('');
  const [minScore, setMinScore] = useState<string>('0');
  const [contactFilter, setContactFilter] = useState<'all' | 'email' | 'whatsapp' | 'any'>('all');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Seleção múltipla
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const firstOpen = campaigns.find((c) => (c.occupied_slots || 0) < (c.creator_slots || 0)) || campaigns[0];
  const [targetCampaignId, setTargetCampaignId] = useState(firstOpen?.id || '');
  const [squadFee, setSquadFee] = useState<string>(() => String(firstOpen?.commission_value || '250'));
  const [squadMode, setSquadMode] = useState<'new_campaign' | 'existing_campaign'>(() => campaigns.length > 0 ? 'existing_campaign' : 'new_campaign');
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampObjective, setNewCampObjective] = useState('');
  const [newCampType, setNewCampType] = useState<CampaignType>('ugc');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'credit_card'>('pix');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{
    invoiceId: string;
    campaignId: string;
    campaignTitle: string;
    creatorsCount: number;
    subtotal: number;
    fee: number;
    total: number;
    pixCode: string;
    paymentMethod: string;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Detalhe de Creator (Modal /creators/:id)
  const [detailCreator, setDetailCreator] = useState<CreatorProfile | null>(null);
  useLockBodyScroll(!!detailCreator, () => setDetailCreator(null));

  // Novo Creator (Modal de Adição Direta)
  const [isAddCreatorModalOpen, setIsAddCreatorModalOpen] = useState(false);
  const [newCreatorForm, setNewCreatorForm] = useState({
    professional_name: '',
    tiktok: '',
    instagram: '',
    tiktok_followers: '10000',
    specialties: 'Nail Designer',
    tier: 'A',
    email: '',
    phone: '',
    bio: '',
  });

  // Notificação toast simples
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSaveCreator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreatorForm.professional_name.trim() && !newCreatorForm.tiktok.trim()) {
      alert('Informe ao menos o nome profissional ou @ do TikTok.');
      return;
    }
    const tags = [
      newCreatorForm.tier === 'A' ? 'A - Prioritário (Top Live)' : newCreatorForm.tier === 'B' ? 'B - Qualificado' : 'C - Fora do perfil',
      newCreatorForm.specialties
    ];
    addCreator({
      professional_name: newCreatorForm.professional_name.trim() || newCreatorForm.tiktok.trim(),
      tiktok: newCreatorForm.tiktok.trim().replace(/^@/, ''),
      instagram: newCreatorForm.instagram.trim().replace(/^@/, ''),
      tiktok_followers: Number(newCreatorForm.tiktok_followers || 0),
      specialties: [newCreatorForm.specialties],
      tags,
      email: newCreatorForm.email.trim(),
      phone: newCreatorForm.phone.trim(),
      bio: newCreatorForm.bio.trim() || 'Creator qualificado para campanhas UGC e live commerce.',
      operational_score: newCreatorForm.tier === 'A' ? 95 : newCreatorForm.tier === 'B' ? 82 : 65,
      engagement_rate: 0,
    });
    setIsAddCreatorModalOpen(false);
    setNewCreatorForm({
      professional_name: '',
      tiktok: '',
      instagram: '',
      tiktok_followers: '10000',
      specialties: 'Nail Designer',
      tier: 'A',
      email: '',
      phone: '',
      bio: '',
    });
    showToast('Novo creator adicionado com sucesso! Métricas atualizadas.');
  };

  const handleDeleteCreator = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o creator "${name}" da base? O painel e métricas serão recalculados imediatamente.`)) {
      deleteCreator(id);
      showToast(`Creator ${name} removido com sucesso.`);
    }
  };

  // Filtragem dos creators
  const filteredCreators = useMemo(() => {
    return creators.filter((c) => {
      // 1. Busca textual
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = c.professional_name.toLowerCase().includes(q);
        const matchesHandle = (c.tiktok || '').toLowerCase().includes(q) || (c.instagram || '').toLowerCase().includes(q);
        const matchesBio = (c.bio || '').toLowerCase().includes(q);
        if (!matchesName && !matchesHandle && !matchesBio) return false;
      }

      // 2. Faixa / Tier
      if (selectedTier !== 'all') {
        const tags = c.tags || [];
        if (selectedTier === 'A' && !tags.some(t => t.includes('A - Prioritário'))) return false;
        if (selectedTier === 'B' && !tags.some(t => t.includes('B - Qualificado'))) return false;
        if (selectedTier === 'C' && !tags.some(t => t.includes('C - Fora do perfil'))) return false;
        if (selectedTier === 'live' && !tags.includes('Vendas por live') && !c.accepts_live_campaigns) return false;
        if (selectedTier === 'shop' && !tags.includes('TikTok Shop')) return false;
        if (selectedTier === 'ugc' && !tags.includes('UGC/publi') && !tags.includes('UGC')) return false;
        if (selectedTier === 'feira' && !tags.includes('origem:feira-influence')) return false;
      }

      // 3. Nicho
      if (selectedNiche !== 'all') {
        const specialties = c.specialties || [];
        const tags = c.tags || [];
        if (!specialties.includes(selectedNiche) && !tags.includes(selectedNiche)) return false;
      }

      // 4. Seguidores
      const followers = followersOf(c);
      if (size !== 'all' && sizeOf(followers) !== size) return false;
      if (platform === 'tiktok' && !c.tiktok) return false;
      if (platform === 'instagram' && !c.instagram) return false;
      if (platform === 'both' && !(c.tiktok && c.instagram)) return false;
      if (quality !== 'all') {
        const k = audienceQuality(c).key;
        if (quality === 'alta' ? k !== 'alta' : k !== 'alta' && k !== 'real') return false;
      }
      if (minFollowers && followers < Number(minFollowers)) return false;
      if (maxFollowers && followers > Number(maxFollowers)) return false;

      // 5. Pontuação Operacional
      if (minScore !== '0' && (c.operational_score || 0) < Number(minScore)) return false;

      // 6. Contatos
      if (contactFilter === 'email' && !c.email) return false;
      if (contactFilter === 'whatsapp' && !c.phone) return false;
      if (contactFilter === 'any' && !c.email && !c.phone) return false;

      return true;
    });
  }, [creators, search, selectedTier, selectedNiche, minFollowers, maxFollowers, minScore, contactFilter, platform, size, quality]);

  // Paginação
  const totalPages = Math.ceil(filteredCreators.length / pageSize) || 1;
  const paginatedCreators = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCreators.slice(start, start + pageSize);
  }, [filteredCreators, currentPage, pageSize]);

  // Toggle Seleção
  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedCreators.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCreators.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Exportar CSV dos Creators Filtrados
  const handleExportCsv = () => {
    if (!canManageCsv) return;
    // empresas exportam sem e-mail/WhatsApp (contato direto é só do time Squad UGC)
    const headers = ['Nome', 'TikTok', 'Instagram', 'Seguidores_TikTok', 'Engajamento_%', 'Pontuacao_Operacional', 'Nicho', ...(canSeeContacts ? ['Email', 'WhatsApp'] : []), 'Cidade', 'Estado'];
    const rows = filteredCreators.map(c => [
      `"${c.professional_name.replace(/"/g, '""')}"`,
      `"${c.tiktok || ''}"`,
      `"${c.instagram || ''}"`,
      c.tiktok_followers || 0,
      c.engagement_rate || 0,
      c.operational_score || 0,
      `"${(c.specialties?.[0] || 'Geral').replace(/"/g, '""')}"`,
      ...(canSeeContacts ? [`"${c.email || ''}"`, `"${c.phone || ''}"`] : []),
      `"${c.city || ''}"`,
      `"${c.state || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `squadra_creators_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${filteredCreators.length} creators exportados em CSV com sucesso!`);
  };

  // Importar CSV com Deduplicação
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canManageCsv) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length <= 1) return;

      const items: Partial<CreatorProfile>[] = [];
      // Ignora header
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols[0]) {
          items.push({
            professional_name: cols[0],
            // ponytail: só o que veio no CSV — sem valores padrão inventados
            tiktok: cols[1] || '',
            instagram: cols[2] || '',
            tiktok_followers: Number(cols[3]) || 0,
            engagement_rate: Number(cols[4]) || 0,
            operational_score: Number(cols[5]) || 0,
            specialties: cols[6] ? [cols[6]] : [],
            email: cols[7] || '',
            phone: cols[8] || '',
            city: cols[9] || '',
            state: cols[10] || ''
          });
        }
      }

      const res = importCreatorsCsv(items);
      showToast(`Importação concluída: ${res.added} novos creators adicionados (${res.duplicates} duplicados ignorados)`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Executar Ações em Massa
  const handleApplyBulkTags = () => {
    if (!newTagInput.trim()) return;
    addCreatorTags(selectedIds, [newTagInput.trim()]);
    setIsBulkTagModalOpen(false);
    setNewTagInput('');
    showToast(`Tag aplicada com sucesso a ${selectedIds.length} creators!`);
    setSelectedIds([]);
  };

  // Resumo financeiro e de cobrança do squad
  const feePerCreator = Number(squadFee) || 250;
  const countSelected = selectedIds.length;
  const subtotalCreators = countSelected * feePerCreator;
  const platformFee = Math.round(subtotalCreators * rules.fee_pct) / 100; // taxa da Squad sobre cachês aprovados (squad_settings)
  const totalSquadInvestment = subtotalCreators + platformFee;
  const pixDiscount = Math.round(totalSquadInvestment * 0.05);
  const finalPayable = totalSquadInvestment; // estimativa, sem desconto de pagamento (não há cobrança na plataforma)

  const targetCampaign = campaigns.find((c) => c.id === targetCampaignId);
  const freeSlots = targetCampaign ? Math.max(0, (targetCampaign.creator_slots || 0) - (targetCampaign.occupied_slots || 0)) : Infinity;
  const willAdd = squadMode === 'new_campaign' ? countSelected : Math.min(countSelected, freeSlots);
  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  // convidar ≠ contratar: o creator precisa aceitar as condições e a marca confirmar.
  // Nada de fatura/PIX aqui: o pagamento acontece depois da entrega aprovada, fora da plataforma.
  const handleConfirmAndHireSquad = async () => {
    if (selectedIds.length === 0) return;
    if (squadMode === 'new_campaign' || !targetCampaignId) {
      // campanha nova: monta no assistente; os escolhidos ficam pré-selecionados para convidar após publicar
      sessionStorage.setItem('squad_pending_invites', JSON.stringify(selectedIds));
      setIsSquadModalOpen(false);
      setSelectedIds([]);
      onNavigate?.('brand-create-campaign');
      return;
    }
    if (!['open', 'selecting', 'in_progress'].includes(targetCampaign?.status || '')) {
      showToast('Publique a campanha antes de convidar creators.');
      return;
    }
    createSquadFromCreators(targetCampaignId, selectedIds, feePerCreator);
    showToast(`${countSelected} creator(s) convidado(s) para "${targetCampaign?.title}". Eles veem o convite ao entrar; nenhum e-mail foi enviado.`);
    setIsSquadModalOpen(false);
    setSelectedIds([]);
    sessionStorage.setItem('squadra_open_campaign', targetCampaignId);
    onNavigate?.('campaigns');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            Diretório de Creators
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Base ativa de <strong>{creators.length} creators</strong> minerados e qualificados para campanhas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Import / Export CSV e Novo Creator - Apenas Admin Geral (evita vazamento de base para empresas) */}
          {canManageCsv && (
            <>
              <button
                onClick={() => setIsAddCreatorModalOpen(true)}
                className="px-3.5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl text-xs transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Creator</span>
              </button>

              <label className="cursor-pointer px-3 py-2 bg-card hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all shadow-sm flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Importar CSV</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
              </label>

              <button
                onClick={handleExportCsv}
                className="px-3 py-2 bg-card hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Exportar CSV</span>
              </button>
            </>
          )}

          {/* Toggle View Mode */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground'}`}
              title="Visualização em Tabela"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground'}`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros Avançados */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Busca Textual */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Buscar por @, nome, bio ou especialidade..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>

          {/* Faixa / Tier */}
          <div>
            <select
              value={selectedTier}
              onChange={(e) => { setSelectedTier(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-none text-foreground"
            >
              <option value="all">Todas as Faixas</option>
              <option value="A">Faixa A - Prioritário</option>
              <option value="B">Faixa B - Qualificado</option>
              <option value="C">Faixa C - Fora do Perfil</option>
              <option value="live">🔴 Vendem por Live</option>
              <option value="shop">🛒 Vendem no TikTok Shop</option>
              <option value="ugc">🎥 Fazem UGC / publi</option>
              <option value="feira">🤝 Lista da feira de influência</option>
            </select>
          </div>

          {/* Nicho */}
          <div>
            <select
              value={selectedNiche}
              onChange={(e) => { setSelectedNiche(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-none text-foreground"
            >
              <option value="all">Todos os Nichos</option>
              <option value="Bem-estar">Bem-estar</option>
              <option value="Academia">Academia</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Suplementação">Suplementação</option>
              <option value="Corrida/Triatlo">Corrida / Esporte</option>
              <option value="Beleza">Beleza & Unhas</option>
            </select>
          </div>

          {/* Pontuação Operacional Mínima */}
          <div>
            <select
              value={minScore}
              onChange={(e) => { setMinScore(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-none text-foreground"
            >
              <option value="0">Pontuação Operacional: Todos</option>
              <option value="50">Score ≥ 50</option>
              <option value="70">Score ≥ 70 (Qualificados)</option>
              <option value="90">Score ≥ 90 (Top Performance)</option>
            </select>
          </div>

          {/* Contato Disponível (só time Squad UGC) */}
          {canSeeContacts && <div>
            <select
              value={contactFilter}
              onChange={(e) => { setContactFilter(e.target.value as any); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-none text-foreground"
            >
              <option value="all">Contatos: Todos</option>
              <option value="email">Com E-mail</option>
              <option value="whatsapp">Com WhatsApp</option>
              <option value="any">Com E-mail ou WhatsApp</option>
            </select>
          </div>}

        </div>

        {/* Faixa de seguidores & Limpeza */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-border/60 gap-2">
          <div className="flex items-center space-x-2">
            <select value={platform} onChange={(e) => { setPlatform(e.target.value as any); setCurrentPage(1); }} className="px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground">
              <option value="all">Rede: todas</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="both">TikTok + Instagram</option>
            </select>
            <select value={size} onChange={(e) => { setSize(e.target.value as any); setCurrentPage(1); }} className="px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground">
              <option value="all">Porte: todos</option>
              {(Object.keys(SIZES) as SizeKey[]).map((k) => <option key={k} value={k}>{SIZES[k].label}</option>)}
            </select>
            <select value={quality} onChange={(e) => { setQuality(e.target.value as any); setCurrentPage(1); }} className="px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground">
              <option value="all">Audiência: todas</option>
              <option value="real">Só audiência real (1%+)</option>
              <option value="alta">Só audiência engajada (3%+)</option>
            </select>
            <span className="text-muted-foreground font-semibold">Seguidores:</span>
            <input
              type="number"
              value={minFollowers}
              onChange={(e) => { setMinFollowers(e.target.value); setCurrentPage(1); }}
              placeholder="Min"
              className="w-20 px-2 py-1 bg-background border border-border rounded-lg text-xs"
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="number"
              value={maxFollowers}
              onChange={(e) => { setMaxFollowers(e.target.value); setCurrentPage(1); }}
              placeholder="Max"
              className="w-24 px-2 py-1 bg-background border border-border rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center space-x-3 text-muted-foreground">
            <span>Mostrando <strong>{filteredCreators.length}</strong> de {creators.length} creators</span>
            {(search || selectedTier !== 'all' || selectedNiche !== 'all' || minFollowers || maxFollowers || minScore !== '0' || contactFilter !== 'all' || platform !== 'all' || size !== 'all' || quality !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedTier('all');
                  setSelectedNiche('all');
                  setMinFollowers('');
                  setMaxFollowers('');
                  setMinScore('0');
                  setContactFilter('all');
                  setPlatform('all');
                  setSize('all');
                  setQuality('all');
                  setCurrentPage(1);
                }}
                className="text-primary hover:underline font-bold text-xs"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Ações em Massa (Quando itens estão selecionados) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-foreground">
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px]">
              {selectedIds.length}
            </span>
            <span>creators selecionados</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsBulkTagModalOpen(true)}
              className="px-3 py-1.5 bg-card hover:bg-muted border border-border rounded-xl text-xs font-bold text-foreground flex items-center space-x-1"
            >
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>Adicionar Tag</span>
            </button>
            <button
              onClick={() => setIsSquadModalOpen(true)}
              className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-black rounded-full text-xs font-bold flex items-center space-x-1 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Convidar para campanha ({selectedIds.length})</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* 4. Tabela de Creators */}
      {viewMode === 'table' ? (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 w-8 text-center">
                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                      {selectedIds.length === paginatedCreators.length && paginatedCreators.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="pb-3 pl-2">Creator & Handle</th>
                  <th className="pb-3 text-center">Pontuação Operacional</th>
                  <th className="pb-3 text-right">Seguidores TikTok</th>
                  <th className="pb-3 text-center">Audiência</th>
                  <th className="pb-3 text-left">Nicho & Tags</th>
                  {canSeeContacts && <th className="pb-3 text-center">Contatos</th>}
                  <th className="pb-3 text-right pr-2">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedCreators.map((creator) => {
                  const isSelected = selectedIds.includes(creator.id);
                  const isTierA = (creator.tags || []).some(t => t.includes('A - Prioritário'));

                  return (
                    <tr
                      key={creator.id}
                      className={`hover:bg-muted/40 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 text-center">
                        <button onClick={() => toggleSelect(creator.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </td>

                      {/* Creator */}
                      <td className="py-3 pl-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 border border-border text-xs">
                            {creator.professional_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <div className="flex items-center space-x-1.5">
                              <p className="font-bold text-foreground truncate cursor-pointer hover:text-primary" onClick={() => setDetailCreator(creator)}>
                                {creator.professional_name}
                              </p>
                              {isTierA && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                                  TIER A
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium truncate">
                              <TikTokLink handle={creator.tiktok} />
                              {creator.instagram && <> · <InstagramLink handle={creator.instagram} /></>}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Pontuação Operacional */}
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                          (creator.operational_score || 0) >= 80
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : (creator.operational_score || 0) >= 60
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          <Award className="w-3 h-3 mr-1" />
                          {creator.operational_score || '—'}
                        </span>
                      </td>

                      {/* Seguidores */}
                      <td className="py-3 text-right font-semibold text-foreground">
                        {(creator.tiktok_followers || creator.instagram_followers || 0).toLocaleString('pt-BR')}
                      </td>

                      {/* Engajamento */}
                      <td className="py-3 text-center">
                        <QualityBadge c={creator} />
                      </td>

                      {/* Nicho & Tags */}
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          <Badge variant="secondary" size="sm">
                            {creator.specialties?.[0] || (creator.tags || []).find((t) => !/^(origem:|[ABC] - |micro|médio|macro)/.test(t)) || 'UGC'}
                          </Badge>
                          {(creator.tags || []).slice(0, 1).map((t, idx) => (
                            <span key={idx} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Contatos (só time Squad UGC) */}
                      {canSeeContacts && <td className="py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {creator.email ? (
                            <a href={`mailto:${creator.email}`} title={creator.email} className="p-1 rounded-md bg-muted text-foreground hover:text-primary">
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="p-1 text-muted-foreground/30"><Mail className="w-3.5 h-3.5" /></span>
                          )}
                          {creator.phone ? (
                            <a href={`https://wa.me/${creator.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title={creator.phone} className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="p-1 text-muted-foreground/30"><Phone className="w-3.5 h-3.5" /></span>
                          )}
                        </div>
                      </td>}

                      {/* Ação */}
                      <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setDetailCreator(creator)}
                            className="px-2.5 py-1 rounded-lg bg-card hover:bg-primary hover:text-black border border-border text-[11px] font-bold transition-all"
                          >
                            Ver Perfil
                          </button>
                          {canManageCsv && (
                            <button
                              onClick={() => handleDeleteCreator(creator.id, creator.professional_name)}
                              title="Remover Creator"
                              className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
            <span className="text-muted-foreground">
              Página <strong>{currentPage}</strong> de {totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted text-xs font-semibold"
              >
                Anterior
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted text-xs font-semibold"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Visualização em Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedCreators.map((creator) => {
            const isSelected = selectedIds.includes(creator.id);
            return (
              <div
                key={creator.id}
                className={`p-4 rounded-2xl bg-card border transition-all space-y-3 relative group ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
                }`}
              >
                <button
                  onClick={() => toggleSelect(creator.id)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                    {creator.professional_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 pr-6">
                    <p className="font-bold text-foreground text-xs truncate cursor-pointer hover:text-primary" onClick={() => setDetailCreator(creator)}>
                      {creator.professional_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate"><TikTokLink handle={creator.tiktok} /></p>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2 h-8">
                  {creator.bio}
                </p>

                <div className="grid grid-cols-3 gap-1 py-2 bg-muted/30 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Seguidores</span>
                    <span className="text-xs font-bold text-foreground">
                      {followersOf(creator) >= 1000 ? `${Math.round(followersOf(creator) / 1000).toLocaleString('pt-BR')}k` : followersOf(creator)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Score</span>
                    <span className="text-xs font-bold text-emerald-600">{creator.operational_score || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Engaj.</span>
                    <span className="text-xs font-bold text-foreground">{creator.engagement_rate ? `${creator.engagement_rate}%` : '—'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Badge variant="secondary" size="sm">
                    {creator.specialties?.[0] || (creator.tags || []).find((t) => !/^(origem:|[ABC] - |micro|médio|macro)/.test(t)) || 'UGC'}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setDetailCreator(creator)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Ver detalhes
                    </button>
                    {canManageCsv && (
                      <button
                        onClick={() => handleDeleteCreator(creator.id, creator.professional_name)}
                        title="Remover Creator"
                        className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Adicionar Tag em Massa */}
      {isBulkTagModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-display text-foreground text-base">Adicionar Tag em Massa</h3>
              <button onClick={() => setIsBulkTagModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              A tag será aplicada aos <strong>{selectedIds.length} creators selecionados</strong>.
            </p>
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="Ex: Squad Black Friday, Top Live, Seeding SP..."
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="secondary" onClick={() => setIsBulkTagModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleApplyBulkTags}>Aplicar Tag</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Contratar Squad, Orçamento Transparente & Cobrança */}
      {isSquadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            
            {/* Cabeçalho */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-black">
                    Squad de {countSelected} Creators
                  </span>
                  <span className="text-[11px] text-muted-foreground">Proposta & Orçamento</span>
                </div>
                <h3 className="font-bold font-display text-foreground text-xl mt-1">
                  Convidar creators para uma campanha
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Escolha a campanha e veja a estimativa de custo. Os creators só entram depois de aceitar as condições.
                </p>
              </div>
              <button
                onClick={() => setIsSquadModalOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Destino do Squad: Nova Campanha vs Campanha Existente */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                1. Onde este squad vai atuar?
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSquadMode('new_campaign')}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    squadMode === 'new_campaign'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border hover:border-muted-foreground/30 bg-card'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Criar Nova Campanha</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Ideal para um novo lançamento ou ação com estes {countSelected} creators.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSquadMode('existing_campaign')}
                  disabled={campaigns.length === 0}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    campaigns.length === 0
                      ? 'opacity-40 cursor-not-allowed border-border'
                      : squadMode === 'existing_campaign'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border hover:border-muted-foreground/30 bg-card'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Campanha Aberta ({campaigns.length})</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {campaigns.length === 0
                      ? 'Nenhuma campanha cadastrada ainda.'
                      : 'Alocar este squad dentro de uma campanha já existente.'}
                  </p>
                </button>
              </div>

              {/* Campos se for Nova Campanha */}
              {squadMode === 'new_campaign' && (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3 animate-in fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Nome da Campanha *</label>
                    <input
                      type="text"
                      value={newCampTitle}
                      onChange={(e) => setNewCampTitle(e.target.value)}
                      placeholder={`Ex: Lançamento Coleção Outono — ${countSelected} Creators`}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Formato de Produção</label>
                      <select
                        value={newCampType}
                        onChange={(e) => setNewCampType(e.target.value as CampaignType)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
                      >
                        <option value="ugc">Vídeos Curtos UGC (Reels / TikTok)</option>
                        <option value="live_commerce">Live Commerce (TikTok Shop / Instagram)</option>
                        <option value="product_seeding">Envio de Produto (Seeding)</option>
                        <option value="paid_content">Publicidade Paga (Perfil do Creator)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Objetivo Mensurável</label>
                      <input
                        type="text"
                        value={newCampObjective}
                        onChange={(e) => setNewCampObjective(e.target.value)}
                        placeholder="Ex: 20 vídeos de prova social e conversão"
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Se for Campanha Existente */}
              {squadMode === 'existing_campaign' && (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                  <label className="text-xs font-semibold text-foreground">Selecione a Campanha</label>
                  <select
                    value={targetCampaignId}
                    onChange={(e) => {
                      setTargetCampaignId(e.target.value);
                      const c = campaigns.find((x) => x.id === e.target.value);
                      if (c?.commission_value) setSquadFee(String(c.commission_value));
                    }}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  >
                    {campaigns.map((c) => {
                      const free = Math.max(0, (c.creator_slots || 0) - (c.occupied_slots || 0));
                      return (
                        <option key={c.id} value={c.id} disabled={free === 0}>
                          {c.title} — {free === 0 ? 'lotada' : `${free} vagas livres`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* 2. Régua de Cachê por Creator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Cachê por Creator (Remuneração Direta)
                </label>
                <span className="text-[11px] text-emerald-600 font-semibold">100% repassado aos creators</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'UGC Básico', val: '150', sub: 'Iniciantes / Seeding' },
                  { label: 'UGC Pro (Recomendado)', val: '250', sub: 'Técnicas + Roteiro', rec: true },
                  { label: 'Live / Top Creator', val: '350', sub: 'Lives de 1h+ ou Faixa A' }
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setSquadFee(item.val)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      squadFee === item.val
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border hover:border-muted-foreground/30 bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">R$ {item.val}</span>
                      {item.rec && <span className="text-[9px] bg-primary text-black px-1.5 py-0.2 rounded font-extrabold">TOP</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.sub}</p>
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <span className="text-xs text-muted-foreground">Ou digite outro valor:</span>
                <div className="relative max-w-[140px]">
                  <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">R$</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={squadFee}
                    onChange={(e) => setSquadFee(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Discriminativo de Cobrança Transparente (Como nós cobramos & quanto paga) */}
            <div className="p-4 rounded-2xl bg-card border-2 border-border shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Demonstrativo Financeiro do Squad
                </span>
                <span className="text-xs font-bold text-foreground">{countSelected} Creators</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Cachê dos Creators ({countSelected} × {brl(feePerCreator)})</span>
                  <span className="font-semibold text-foreground">{brl(subtotalCreators)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center">
                    <span>Taxa Squad UGC ({rules.fee_pct}% sobre cachês aprovados)</span>
                  </span>
                  <span className="font-semibold text-foreground">{brl(platformFee)}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold font-display text-foreground">Estimativa se todos forem contratados</span>
                    <span className="text-[10px] text-muted-foreground block">Taxa confirmada na proposta. Nada é cobrado agora.</span>
                  </div>
                  <span className="text-2xl font-extrabold font-display text-primary">
                    {brl(finalPayable)}
                  </span>
                </div>
              </div>
            </div>

            {/* Como funciona o pagamento (sem cobrança aqui) */}
            <div className="p-3.5 rounded-2xl bg-muted/50 border border-border text-[11px] text-foreground leading-relaxed">
              <strong>Isto é um convite, não uma contratação.</strong> Cada creator vê as condições, aceita ou não, e você escolhe quem contratar na campanha.
              O cachê é pago por você depois de aprovar a entrega (fora da plataforma) e informado no painel. Nenhum valor é cobrado agora.
            </div>

            {/* Rodapé com Ações */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsSquadModalOpen(false)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2"
              >
                Voltar e alterar seleção
              </button>

              <Button
                onClick={handleConfirmAndHireSquad}
                disabled={willAdd === 0}
                className="bg-primary hover:bg-primary/90 text-black font-bold border-2 border-black rounded-full px-6 py-2.5 shadow-lg flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{squadMode === 'new_campaign' ? 'Criar campanha com estes creators' : `Convidar ${countSelected} creator(s)`}</span>
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 2.1: Fatura Gerada & Confirmação de Contratação */}
      {isInvoiceModalOpen && invoiceData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border-2 border-primary/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500 text-white inline-block">
                Fatura Gerada com Sucesso
              </span>
              <h3 className="font-bold font-display text-foreground text-xl">
                Squad Contratado Oficialmente!
              </h3>
              <p className="text-xs text-muted-foreground">
                Fatura <strong>{invoiceData.invoiceId}</strong> emitida para {invoiceData.creatorsCount} creators na campanha <strong>{invoiceData.campaignTitle}</strong>.
              </p>
            </div>

            {/* Detalhes da Fatura */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Forma Escolhida:</span>
                <span className="font-bold text-foreground">{invoiceData.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cachês dos Creators:</span>
                <span className="font-semibold text-foreground">{brl(invoiceData.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa Squad UGC ({rules.fee_pct}%):</span>
                <span className="font-semibold text-foreground">{brl(invoiceData.fee)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-baseline font-bold text-sm">
                <span>Total a Pagar:</span>
                <span className="text-lg text-primary">{brl(invoiceData.total)}</span>
              </div>
            </div>

            {/* Código PIX Copia e Cola */}
            {paymentMethod === 'pix' && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center space-x-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>Chave PIX Copia e Cola</span>
                  </span>
                  <span className="text-[11px] text-emerald-600">5% OFF aplicado</span>
                </div>
                <div className="p-2.5 bg-background border border-border rounded-xl font-mono text-[11px] text-muted-foreground break-all select-all">
                  {invoiceData.pixCode}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(invoiceData.pixCode);
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 3000);
                  }}
                  className="w-full py-2 bg-primary text-black font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedPix ? 'Código PIX Copiado!' : 'Copiar Código PIX'}</span>
                </button>
              </div>
            )}

            {/* Botão de Conclusão */}
            <div className="pt-2">
              <Button
                onClick={() => {
                  setIsInvoiceModalOpen(false);
                  sessionStorage.setItem('squadra_open_campaign', invoiceData.campaignId);
                  onNavigate?.('campaigns');
                }}
                className="w-full py-3 bg-black text-white hover:bg-black/90 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>Acessar Campanha & Acompanhar Squad</span>
                <ChevronRight className="w-4 h-4 text-primary" />
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 3: Detalhe do Creator (/creators/:id) */}
      {detailCreator && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Perfil de ${detailCreator.professional_name}`} onClick={() => setDetailCreator(null)}>
          <div className="bg-background border border-border rounded-2xl max-w-4xl w-full p-4 sm:p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Perfil do creator</p>
              <button onClick={() => setDetailCreator(null)} aria-label="Fechar" className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <CreatorAnalytics
              key={detailCreator.id}
              creator={detailCreator}
              actions={<>
                <Button
                  size="sm"
                  onClick={() => {
                    createSquadFromCreators(campaigns[0]?.id || '', [detailCreator.id]);
                    setDetailCreator(null);
                    showToast(`${detailCreator.professional_name} convidado(a). Só entra no squad depois de aceitar as condições e você contratar.`);
                  }}
                >
                  Convidar para campanha
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  title="Mesmo porte, mesma rede e nicho, só audiência real"
                  onClick={() => {
                    // ponytail: parecido = mesmo porte + rede + nicho; similaridade por conteúdo quando houver embeddings
                    const d = detailCreator;
                    setSearch('');
                    setSelectedTier('all');
                    setSelectedNiche(d.specialties?.[0] || 'all');
                    setMinFollowers('');
                    setMaxFollowers('');
                    setSize(sizeOf(followersOf(d)));
                    setPlatform(d.tiktok && d.instagram ? 'both' : d.instagram ? 'instagram' : 'tiktok');
                    setQuality('real');
                    setCurrentPage(1);
                    setDetailCreator(null);
                    showToast(`Mostrando creators parecidos com ${d.professional_name}`);
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />Ver parecidos
                </Button>
              </>}
              privateSlot={canSeeContacts && (detailCreator.email || detailCreator.phone) ? (
                // contato direto: só time Squad UGC e só quando existe
                <div className="p-3 rounded-2xl bg-card border border-border space-y-1.5 text-xs">
                  <p className="text-[11px] font-bold uppercase text-muted-foreground">Contato (só admin)</p>
                  {detailCreator.email && <p className="flex justify-between gap-2"><span className="text-muted-foreground">E-mail</span><span className="font-semibold text-foreground break-all">{detailCreator.email}</span></p>}
                  {detailCreator.phone && <p className="flex justify-between gap-2"><span className="text-muted-foreground">WhatsApp</span><span className="font-semibold text-foreground">{detailCreator.phone}</span></p>}
                </div>
              ) : null}
            />
          </div>
        </div>
      )}

      {/* Modal 4: Novo Creator */}
      {isAddCreatorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold font-display text-foreground text-lg">Novo Creator</h3>
                <p className="text-xs text-muted-foreground">Cadastre um creator na base ativa. Os indicadores do Dashboard atualizarão em tempo real.</p>
              </div>
              <button onClick={() => setIsAddCreatorModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreator} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Nome Profissional *</label>
                  <input
                    type="text"
                    required
                    value={newCreatorForm.professional_name}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, professional_name: e.target.value })}
                    placeholder="Ex: Beatriz Lima Nails"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Nicho / Especialidade</label>
                  <select
                    value={newCreatorForm.specialties}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, specialties: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  >
                    <option value="Nail Designer">Nail Designer</option>
                    <option value="Unhas Decoradas">Unhas Decoradas</option>
                    <option value="Alongamento em Gel">Alongamento em Gel</option>
                    <option value="Manicure Tradicional">Manicure Tradicional</option>
                    <option value="Beleza & Cuidados">Beleza & Cuidados</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">@ TikTok</label>
                  <input
                    type="text"
                    value={newCreatorForm.tiktok}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, tiktok: e.target.value })}
                    placeholder="@beatriznails"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">@ Instagram</label>
                  <input
                    type="text"
                    value={newCreatorForm.instagram}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, instagram: e.target.value })}
                    placeholder="@beatriz.nails"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Seguidores</label>
                  <input
                    type="number"
                    value={newCreatorForm.tiktok_followers}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, tiktok_followers: e.target.value })}
                    placeholder="15000"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Faixa / Classificação</label>
                  <select
                    value={newCreatorForm.tier}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, tier: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  >
                    <option value="A">Faixa A - Prioritário (Top Live)</option>
                    <option value="B">Faixa B - Qualificado</option>
                    <option value="C">Faixa C - Geral</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={newCreatorForm.email}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, email: e.target.value })}
                    placeholder="contato@creator.com"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={newCreatorForm.phone}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Bio / Apresentação</label>
                <textarea
                  rows={2}
                  value={newCreatorForm.bio}
                  onChange={(e) => setNewCreatorForm({ ...newCreatorForm, bio: e.target.value })}
                  placeholder="Especialista em unhas decoradas e reviews de produtos para marcas de beleza..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-border">
                <Button type="button" variant="secondary" onClick={() => setIsAddCreatorModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Cadastrar Creator
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
