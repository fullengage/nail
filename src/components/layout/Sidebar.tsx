import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  Image as ImageIcon,
  DollarSign,
  User,
  Users,
  Building2,
  TrendingUp,
  Sparkles,
  Store,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Video
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  count?: number;
  isHighlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { role, creatorProfile, user } = useAuth();
  const { applications, submissions } = useData();

  // Pending counts
  const pendingAppsCount = applications.filter(a => a.status === 'pending').length;
  const pendingSubsCount = submissions.filter(s => s.status === 'submitted').length;

  const isMaster = role === 'admin_master' || role === 'admin';
  const isBrand = role === 'brand_admin' || role === 'brand';
  const isCreator = role === 'creator';

  // 1. Admin Master Menu (Controle Geral da Plataforma)
  const masterMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard },
    { id: 'creators', label: 'Banco de Creators', icon: Users, count: pendingAppsCount },
    { id: 'retail', label: 'Pontos de Venda (PDVs)', icon: Store },
    { id: 'campaigns', label: 'Campanhas & Squads', icon: Briefcase, count: pendingSubsCount },
    { id: 'affiliates', label: 'Afiliados & Vendas', icon: DollarSign },
    { id: 'brands', label: 'Marcas (Multiempresa)', icon: Building2 },
    { id: 'reports', label: 'Relatórios & Exportação', icon: TrendingUp },
    { id: 'settings', label: 'Pesos & Parâmetros IA', icon: Sparkles },
    { id: 'public-apply', label: 'Formulário Público', icon: ExternalLink },
  ];

  // 2. Brand Admin Menu (Empresa Contratante)
  const brandMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard da Marca', icon: LayoutDashboard },
    { id: 'creators', label: 'Contratar Creators', icon: Users },
    { id: 'campaigns', label: 'Minhas Campanhas & Pipeline', icon: Briefcase, count: pendingSubsCount },
    { id: 'retail', label: 'Nossos PDVs', icon: Store },
    { id: 'affiliates', label: 'Afiliados & Cupons', icon: DollarSign },
    { id: 'reports', label: 'Relatórios da Empresa', icon: TrendingUp },
    { id: 'public-apply', label: 'Link de Inscrição', icon: ExternalLink },
  ];

  // 3. UGC Creator Menu (Influenciador / Prestador de Serviço)
  const creatorMenuItems: MenuItem[] = [
    { id: 'creator-dashboard', label: 'Meu Painel UGC', icon: LayoutDashboard },
    { id: 'creator-campaigns', label: 'Oportunidades Disponíveis', icon: Compass },
    { id: 'creator-my-campaigns', label: 'Minhas Campanhas', icon: Briefcase, badge: 'Ativas' },
    { id: 'creator-portfolio', label: 'Meu Mídia Kit & Vídeos', icon: Video },
    { id: 'creator-earnings', label: 'Ganhos & Afiliados', icon: DollarSign },
    { id: 'creator-profile', label: 'Meu Perfil & Nichos', icon: User },
  ];

  const items: MenuItem[] = isCreator 
    ? creatorMenuItems 
    : isBrand 
    ? brandMenuItems 
    : masterMenuItems;

  const roleLabel = isMaster
    ? 'Nível 1 • Admin Geral'
    : isBrand
    ? 'Nível 2 • Empresa (Contratante)'
    : 'Nível 3 • UGC Influenciador';

  const roleColorClass = isMaster
    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
    : isBrand
    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';

  return (
    <aside className="w-64 shrink-0 bg-card border-r border-border min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        
        {/* Profile Card Summary */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/40 to-primary/10 border border-primary/15">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt={user?.full_name}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/40"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-foreground truncate">{user?.full_name}</p>
              <div className={`mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${roleColorClass}`}>
                {roleLabel}
              </div>
            </div>
          </div>

          {/* Profile strength widget for Creator */}
          {isCreator && (
            <div className="mt-3 pt-2.5 border-t border-primary/10">
              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground/80 mb-1">
                <span>Completude do Mídia Kit</span>
                <span className="text-primary font-bold">{creatorProfile?.profile_completion ?? 0}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${creatorProfile?.profile_completion ?? 0}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1">
          <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase px-3 mb-2 flex items-center justify-between">
            <span>Navegação</span>
            <span className="text-[9px] font-mono text-primary">{items.length} módulos</span>
          </p>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : item.isHighlight
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 font-bold border border-amber-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-black' : item.isHighlight ? 'text-amber-500' : 'text-muted-foreground'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 ? (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-black text-primary' : 'bg-primary text-black'
                    }`}
                  >
                    {item.count}
                  </span>
                ) : item.badge ? (
                  <Badge variant={isActive ? 'gold' : 'secondary'} size="sm">
                    {item.badge}
                  </Badge>
                ) : (
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform opacity-0 group-hover:opacity-100 ${
                      isActive ? 'opacity-100 text-black' : 'text-muted-foreground'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Help / Status Card */}
      <div className="p-3.5 rounded-2xl bg-muted/50 border border-border text-center space-y-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-xs font-bold text-foreground">
          {isMaster ? 'Squadra Master OS' : isBrand ? 'Gestão da Marca' : 'Suporte UGC Creator'}
        </p>
        <p className="text-[11px] text-muted-foreground leading-snug">
          {isMaster
            ? 'Acesso irrestrito a todos os dados do banco.'
            : isBrand
            ? 'Pipeline de contratação e aprovação de vídeos.'
            : 'Envio de vídeos e acompanhamento de cachês.'}
        </p>
      </div>
    </aside>
  );
};
