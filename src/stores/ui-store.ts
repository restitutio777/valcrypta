import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SecurityLevel } from '../lib/key-session';
import type { Language } from '../locales';

// Best-effort detection from the browser's language preferences. A
// previously chosen language always wins over this — the persist
// middleware rehydrates over the initial state below, so detection only
// ever supplies the very first value for a new visitor.
function detectLanguage(): Language {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const candidate of candidates) {
    const prefix = candidate?.slice(0, 2).toLowerCase();
    if (prefix === 'de' || prefix === 'fr' || prefix === 'en') return prefix;
  }
  return 'de';
}

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  showEncryptionInfo: boolean;
  showSecuritySettings: boolean;
  securityLevel: SecurityLevel;
  language: Language;
  notification: {
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setShowEncryptionInfo: (show: boolean) => void;
  setShowSecuritySettings: (show: boolean) => void;
  setSecurityLevel: (level: SecurityLevel) => void;
  setLanguage: (language: Language) => void;
  setNotification: (notification: UIState['notification']) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      sidebarOpen: window.innerWidth >= 1024,
      showEncryptionInfo: false,
      showSecuritySettings: false,
      securityLevel: 'balanced',
      language: detectLanguage(),
      notification: null,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setShowEncryptionInfo: (show) => set({ showEncryptionInfo: show }),
      setShowSecuritySettings: (show) => set({ showSecuritySettings: show }),
      setSecurityLevel: (level) => set({ securityLevel: level }),
      setLanguage: (language) => set({ language }),
      setNotification: (notification) => set({ notification }),
      clearNotification: () => set({ notification: null }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        securityLevel: state.securityLevel,
        language: state.language,
      }),
    }
  )
);
