import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabaseService } from '../../services/supabaseService';
import { formatPhone } from '../../lib/utils';
import { Sparkles, User, CheckCircle2, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreatorWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorWaitlistModal: React.FC<CreatorWaitlistModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>(['Live commerce', 'Vídeos UGC']);
  const [honeypot, setHoneypot] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableTechniques = [
    'Live commerce',
    'Vídeos UGC',
    'Unboxing & review',
    'Tutorial / demonstração',
    'Fotos de produto',
    'Afiliado / TikTok Shop',
    'Stories & Reels',
    'Depoimento / antes e depois'
  ];

  const toggleTechnique = (tech: string) => {
    if (selectedTechniques.includes(tech)) {
      setSelectedTechniques(selectedTechniques.filter((t) => t !== tech));
    } else {
      setSelectedTechniques([...selectedTechniques, tech]);
    }
  };

  const resetForm = () => {
    setName('');
    setInstagram('');
    setWhatsapp('');
    setCity('');
    setState('SP');
    setSelectedTechniques(['Live commerce', 'Vídeos UGC']);
    setHoneypot('');
    setIsSuccess(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Honeypot anti-spam check
    if (honeypot.trim() !== '') {
      setIsSuccess(true);
      return;
    }

    if (!name.trim() || !instagram.trim() || !whatsapp.trim()) {
      setErrorMessage('Por favor, preencha os campos obrigatórios.');
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Por favor, insira um WhatsApp válido com DDD.');
      return;
    }

    const formattedIg = instagram.startsWith('@') ? instagram.trim() : `@${instagram.trim()}`;

    setIsLoading(true);
    try {
      const res = await supabaseService.submitCreatorWaitlist({
        name: name.trim(),
        instagram: formattedIg,
        whatsapp: whatsapp.trim(),
        city: city.trim() || 'Não informada',
        state,
        techniques: selectedTechniques
      });

      if (res.success) {
        setIsSuccess(true);
        confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
      } else {
        setErrorMessage(res.message || 'Ocorreu um erro ao registrar sua vaga. Tente novamente.');
      }
    } catch {
      setErrorMessage('Falha na comunicação com o servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="lg">
      <div className="space-y-6 text-left">
        {/* Header */}
        <div className="flex items-start space-x-4 border-b border-border pb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-1">
              <User className="w-3 h-3" />
              <span>Lista de Espera Prioritária</span>
            </div>
            <h2 className="text-xl font-extrabold font-display text-foreground">
              Garanta sua vaga no Squad
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Creators de UGC e live commerce selecionados para as primeiras campanhas com marcas parceiras. Inscreva-se para a curadoria.
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-foreground">Inscrição Confirmada na Lista!</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Recebemos seus dados com sucesso! Você está na fila de curadoria do piloto com as primeiras marcas. Entraremos em contato pelo WhatsApp assim que novas vagas forem liberadas.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-4">
              Concluir
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot field for bot suppression */}
            <input
              type="text"
              name="c_hp_check"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Seu Nome Completo *"
                placeholder="Ex: Camila Ferreira"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Instagram Profissional *"
                placeholder="@seuperfil"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  WhatsApp com DDD *
                </label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="sm:col-span-1">
                <Input
                  label="Cidade *"
                  placeholder="Ex: Campinas"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Estado *
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  {['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'GO', 'DF', 'ES', 'Outro'].map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Formatos que você produz (selecione os principais):
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTechniques.map((tech) => {
                  const isSelected = selectedTechniques.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTechnique(tech)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {tech}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-xl border border-border flex items-center space-x-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Participação 100% gratuita para creators. Não cobramos taxa de inscrição.</span>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="shadow-md">
                {isLoading ? 'Confirmando...' : 'Entrar na Lista de Espera'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
