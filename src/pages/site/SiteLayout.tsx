import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { FoundingBrandModal } from '../../components/landing/FoundingBrandModal';
import { CreatorWaitlistModal } from '../../components/landing/CreatorWaitlistModal';
import { NavLink } from '../../components/common/NavLink';

// Vocabulário visual do site institucional (inspirado em theugcclub.com)
export const LIME = 'bg-[#DFE82A]';
export const INK = 'bg-[#2A2A2A]';
export const HEAVY = 'font-display font-black tracking-tight lowercase';
export const SERIF = 'font-serif';
export const PILL = 'inline-flex items-center gap-2 rounded-full border-2 border-black px-6 py-2.5 font-semibold transition-colors';
export const WRAP = 'max-w-6xl mx-auto px-4 sm:px-8';

export const SITE_VIEWS = ['landing', 'sobre', 'para-creators', 'para-marcas', 'contato', 'squad', 'planos'] as const;

export const Marquee: React.FC<{ items: string[]; className: string }> = ({ items, className }) => (
  <div className={`overflow-hidden whitespace-nowrap py-2 ${className}`} aria-hidden="true">
    <div className="ugc-marquee inline-block">
      {[0, 1].map((k) => (
        <span key={k} className="text-2xl sm:text-3xl font-medium pr-8">
          {items.map((t) => `${t}  •  `).join('')}
        </span>
      ))}
    </div>
  </div>
);

export interface SiteActions {
  openCreator: () => void;
  openBrand: () => void;
  onNavigate: (view: string) => void;
}

const NAV: [string, string][] = [
  ['para-creators', 'Para creators'],
  ['para-marcas', 'Para marcas'],
  ['planos', 'Planos'],
  ['squad', 'Academy'],
  ['sobre', 'Sobre'],
  ['contato', 'Contato'],
];

interface SiteLayoutProps {
  currentView: string;
  onNavigate: (view: string) => void;
  children: (actions: SiteActions) => React.ReactNode;
}

export const SiteLayout: React.FC<SiteLayoutProps> = ({ currentView, onNavigate, children }) => {
  const [brandOpen, setBrandOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const go = (v: string) => {
    setMenuOpen(false);
    onNavigate(v);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFAF9] text-black">
      <FoundingBrandModal isOpen={brandOpen} onClose={() => setBrandOpen(false)} />
      <CreatorWaitlistModal isOpen={creatorOpen} onClose={() => setCreatorOpen(false)} />

      <header className="sticky top-0 z-40 bg-[#FBFAF9]/95 backdrop-blur border-b border-black/10">
        <div className="flex h-16 items-center justify-between px-4 sm:px-8 lg:px-14">
          <NavLink view="landing" onNavigate={go} className={`${HEAVY} text-2xl`} aria-label="Início">
            <span className={`${LIME} px-1.5`}>squad</span> ugc
          </NavLink>
          <nav className="hidden md:flex items-center gap-7 text-[11px] font-bold uppercase tracking-wide">
            {NAV.map(([v, t]) => (
              <NavLink
                key={v}
                view={v}
                onNavigate={go}
                className={`uppercase hover:underline underline-offset-4 ${currentView === v ? 'underline' : ''}`}
              >
                {t}
              </NavLink>
            ))}
            <NavLink
              view="auth"
              onNavigate={go}
              className={`${PILL} px-4 py-1.5 bg-black text-white hover:bg-[#DFE82A] hover:text-black`}
            >
              Acessar painel
            </NavLink>
          </nav>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="md:hidden flex flex-col gap-4 px-4 pb-6 text-sm font-bold uppercase">
            {NAV.map(([v, t]) => (
              <NavLink key={v} view={v} onNavigate={go} className="text-left uppercase">
                {t}
              </NavLink>
            ))}
            <NavLink view="auth" onNavigate={go} className={`${PILL} justify-center bg-black text-white`}>
              Acessar painel
            </NavLink>
          </nav>
        )}
      </header>

      <main className="flex-1">
        {children({ openCreator: () => setCreatorOpen(true), openBrand: () => setBrandOpen(true), onNavigate: go })}
      </main>

      <footer className={`${INK} text-white`}>
        <div className={`${WRAP} py-12 grid grid-cols-1 md:grid-cols-4 gap-8`}>
          <div className="md:col-span-2 space-y-3">
            <span className={`${HEAVY} text-3xl`}>
              <span className="bg-[#DFE82A] text-black px-1.5">squad</span> ugc
            </span>
            <p className="text-sm text-white/70 max-w-sm">
              UGC e live commerce: squads de creators que produzem conteúdo e vendem ao vivo para a sua marca.
            </p>
          </div>
          <div className="space-y-2 text-[11px] font-bold uppercase tracking-wide">
            {NAV.map(([v, t]) => (
              <NavLink key={v} view={v} onNavigate={go} className="block uppercase hover:text-[#DFE82A]">
                {t}
              </NavLink>
            ))}
          </div>
          <div className="space-y-2 text-[11px] font-bold uppercase tracking-wide">
            <NavLink view="termos" onNavigate={go} className="block uppercase hover:text-[#DFE82A]">
              Termos de uso
            </NavLink>
            <NavLink view="privacidade" onNavigate={go} className="block uppercase hover:text-[#DFE82A]">
              Privacidade & LGPD
            </NavLink>
            <NavLink view="auth" onNavigate={go} className="block uppercase hover:text-[#DFE82A]">
              Acessar painel
            </NavLink>
          </div>
        </div>
        <div className={`${WRAP} py-5 border-t border-white/15 text-[10px] font-bold uppercase tracking-wide text-white/60`}>
          © {new Date().getFullYear()} Squad UGC. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};
