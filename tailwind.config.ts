import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.2)',
          dark: 'rgba(255, 255, 255, 0.05)',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        // Design system gradients
        'gradient-primary': 'linear-gradient(to right, #2563eb, #4f46e5, #7c3aed)',
        'gradient-secondary': 'linear-gradient(to right, #06b6d4, #3b82f6, #6366f1)',
        'gradient-accent': 'linear-gradient(to right, #a855f7, #ec4899, #f43f5e)',
        'gradient-success': 'linear-gradient(to right, #10b981, #059669, #14b8a6)',
        'gradient-warning': 'linear-gradient(to right, #f59e0b, #f97316, #dc2626)',
        'gradient-background': 'linear-gradient(to bottom right, #f8fafc, #dbeafe, #e0e7ff)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 20px 60px 0 rgba(31, 38, 135, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;

