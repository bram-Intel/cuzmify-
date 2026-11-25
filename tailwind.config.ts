import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/studio/**/*.{js,ts,jsx,tsx,mdx}',
    './src/core/**/*.{js,ts,jsx,tsx,mdx}',
    './src/engine/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#72b9f3',
          400: '#3498e3',
          500: '#0d5771',
          600: '#083d50',
          700: '#0a3242',
          800: '#1a202c',
          900: '#0f172a',
          950: '#020617',
        },
        cinematic: {
          bg: '#FFFFFF',
          surface: '#F7FAFC',
          border: '#E2E8F0',
          pill: '#F1F5F9',
          accent: '#3498E3',
          accentLight: '#72B9F3',
          teal: '#0D5771',
          text: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        xs: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
      },
      backdropBlur: {
        xs: '2px',
      },
      blur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(52, 152, 227, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(52, 152, 227, 0.4)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
