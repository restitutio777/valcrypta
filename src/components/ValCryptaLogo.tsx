interface ValCryptaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function ValCryptaLogo({ size = 'md', showText = true }: ValCryptaLogoProps) {
  const sizes = {
    sm: { box: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-base' },
    md: { box: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-xl' },
    lg: { box: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-3xl' },
  };

  const { box, icon, text } = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${box} relative rounded-2xl bg-brand-gradient shadow-glow flex items-center justify-center`}
      >
        {/* subtle top sheen */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
        <svg
          className={`${icon} text-white relative`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L12 2Z"
            fill="currentColor"
            opacity="0.18"
          />
          <path
            d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L12 2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <path
            d="M12 8V10M12 14V16M8 12H10M14 12H16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {showText && (
        <h2 className={`${text} font-display font-bold tracking-tight`}>
          <span className="bg-gradient-to-r from-primary-light via-primary to-accent bg-clip-text text-transparent">
            Val
          </span>
          <span className="text-warm-800 dark:text-warm-100">Crypta</span>
        </h2>
      )}
    </div>
  );
}
