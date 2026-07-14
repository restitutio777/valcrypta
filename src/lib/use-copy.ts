import { useUIStore } from '../stores/ui-store';
import { locales } from '../locales';
import type { Copy } from '../locales/de';

// Reactive translation lookup: re-renders whenever the chosen language
// changes, since it reads from the persisted UI store.
export function useCopy(): Copy {
  const language = useUIStore((s) => s.language);
  return locales[language];
}
