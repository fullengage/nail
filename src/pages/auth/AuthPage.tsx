import React, { useState } from 'react';
import { useAuth, SQUADRA_AUTH_LEVELS } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Sparkles, 
  Building2, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  KeyRound,
  ExternalLink 
} from 'lucide-react';
import { UserRole } from '../../types/database';
import confetti from 'canvas-confetti';

interface AuthPageProps {
  onNavigate: (view: string) => void;
  defaultRole?: UserRole;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, defaultRole = 'admin_master' }) => {
  const { login, signUpCreator, signUpBrand, loginAsLevel, isLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'admin_master' | 'brand_admin' | 'creator'>(() => {
    if (defaultRole === 'creator') return 'creator';
    if (defaultRole === 'brand' || defaultRole === 'brand_admin') return 'brand_admin';
    return 'admin_master';
  });

  // Login form state
  const [email, setEmail] = useState(import.meta.env.VITE_DEMO_MODE === 'true' ? 'admin@example.com' : '');
  // senha de demonstração só aparece preenchida em modo demo
  const DEMO_PWD = import.meta.env.VITE_DEMO_MODE === 'true' ? 'Squadra@2026' : '';
  const [password, setPassword] = useState(DEMO_PWD);
  const [authError, setAuthError] = useState('');

  // Creator Register state
  const [creatorName, setCreatorName] = useState('');
  const [creatorEmail, setCreatorEmail] = useState('');
  const [creatorPass, setCreatorPass] = useState('');
  const [creatorIg, setCreatorIg] = useState('');
  const [creatorTiktok, setCreatorTiktok] = useState('');
  const [creatorCity, setCreatorCity] = useState('');
  const [creatorState, setCreatorState] = useState('SP');
  const [selectedNiches, setSelectedNiches] = useState<string[]>(['Saúde & Bem-estar', 'Suplementação']);

  // Brand Register state
  const [companyName, setCompanyName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [brandEmail, setBrandEmail] = useState('');
  const [brandPass, setBrandPass] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [brandCity, setBrandCity] = useState('');
  const [brandState, setBrandState] = useState('SP');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const nichesList = [
    'Saúde & Bem-estar',
    'Suplementação',
    'Fitness & Treino',
    'Nutrição & Dieta',
    'Longevidade 50+',
    'Skincare & Beleza',
    'Rotina Saudável',
    'Lifestyle'
  ];

  const toggleNiche = (niche: string) => {
    if (selectedNiches.includes(niche)) {
      setSelectedNiches(selectedNiches.filter((s) => s !== niche));
    } else {
      setSelectedNiches([...selectedNiches, niche]);
    }
  };

  const handleSelectLevel = (level: 'admin_master' | 'brand_admin' | 'creator') => {
    setSelectedRole(level);
    setAuthError('');
    if (level === 'admin_master') {
      setEmail('admin@example.com');
      setPassword(DEMO_PWD);
    } else if (level === 'brand_admin') {
      setEmail('empresa@example.com');
      setPassword(DEMO_PWD);
    } else {
      setEmail('ugc@example.com');
      setPassword(DEMO_PWD);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await login(email, password);
    if (res.success) {
      confetti({ particleCount: 60, spread: 50 });
      if (import.meta.env.VITE_DEMO_MODE === 'true' && selectedRole === 'creator') onNavigate('creator-dashboard');
      else onNavigate('dashboard');
    } else {
      setAuthError(res.message || 'Falha ao autenticar.');
    }
  };

  const handleOneClickLogin = (level: 'admin_master' | 'brand_admin' | 'creator') => {
    loginAsLevel(level);
    confetti({ particleCount: 70, spread: 60 });
    if (level === 'creator') onNavigate('creator-dashboard');
    else onNavigate('dashboard');
  };

  const handleCreatorRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      alert('Você precisa aceitar os Termos de Uso e a Política de Privacidade para prosseguir.');
      return;
    }
    const res = await signUpCreator({
      fullName: creatorName,
      email: creatorEmail,
      password: creatorPass,
      instagram: creatorIg,
      tiktok: creatorTiktok,
      city: creatorCity,
      state: creatorState,
      specialties: selectedNiches,
    });
    if (res.success) {
      confetti({ particleCount: 100, spread: 70 });
      onNavigate('creator-dashboard');
    } else {
      setAuthError(res.message || 'Erro ao cadastrar creator');
    }
  };

  const handleBrandRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      alert('Você precisa aceitar os Termos de Uso e a Política de Privacidade para prosseguir.');
      return;
    }
    const res = await signUpBrand({
      companyName,
      brandName,
      cnpj,
      email: brandEmail,
      password: brandPass,
      contactName,
      phone: contactPhone,
      city: brandCity,
      state: brandState,
    });
    if (res.success) {
      confetti({ particleCount: 100, spread: 70 });
      onNavigate('dashboard');
    } else {
      setAuthError(res.message || 'Erro ao cadastrar marca');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {import.meta.env.VITE_DEMO_MODE === 'true' && (
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-xs font-bold text-primary mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span>3 Níveis de Acesso Autenticado</span>
          </div>
          )}
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
            Squad <span className="text-primary font-black">UGC</span>
          </h1>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Plataforma SaaS para contratação, gestão de squads e entregas de criadores UGC com controle multi-nível.
          </p>
        </div>

        {/* 3 Quick Role Selection Cards (só demonstração; em produção o papel vem da conta) */}
        {import.meta.env.VITE_DEMO_MODE === 'true' && <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Level 1: Admin Geral */}
          <button
            type="button"
            onClick={() => handleSelectLevel('admin_master')}
            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
              selectedRole === 'admin_master'
                ? 'border-purple-500 bg-purple-500/10 shadow-lg ring-1 ring-purple-500'
                : 'border-border bg-card hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-300">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">Nível 1</span>
            </div>
            <p className="text-xs font-bold text-foreground">Admin Geral</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
              Gestão global, multiempresa e relatórios
            </p>
          </button>

          {/* Level 2: Empresa Contratante */}
          <button
            type="button"
            onClick={() => handleSelectLevel('brand_admin')}
            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
              selectedRole === 'brand_admin'
                ? 'border-blue-500 bg-blue-500/10 shadow-lg ring-1 ring-blue-500'
                : 'border-border bg-card hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-300">
                <Building2 className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">Nível 2</span>
            </div>
            <p className="text-xs font-bold text-foreground">Empresa</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
              Contratação de creators e campanhas
            </p>
          </button>

          {/* Level 3: UGC Creator */}
          <button
            type="button"
            onClick={() => handleSelectLevel('creator')}
            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
              selectedRole === 'creator'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg ring-1 ring-emerald-500'
                : 'border-border bg-card hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">Nível 3</span>
            </div>
            <p className="text-xs font-bold text-foreground">UGC Creator</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
              Oferta de serviço, vídeos e cupons
            </p>
          </button>
        </div>}

        {/* Auth Mode Toggle (Login vs Cadastro) */}
        <div className="flex p-1 bg-muted/80 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              isLogin ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Fazer Login com Credenciais
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              !isLogin ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Criar Nova Conta ({selectedRole === 'creator' ? 'UGC' : 'Empresa'})
          </button>
        </div>

        {/* LOGIN FORM */}
        {isLogin ? (
          <Card variant="elevated" className="p-6 space-y-4 border-border/80 text-left">
            {import.meta.env.VITE_DEMO_MODE === 'true' && (
            <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">
                  Autenticando como: <span className="text-primary font-mono">{SQUADRA_AUTH_LEVELS[selectedRole].label}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {SQUADRA_AUTH_LEVELS[selectedRole].description}
                </p>
              </div>
            </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Input
                label="E-mail Cadastrado"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {authError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
                  {authError}
                </div>
              )}

              <Button type="submit" className="w-full font-bold" size="lg" isLoading={isLoading}>
                Entrar no Sistema
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Quick 1-Click Access for Testing */}
            {import.meta.env.VITE_DEMO_MODE === 'true' && (
<div className="pt-3 border-t border-border text-center space-y-2">
              <p className="text-[11px] text-muted-foreground font-medium">
                Atalho de Teste / Demonstração:
              </p>
              <button
                type="button"
                onClick={() => handleOneClickLogin(selectedRole)}
                className="w-full py-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-foreground text-xs font-bold border border-primary/20 transition-all flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                Entrar Imediatamente como {SQUADRA_AUTH_LEVELS[selectedRole].label}
              </button>
            </div>
            )}
          </Card>
        ) : (
          /* REGISTER FORM */
          <Card variant="elevated" className="p-6 space-y-5 border-border/80 text-left">
            {selectedRole === 'creator' ? (
              /* CREATOR REGISTRATION */
              <form onSubmit={handleCreatorRegisterSubmit} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-sm text-foreground">Cadastro de UGC Creator (Influenciador)</h3>
                </div>

                <Input
                  label="Nome Completo ou Nome de Criador"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="Ex: Gabriela Santos UGC"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="E-mail"
                    type="email"
                    value={creatorEmail}
                    onChange={(e) => setCreatorEmail(e.target.value)}
                    placeholder="voce@example.com"
                    required
                  />
                  <Input
                    label="Senha de Acesso"
                    type="password"
                    value={creatorPass}
                    onChange={(e) => setCreatorPass(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Instagram (@)"
                    value={creatorIg}
                    onChange={(e) => setCreatorIg(e.target.value)}
                    placeholder="@gabrielaugc"
                    required
                  />
                  <Input
                    label="TikTok (@)"
                    value={creatorTiktok}
                    onChange={(e) => setCreatorTiktok(e.target.value)}
                    placeholder="@gabriela.ugc"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      label="Cidade"
                      value={creatorCity}
                      onChange={(e) => setCreatorCity(e.target.value)}
                      placeholder="São Paulo"
                      required
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
                      UF
                    </label>
                    <select
                      value={creatorState}
                      onChange={(e) => setCreatorState(e.target.value)}
                      className="w-full h-11 rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold"
                    >
                      <option value="SP">SP</option>
                      <option value="RJ">RJ</option>
                      <option value="MG">MG</option>
                      <option value="PR">PR</option>
                      <option value="RS">RS</option>
                      <option value="BA">BA</option>
                      <option value="SC">SC</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-2">
                    Seus Nichos de Atuação
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {nichesList.map((niche) => (
                      <button
                        key={niche}
                        type="button"
                        onClick={() => toggleNiche(niche)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          selectedNiches.includes(niche)
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {niche} {selectedNiches.includes(niche) && '✓'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 pt-1 text-left">
                  <input
                    type="checkbox"
                    id="creator-terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                    className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="creator-terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                    Li e concordo com os Termos de Uso e a Política de Privacidade para criadores UGC.
                  </label>
                </div>

                <Button type="submit" className="w-full" size="lg" isLoading={isLoading} disabled={!termsAccepted}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Concluir Cadastro de UGC Creator
                </Button>
              </form>
            ) : (
              /* BRAND REGISTRATION */
              <form onSubmit={handleBrandRegisterSubmit} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <h3 className="font-bold text-sm text-foreground">Cadastro de Empresa (Contratante)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nome da Marca / Fantasia"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Ex: Squadra Nutrition"
                    required
                  />
                  <Input
                    label="Razão Social"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Squadra Nutrition Alimentos LTDA"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="CNPJ"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    required
                  />
                  <Input
                    label="E-mail Corporativo"
                    type="email"
                    value={brandEmail}
                    onChange={(e) => setBrandEmail(e.target.value)}
                    placeholder="voce@example.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nome do Responsável / Contato"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Rodrigo Mendes"
                    required
                  />
                  <Input
                    label="WhatsApp / Telefone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="DDD + número"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Cidade"
                    value={brandCity}
                    onChange={(e) => setBrandCity(e.target.value)}
                    placeholder="São Paulo"
                    required
                  />
                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
                      Estado (UF)
                    </label>
                    <select
                      value={brandState}
                      onChange={(e) => setBrandState(e.target.value)}
                      className="w-full h-11 rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold"
                    >
                      <option value="SP">SP</option>
                      <option value="RJ">RJ</option>
                      <option value="MG">MG</option>
                      <option value="PR">PR</option>
                      <option value="RS">RS</option>
                      <option value="SC">SC</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Senha de Acesso"
                  type="password"
                  value={brandPass}
                  onChange={(e) => setBrandPass(e.target.value)}
                  required
                />

                <div className="flex items-start space-x-2.5 pt-1 text-left">
                  <input
                    type="checkbox"
                    id="brand-terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                    className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="brand-terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                    Declaro poderes de representação da empresa e aceito os Termos de Uso da Plataforma.
                  </label>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" size="lg" isLoading={isLoading} disabled={!termsAccepted}>
                  <Building2 className="w-4 h-4 mr-2" />
                  Concluir Cadastro da Empresa
                </Button>
              </form>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
