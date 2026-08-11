import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/engine/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bram Intel Cinematic Palette
        brand: {
          50: '#eef8ff',
          100: '#d8f0ff',
          200: '#b9e5ff',
          300: '#72b9f3',
          400: '#3498e3',
          500: '#0d5771',
          600: '#083d50',
          700: '#0a3242',
          800: '#0d2a38',
          900: '#071a24',
          950: '#041017',
        },
        cinematic: {
          bg: '#071A24',
          surface: '#0D2A38',
          border: '#1E3A4A',
          pill: '#0A222E',
          accent: '#3498E3',
          accentLight: '#72B9F3',
          teal: '#0D5771',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        dark: {
          bg: '#071A24',
          card: '#0D2A38',
          border: '#1E3A4A',
          hover: '#0A222E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Kanit', 'Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(52, 152, 227, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(52, 152, 227, 0.7)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
