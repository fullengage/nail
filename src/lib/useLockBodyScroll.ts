import { useEffect } from 'react';

// trava a rolagem da página de trás enquanto um modal está aberto e fecha com Esc
export function useLockBodyScroll(active: boolean, onEscape?: () => void) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onEscape?.(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [active, onEscape]);
}
