import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    '../../apps/web/**/*.{ts,tsx}',
    '../../packages/ui/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
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
        score: {
          a: '#22c55e',
          b: '#84cc16',
          c: '#eab308',
          d: '#f97316',
          f: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};

export default config;
