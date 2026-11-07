// Initial-letter avatar. The tone is derived from the username so each
// contact keeps a stable, recognisable colour, drawn only from the Lumen Haze
// ramps (mist, brass, porcelain, ink) to stay within the restrained palette.
const TONES = [
  'bg-mist-200 text-mist-800 dark:bg-mist-600 dark:text-mist-50',
  'bg-brass-300/45 text-brass-700 dark:bg-brass-700/50 dark:text-brass-300',
  'bg-porcelain-200 text-porcelain-800 dark:bg-porcelain-300 dark:text-ink-900',
  'bg-ink-800 text-porcelain-100 dark:bg-ink-700 dark:text-porcelain-200',
  'bg-mist-400/45 text-ink-800 dark:bg-mist-300 dark:text-ink-900',
];

const SIZES = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-11 w-11 text-base',
};

function toneFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return TONES[Math.abs(hash) % TONES.length];
}

interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
}

export default function Avatar({ name, size = 'lg' }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} ${toneFor(name)} flex flex-shrink-0 select-none items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-ink-900/5 dark:ring-porcelain-50/10`}
    >
      {initial}
    </span>
  );
}
