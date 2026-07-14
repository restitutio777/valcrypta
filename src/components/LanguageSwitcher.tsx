import { useUIStore } from '../stores/ui-store';
import { useCopy } from '../lib/use-copy';
import type { Language } from '../locales';

const LANGS: { code: Language; label: string }[] = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
];

interface LanguageSwitcherProps {
  className?: string;
}

// Compact inline "DE · EN · FR" control. Kept deliberately small — this is
// a utility, not a feature — and styled to sit next to the existing
// btn-ghost-icon row (Sidebar) or the glass nav (LandingPage).
export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useUIStore();
  const { common } = useCopy();

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs font-semibold tracking-wide ${className}`}
      role="group"
      aria-label={common.languageTooltip}
      title={common.languageTooltip}
    >
      {LANGS.map(({ code, label }, i) => (
        <span key={code} className="flex items-center">
          {i > 0 && <span className="mx-0.5 text-warm-300 dark:text-warm-600">·</span>}
          <button
            type="button"
            onClick={() => setLanguage(code)}
            aria-pressed={language === code}
            className={`rounded-md px-1.5 py-1 transition-colors ${
              language === code
                ? 'text-warm-800 dark:text-warm-50'
                : 'text-warm-400 dark:text-warm-500 hover:text-warm-600 dark:hover:text-warm-300'
            }`}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  );
}
