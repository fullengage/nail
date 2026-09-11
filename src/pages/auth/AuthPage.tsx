import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Crown, Sparkles, Building2, User, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types/database';
import confetti from 'canvas-confetti';

interface AuthPageProps {
  onNavigate: (view: string) => void;
  defaultRole?: UserRole;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, defaultRole = 'creator' }) => {
  const { login, signUpCreator, signUpBrand, loginAsDemoUser, isLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // Login form state
  const [email, setEmail] = useState(isDemoMode ? 'camila@camilanails.art' : '');
  const [password, setPassword] = useState(isDemoMode ? '123456' : '');

  // Creator Register state
  const [creatorName, setCreatorName] = useState('');
  const [creatorEmail, setCreatorEmail] = useState('');
  const [creatorPass, setCreatorPass] = useState('');
  const [creatorIg, setCreatorIg] = useState('');
  const [creatorCity, setCreatorCity] = useState('');
  const [creatorState, setCreatorState] = useState('SP');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(['fibra de vidro', 'nail art']);

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

  const specialtiesList = ['fibra de vidro', 'alongamento', 'gel', 'acrílico', 'esmaltação em gel', 'nail art', 'manicure tradicional', 'pedicure'];

  const toggleSpecialty = (spec: string) => {
    if (selectedSpecialties.includes(spec)) {
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== spec));
    } else {
      setSelectedSpecialties([...selectedSpecialties, spec]);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (isDemoMode) {
      if (role === 'creator') setEmail('camila@camilanails.art');
      else if (role === 'brand') setEmail('parcerias@bellavitta.com.br');
      else setEmail('admin@nailclubpro.com.br');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await login(email, password);
    if (res.success) {
      confetti({ particleCount: 60, spread: 50 });
      if (selectedRole === 'creator') onNavigate('creator-dashboard');
      else if (selectedRole === 'brand') onNavigate('brand-dashboard');
      else onNavigate('admin-dashboard');
    }
  };

  const handleCreatorRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signUpCreator({
      fullName: creatorName,
      email: creatorEmail,
      password: creatorPass,
      instagram: creatorIg,
      city: creatorCity,
      state: creatorState,
      specialties: selectedSpecialties,
    });
    if (res.success) {
      confetti({ particleCount: 100, spread: 70 });
      onNavigate('creator-dashboard');
    }
  };

  const handleBrandRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      onNavigate('brand-dashboard');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary via-primary-500 to-amber-500 p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-primary/20">
            <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold font-display text-foreground">NAIL CLUB PRO</h1>
          <p className="text-xs text-muted-foreground">
            {isLogin ? 'Entre na sua conta para continuar' : 'Crie sua conta e comece agora'}
          </p>
        </div>

        {/* Auth Mode Toggle (Login vs Cadastro) */}
        <div className="flex p-1 bg-muted/80 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              isLogin ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Fazer Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              !isLogin ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Criar Nova Conta
          </button>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => handleRoleSelect('creator')}
            className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              selectedRole === 'creator'
                ? 'bg-primary text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Nail Creator</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('brand')}
            className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              selectedRole === 'brand'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Marca</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('admin')}
            className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              selectedRole === 'admin'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin</span>
          </button>
        </div>

        {/* LOGIN FORM */}
        {isLogin ? (
          <Card variant="elevated" className="p-6 space-y-4 border-border/80 text-left">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Input
                label="E-mail"
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

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Entrar na Plataforma
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Quick Demo Access Trigger */}
            <div className="pt-3 border-t border-border text-center">
              <p className="text-[11px] text-muted-foreground font-medium mb-2">
                Acesso Rápido de Demonstração:
              </p>
              <button
                onClick={() => {
                  loginAsDemoUser(selectedRole);
                  if (selectedRole === 'creator') onNavigate('creator-dashboard');
                  else if (selectedRole === 'brand') onNavigate('brand-dashboard');
                  else onNavigate('admin-dashboard');
                }}
                className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <Sparkles className="w-3.5 h-3.5" /> Entrar com 1 Clique como {selectedRole.toUpperCase()}
              </button>
            </div>
          </Card>
        ) : (
          /* REGISTER FORM */
          <Card variant="elevated" className="p-6 space-y-5 border-border/80 text-left">
            {selectedRole === 'creator' ? (
              /* CREATOR REGISTRATION */
              <form onSubmit={handleCreatorRegisterSubmit} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Cadastro de Nail Creator</h3>
                </div>

                <Input
                  label="Nome Completo ou Nome Artístico"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="Ex: Camila Rodriguez Nails"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="E-mail"
                    type="email"
                    value={creatorEmail}
                    onChange={(e) => setCreatorEmail(e.target.value)}
                    placeholder="camila@exemplo.com"
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <Input
                      label="Instagram (@)"
                      value={creatorIg}
                      onChange={(e) => setCreatorIg(e.target.value)}
                      placeholder="@camilanails"
                      required
                    />
                  </div>
                  <div className="sm:col-span-1">
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
                      <option value="DF">DF</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-2">
                    Suas Especialidades em Unhas
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {specialtiesList.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialty(spec)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                          selectedSpecialties.includes(spec)
                            ? 'bg-primary text-white font-bold'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {spec} {selectedSpecialties.includes(spec) && '✓'}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Concluir Cadastro de Nail Creator
                </Button>
              </form>
            ) : (
              /* BRAND REGISTRATION */
              <form onSubmit={handleBrandRegisterSubmit} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-foreground">Cadastro de Empresa / Marca</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nome da Marca / Fantasia"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Ex: BellaVitta Cosméticos"
                    required
                  />
                  <Input
                    label="Razão Social"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: BellaVitta Cosméticos LTDA"
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
                    placeholder="parcerias@marca.com.br"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nome do Responsável / Contato"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Renata Vasconcelos"
                    required
                  />
                  <Input
                    label="WhatsApp / Telefone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
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
                      <option value="BA">BA</option>
                      <option value="DF">DF</option>
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

                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" size="lg" isLoading={isLoading}>
                  <Building2 className="w-4 h-4 mr-2" />
                  Concluir Cadastro da Marca
                </Button>
              </form>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
