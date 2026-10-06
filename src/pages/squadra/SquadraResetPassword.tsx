import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface SquadraResetPasswordProps {
  onNavigate: (view: string) => void;
}

export const SquadraResetPassword: React.FC<SquadraResetPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Recuperação de Senha
          </h2>
          <p className="text-xs text-muted-foreground">
            Informe o e-mail cadastrado na sua conta Squad UGC para receber as instruções de redefinição.
          </p>
        </div>

        {sent ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-foreground">
              Link de redefinição enviado para:
            </p>
            <p className="text-xs font-mono text-muted-foreground">{email}</p>
            <div className="pt-2">
              <Button onClick={() => onNavigate('auth')} variant="secondary" className="w-full">
                Voltar para o Login
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Seu E-mail Corporativo</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs"
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-2.5 shadow-md shadow-primary/20">
              Enviar Link de Redefinição
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Lembrou a senha? Fazer login</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
