// "Lumen Haze" identity: misty porcelain-blue surfaces, deep slate-blue ink,
// one restrained brass accent. Everything tonal — no pure black, no pure white
// slabs, no loud gradients. Legacy token names (warm/sage/slate/amber/primary)
// are kept as aliases of the new ramps so existing class usage re-skins
// without TSX churn.

const porcelain = {
  50: '#F7F8FA',
  100: '#EFF1F5',
  200: '#E2E6EC',
  300: '#CDD3DE',
  400: '#A9B2C3',
  500: '#8A94A9',
  600: '#67728A',
  700: '#4B5568',
  800: '#333B4C',
  900: '#202633',
};

const mist = {
  50: '#F4F6FA',
  100: '#E9EDF4',
  200: '#D8DEEA',
  300: '#BFC9DB',
  400: '#9DAAC4',
  500: '#7B89A6',
  600: '#5D6B87',
  700: '#465269',
  800: '#333C4E',
  900: '#232A38',
};

const ink = {
  950: '#0C101B',
  900: '#131826',
  850: '#181E2B',
  800: '#1F2635',
  700: '#2B3447',
  600: '#39445A',
  500: '#46536B',
};

const brass = {
  300: '#D9BC85',
  400: '#C8A25D',
  500: '#B08A45',
  600: '#8F6E33',
  700: '#6F5527',
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        porcelain,
        mist,
        ink,
        brass,
        // Brass drives the micro-details (focus rings, spinners, ping dots)
        // that already use `primary`.
        primary: { DEFAULT: brass[500], light: brass[300], dark: brass[600] },
        accent: { DEFAULT: mist[500], gold: brass[400] },
        secondary: { DEFAULT: porcelain[300], light: porcelain[200], dark: porcelain[400] },
        // Legacy aliases — same hexes, zero component churn.
        warm: porcelain,
        sage: mist,
        slate: { 700: ink[700], 800: ink[850], 850: ink[900], 900: ink[950] },
        amber: { 400: brass[300], 500: brass[400], 600: brass[500] },
        dark: ink[950],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(19, 24, 38, 0.05), 0 4px 16px -6px rgba(19, 24, 38, 0.07)',
        lift: '0 10px 28px -12px rgba(19, 24, 38, 0.22), 0 2px 6px -2px rgba(19, 24, 38, 0.08)',
        glow: '0 0 0 1px rgba(200, 162, 93, 0.25), 0 8px 24px -10px rgba(200, 162, 93, 0.22)',
        'glow-lg': '0 0 0 1px rgba(200, 162, 93, 0.30), 0 16px 44px -16px rgba(200, 162, 93, 0.28)',
      },
      backgroundImage: {
        // Near-flat tonal ink shifts — used for solid surfaces, not effects.
        'brand-gradient': 'linear-gradient(150deg, #1F2635 0%, #131826 55%, #0C101B 100%)',
        'brand-sheen': 'linear-gradient(150deg, #2B3447 0%, #1F2635 55%, #131826 100%)',
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
