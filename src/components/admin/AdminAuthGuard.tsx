import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ShieldCheck, Lock, KeyRound, AlertCircle, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminAuthGuardProps {
  children: React.ReactNode;
  onNavigate?: (view: string) => void;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children, onNavigate }) => {
  const { user, role, loginAsDemoUser } = useAuth();
  
  // Track if admin has unlocked the current session
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return role === 'admin' && localStorage.getItem('ncp_admin_unlocked') === 'true';
  });

  const [email, setEmail] = useState('admin@nailclubpro.com.br');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      // Validate credentials (accepts master admin email and password or default PIN)
      if (
        (email.toLowerCase().includes('admin') && password.length >= 4) ||
        pin === '998877' ||
        pin === '123456' ||
        password === 'admin123'
      ) {
        loginAsDemoUser('admin');
        setIsAdminUnlocked(true);
        localStorage.setItem('ncp_admin_unlocked', 'true');
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setIsLoading(false);
      } else {
        setErrorMsg('Credenciais administrativas inválidas. Use a senha master ou PIN fornecido.');
        setIsLoading(false);
      }
    }, 400);
  };

  const handleQuickMasterUnlock = () => {
    setEmail('admin@nailclubpro.com.br');
    setPassword('admin123');
    setPin('998877');
    loginAsDemoUser('admin');
    setIsAdminUnlocked(true);
    localStorage.setItem('ncp_admin_unlocked', 'true');
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
  };

  // If already authenticated and unlocked as admin, render children
  if (role === 'admin' && isAdminUnlocked) {
    return <>{children}</>;
  }

  // Otherwise, render the Executive Admin Authentication Gate
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Security Shield Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-primary p-0.5 mx-auto flex items-center justify-center shadow-xl shadow-purple-500/20">
            <div className="w-full h-full bg-background rounded-[22px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Área de Acesso Restrito</span>
          </div>
          <h1 className="text-2xl font-extrabold font-display text-foreground">
            Autenticação Administrativa
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Informe suas credenciais de gestor ou chave master para acessar o painel executivo do NAIL CLUB PRO.
          </p>
        </div>

        {/* Auth Form Card */}
        <Card variant="elevated" className="p-6 sm:p-7 border-purple-500/30 text-left space-y-5 shadow-2xl">
          <form onSubmit={handleAdminAuth} className="space-y-4">
            
            <Input
              label="E-mail de Administrador"
              type="email"
              placeholder="admin@nailclubpro.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Senha Master"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>PIN / Chave de Segurança (Opcional)</span>
                <span className="text-[10px] text-muted-foreground font-normal">Ex: 998877</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="998877"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-center font-mono tracking-widest text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
              size="lg"
              isLoading={isLoading}
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Autenticar como Administrador
            </Button>
          </form>

          {/* Quick Demo Access Trigger */}
          <div className="pt-3 border-t border-border space-y-3 text-center">
            <button
              type="button"
              onClick={handleQuickMasterUnlock}
              className="w-full py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Acesso Rápido Master (1 Clique)
            </button>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center justify-center gap-1 mx-auto pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o Início
              </button>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};
