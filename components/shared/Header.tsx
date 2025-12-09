import { motion } from 'framer-motion';
import { designTokens, cn } from '@/lib/styles/tokens';
import { ReactNode } from 'react';
import { Shield } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function Header({ title, subtitle, icon, actions }: HeaderProps) {
  return (
    <motion.nav
      className={cn(
        'sticky top-0 z-50',
        designTokens.colors.card.base,
        designTokens.colors.card.backdrop,
        designTokens.colors.border.light,
        'border-b',
        designTokens.shadows.sm
      )}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className={cn('container mx-auto', designTokens.spacing.container, 'py-4')}>
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn('flex items-center', designTokens.spacing.gap.md)}
          >
            <motion.div
              className={cn(
                'w-12 h-12',
                'bg-gradient-to-br',
                designTokens.gradients.primary,
                designTokens.radius.md,
                'flex items-center justify-center',
                designTokens.shadows.md
              )}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {icon || <Shield className="w-6 h-6 text-white" />}
            </motion.div>
            <div>
              <motion.h1
                className={cn(
                  designTokens.typography.heading.h1,
                  designTokens.colors.text.primary
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {title}
              </motion.h1>
              {subtitle && (
                <p className={cn(designTokens.typography.body.sm, designTokens.colors.text.secondary, 'mt-0.5')}>
                  {subtitle}
                </p>
              )}
            </div>
          </motion.div>
          {actions && (
            <div className={cn('flex items-center', designTokens.spacing.gap.sm)}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
