import React from 'react';
import { Crown, Heart, Sparkles } from 'lucide-react';
import { InstagramIcon } from '../ui/InstagramIcon';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur text-muted-foreground text-xs py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground tracking-tight">NAIL CLUB PRO</span>
            <p className="text-[11px] text-muted-foreground">Plataforma de Creator Commerce para o Mercado de Unhas</p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
          <a href="#como-funciona-manicure" className="hover:text-primary transition-colors">Para Manicures</a>
          <a href="#como-funciona-marcas" className="hover:text-primary transition-colors">Para Marcas</a>
          <a href="#campanhas" className="hover:text-primary transition-colors">Campanhas</a>
          <a href="#academy" className="hover:text-primary transition-colors">Nail Academy</a>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1 text-primary font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> 100% Focado no Nicho Nail
          </span>
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
