import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SecurityLevel } from '../lib/key-session';

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  showEncryptionInfo: boolean;
  showSecuritySettings: boolean;
  securityLevel: SecurityLevel;
  notification: {
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setShowEncryptionInfo: (show: boolean) => void;
  setShowSecuritySettings: (show: boolean) => void;
  setSecurityLevel: (level: SecurityLevel) => void;
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
      notification: null,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setShowEncryptionInfo: (show) => set({ showEncryptionInfo: show }),
      setShowSecuritySettings: (show) => set({ showSecuritySettings: show }),
      setSecurityLevel: (level) => set({ securityLevel: level }),
      setNotification: (notification) => set({ notification }),
      clearNotification: () => set({ notification: null }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        securityLevel: state.securityLevel,
      }),
    }
  )
);
