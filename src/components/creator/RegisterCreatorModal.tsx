import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Sparkles, User, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegisterCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterCreatorModal: React.FC<RegisterCreatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { signUpCreator, isLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(['fibra de vidro', 'nail art']);

  const specialtiesList = ['fibra de vidro', 'alongamento', 'gel', 'acrílico', 'esmaltação em gel', 'nail art', 'manicure tradicional', 'pedicure'];

  const toggleSpecialty = (spec: string) => {
    if (selectedSpecialties.includes(spec)) {
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== spec));
    } else {
      setSelectedSpecialties([...selectedSpecialties, spec]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !instagram) return;

    const res = await signUpCreator({
      fullName,
      email,
      password: password || '123456',
      instagram,
      tiktok,
      city: city || 'São Paulo',
      state,
      specialties: selectedSpecialties,
    });

    if (res.success) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onClose();
      onSuccess();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="space-y-6 text-left">
        
        {/* Header Branding */}
        <div className="flex items-start space-x-4 border-b border-border pb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-1">
              <User className="w-3 h-3" />
              <span>Para Manicures & Nail Designers</span>
            </div>
            <h2 className="text-xl font-extrabold font-display text-foreground">
              Cadastre-se como Nail Creator
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receba produtos de marcas renomadas, feche parcerias com cachê e monetize seu trabalho.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome Completo ou Artístico"
            placeholder="Ex: Camila Rodriguez Nails"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="E-mail"
              type="email"
              placeholder="camila@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Instagram (@)"
              placeholder="@camilanails_art"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              required
            />
            <Input
              label="TikTok (Opcional)"
              placeholder="@camilanails.pro"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cidade"
              placeholder="São Paulo"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <div>
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
              </select>
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              Suas Especialidades em Unhas
            </label>
            <div className="flex flex-wrap gap-2">
              {specialtiesList.map((spec) => {
                const isSelected = selectedSpecialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border capitalize transition-all ${
                      isSelected
                        ? 'bg-primary text-white font-bold border-primary'
                        : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {spec} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-muted/50 border border-border/80 text-[11px] text-muted-foreground flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              100% gratuito para profissionais de unhas. Acesso imediato a campanhas e à Nail Academy.
            </span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" isLoading={isLoading}>
              <Sparkles className="w-4 h-4 mr-2" />
              Criar Perfil de Creator
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
