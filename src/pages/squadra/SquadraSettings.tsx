import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ScoreWeights, BrandProfile } from '../../types/database';
import {
  Building2,
  Package,
  ShieldCheck,
  CreditCard,
  Users,
  Sliders,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Bell,
  Truck,
  FileText,
  AlertCircle,
  ExternalLink,
  Globe,
  Sparkles,
  HelpCircle,
  Mail,
  Phone
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

// Configurações operacionais estendidas por marca
interface BrandSettingsData {
  // Logística de Kits
  shipping_address: string;
  shipping_number: string;
  shipping_complement: string;
  shipping_neighborhood: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  carrier_preference: string;
  unboxing_notes: string;
  auto_tracking: boolean;

  // Diretrizes de Conteúdo & Compliance
  required_hashtags: string;
  required_mentions: string;
  dos_guidelines: string;
  donts_guidelines: string;
  approval_required: boolean;
  max_review_hours: number;

  // Financeiro & Faturamento
  state_registration: string;
  billing_email: string;
  monthly_budget_cap: number;
  pix_key: string;
  pix_key_type: string;
  default_payout_model: 'fixed_pix' | 'hybrid' | 'seeding_only';

  // Alertas & Notificações
  notify_whatsapp: boolean;
  notify_email: boolean;
  alert_phone: string;
  alert_email: string;
}

const DEFAULT_BRAND_SETTINGS: BrandSettingsData = {
  shipping_address: 'Av. Paulista',
  shipping_number: '1842',
  shipping_complement: 'Torre Sul, 12º andar',
  shipping_neighborhood: 'Bela Vista',
  shipping_city: 'São Paulo',
  shipping_state: 'SP',
  shipping_zip: '01310-200',
  carrier_preference: 'correios',
  unboxing_notes: 'Grave abrindo a embalagem com iluminação natural. Mostre a textura do produto na mão ou aplicador. Não amasse a caixa original.',
  auto_tracking: true,

  required_hashtags: '#Publi #SquadUGC #ParceriaPaga',
  required_mentions: '@squadra_nutrition',
  dos_guidelines: '• Demonstrar a rotina matinal real;\n• Enfatizar a textura suave e absorção rápida;\n• Mencionar cupom com link nos Stories ou bio do TikTok;\n• Boa iluminação e áudio limpo sem eco.',
  donts_guidelines: '• Não fazer alegações médicas de cura ou tratamento de doenças (Conformidade ANVISA);\n• Não citar marcas concorrentes pelo nome;\n• Não gravar em ambientes desorganizados ou com barulho de fundo;\n• Não esquecer a sinalização de conteúdo publicitário (#Publi).',
  approval_required: true,
  max_review_hours: 48,

  state_registration: '110.234.567.890',
  billing_email: 'financeiro@example.com',
  monthly_budget_cap: 50000,
  pix_key: 'financeiro@example.com',
  pix_key_type: 'email',
  default_payout_model: 'fixed_pix',

  notify_whatsapp: true,
  notify_email: true,
  alert_phone: '',
  alert_email: 'marketing@example.com',
};

export const SquadraSettings: React.FC = () => {
  const { brands, selectedBrandId, setSelectedBrandId, updateBrand, scoreWeights, setScoreWeights } = useData();
  const { role } = useAuth();
  const isMasterAdmin = role === 'admin_master' || role === 'admin';

  // Marca ativa
  const currentBrand = brands.find((b) => b.id === selectedBrandId) || brands[0] || {
    id: 'brand-1',
    company_name: 'Squadra Nutrition Alimentos Funcionais Ltda',
    brand_name: 'Squadra Nutrition',
    cnpj: '48.912.345/0001-90',
    description: 'Suplementação limpa e nutrição esportiva de alta performance.',
    website: 'https://squadranutrition.com.br',
    instagram: '@squadra_nutrition',
    tiktok: '@squadra_fit',
    logo_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300',
    contact_name: 'Camila Brand Manager',
    contact_email: 'camila@example.com',
    contact_phone: '',
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
  };

  // Abas disponíveis
  type TabKey = 'brand' | 'logistics' | 'compliance' | 'financial' | 'team' | 'weights';
  const [activeTab, setActiveTab] = useState<TabKey>('brand');

  // Formulário do Perfil da Marca
  const [brandForm, setBrandForm] = useState({
    brand_name: currentBrand.brand_name || '',
    company_name: currentBrand.company_name || '',
    cnpj: currentBrand.cnpj || '',
    website: currentBrand.website || '',
    instagram: currentBrand.instagram || '',
    tiktok: currentBrand.tiktok || '',
    description: currentBrand.description || '',
    logo_url: currentBrand.logo_url || '',
    contact_name: currentBrand.contact_name || '',
    contact_email: currentBrand.contact_email || '',
    contact_phone: currentBrand.contact_phone || '',
    city: currentBrand.city || '',
    state: currentBrand.state || 'SP',
  });

  // Atualiza form se trocar de marca
  useEffect(() => {
    if (currentBrand) {
      setBrandForm({
        brand_name: currentBrand.brand_name || '',
        company_name: currentBrand.company_name || '',
        cnpj: currentBrand.cnpj || '',
        website: currentBrand.website || '',
        instagram: currentBrand.instagram || '',
        tiktok: currentBrand.tiktok || '',
        description: currentBrand.description || '',
        logo_url: currentBrand.logo_url || '',
        contact_name: currentBrand.contact_name || '',
        contact_email: currentBrand.contact_email || '',
        contact_phone: currentBrand.contact_phone || '',
        city: currentBrand.city || '',
        state: currentBrand.state || 'SP',
      });
    }
  }, [currentBrand.id]);

  // Configurações estendidas (persistidas no localStorage por marca)
  const [settings, setSettings] = useState<BrandSettingsData>(() => {
    const saved = localStorage.getItem(`squadra_brand_settings_${currentBrand.id}`);
    if (saved) {
      try {
        return { ...DEFAULT_BRAND_SETTINGS, ...JSON.parse(saved) };
      } catch (e) { /* fallback */ }
    }
    return DEFAULT_BRAND_SETTINGS;
  });

  // Membros da equipe da marca
  const [teamMembers, setTeamMembers] = useState([
    { id: '1', name: 'Camila Brand Manager', email: 'camila@example.com', role: 'Gestora de Marketing & Campanhas', status: 'Ativo' },
    { id: '2', name: 'Lucas Santos', email: 'lucas.conteudo@example.com', role: 'Analista de Conteúdo & Revisão de Vídeos', status: 'Ativo' },
    { id: '3', name: 'Juliana Costa', email: 'financeiro@example.com', role: 'Financeiro & Pagamentos PIX', status: 'Ativo' },
  ]);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Analista de Conteúdo & Revisão de Vídeos');

  // Pesos do algoritmo (para Admin Master)
  const [weights, setWeights] = useState<ScoreWeights>(scoreWeights);
  const totalWeight = weights.engagement + weights.audience + weights.nicheMatch + weights.deliveryHistory + weights.quality;

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Salvar Perfil da Marca
  const handleSaveBrandProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrand(currentBrand.id, brandForm);
    showToast('Identidade e dados cadastrais da marca salvos com sucesso!');
  };

  // Salvar Configurações Estendidas (Logística, Compliance, Financeiro)
  const handleSaveSettings = (sectionName: string) => {
    localStorage.setItem(`squadra_brand_settings_${currentBrand.id}`, JSON.stringify(settings));
    showToast(`${sectionName} atualizadas com sucesso!`);
  };

  // Convidar Membro para a Equipe
  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setTeamMembers([
      ...teamMembers,
      {
        id: String(Date.now()),
        name: newMemberName.trim() || newMemberEmail.split('@')[0],
        email: newMemberEmail.trim(),
        role: newMemberRole,
        status: 'Convite Enviado',
      }
    ]);
    setNewMemberEmail('');
    setNewMemberName('');
    showToast(`Convite de acesso enviado para ${newMemberEmail}!`);
  };

  // Remover Membro da Equipe
  const handleRemoveMember = (id: string, name: string) => {
    if (window.confirm(`Remover acesso de ${name}?`)) {
      setTeamMembers(prev => prev.filter(m => m.id !== id));
      showToast('Membro removido da equipe.');
    }
  };

  // Salvar Pesos Operacionais (Admin Master)
  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      showToast('A soma dos pesos deve totalizar exatamente 100%!');
      return;
    }
    setScoreWeights(weights);
    showToast('Pesos do algoritmo operacional atualizados!');
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

      {/* 1. Header & Seletor de Marca (Multiempresa) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            Configurações da Empresa
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gerencie identidade de marca, logística de envio de kits, compliance com creators e dados de faturamento.
          </p>
        </div>

        {/* Seletor de Marca para Admin Master */}
        {isMasterAdmin && brands.length > 1 && (
          <div className="flex items-center space-x-2 bg-card p-2 rounded-xl border border-border shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground">Empresa:</span>
            <select
              value={currentBrand.id}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="text-xs font-bold bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brand_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Abas de Navegação */}
      <div className="flex border-b border-border space-x-2 pb-px overflow-x-auto text-xs font-bold scrollbar-none">
        
        {/* Aba 1: Identidade da Marca */}
        <button
          onClick={() => setActiveTab('brand')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'brand' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Marca & Identidade</span>
        </button>

        {/* Aba 2: Logística de Kits */}
        <button
          onClick={() => setActiveTab('logistics')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'logistics' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Logística & Envio de Kits</span>
        </button>

        {/* Aba 3: Diretrizes & Compliance */}
        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'compliance' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Diretrizes & Compliance</span>
        </button>

        {/* Aba 4: Financeiro & Faturamento */}
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'financial' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Financeiro & Faturamento</span>
        </button>

        {/* Aba 5: Equipe & Alertas */}
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'team' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipe & Alertas ({teamMembers.length})</span>
        </button>

        {/* Aba 6: Algoritmo Master (Admin Master) */}
        {isMasterAdmin && (
          <button
            onClick={() => setActiveTab('weights')}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'weights' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Pesos do Algoritmo</span>
          </button>
        )}

      </div>

      {/* ========================================================================= */}
      {/* ABA 1: MARCA & IDENTIDADE */}
      {/* ========================================================================= */}
      {activeTab === 'brand' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold font-display text-foreground">
                  Perfil Oficial da Empresa
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estes dados são apresentados nos briefings, contratos digitais e termos de cessão de direitos de imagem.
                </p>
              </div>

              <form onSubmit={handleSaveBrandProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Nome Fantasia / Marca *</label>
                    <input
                      type="text"
                      required
                      value={brandForm.brand_name}
                      onChange={(e) => setBrandForm({ ...brandForm, brand_name: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Razão Social *</label>
                    <input
                      type="text"
                      required
                      value={brandForm.company_name}
                      onChange={(e) => setBrandForm({ ...brandForm, company_name: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">CNPJ *</label>
                    <input
                      type="text"
                      required
                      value={brandForm.cnpj}
                      onChange={(e) => setBrandForm({ ...brandForm, cnpj: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Site / Loja Virtual (E-commerce)</label>
                    <input
                      type="url"
                      value={brandForm.website}
                      onChange={(e) => setBrandForm({ ...brandForm, website: e.target.value })}
                      placeholder="https://sualoja.com.br"
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Instagram Oficial da Marca</label>
                    <input
                      type="text"
                      value={brandForm.instagram}
                      onChange={(e) => setBrandForm({ ...brandForm, instagram: e.target.value })}
                      placeholder="@suamarca"
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">TikTok Oficial</label>
                    <input
                      type="text"
                      value={brandForm.tiktok}
                      onChange={(e) => setBrandForm({ ...brandForm, tiktok: e.target.value })}
                      placeholder="@suamarca.oficial"
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Logo URL (Alta Resolução)</label>
                  <input
                    type="url"
                    value={brandForm.logo_url}
                    onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Sobre a Marca & Posicionamento</label>
                  <textarea
                    rows={3}
                    value={brandForm.description}
                    onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                    placeholder="Conte aos creators o propósito da sua marca, valores e principais diferenciais..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" className="flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Salvar Dados da Marca</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Card Resumo do Brand Guidelines */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview da Marca</h4>
              <div className="flex items-center space-x-3 pb-3 border-b border-border">
                <img
                  src={brandForm.logo_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300'}
                  alt="Logo"
                  className="w-12 h-12 rounded-xl object-cover border border-border bg-white p-1"
                />
                <div>
                  <p className="font-bold text-foreground text-sm">{brandForm.brand_name || 'Nome da Marca'}</p>
                  <p className="text-[11px] text-muted-foreground">{brandForm.city} - {brandForm.state}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">CNPJ</span>
                  <span className="font-mono text-foreground">{brandForm.cnpj}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Status da Conta</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">Verificada</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Gestor Responsável</span>
                  <span className="font-semibold text-foreground">{brandForm.contact_name || 'Camila Brand Manager'}</span>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border border-border text-[11px] text-muted-foreground flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Os dados da marca são anexados automaticamente aos contratos e acordos de confidencialidade com os creators.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: LOGÍSTICA & ENVIO DE KITS (SEEDING) */}
      {/* ========================================================================= */}
      {activeTab === 'logistics' && (
        <div className="max-w-3xl space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold font-display text-foreground flex items-center space-x-2">
                <Truck className="w-5 h-5 text-primary" />
                <span>Endereço de Expedição & Envio de Kits</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Endereço de onde os kits de produtos saem para entrega aos creators selecionados e para onde retornam em caso de devolução.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <label className="text-xs font-semibold text-foreground block mb-1">Logradouro (Rua / Avenida) *</label>
                  <input
                    type="text"
                    value={settings.shipping_address}
                    onChange={(e) => setSettings({ ...settings, shipping_address: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Número *</label>
                  <input
                    type="text"
                    value={settings.shipping_number}
                    onChange={(e) => setSettings({ ...settings, shipping_number: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Complemento</label>
                  <input
                    type="text"
                    value={settings.shipping_complement}
                    onChange={(e) => setSettings({ ...settings, shipping_complement: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Bairro</label>
                  <input
                    type="text"
                    value={settings.shipping_neighborhood}
                    onChange={(e) => setSettings({ ...settings, shipping_neighborhood: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">CEP</label>
                  <input
                    type="text"
                    value={settings.shipping_zip}
                    onChange={(e) => setSettings({ ...settings, shipping_zip: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Cidade</label>
                  <input
                    type="text"
                    value={settings.shipping_city}
                    onChange={(e) => setSettings({ ...settings, shipping_city: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Transportadora Preferencial</label>
                  <select
                    value={settings.carrier_preference}
                    onChange={(e) => setSettings({ ...settings, carrier_preference: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                  >
                    <option value="correios">Correios (Sedex / PAC)</option>
                    <option value="melhor_envio">Melhor Envio (Multi-transportadoras)</option>
                    <option value="jadlog">Jadlog Express</option>
                    <option value="loggi">Loggi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Instruções de Unboxing (Mensagem impressa que vai junto ao Kit)
                </label>
                <textarea
                  rows={3}
                  value={settings.unboxing_notes}
                  onChange={(e) => setSettings({ ...settings, unboxing_notes: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none resize-none leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Orientação para a criadora de conteúdo ao abrir a caixa diante da câmera.
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Rastreamento Automático de Entrega</p>
                  <p className="text-[11px] text-muted-foreground">Notificar a marca e o creator assim que o produto for entregue na residência.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_tracking}
                  onChange={(e) => setSettings({ ...settings, auto_tracking: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={() => handleSaveSettings('Diretrizes de logística')} className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Salvar Dados de Logística</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: DIRETRIZES & COMPLIANCE (DO'S & DON'TS) */}
      {/* ========================================================================= */}
      {activeTab === 'compliance' && (
        <div className="max-w-3xl space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold font-display text-foreground flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Regras de Conteúdo & Compliance (Do's & Don'ts)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Defina o que os creators DEVEM e NÃO PODEM falar nos vídeos e lives para blindar sua marca juridicamente.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Hashtags Obrigatórias</label>
                  <input
                    type="text"
                    value={settings.required_hashtags}
                    onChange={(e) => setSettings({ ...settings, required_hashtags: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Exigência legal do CONAR para sinalização publicitária (#Publi).</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Menção Obrigatória da Marca</label>
                  <input
                    type="text"
                    value={settings.required_mentions}
                    onChange={(e) => setSettings({ ...settings, required_mentions: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">@ da conta oficial a ser marcado na legenda ou no áudio.</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-600 flex items-center space-x-1.5 block mb-1">
                  <span>O que a criadora DEVE destacar (Do's)</span>
                </label>
                <textarea
                  rows={4}
                  value={settings.dos_guidelines}
                  onChange={(e) => setSettings({ ...settings, dos_guidelines: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-emerald-500/30 rounded-xl text-foreground focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-red-600 flex items-center space-x-1.5 block mb-1">
                  <span>O que a criadora NÃO PODE falar de jeito nenhum (Don'ts)</span>
                </label>
                <textarea
                  rows={4}
                  value={settings.donts_guidelines}
                  onChange={(e) => setSettings({ ...settings, donts_guidelines: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-red-500/30 rounded-xl text-foreground focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Exigir Aprovação Prévia da Marca</p>
                    <p className="text-[11px] text-muted-foreground">O creator só pode publicar na rede social após a aprovação da sua equipe.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.approval_required}
                    onChange={(e) => setSettings({ ...settings, approval_required: e.target.checked })}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-foreground font-semibold">Prazo Máximo para Revisão da Marca:</span>
                  <select
                    value={settings.max_review_hours}
                    onChange={(e) => setSettings({ ...settings, max_review_hours: Number(e.target.value) })}
                    className="px-2.5 py-1 rounded-lg bg-background border border-border text-foreground font-bold"
                  >
                    <option value={24}>24 horas (Expresso)</option>
                    <option value={48}>48 horas (Padrão)</option>
                    <option value={72}>72 horas (Até 3 dias úteis)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={() => handleSaveSettings('Diretrizes de compliance')} className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Salvar Regras de Conteúdo</span>
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: FINANCEIRO & FATURAMENTO */}
      {/* ========================================================================= */}
      {activeTab === 'financial' && (
        <div className="max-w-3xl space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold font-display text-foreground flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span>Dados de Faturamento & Pagamentos de Creators</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configuração fiscal da empresa para emissão de notas fiscais de serviço e liquidação de cachês via PIX.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Inscrição Estadual (IE)</label>
                  <input
                    type="text"
                    value={settings.state_registration}
                    onChange={(e) => setSettings({ ...settings, state_registration: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">E-mail para Envio de Notas Fiscais (XML/PDF)</label>
                  <input
                    type="email"
                    value={settings.billing_email}
                    onChange={(e) => setSettings({ ...settings, billing_email: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Teto Orçamentário Mensal (R$)</label>
                  <input
                    type="number"
                    value={settings.monthly_budget_cap}
                    onChange={(e) => setSettings({ ...settings, monthly_budget_cap: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Trava preventiva para evitar gastos acima da verba aprovada pela diretoria.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Modelo Padrão de Remuneração</label>
                  <select
                    value={settings.default_payout_model}
                    onChange={(e) => setSettings({ ...settings, default_payout_model: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none font-medium"
                  >
                    <option value="fixed_pix">Cachê Fixo via PIX por Entrega Aprovada</option>
                    <option value="hybrid">Híbrido: Cachê Fixo + Comissão por Venda</option>
                    <option value="seeding_only">Apenas Seeding (Kit de Produtos)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    PIX
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Chave PIX da Empresa para Débito de Campanhas</p>
                    <p className="text-[11px] text-muted-foreground">Utilizada para liquidação automática dos cachês aos creators aprovados.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Tipo de Chave</label>
                    <select
                      value={settings.pix_key_type}
                      onChange={(e) => setSettings({ ...settings, pix_key_type: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs"
                    >
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="aleatoria">Chave Aleatória</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-muted-foreground block mb-1">Chave PIX</label>
                    <input
                      type="text"
                      value={settings.pix_key}
                      onChange={(e) => setSettings({ ...settings, pix_key: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={() => handleSaveSettings('Informações financeiras')} className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Salvar Dados Financeiros</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 5: EQUIPE DA MARCA & ALERTAS */}
      {/* ========================================================================= */}
      {activeTab === 'team' && (
        <div className="max-w-4xl space-y-6">
          
          {/* Alertas em Tempo Real */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="text-base font-bold font-display text-foreground flex items-center space-x-2">
              <Bell className="w-5 h-5 text-primary" />
              <span>Notificações & Alertas em Tempo Real</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Receba avisos instantâneos quando creators enviarem vídeos para revisão ou quando novos perfis se candidatarem.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Alertas via WhatsApp</span>
                  <input
                    type="checkbox"
                    checked={settings.notify_whatsapp}
                    onChange={(e) => setSettings({ ...settings, notify_whatsapp: e.target.checked })}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>
                <input
                  type="tel"
                  value={settings.alert_phone}
                  onChange={(e) => setSettings({ ...settings, alert_phone: e.target.value })}
                  placeholder="DDD + número"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Alertas por E-mail</span>
                  <input
                    type="checkbox"
                    checked={settings.notify_email}
                    onChange={(e) => setSettings({ ...settings, notify_email: e.target.checked })}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>
                <input
                  type="email"
                  value={settings.alert_email}
                  onChange={(e) => setSettings({ ...settings, alert_email: e.target.value })}
                  placeholder="voce@example.com"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleSaveSettings('Preferências de notificação')} size="sm">
                Salvar Notificações
              </Button>
            </div>
          </div>

          {/* Membros da Equipe da Empresa */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="text-base font-bold font-display text-foreground flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Membros com Acesso à Conta da Marca</span>
            </h3>

            {/* Formulário Convidar Membro */}
            <form onSubmit={handleAddTeamMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1 border-b border-border pb-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Nome do colaborador"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="email"
                  required
                  placeholder="voce@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                />
              </div>
              <div>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                >
                  <option value="Gestora de Marketing & Campanhas">Gestor de Marketing</option>
                  <option value="Analista de Conteúdo & Revisão de Vídeos">Analista de Conteúdo</option>
                  <option value="Financeiro & Pagamentos PIX">Financeiro</option>
                </select>
              </div>
              <div>
                <Button type="submit" className="w-full flex items-center justify-center space-x-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Convidar</span>
                </Button>
              </div>
            </form>

            {/* Tabela de Membros */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pl-2">Colaborador</th>
                    <th className="pb-3">E-mail</th>
                    <th className="pb-3">Função / Papel</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right pr-2">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {teamMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 pl-2 font-bold text-foreground">{m.name}</td>
                      <td className="py-3 text-muted-foreground">{m.email}</td>
                      <td className="py-3">
                        <span className="font-semibold text-primary">{m.role}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2">
                        {teamMembers.length > 1 && (
                          <button
                            onClick={() => handleRemoveMember(m.id, m.name)}
                            title="Remover acesso"
                            className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
      {/* ABA 6: PESOS DO ALGORITMO OPERACIONAL (EXCLUSIVO ADMIN MASTER) */}
      {/* ========================================================================= */}
      {isMasterAdmin && activeTab === 'weights' && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-display text-foreground">
                  Pesos da Pontuação Operacional (Match Score 0–100)
                </h3>
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                  totalWeight === 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                }`}>
                  Total: {totalWeight}% / 100%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Configure a relevância de cada pilar para a classificação e pontuação operacional automática dos creators na plataforma.
              </p>
            </div>

            <form onSubmit={handleSaveWeights} className="space-y-4 text-xs">
              
              {/* Engajamento */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Taxa de Engajamento (%)</span>
                  <span className="text-primary">{weights.engagement}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.engagement}
                  onChange={(e) => setWeights({ ...weights, engagement: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              {/* Tamanho da Audiência */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Volume de Seguidores & Alcance</span>
                  <span className="text-primary">{weights.audience}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.audience}
                  onChange={(e) => setWeights({ ...weights, audience: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              {/* Aderência de Nicho */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Aderência ao Nicho da Marca</span>
                  <span className="text-primary">{weights.nicheMatch}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.nicheMatch}
                  onChange={(e) => setWeights({ ...weights, nicheMatch: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              {/* Histórico de Entregas */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Histórico de Pontualidade & Cumprimento de Briefing</span>
                  <span className="text-primary">{weights.deliveryHistory}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.deliveryHistory}
                  onChange={(e) => setWeights({ ...weights, deliveryHistory: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              {/* Qualidade Técnica */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Qualidade Técnica (Áudio, Iluminação, Enquadramento)</span>
                  <span className="text-primary">{weights.quality}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.quality}
                  onChange={(e) => setWeights({ ...weights, quality: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={totalWeight !== 100} className="w-full">
                  Salvar Pesos Operacionais
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
