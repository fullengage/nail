import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Building2, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegisterBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterBrandModal: React.FC<RegisterBrandModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { signUpBrand, isLoading } = useAuth();

  // Form State
  const [brandName, setBrandName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [website, setWebsite] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['esmaltes', 'gel']);
  const [objective, setObjective] = useState('ugc');

  const categories = [
    { id: 'esmaltes', label: 'Esmaltes & Cores' },
    { id: 'gel', label: 'Gel & Fibra de Vidro' },
    { id: 'equipamentos', label: 'Cabines & Lixas Elétricas' },
    { id: 'nailart', label: 'Acessórios & Nail Art' },
    { id: 'cuidados', label: 'Tratamento & Cutículas' },
  ];

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || !email) return;

    const res = await signUpBrand({
      companyName: companyName || brandName,
      brandName,
      cnpj: cnpj || '12.345.678/0001-90',
      email,
      password: password || '123456',
      contactName: contactName || 'Responsável Parcerias',
      phone: phone || '',
      city: city || 'São Paulo',
      state,
    });

    if (res.success) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onClose();
      onSuccess();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl">
      <div className="space-y-6 text-left">
        
        {/* Header Branding */}
        <div className="flex items-start space-x-4 border-b border-border pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Para Marcas & Indústrias de Beleza</span>
            </div>
            <h2 className="text-xl font-extrabold font-display text-foreground">
              Cadastre sua Marca no NAIL CLUB PRO
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conecte seus produtos a mais de 10.000 Nail Designers e gere conteúdos UGC de alta conversão.
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Brand & Company Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nome da Marca (Fantasia)"
              placeholder="Ex: BellaVitta Cosméticos"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              required
            />
            <Input
              label="Razão Social"
              placeholder="Ex: BellaVitta Cosméticos LTDA"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          {/* CNPJ & Corporate Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="CNPJ da Empresa"
              placeholder="00.000.000/0001-00"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              required
            />
            <Input
              label="E-mail Corporativo"
              type="email"
              placeholder="voce@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Contact Person & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nome do Responsável / Contato"
              placeholder="Ex: Renata Vasconcelos"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
            />
            <Input
              label="WhatsApp / Telefone Direto"
              placeholder="DDD + número"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          {/* Location & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Input
                label="Cidade"
                placeholder="São Paulo"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
                Estado (UF)
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold"
              >
                <option value="SP">São Paulo (SP)</option>
                <option value="RJ">Rio de Janeiro (RJ)</option>
                <option value="MG">Minas Gerais (MG)</option>
                <option value="PR">Paraná (PR)</option>
                <option value="SC">Santa Catarina (SC)</option>
                <option value="RS">Rio Grande do Sul (RS)</option>
                <option value="BA">Bahia (BA)</option>
                <option value="DF">Distrito Federal (DF)</option>
                <option value="GO">Goiás (GO)</option>
              </select>
            </div>
            <div className="sm:col-span-1">
              <Input
                label="Senha de Acesso"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Categories of Interest */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              Categorias dos seus Produtos
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold'
                        : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.label} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security & Benefits notice */}
          <div className="p-3 rounded-2xl bg-muted/50 border border-border/80 text-[11px] text-muted-foreground flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Cadastro seguro. Acesso imediato ao painel de criação de campanhas e busca de creators.
            </span>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              isLoading={isLoading}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Finalizar Cadastro da Marca
            </Button>
          </div>
        </form>

      </div>
    </Modal>
  );
};
