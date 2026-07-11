interface ValCryptaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

// Brand mark: chiseled brass "V" (thick left stroke, thin right — a calligraphic
// high-contrast cut) on a deep-ink rounded tile. Identical geometry to the PWA
// icons in /public, so tab, home screen and top nav all show the same mark.
// The tile is dark in both themes; a faint porcelain ring keeps it from sinking
// into dark-mode surfaces.
export default function ValCryptaLogo({ size = 'md', showText = true }: ValCryptaLogoProps) {
  const sizes = {
    sm: { box: 'w-8 h-8', text: 'text-base' },
    md: { box: 'w-10 h-10', text: 'text-xl' },
    lg: { box: 'w-16 h-16', text: 'text-3xl' },
  };

  const { box, text } = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <svg className={box} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vc-brass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#DCC08B" />
            <stop offset="0.55" stopColor="#C8A25D" />
            <stop offset="1" stopColor="#A9843F" />
          </linearGradient>
          <linearGradient id="vc-ink" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1B2233" />
            <stop offset="1" stopColor="#0D111C" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="116" fill="url(#vc-ink)" />
        <rect
          x="6"
          y="6"
          width="500"
          height="500"
          rx="110"
          fill="none"
          strokeWidth="12"
          className="stroke-transparent dark:stroke-porcelain-100/15"
        />
        <path d="M141 136L211 136L275 279.4L339 136L373 136L257 396Z" fill="url(#vc-brass)" />
      </svg>
      {showText && (
        <h2 className={`${text} font-semibold tracking-tight text-ink-900 dark:text-porcelain-100`}>
          ValCrypta
        </h2>
      )}
    </div>
  );
}
