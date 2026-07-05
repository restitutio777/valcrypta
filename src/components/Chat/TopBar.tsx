import { useState } from 'react';
import { ArrowLeft, ShieldCheck, Settings2, X, Fingerprint } from 'lucide-react';
import { useChatStore } from '../../stores/chat-store';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';
import { computeFingerprint } from '../../lib/key-pinning';
import { chat, sidebar, keyVerify } from '../../lib/copy';

export default function TopBar() {
  const { activeContact, setActiveContact } = useChatStore();
  const { publicKey } = useAuthStore();
  const { setShowSecuritySettings } = useUIStore();
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

      <div className="flex items-center gap-1">
        {activeContact && (
          <button onClick={openVerify} className="btn-ghost-icon" title={keyVerify.verifyTooltip}>
            <Fingerprint className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={() => setShowSecuritySettings(true)}
          className="btn-ghost-icon"
          title={sidebar.securityTooltip}
        >
          <Settings2 className="h-5 w-5" />
        </button>
      </div>

      {verifyFps && activeContact && (
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
          </div>
        </div>
      )}
    </div>
  );
}
