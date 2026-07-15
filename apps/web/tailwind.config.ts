import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // AI Growth Design System tokens
        background: '#080B16',
        surface: '#111827',
        'surface-hover': '#1A2236',
        elevated: '#1A2236',
        border: '#263247',
        primary: {
          DEFAULT: '#4F8CFF',
          50: '#eef4ff',
          100: '#dbe7ff',
          200: '#bcd3ff',
          300: '#8fb5ff',
          400: '#6b9bff',
          500: '#4F8CFF',
          600: '#3b73e6',
          700: '#2f5bbd',
          800: '#284a99',
          900: '#243f7a',
        },
        secondary: '#8B5CF6',
        'ai-premium': '#EC4899',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        'text-primary': '#FFFFFF',
        'text-secondary': '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'ai-hero': 'linear-gradient(135deg, #4F8CFF, #8B5CF6)',
        'ai-growth': 'linear-gradient(135deg, #22C55E, #4F8CFF)',
        'ai-premium': 'linear-gradient(135deg, #8B5CF6, #EC4899)',
      },
      boxShadow: {
        'glow-primary': '0 0 24px rgba(79,140,255,0.2)',
        'glow-secondary': '0 0 24px rgba(139,92,246,0.2)',
        'glow-success': '0 0 24px rgba(34,197,94,0.2)',
        card: '0 1px 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};

export default config;
