interface ValCryptaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  // 'square' matches the favicon / home-screen tile (default). 'circle'
  // renders the same mark on a round tile — used in the top nav.
  shape?: 'square' | 'circle';
}

// Brand mark: brass owl engraving (Baltimore 1832, via Font Revival, MIT) on a
// deep-ink tile. The image is /favicon.svg itself, so tab, home screen and
// in-app logo always show the same mark; it is generated from public/owl.svg
// by scripts/generate-icons.mjs. The tile is dark in both themes; a faint
// porcelain ring keeps it from sinking into dark-mode surfaces.
export default function ValCryptaLogo({ size = 'md', showText = true, shape = 'square' }: ValCryptaLogoProps) {
  const sizes = {
    sm: { box: 'w-8 h-8', text: 'text-base' },
    md: { box: 'w-10 h-10', text: 'text-xl' },
    lg: { box: 'w-16 h-16', text: 'text-3xl' },
  };

  const { box, text } = sizes[size];
  // 112/512 matches the rx of the rounded tile in favicon.svg.
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-[21.875%]';

  return (
    <div className="flex items-center gap-2">
      <img
        src="/favicon.svg?v=2"
        alt={showText ? '' : 'ValCrypta'}
        width={64}
        height={64}
        draggable={false}
        className={`${box} ${radius} flex-shrink-0 select-none dark:ring-1 dark:ring-porcelain-100/15`}
      />
      {showText && (
        <h2 className={`${text} font-semibold tracking-tight text-ink-900 dark:text-porcelain-100`}>
          ValCrypta
        </h2>
      )}
    </div>
  );
}
