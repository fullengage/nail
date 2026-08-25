import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'bordered' | 'elevated';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-card text-card-foreground border border-border/80 shadow-sm',
      glass: 'glass-panel text-card-foreground shadow-lg',
      bordered: 'border-2 border-border/90 bg-card text-card-foreground',
      elevated: 'bg-card text-card-foreground shadow-xl border border-border/50 hover:shadow-2xl transition-all duration-300',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-2xl p-6 transition-all duration-200', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
