import { LogOut, Moon, Sun, Info, ShieldCheck } from 'lucide-react';
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
    <div className="flex h-16 items-center justify-between border-b border-sage-100 dark:border-ink-700/60 bg-white/70 dark:bg-ink-900/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        {activeContact ? (
          <>
            <div className="avatar-disc h-10 w-10 text-sm">
              {activeContact.username[0].toUpperCase()}
            </div>
            <div>
              <h2 className="font-display font-semibold leading-tight text-warm-800 dark:text-warm-50">
                {activeContact.username}
              </h2>
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary-dark dark:text-primary-light">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                End-to-end encrypted
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold text-warm-800 dark:text-warm-50">
              ValCrypta
            </h2>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowEncryptionInfo(true)}
          className="btn-ghost-icon"
          title="How encryption works"
        >
          <Info className="h-5 w-5" />
        </button>

        <button onClick={toggleDarkMode} className="btn-ghost-icon" title="Toggle dark mode">
          {darkMode ? (
            <Sun className="h-5 w-5 text-accent-gold" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        <button onClick={handleLogout} className="btn-ghost-icon" title="Logout">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
