import { LogOut, Moon, Sun, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { useChatStore } from '../../stores/chat-store';
import { useUIStore } from '../../stores/ui-store';

export default function TopBar() {
  const { activeContact, clearChat } = useChatStore();
  const { clearAuth } = useAuthStore();
  const { darkMode, toggleDarkMode, setShowEncryptionInfo } = useUIStore();

  const handleLogout = async () => {
    // Deliberately keep the encrypted private key in IndexedDB: it is the
    // only copy in existence and is already AES-GCM encrypted with the
    // user's password. Deleting it would permanently brick the account.
    await supabase.auth.signOut();
    clearChat();
    clearAuth();
  };

  return (
    <div className="h-16 bg-white dark:bg-slate-800 border-b border-warm-200 dark:border-slate-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        {activeContact ? (
          <>
            <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-amber-500/20 flex items-center justify-center">
              <span className="text-primary dark:text-amber-500 font-semibold">
                {activeContact.username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-warm-800 dark:text-slate-100">
                {activeContact.username}
              </h2>
              <p className="text-xs text-primary dark:text-amber-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-primary dark:bg-amber-500 rounded-full"></span>
                End-to-end encrypted
              </p>
            </div>
          </>
        ) : (
          <h2 className="font-semibold text-warm-800 dark:text-slate-100">ValCrypta</h2>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEncryptionInfo(true)}
          className="p-2 hover:bg-warm-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="How encryption works"
        >
          <Info className="w-5 h-5 text-warm-600 dark:text-slate-300" />
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-warm-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-warm-600 dark:text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-warm-600 dark:text-slate-300" />
          )}
        </button>

        <button
          onClick={handleLogout}
          className="p-2 hover:bg-warm-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5 text-warm-600 dark:text-slate-300" />
        </button>
      </div>
    </div>
  );
}
