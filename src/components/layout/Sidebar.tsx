import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  Image as ImageIcon,
  DollarSign,
  GraduationCap,
  User,
  PlusCircle,
  Users,
  Inbox,
  Video,
  Package,
  ShieldCheck,
  Building2,
  TrendingUp,
  FileCheck,
  ChevronRight,
  Sparkles
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

  // Badge counts
  const pendingAppsCount = applications.filter(a => a.status === 'pending').length;
  const pendingSubsCount = submissions.filter(s => s.status === 'submitted').length;

  const creatorMenuItems: MenuItem[] = [
    { id: 'creator-dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'creator-campaigns', label: 'Campanhas Disponíveis', icon: Compass },
    { id: 'creator-my-campaigns', label: 'Minhas Campanhas', icon: Briefcase, badge: 'Ativas' },
    { id: 'creator-portfolio', label: 'Meu Portfólio', icon: ImageIcon },
    { id: 'creator-earnings', label: 'Ganhos & Afiliados', icon: DollarSign },
    { id: 'creator-academy', label: 'Nail Academy', icon: GraduationCap, badge: 'Cursos' },
    { id: 'creator-profile', label: 'Meu Perfil', icon: User },
  ];

  const brandMenuItems: MenuItem[] = [
    { id: 'brand-dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'brand-create-campaign', label: 'Criar Campanha', icon: PlusCircle, isHighlight: true },
    { id: 'brand-campaigns', label: 'Minhas Campanhas', icon: Briefcase },
    { id: 'brand-creators', label: 'Explorar Creators', icon: Users },
    { id: 'brand-applications', label: 'Candidaturas', icon: Inbox, count: pendingAppsCount },
    { id: 'brand-content', label: 'Conteúdos & Entregas', icon: Video, count: pendingSubsCount },
    { id: 'brand-products', label: 'Meus Produtos', icon: Package },
  ];

  const adminMenuItems: MenuItem[] = [
    { id: 'admin-dashboard', label: 'Dashboard Geral', icon: LayoutDashboard },
    { id: 'admin-moderation-creators', label: 'Creators Cadastradas', icon: Users },
    { id: 'admin-moderation-brands', label: 'Marcas Parceiras', icon: Building2 },
    { id: 'admin-moderation-campaigns', label: 'Moderação Campanhas', icon: FileCheck },
    { id: 'admin-finance', label: 'Financeiro & Comissões', icon: TrendingUp },
    { id: 'admin-academy', label: 'Gestão Academy', icon: GraduationCap },
  ];

  const items: MenuItem[] = role === 'creator' ? creatorMenuItems : role === 'brand' ? brandMenuItems : adminMenuItems;

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
              <p className="text-[10px] text-muted-foreground font-medium truncate">
                {role === 'creator' ? 'Nail Creator PRO' : role === 'brand' ? 'Marca Verificada' : 'Administração Geral'}
              </p>
            </div>
          </div>

          {/* Profile strength widget for Creator */}
          {role === 'creator' && (
            <div className="mt-3 pt-2.5 border-t border-primary/10">
              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground/80 mb-1">
                <span>Completude do Perfil</span>
                <span className="text-primary font-bold">{creatorProfile?.profile_completion || 95}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${creatorProfile?.profile_completion || 95}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1">
          <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase px-3 mb-2">
            Navegação Principal
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
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : item.isHighlight
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 font-bold border border-amber-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : item.isHighlight ? 'text-amber-500' : 'text-muted-foreground'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 ? (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-white text-primary' : 'bg-primary text-white'
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
                      isActive ? 'opacity-100 text-white' : 'text-muted-foreground'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Pro Help Box */}
      <div className="p-3.5 rounded-2xl bg-muted/50 border border-border text-center space-y-2">
        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-xs font-bold text-foreground">Suporte Creator VIP</p>
        <p className="text-[11px] text-muted-foreground leading-snug">
          Dúvidas sobre campanhas ou pagamentos?
        </p>
        <button
          onClick={() => alert('Canal exclusivo de suporte via WhatsApp aberto!')}
          className="w-full text-center py-1.5 text-xs font-bold text-primary hover:underline"
        >
          Falar com Gerente
        </button>
      </div>
    </aside>
  );
};
