import { ArrowLeft, ShieldCheck, Settings2 } from 'lucide-react';
import { useChatStore } from '../../stores/chat-store';
import { useUIStore } from '../../stores/ui-store';
import { chat, sidebar } from '../../lib/copy';

export default function TopBar() {
  const { activeContact, setActiveContact } = useChatStore();
  const { setShowSecuritySettings } = useUIStore();

  return (
    <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-sage-100 dark:border-ink-700/60 bg-white/70 dark:bg-ink-900/80 px-2 backdrop-blur-xl sm:px-4 pt-[env(safe-area-inset-top)]">
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        {activeContact && (
          <button
            onClick={() => setActiveContact(null)}
            className="btn-ghost-icon lg:hidden"
            title={chat.backToChats}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}

        {activeContact ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="avatar-disc h-10 w-10 flex-shrink-0 text-sm">
              {activeContact.username[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-semibold leading-tight text-warm-800 dark:text-warm-50">
                {activeContact.username}
              </h2>
              <p className="flex items-center gap-1.5 text-xs font-medium text-porcelain-600 dark:text-porcelain-300">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                {chat.e2eBadge}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-warm-800 dark:text-warm-50">
              ValCrypta
            </h2>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowSecuritySettings(true)}
        className="btn-ghost-icon"
        title={sidebar.securityTooltip}
      >
        <Settings2 className="h-5 w-5" />
      </button>
    </div>
  );
}
