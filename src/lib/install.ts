// Shared capture point for the browser's install prompt. Chrome/Android
// fire the `beforeinstallprompt` event once per page load, before the
// browser shows its own install hint — grabbing it here (once, at module
// scope) lets any component in the app trigger the install flow later,
// instead of each component racing to add its own listener.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

type AvailabilityListener = (available: boolean) => void;
const listeners = new Set<AvailabilityListener>();

function notifyListeners() {
  const available = deferredPrompt !== null;
  listeners.forEach((listener) => listener(available));
}

window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  notifyListeners();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  notifyListeners();
});

export function getDeferredPrompt(): boolean {
  return deferredPrompt !== null;
}

// Subscribe to changes in prompt availability (fired once the browser
// hands over the event, and again once it's been consumed/installed).
// Returns an unsubscribe function.
export function onInstallAvailabilityChange(listener: AvailabilityListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notifyListeners();
  return outcome === 'accepted';
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari reports home-screen mode via navigator.standalone.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}
