import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { pwa } from '../lib/copy';

// Chrome/Android liefern dieses Event, bevor der Browser den eigenen
// Installations-Hinweis zeigt. Wir fangen es ab und bieten stattdessen einen
// dezenten eigenen Hinweis an.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'valcrypta-install-dismissed';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari meldet den Home-Screen-Modus über navigator.standalone.
  (navigator as unknown as { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

// Kleiner, dezenter Install-Hinweis. Erscheint einmalig unten und lässt sich
// dauerhaft wegklicken. Auf iOS gibt es kein Prompt-Event, daher eine kurze
// Anleitung zum „Zum Home-Bildschirm".
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS bietet kein Event — Hinweis nach kurzer Verzögerung selbst zeigen.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      iosTimer = setTimeout(() => setShow(true), 2500);
    }

    const onInstalled = () => {
      setShow(false);
      localStorage.setItem(DISMISS_KEY, '1');
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  if (!show) return null;

  const iosMode = !deferred && isIos();

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
                <span>Zum Installieren</span>
                <Share className="inline h-3.5 w-3.5 flex-shrink-0" />
                <span>„Teilen" → „Zum Home-Bildschirm".</span>
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
