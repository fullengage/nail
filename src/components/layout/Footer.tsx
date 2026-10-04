import React from 'react';
import { Crown, Heart } from 'lucide-react';
import { NavLink } from '../common/NavLink';

interface FooterProps {
  onNavigate?: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur text-muted-foreground text-xs py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-black shadow-sm">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground tracking-tight">SQUADRA UGC</span>
            <p className="text-[11px] text-muted-foreground">Plataforma de Creator Commerce e Live Shopping</p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-medium">
          <NavLink view="para-creators" onNavigate={onNavigate} className="hover:text-primary transition-colors">
            Para Creators
          </NavLink>
          <NavLink view="para-marcas" onNavigate={onNavigate} className="hover:text-primary transition-colors">
            Para Marcas
          </NavLink>
          <NavLink view="squad" onNavigate={onNavigate} className="hover:text-primary transition-colors">
            Academy
          </NavLink>
          <span className="text-border">|</span>
          <NavLink view="termos" onNavigate={onNavigate} className="hover:text-primary transition-colors">
            Termos de Uso
          </NavLink>
          <NavLink view="privacidade" onNavigate={onNavigate} className="hover:text-primary transition-colors">
            Privacidade & LGPD
          </NavLink>
        </div>

        {/* Copyright */}
        <div className="flex items-center space-x-1 text-muted-foreground">
          <span>Desenvolvido com</span>
          <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
          <span>para profissionais da beleza &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
};
