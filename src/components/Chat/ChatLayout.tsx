import { useEffect } from 'react';
import { useUIStore } from '../../stores/ui-store';
import { useChatStore } from '../../stores/chat-store';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import TopBar from './TopBar';

export default function ChatLayout() {
  const { darkMode } = useUIStore();
  const { activeContact } = useChatStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Phone-style navigation: on small screens the contact list IS the home
  // screen and a chat opens full-screen on top of it (back arrow in the
  // TopBar returns to the list). On lg+ both panes sit side by side.
  return (
    <div className="app-height flex bg-warm-50 dark:bg-ink-950">
      <div
        className={`${
          activeContact ? 'hidden lg:flex' : 'flex'
        } w-full flex-col lg:w-[22rem] lg:flex-shrink-0`}
      >
        <Sidebar />
      </div>

      <div
        className={`${
          activeContact ? 'flex' : 'hidden lg:flex'
        } min-w-0 flex-1 flex-col`}
      >
        <TopBar />
        <ChatArea />
      </div>
    </div>
  );
}
