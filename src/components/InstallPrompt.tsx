import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { useCopy } from '../lib/use-copy';
import { getDeferredPrompt, onInstallAvailabilityChange, promptInstall, isStandalone, isIos } from '../lib/install';

const DISMISS_KEY = 'valcrypta-install-dismissed';

// Only rendered in the logged-in view (see App.tsx) so it never interrupts
// the landing/login/signup flow — new users learn about installing from
// the calm section on the landing page instead. A short delay after mount
// keeps it from popping up the instant someone signs in.
const SHOW_DELAY_MS = 25_000;

// Small, unobtrusive install hint. Appears once at the bottom and can be
// dismissed permanently. iOS has no prompt event, so it gets a short
// "Share" -> "Add to Home Screen" instruction instead.
export default function InstallPrompt() {
  const { pwa } = useCopy();
  const [hasPrompt, setHasPrompt] = useState(getDeferredPrompt());
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

    const unsubscribe = onInstallAvailabilityChange(setHasPrompt);

    const showTimer = setTimeout(() => setShow(true), SHOW_DELAY_MS);

    const onInstalled = () => {
      setShow(false);
      localStorage.setItem(DISMISS_KEY, '1');
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      unsubscribe();
      clearTimeout(showTimer);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    await promptInstall();
    dismiss();
  };

  if (!show) return null;

  const iosMode = !hasPrompt && isIos();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="glass-card animate-scale-in flex w-full max-w-md items-start gap-3 rounded-2xl p-4 shadow-lift">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-soft">
          <Download className="h-5 w-5 text-porcelain-50" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-warm-800 dark:text-warm-50">{pwa.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] leading-snug text-warm-500 dark:text-warm-300">
            {iosMode ? (
              <>
                <span>{pwa.iosHintPre}</span>
                <Share className="inline h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  {pwa.iosHintShare} {pwa.iosHintAdd}
                </span>
              </>
            ) : (
              pwa.body
            )}
          </p>
          {!iosMode && (
            <div className="mt-3 flex gap-2">
              <button onClick={install} className="btn-primary px-4 py-2 text-sm">
                {pwa.install}
              </button>
              <button
                onClick={dismiss}
                className="rounded-xl px-3 py-2 text-sm font-medium text-warm-500 dark:text-warm-300 transition-colors hover:text-warm-800 dark:hover:text-warm-100"
              >
                {pwa.dismiss}
              </button>
            </div>
          )}
        </div>
        <button onClick={dismiss} className="btn-ghost-icon flex-shrink-0" title={pwa.dismiss}>
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
