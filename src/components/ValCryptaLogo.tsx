interface ValCryptaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function ValCryptaLogo({ size = 'md', showText = true }: ValCryptaLogoProps) {
  const sizes = {
    sm: { icon: 'w-5 h-5', text: 'text-base' },
    md: { icon: 'w-6 h-6', text: 'text-xl' },
    lg: { icon: 'w-10 h-10', text: 'text-3xl' }
  };

  const { icon, text } = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <svg
          className={`${icon} text-primary dark:text-amber-500`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className="text-primary dark:text-amber-500" stopColor="currentColor" />
              <stop offset="100%" className="text-primary-dark dark:text-amber-600" stopColor="currentColor" />
            </linearGradient>
          </defs>
          <path
            d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L12 2Z"
            fill="url(#shield-gradient)"
            opacity="0.15"
          />
          <path
            d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L12 2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.8" />
          <path
            d="M12 8V10M12 14V16M8 12H10M14 12H16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {showText && (
        <h2 className={`${text} font-bold tracking-tight text-warm-800 dark:text-slate-100`}>
          <span className="bg-gradient-to-r from-primary via-primary-dark to-primary dark:from-amber-400 dark:via-amber-500 dark:to-amber-600 bg-clip-text text-transparent">
            Val
          </span>
          <span className="text-warm-700 dark:text-slate-300">Crypta</span>
        </h2>
      )}
    </div>
  );
}
