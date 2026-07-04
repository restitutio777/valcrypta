/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        // Primary brand identity — a luminous emerald-sage
        primary: {
          DEFAULT: '#1f8a5d',
          light: '#5cb98c',
          dark: '#136b46',
        },
        secondary: {
          DEFAULT: '#D4CFC0',
          light: '#E8E4D9',
          dark: '#C0BCB0',
        },
        accent: {
          DEFAULT: '#2fb59b',
          gold: '#c9a962',
        },
        // Warm cream neutrals (light surfaces)
        warm: {
          50: '#FAF8F2',
          100: '#EDE9DF',
          200: '#DBD5C6',
          300: '#C4BDAB',
          400: '#A79F8E',
          500: '#867E6F',
          600: '#645D52',
          700: '#463F38',
          800: '#2A2621',
          900: '#181511',
        },
        // Emerald / sage brand ramp
        sage: {
          50: '#EEF6F0',
          100: '#D6EADD',
          200: '#AFD6BE',
          300: '#82BF9B',
          400: '#4FA57A',
          500: '#1f8a5d',
          600: '#136b46',
          700: '#0f5236',
          800: '#0b3d28',
          900: '#082c1d',
        },
        // Deep forest-charcoal ink (dark surfaces)
        ink: {
          950: '#070d0a',
          900: '#0b130e',
          850: '#0f1912',
          800: '#142117',
          700: '#1c2e21',
          600: '#2a412f',
          500: '#3a5641',
        },
        // Dark-mode surfaces route through the same forest-ink ramp so the
        // existing `slate-*` classes stay on-brand.
        slate: {
          700: '#1c2e21',
          800: '#0f1912',
          850: '#0b130e',
          900: '#070d0a',
        },
        amber: {
          400: '#dcc07e',
          500: '#c9a962',
          600: '#b3924e',
        },
        dark: '#070d0a',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(24, 40, 30, 0.08), 0 4px 20px -4px rgba(24, 40, 30, 0.08)',
        lift: '0 10px 30px -10px rgba(24, 50, 34, 0.25), 0 2px 8px -2px rgba(24, 50, 34, 0.12)',
        glow: '0 0 0 1px rgba(31, 138, 93, 0.18), 0 12px 40px -12px rgba(31, 138, 93, 0.45)',
        'glow-lg': '0 20px 70px -20px rgba(31, 138, 93, 0.55)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2fa374 0%, #1f8a5d 45%, #0f6b47 100%)',
        'brand-sheen': 'linear-gradient(135deg, #5cb98c 0%, #1f8a5d 40%, #2fb59b 100%)',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(120%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-24px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(30px, -20px) scale(1.05)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.9' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        float: 'float 8s ease-in-out infinite',
        'float-slow': 'float-slow 14s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.6s ease-out both',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'gradient-pan': 'gradient-pan 6s ease infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
