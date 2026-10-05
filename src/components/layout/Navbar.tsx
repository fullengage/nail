import React, { useEffect, useState } from 'react';
import { campaignFlow } from '../../services/campaignFlow';
import { PATH_TO_VIEW } from '../../lib/routes';
import { useAuth, SQUADRA_AUTH_LEVELS } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Bell, 
  ChevronDown, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Building2, 
  Sparkles, 
  Layers
} from 'lucide-react';
import { Button } from '../ui/Button';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, role, logout, loginAsLevel } = useAuth();
  const { notifications: localNotifs, markNotificationAsRead } = useData();
  // com login: notificações reais do servidor; sem login (demonstração): as locais
  const [serverNotifs, setServerNotifs] = useState<typeof localNotifs | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const user = await campaignFlow.session().catch(() => null);
      if (!user) { if (alive) setServerNotifs(null); return; }
      const ns = await campaignFlow.notifications().catch(() => []);
      if (alive) setServerNotifs(ns.map((n) => ({ id: n.id, user_id: '', title: n.title, message: n.body || '', type: 'campaign', read: !!n.read_at, link: n.link || '', created_at: n.created_at })) as typeof localNotifs);
    };
    load();
    const t = window.setInterval(load, 60000);
    return () => { alive = false; window.clearInterval(t); };
  }, [user?.id]);
  const notifications = serverNotifs ?? localNotifs;
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const isMaster = role === 'admin_master' || role === 'admin';
  const isBrand = role === 'brand_admin' || role === 'brand';
  const isCreator = role === 'creator';

  const roleMeta = isMaster
    ? {
        name: '1. Admin Geral',
        badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
        icon: ShieldCheck,
      }
    : isBrand
    ? {
        name: '2. Empresa (Contratante)',
        badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
        icon: Building2,
      }
    : {
        name: '3. UGC Influenciador',
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        icon: Sparkles,
      };

  const RoleIcon = roleMeta.icon;

  const handleNavigateToRoleDashboard = () => {
    if (isCreator) onNavigate('creator-dashboard');
    else if (isBrand) onNavigate('dashboard');
    else onNavigate('dashboard');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Brand Logo & Active Level Indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <span className="font-display font-black tracking-tight text-xl text-foreground flex items-center gap-1">
              <span className="bg-primary text-black px-2 py-0.5 rounded font-black tracking-tighter">SQUADRA</span>
              <span className="text-primary font-bold tracking-tight text-sm">UGC</span>
            </span>
          </div>

          {/* Role Badge in Header */}
          <div className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${roleMeta.badgeClass}`}>
            <RoleIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{roleMeta.name}</span>
          </div>
        </div>

        {/* Center Navigation Links based on role */}
        <nav className="hidden md:flex items-center space-x-5 text-xs font-semibold">
          {isCreator ? (
            <>
              <button
                onClick={() => onNavigate('creator-dashboard')}
                className={`transition-colors hover:text-primary ${currentView === 'creator-dashboard' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                Meu Painel UGC
              </button>
              <button
                onClick={() => onNavigate('creator-campaigns')}
                className={`transition-colors hover:text-primary ${currentView === 'creator-campaigns' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                Oportunidades
              </button>
              <button
                onClick={() => onNavigate('creator-my-campaigns')}
                className={`transition-colors hover:text-primary ${currentView === 'creator-my-campaigns' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                Minhas Entregas
              </button>
              <button
                onClick={() => onNavigate('creator-earnings')}
                className={`transition-colors hover:text-primary ${currentView === 'creator-earnings' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                Meus Ganhos
              </button>
              <button
                onClick={() => onNavigate('creator-portfolio')}
                className={`transition-colors hover:text-primary ${currentView === 'creator-portfolio' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                Mídia Kit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`transition-colors hover:text-primary ${currentView === 'dashboard' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('creators')}
                className={`transition-colors hover:text-primary ${currentView === 'creators' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                Creators
              </button>
              <button
                onClick={() => onNavigate('campaigns')}
                className={`transition-colors hover:text-primary ${currentView === 'campaigns' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                Campanhas & Squads
              </button>
              <button
                onClick={() => onNavigate('retail')}
                className={`transition-colors hover:text-primary ${currentView === 'retail' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                PDVs
              </button>
              <button
                onClick={() => onNavigate('affiliates')}
                className={`transition-colors hover:text-primary ${currentView === 'affiliates' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                Afiliados
              </button>
              {isMaster && (
                <button
                  onClick={() => onNavigate('brands')}
                  className={`transition-colors hover:text-primary ${currentView === 'brands' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
                >
                  Marcas
                </button>
              )}
            </>
          )}
        </nav>

        {/* Right Section (Notifications, Role switcher & Profile) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Notificações"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-primary" /> Notificações
                  </h4>
                  <span className="text-xs text-muted-foreground">{unreadCount} não lidas</span>
                </div>
                <div className="divide-y divide-border/60 max-h-80 overflow-y-auto mt-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (serverNotifs) { campaignFlow.markRead(n.id); setServerNotifs((p) => p && p.map((x) => (x.id === n.id ? { ...x, read: true } : x))); }
                        else markNotificationAsRead(n.id);
                        if (n.link) onNavigate(PATH_TO_VIEW[n.link] || n.link.replace('/', ''));
                        setShowNotifs(false);
                      }}
                      className={`p-3 text-left rounded-xl transition-colors cursor-pointer hover:bg-muted/60 ${
                        !n.read ? 'bg-primary/5 font-medium' : 'opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-xs font-semibold text-foreground">{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1"></span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Access Level Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 pr-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted/50 transition-all text-left"
            >
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user?.full_name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-primary/30"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold leading-tight text-foreground truncate max-w-[120px]">
                  {user?.full_name.split(' ')[0]}
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground truncate">
                  {roleMeta.name}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-card border border-border shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95">
                <div className="p-2 border-b border-border/60">
                  <p className="text-xs font-bold text-foreground">{user?.full_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${roleMeta.badgeClass}`}>
                    <RoleIcon className="w-3 h-3" />
                    <span>{roleMeta.name}</span>
                  </div>
                </div>

                {/* 3 Níveis de Acesso Switcher */}
                <div className="py-2 border-b border-border/60">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1.5 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-primary" /> Alternar Nível de Acesso:
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        loginAsLevel('admin_master');
                        setShowUserMenu(false);
                        onNavigate('dashboard');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        role === 'admin_master'
                          ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                        <span>1. Admin Geral</span>
                      </div>
                      <span className="text-[10px] opacity-75">admin@</span>
                    </button>

                    <button
                      onClick={() => {
                        loginAsLevel('brand_admin');
                        setShowUserMenu(false);
                        onNavigate('dashboard');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        role === 'brand_admin'
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>2. Empresa (Contratante)</span>
                      </div>
                      <span className="text-[10px] opacity-75">empresa@</span>
                    </button>

                    <button
                      onClick={() => {
                        loginAsLevel('creator');
                        setShowUserMenu(false);
                        onNavigate('creator-dashboard');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        role === 'creator'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span>3. UGC Creator</span>
                      </div>
                      <span className="text-[10px] opacity-75">ugc@</span>
                    </button>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      handleNavigateToRoleDashboard();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-muted flex items-center gap-2"
                  >
                    <RoleIcon className="w-3.5 h-3.5 text-primary" /> Meu Painel
                  </button>
                  <button
                    onClick={() => {
                      if (isCreator) onNavigate('creator-profile');
                      else onNavigate('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-muted flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" /> Configurações
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      onNavigate('auth');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-red-500/10 text-red-600 flex items-center gap-2 border-t border-border/50 mt-1 pt-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sair da Conta
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Dashboard Action */}
          <Button
            size="sm"
            onClick={handleNavigateToRoleDashboard}
            className="hidden sm:inline-flex text-xs font-bold"
          >
            Acessar Painel
          </Button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl md:hidden text-foreground hover:bg-muted"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-3">
          <div className="p-2.5 rounded-xl bg-muted/60 border border-border flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Nível Ativo:</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleMeta.badgeClass}`}>
              {roleMeta.name}
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted"
            >
              Dashboard
            </button>
            <button
              onClick={() => { onNavigate('creators'); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted"
            >
              Creators
            </button>
            <button
              onClick={() => { onNavigate('campaigns'); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted"
            >
              Campanhas
            </button>
            <button
              onClick={() => { onNavigate('retail'); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted"
            >
              PDVs Parceiros
            </button>
            <button
              onClick={() => { onNavigate('affiliates'); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted"
            >
              Afiliados
            </button>
          </div>

          <div className="pt-2 border-t border-border space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase px-1">Trocar Perfil (Teste):</p>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => { loginAsLevel('admin_master'); setMobileMenuOpen(false); }}
                className="p-1.5 text-center text-[10px] font-bold rounded-lg border bg-purple-500/10 text-purple-700"
              >
                1. Admin
              </button>
              <button
                onClick={() => { loginAsLevel('brand_admin'); setMobileMenuOpen(false); }}
                className="p-1.5 text-center text-[10px] font-bold rounded-lg border bg-blue-500/10 text-blue-700"
              >
                2. Empresa
              </button>
              <button
                onClick={() => { loginAsLevel('creator'); setMobileMenuOpen(false); }}
                className="p-1.5 text-center text-[10px] font-bold rounded-lg border bg-emerald-500/10 text-emerald-700"
              >
                3. UGC
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
