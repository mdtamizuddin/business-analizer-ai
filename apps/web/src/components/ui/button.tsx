import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-600 shadow-glow-primary focus-visible:ring-primary/40',
  ai: 'bg-ai-hero text-white hover:opacity-90 shadow-glow-secondary focus-visible:ring-secondary/40',
  secondary:
    'border border-primary/40 text-primary hover:bg-primary/10 focus-visible:ring-primary/40',
  success: 'bg-success text-white hover:bg-success/90 shadow-glow-success focus-visible:ring-success/40',
  destructive: 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/40',
  ghost: 'text-text-secondary hover:bg-surface-hover focus-visible:ring-surface-hover',
  outline: 'border border-border text-text-primary hover:bg-surface-hover focus-visible:ring-surface-hover',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
