import { motion } from 'framer-motion';
import { designTokens, cn } from '@/lib/styles/tokens';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = cn(
    'flex items-center justify-center gap-2',
    designTokens.radius.md,
    designTokens.transitions.base,
    designTokens.typography.body.sm,
    designTokens.typography.weight.medium,
    'focus:outline-none focus:ring-2 focus:ring-offset-2'
  );

  const variantClasses = {
    primary: cn(
      'bg-gradient-to-r',
      designTokens.gradients.primary,
      designTokens.colors.text.white,
      'hover:opacity-90',
      'focus:ring-blue-500',
      designTokens.shadows.md
    ),
    secondary: cn(
      designTokens.colors.background.primary,
      designTokens.colors.border.light,
      'border',
      designTokens.colors.text.secondary,
      'hover:bg-slate-50 hover:border-slate-300',
      'focus:ring-slate-300',
      designTokens.shadows.sm
    ),
    outline: cn(
      'bg-transparent',
      designTokens.colors.border.medium,
      'border',
      designTokens.colors.text.primary,
      'hover:bg-slate-50',
      'focus:ring-slate-300'
    ),
    ghost: cn(
      'bg-transparent',
      designTokens.colors.text.secondary,
      'hover:bg-slate-100',
      'focus:ring-slate-300'
    ),
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-base',
  };

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : '';

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}
