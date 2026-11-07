import { useState } from 'react';
import { ArrowLeft, X, Fingerprint, BarChart3, ShieldCheck } from 'lucide-react';
import Avatar from './Avatar';
import { useChatStore } from '../../stores/chat-store';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';
import { computeFingerprint } from '../../lib/key-pinning';
import { isAdminUser } from '../../lib/admin';
import { useCopy } from '../../lib/use-copy';

export default function TopBar() {
  const { activeContact, setActiveContact } = useChatStore();
  const { user, publicKey } = useAuthStore();
  const { setShowAdminStats } = useUIStore();
  const { chat, keyVerify, admin } = useCopy();
  const [verifyFps, setVerifyFps] = useState<{ mine: string; theirs: string } | null>(null);

  const openVerify = async () => {
    if (!activeContact || !publicKey) return;
    try {
      const [mine, theirs] = await Promise.all([
        computeFingerprint(publicKey),
        computeFingerprint(activeContact.public_key),
      ]);
      setVerifyFps({ mine, theirs });
    } catch (error) {
      console.error('Fingerprint computation failed:', error);
    }
  };

  // Without an open chat the sidebar already carries the brand; the bar
  // collapses to a floating slot for the admin entry so the empty state
  // gets the whole pane.
  if (!activeContact) {
    return isAdminUser(user) ? (
      <div className="absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] z-10">
        <button
          onClick={() => setShowAdminStats(true)}
          className="btn-ghost-icon"
          title={admin.tooltip}
          aria-label={admin.tooltip}
        >
          <BarChart3 className="h-5 w-5" />
        </button>
      </div>
    ) : null;
  }

  return (
    <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-porcelain-200/80 bg-porcelain-50/85 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-ink-700/60 dark:bg-ink-950/85 sm:px-4">
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        <button
          onClick={() => setActiveContact(null)}
          className="btn-ghost-icon lg:hidden"
          title={chat.backToChats}
          aria-label={chat.backToChats}
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={activeContact.username} size="md" />
          <div className="min-w-0">
            <h2 className="truncate font-semibold leading-tight text-ink-900 dark:text-porcelain-50">
              {activeContact.username}
            </h2>
            <p className="flex items-center gap-1 text-xs text-porcelain-600 dark:text-porcelain-400">
              <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-brass-500 dark:text-brass-400" />
              {chat.e2eBadge}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={openVerify}
          className="btn-ghost-icon"
          title={keyVerify.verifyTooltip}
          aria-label={keyVerify.verifyTooltip}
        >
          <Fingerprint className="h-5 w-5" />
        </button>
        {isAdminUser(user) && (
          <button
            onClick={() => setShowAdminStats(true)}
            className="btn-ghost-icon"
            title={admin.tooltip}
            aria-label={admin.tooltip}
          >
            <BarChart3 className="h-5 w-5" />
          </button>
        )}
      </div>

      {verifyFps && (
        <div
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
          onClick={() => setVerifyFps(null)}
        >
          <div
            className="glass-card w-full max-w-md animate-scale-in rounded-3xl p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-xl font-semibold text-warm-800 dark:text-warm-50">
                {keyVerify.verifyTitle}
              </h2>
              <button onClick={() => setVerifyFps(null)} className="btn-ghost-icon">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-warm-600 dark:text-warm-300">
              {keyVerify.verifyBody}
            </p>
            <div className="space-y-3">
              <div className="rounded-2xl border border-sage-100 bg-white/60 p-3 dark:border-ink-600/60 dark:bg-ink-800/60">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-warm-500 dark:text-warm-400">
                  {keyVerify.verifyMine}
                </p>
                <p className="break-all font-mono text-xs leading-relaxed text-warm-800 dark:text-warm-100">
                  {verifyFps.mine}
                </p>
              </div>
              <div className="rounded-2xl border border-sage-100 bg-white/60 p-3 dark:border-ink-600/60 dark:bg-ink-800/60">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-warm-500 dark:text-warm-400">
                  {keyVerify.verifyTheirs(activeContact.username)}
                </p>
                <p className="break-all font-mono text-xs leading-relaxed text-warm-800 dark:text-warm-100">
                  {verifyFps.theirs}
                </p>
              </div>
            </div>
            <button
              onClick={() => setVerifyFps(null)}
              className="btn-primary mt-5 w-full py-2.5"
            >
              {keyVerify.verifyClose}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
