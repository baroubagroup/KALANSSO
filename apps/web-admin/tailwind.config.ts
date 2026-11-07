import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette Maîtresse : Vert Nature & Sécurité kalansso os
        nature: {
          50: '#F2F8F4',
          100: '#D8EFE2',
          200: '#B5E1C8',
          300: '#74B892',
          400: '#4D9F73',
          500: '#2E8B5E',
          600: '#256B4C',
          700: '#1B4D3E', // Vert Maître Officiel
          800: '#163E2E',
          900: '#0D281E',
        },
        surface: {
          bg: '#F5F8F6',
          card: '#FFFFFF',
          border: '#E1ECE5',
          borderDark: '#C4D9CD',
        },
        typography: {
          main: '#12231A',
          muted: '#4E6457',
          subtle: '#799083',
        },
        accent: {
          gold: '#C59B27', // Doré sobre pour mentions d'excellence
          terracotta: '#B85D3B', // Ocre sahélien
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        nature: '0 4px 20px -2px rgba(27, 77, 62, 0.08), 0 2px 6px -1px rgba(27, 77, 62, 0.04)',
        card: '0 1px 3px 0 rgba(18, 35, 26, 0.04), 0 1px 2px -1px rgba(18, 35, 26, 0.02)',
      },
    },
  },
  plugins: [],
};

export default config;
