import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabaseService } from '../../services/supabaseService';
import { formatPhone } from '../../lib/utils';
import { Building2, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FoundingBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FoundingBrandModal: React.FC<FoundingBrandModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [category, setCategory] = useState('Beleza & Cosméticos');
  const [salesChannel, setSalesChannel] = useState('TikTok Shop / Live commerce');
  const [budgetTier, setBudgetTier] = useState('R$ 5.000 a R$ 15.000 / campanha');
  const [honeypot, setHoneypot] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setCompany('');
    setRole('');
    setEmail('');
    setWhatsapp('');
    setCategory('Beleza & Cosméticos');
    setSalesChannel('TikTok Shop / Live commerce');
    setBudgetTier('R$ 5.000 a R$ 15.000 / campanha');
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

    // Basic validation
    if (!name.trim() || !company.trim() || !email.trim() || !whatsapp.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Por favor, insira um e-mail corporativo válido.');
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Por favor, insira um número de WhatsApp válido com DDD.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await supabaseService.submitBrandLead({
        name: name.trim(),
        company: company.trim(),
        role: role.trim() || 'Não informado',
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        category,
        sales_channel: salesChannel,
        budget_tier: budgetTier,
        origin: 'landing_founding_brands'
      });

      if (res.success) {
        setIsSuccess(true);
        confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
      } else {
        setErrorMessage(res.message || 'Ocorreu um erro ao enviar sua aplicação. Tente novamente.');
      }
    } catch {
      setErrorMessage('Falha na comunicação com o servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="xl">
      <div className="space-y-6 text-left">
        {/* Header */}
        <div className="flex items-start space-x-4 border-b border-border pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Programa Marcas Fundadoras</span>
            </div>
            <h2 className="text-xl font-extrabold font-display text-foreground">
              Candidate sua Marca para o Piloto
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Apenas 3 vagas para marcas pioneiras montarem seu squad de creators de UGC e live commerce.
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-foreground">Aplicação Enviada com Sucesso!</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Recebemos sua aplicação para o Programa Marcas Fundadoras! Nossa equipe entrará em contato via WhatsApp ou e-mail em até <strong>48h úteis</strong> para apresentar as condições do piloto.
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
              name="b_hp_check"
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
                label="Nome do Responsável *"
                placeholder="Ex: Beatriz Lima"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Empresa / Marca *"
                placeholder="Ex: BellaVitta"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Seu Cargo / Área *"
                placeholder="Ex: Gerente de Marketing / Fundador"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
              <Input
                label="E-mail Corporativo *"
                type="email"
                placeholder="beatriz@marca.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Categoria de Produtos
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="Beleza & Cosméticos">Beleza & Cosméticos</option>
                  <option value="Moda & Acessórios">Moda & Acessórios</option>
                  <option value="Casa & Decoração">Casa & Decoração</option>
                  <option value="Fitness & Suplementos">Fitness & Suplementos</option>
                  <option value="Eletrônicos & Tech">Eletrônicos & Tech</option>
                  <option value="Alimentos & Bebidas">Alimentos & Bebidas</option>
                  <option value="Infantil & Pets">Infantil & Pets</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Canal Principal de Vendas
                </label>
                <select
                  value={salesChannel}
                  onChange={(e) => setSalesChannel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="TikTok Shop / Live commerce">TikTok Shop / Live commerce</option>
                  <option value="E-commerce Próprio D2C">E-commerce Próprio D2C</option>
                  <option value="Marketplaces (Shopee, Mercado Livre, Amazon)">Marketplaces (Shopee, Mercado Livre, Amazon)</option>
                  <option value="Lojas Físicas / Varejo">Lojas Físicas / Varejo</option>
                  <option value="Distribuidores / Atacado">Distribuidores / Atacado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Orçamento Mensal Previsto para Parcerias
                </label>
                <select
                  value={budgetTier}
                  onChange={(e) => setBudgetTier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="Até R$ 5.000 / campanha">Até R$ 5.000 / campanha</option>
                  <option value="R$ 5.000 a R$ 15.000 / campanha">R$ 5.000 a R$ 15.000 / campanha</option>
                  <option value="R$ 15.000 a R$ 30.000 / campanha">R$ 15.000 a R$ 30.000 / campanha</option>
                  <option value="Acima de R$ 30.000 / campanha">Acima de R$ 30.000 / campanha</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-xl border border-border flex items-center space-x-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Seus dados são protegidos sob a LGPD e usados exclusivamente para contato comercial do piloto.</span>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="shadow-md bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {isLoading ? 'Enviando Aplicação...' : 'Enviar Candidatura da Marca'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
