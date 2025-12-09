/**
 * Design Tokens for Registry Platform
 * Centralized design system for consistent styling across all platforms
 */

export const designTokens = {
  // Color gradients for backgrounds and accents
  gradients: {
    primary: 'from-blue-600 via-indigo-600 to-purple-700',
    secondary: 'from-cyan-500 via-blue-500 to-indigo-600',
    accent: 'from-purple-500 via-pink-500 to-rose-600',
    success: 'from-green-500 via-emerald-500 to-teal-600',
    warning: 'from-amber-500 via-orange-500 to-red-600',
    background: 'from-slate-50 via-blue-50 to-indigo-50',
  },

  // Solid colors for UI elements
  colors: {
    // Background colors
    background: {
      primary: 'bg-white',
      secondary: 'bg-slate-50',
      gradient: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
    },
    // Card colors
    card: {
      base: 'bg-white/80',
      solid: 'bg-white',
      backdrop: 'backdrop-blur-md',
    },
    // Border colors
    border: {
      light: 'border-slate-200/60',
      medium: 'border-slate-300',
      dark: 'border-slate-400',
    },
    // Text colors
    text: {
      primary: 'text-slate-900',
      secondary: 'text-slate-600',
      tertiary: 'text-slate-500',
      white: 'text-white',
    },
    // Status colors
    status: {
      success: 'text-green-600',
      warning: 'text-amber-600',
      error: 'text-red-600',
      info: 'text-blue-600',
    },
  },

  // Shadow definitions
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    card: 'shadow-md',
    elevated: 'shadow-lg',
    interactive: 'shadow-xl',
  },

  // Spacing values
  spacing: {
    section: 'py-8',
    sectionX: 'px-6',
    card: 'p-6',
    cardSm: 'p-4',
    container: 'px-6',
    gap: {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
  },

  // Border radius
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },

  // Typography
  typography: {
    heading: {
      h1: 'text-2xl font-bold',
      h2: 'text-xl font-bold',
      h3: 'text-lg font-bold',
    },
    body: {
      base: 'text-base',
      sm: 'text-sm',
      xs: 'text-xs',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },

  // Transitions
  transitions: {
    base: 'transition-colors',
    all: 'transition-all',
    duration: {
      fast: 'duration-150',
      normal: 'duration-200',
      slow: 'duration-300',
    },
  },
} as const;

// Helper function to combine token classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
