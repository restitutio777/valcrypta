import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  showEncryptionInfo: boolean;
  notification: {
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setShowEncryptionInfo: (show: boolean) => void;
  setNotification: (notification: UIState['notification']) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      sidebarOpen: window.innerWidth >= 1024,
      showEncryptionInfo: false,
      notification: null,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setShowEncryptionInfo: (show) => set({ showEncryptionInfo: show }),
      setNotification: (notification) => set({ notification }),
      clearNotification: () => set({ notification: null }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ darkMode: state.darkMode }),
    }
  )
);
