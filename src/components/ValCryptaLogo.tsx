interface ValCryptaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

// Circular ink seal: geometric "V" knocked out in porcelain, brass pin in the
// apex reading as a keyhole. Inverts automatically in dark mode. The same
// three shapes are the favicon in index.html.
export default function ValCryptaLogo({ size = 'md', showText = true }: ValCryptaLogoProps) {
  const sizes = {
    sm: { box: 'w-8 h-8', text: 'text-base' },
    md: { box: 'w-10 h-10', text: 'text-xl' },
    lg: { box: 'w-16 h-16', text: 'text-3xl' },
  };

  const { box, text } = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <svg className={box} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" className="fill-ink-900 dark:fill-porcelain-100" />
        <path
          d="M6.2 6.5h3l2.8 7.6 2.8-7.6h3L13.4 17.5h-2.8z"
          className="fill-porcelain-50 dark:fill-ink-900"
        />
        <circle cx="12" cy="9.4" r="1.5" fill="#C8A25D" />
      </svg>
      {showText && (
        <h2 className={`${text} font-semibold tracking-tight text-ink-900 dark:text-porcelain-100`}>
          ValCrypta
        </h2>
      )}
    </div>
  );
}
