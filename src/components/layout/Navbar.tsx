import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Crown, Bell, Sparkles, ChevronDown, CheckCircle2, User, LogOut, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, role, logout } = useAuth();
  const { notifications, markNotificationAsRead } = useData();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('landing')}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary via-primary-500 to-amber-500 p-0.5 shadow-md shadow-primary/20 flex items-center justify-center">
            <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold tracking-tight text-lg font-display text-foreground">NAIL CLUB</span>
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-widest uppercase">PRO</span>
            </div>
            <p className="text-[10px] text-muted-foreground tracking-wider font-medium uppercase -mt-0.5">Creator Commerce</p>
          </div>
        </div>

        {/* Center Navigation Links (Public / Quick jumps) */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <button
            onClick={() => onNavigate('landing')}
            className={`transition-colors hover:text-primary ${currentView === 'landing' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
          >
            Início
          </button>
          <button
            onClick={() => onNavigate('creator-campaigns')}
            className={`transition-colors hover:text-primary ${currentView === 'creator-campaigns' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
          >
            Campanhas
          </button>
          <button
            onClick={() => onNavigate('brand-creators')}
            className={`transition-colors hover:text-primary ${currentView === 'brand-creators' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
          >
            Nail Creators
          </button>
          <button
            onClick={() => onNavigate('creator-academy')}
            className={`transition-colors hover:text-primary ${currentView === 'creator-academy' ? 'text-primary font-bold' : 'text-muted-foreground'}`}
          >
            Academy
          </button>
        </nav>

        {/* Right Section (Notifications & Profile) */}
        <div className="flex items-center space-x-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Notificações"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm animate-pulse">
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
                        markNotificationAsRead(n.id);
                        if (n.link) onNavigate(n.link.replace('/', ''));
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

          {/* User Profile / Dashboard CTA */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-xl border border-border/80 bg-card hover:bg-muted/50 transition-all text-left"
            >
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user?.full_name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-primary/30"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold leading-tight text-foreground truncate max-w-[120px]">
                  {user?.full_name.split(' ')[0]}
                </p>
                <p className="text-[10px] font-semibold text-primary capitalize">
                  {role === 'creator' ? 'Nail Creator' : role === 'brand' ? 'Marca Parceira' : 'Administrador'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-2xl p-2 z-50">
                <div className="p-2 border-b border-border/60">
                  <p className="text-xs font-bold text-foreground">{user?.full_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      if (role === 'creator') onNavigate('creator-dashboard');
                      else if (role === 'brand') onNavigate('brand-dashboard');
                      else onNavigate('admin-dashboard');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-primary/10 hover:text-primary flex items-center gap-2"
                  >
                    <Crown className="w-3.5 h-3.5" /> Meu Painel ({role})
                  </button>
                  <button
                    onClick={() => {
                      if (role === 'creator') onNavigate('creator-profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" /> Perfil & Configurações
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Dashboard CTA */}
          <Button
            size="sm"
            onClick={() => {
              if (role === 'creator') onNavigate('creator-dashboard');
              else if (role === 'brand') onNavigate('brand-dashboard');
              else onNavigate('admin-dashboard');
            }}
            className="hidden sm:inline-flex"
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
        <div className="md:hidden border-t border-border bg-card p-4 space-y-2">
          <button
            onClick={() => { onNavigate('landing'); setMobileMenuOpen(false); }}
            className="block w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted"
          >
            Início
          </button>
          <button
            onClick={() => { onNavigate('creator-campaigns'); setMobileMenuOpen(false); }}
            className="block w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted"
          >
            Campanhas
          </button>
          <button
            onClick={() => { onNavigate('brand-creators'); setMobileMenuOpen(false); }}
            className="block w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted"
          >
            Nail Creators
          </button>
          <button
            onClick={() => { onNavigate('creator-academy'); setMobileMenuOpen(false); }}
            className="block w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted"
          >
            Nail Academy
          </button>
          <div className="pt-2 border-t border-border">
            <Button
              className="w-full"
              size="sm"
              onClick={() => {
                if (role === 'creator') onNavigate('creator-dashboard');
                else if (role === 'brand') onNavigate('brand-dashboard');
                else onNavigate('admin-dashboard');
                setMobileMenuOpen(false);
              }}
            >
              Ir para Painel ({role})
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
