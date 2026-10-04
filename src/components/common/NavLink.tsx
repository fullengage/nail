import React from 'react';
import { getViewPath } from '../../lib/routes';

export interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  view: string;
  onNavigate?: (view: string) => void;
  className?: string;
  children: React.ReactNode;
}

export const NavLink: React.FC<NavLinkProps> = ({
  view,
  onNavigate,
  className,
  children,
  onClick,
  ...props
}) => {
  const href = getViewPath(view);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Permite abrir em nova aba com Ctrl/Cmd ou clique do meio
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }

    e.preventDefault();
    onClick?.(e);
    if (onNavigate) {
      onNavigate(view);
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
};
