import { useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useUIStore } from '../../stores/ui-store';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import TopBar from './TopBar';

export default function ChatLayout() {
  const { sidebarOpen, toggleSidebar, darkMode } = useUIStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="flex h-screen bg-warm-50 dark:bg-ink-950">
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-80 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
      >
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-ink-950/60 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <ChatArea />
      </div>

      <button
        onClick={toggleSidebar}
        className="btn-primary fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center !rounded-full lg:hidden"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </div>
  );
}
