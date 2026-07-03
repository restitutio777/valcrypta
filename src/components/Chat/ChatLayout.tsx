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
    <div className="flex h-screen bg-warm-100 dark:bg-slate-900">
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-80 transition-transform duration-300`}
      >
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <ChatArea />
      </div>

      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-40 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark transition-colors"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
    </div>
  );
}
