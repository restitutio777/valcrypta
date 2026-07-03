/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8BA888',
          light: '#A8BFA8',
          dark: '#6B8B6B',
        },
        secondary: {
          DEFAULT: '#D4CFC0',
          light: '#E8E4D9',
          dark: '#C0BCB0',
        },
        accent: {
          DEFAULT: '#B5D4C8',
          gold: '#C9B88A',
        },
        warm: {
          50: '#F5F3EE',
          100: '#E8E4D9',
          200: '#D4CFC0',
          300: '#C0BCB0',
          400: '#A8A39A',
          500: '#8B8680',
          600: '#6B6660',
          700: '#4A4640',
          800: '#2B2926',
          900: '#1A1816',
        },
        sage: {
          50: '#F0F4F0',
          100: '#D9E4D9',
          200: '#B5D0B5',
          300: '#A8BFA8',
          400: '#8BA888',
          500: '#6B8B6B',
          600: '#557055',
          700: '#3D4F3D',
          800: '#1F1F1F',
          900: '#0F0F0F',
        },
        slate: {
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        dark: '#1A1816',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
      },
    },
  },
  plugins: [],
};
