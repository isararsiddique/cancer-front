import { motion } from 'framer-motion';
import { designTokens, cn } from '@/lib/styles/tokens';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  gradient?: boolean;
}

export function Card({
  children,
  className,
  hover = false,
  padding = 'md',
  gradient = false,
}: CardProps) {
  const paddingClasses = {
    sm: designTokens.spacing.cardSm,
    md: designTokens.spacing.card,
    lg: 'p-8',
  };

  const baseClasses = cn(
    designTokens.colors.card.solid,
    designTokens.radius.lg,
    designTokens.shadows.card,
    designTokens.colors.border.light,
    'border',
    'overflow-hidden',
    paddingClasses[padding]
  );

  const gradientBg = gradient
    ? 'bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30'
    : '';

  if (hover) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ duration: 0.2 }}
        className={cn(baseClasses, gradientBg, className)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(baseClasses, gradientBg, className)}
    >
      {children}
    </motion.div>
  );
}
