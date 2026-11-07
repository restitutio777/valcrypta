interface ValCryptaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

// Brand mark: brass owl engraving (Baltimore 1832, via Font Revival, MIT) on a
// round deep-ink medallion. The image is /favicon.svg itself, so tab, home screen and
// in-app logo always show the same mark; it is generated from public/owl.svg
// by scripts/generate-icons.mjs. The medallion is dark in both themes; a faint
// porcelain ring keeps it from sinking into dark-mode surfaces.
export default function ValCryptaLogo({ size = 'md', showText = true }: ValCryptaLogoProps) {
  const sizes = {
    sm: { box: 'w-8 h-8', text: 'text-base' },
    md: { box: 'w-10 h-10', text: 'text-xl' },
    lg: { box: 'w-16 h-16', text: 'text-3xl' },
  };

  const { box, text } = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <img
        src="/favicon.svg?v=3"
        alt={showText ? '' : 'ValCrypta'}
        width={64}
        height={64}
        draggable={false}
        className={`${box} rounded-full flex-shrink-0 select-none dark:ring-1 dark:ring-porcelain-100/15`}
      />
      {showText && (
        <h2 className={`${text} font-semibold tracking-tight text-ink-900 dark:text-porcelain-100`}>
          ValCrypta
        </h2>
      )}
    </div>
  );
}
