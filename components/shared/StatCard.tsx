import { motion } from 'framer-motion';
import { designTokens, cn } from '@/lib/styles/tokens';
import { LucideIcon, TrendingUp, AlertCircle } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  change?: string;
  gradient: 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'alert' | 'neutral';
  index?: number;
}

const gradientConfig = {
  primary: {
    gradient: 'from-blue-600 via-indigo-600 to-purple-700',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  success: {
    gradient: 'from-green-500 via-emerald-500 to-teal-600',
    bg: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  warning: {
    gradient: 'from-amber-500 via-orange-500 to-red-600',
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  error: {
    gradient: 'from-red-500 via-rose-500 to-pink-600',
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  info: {
    gradient: 'from-cyan-500 via-blue-500 to-purple-600',
    bg: 'bg-cyan-50',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  gradient,
  trend = 'neutral',
  index = 0,
}: StatCardProps) {
  const config = gradientConfig[gradient];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -20 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, y: -5 }}
      className={cn(
        'relative',
        designTokens.spacing.card,
        designTokens.radius.lg,
        designTokens.colors.background.primary,
        designTokens.shadows.md,
        designTokens.colors.border.light,
        'border',
        'overflow-hidden'
      )}
      style={{
        background: `linear-gradient(135deg, ${
          gradient === 'warning'
            ? '#fffbeb'
            : gradient === 'success'
            ? '#f0fdf4'
            : gradient === 'error'
            ? '#fef2f2'
            : gradient === 'info'
            ? '#f0f9ff'
            : '#eff6ff'
        } 0%, white 100%)`,
      }}
    >
      <div className="relative z-10">
        <div className={cn('flex items-center justify-between', 'mb-4')}>
          <div className={cn('p-3', designTokens.radius.md, config.iconBg)}>
            <Icon className={cn('w-6 h-6', config.iconColor)} />
          </div>
          {trend === 'up' && <TrendingUp className="w-5 h-5 text-emerald-500" />}
          {trend === 'alert' && <AlertCircle className="w-5 h-5 text-amber-500" />}
        </div>
        <div>
          <p
            className={cn(
              designTokens.colors.text.secondary,
              designTokens.typography.body.sm,
              'mb-2',
              designTokens.typography.weight.medium
            )}
          >
            {label}
          </p>
          <motion.p
            className={cn('text-4xl', designTokens.typography.weight.bold, 'mb-1', designTokens.colors.text.primary)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            {value}
          </motion.p>
          {change && (
            <p className={cn(designTokens.colors.text.tertiary, designTokens.typography.body.xs)}>{change}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
