import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Sparkles, UserCheck, Building2, ShieldCheck, RotateCcw, Database, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types/database';
import { supabaseService } from '../../services/supabaseService';
import { isSupabaseConfigured } from '../../lib/supabase';

interface DemoBannerProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onNavigate }) => {
  const { role, loginAsDemoUser } = useAuth();
  const { resetToDemoDefaults } = useData();
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  useEffect(() => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      supabaseService.checkConnection().then((res) => {
        setDbStatus(res.connected ? 'connected' : 'offline');
      });
    }
  }, []);

  if (import.meta.env.VITE_DEMO_MODE !== 'true') {
    return null;
  }

  const handleRoleChange = (newRole: UserRole) => {
    loginAsDemoUser(newRole);
    if (onNavigate) {
      if (newRole === 'creator') onNavigate('creator-dashboard');
      else if (newRole === 'brand') onNavigate('brand-dashboard');
      else if (newRole === 'admin') onNavigate('admin-dashboard');
    }
  };

  return (
    <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-b border-primary/30 text-white px-4 py-2.5 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Indicator & Database status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <div className="flex items-center space-x-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white/90">DEMO INTERATIVA:</span>
            </div>
          </div>

          {/* Database Connection Pill */}
          <div
            className={`hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
              dbStatus === 'connected'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
            }`}
            title="Status da Conexão com o Supabase"
          >
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Supabase Conectado (bi-abc)</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </div>
        </div>

        {/* Role Switcher Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <button
            onClick={() => handleRoleChange('creator')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              role === 'creator'
                ? 'bg-primary text-white shadow-sm ring-1 ring-white/20 font-bold'
                : 'bg-white/10 hover:bg-white/15 text-white/80'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>1. Creator (Camila Nails)</span>
          </button>

          <button
            onClick={() => handleRoleChange('brand')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              role === 'brand'
                ? 'bg-amber-600 text-white shadow-sm ring-1 ring-white/20 font-bold'
                : 'bg-white/10 hover:bg-white/15 text-white/80'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>2. Marca (BellaVitta)</span>
          </button>

          <button
            onClick={() => handleRoleChange('admin')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              role === 'admin'
                ? 'bg-purple-600 text-white shadow-sm ring-1 ring-white/20 font-bold'
                : 'bg-white/10 hover:bg-white/15 text-white/80'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Admin (Gestão)</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Deseja restaurar todos os dados da demonstração para o estado inicial?')) {
                resetToDemoDefaults();
              }
            }}
            title="Restaurar dados iniciais"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Resetar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
