import { X, Lock, Key, Shield } from 'lucide-react';
import { useUIStore } from '../stores/ui-store';

export default function EncryptionInfoModal() {
  const { showEncryptionInfo, setShowEncryptionInfo } = useUIStore();

  if (!showEncryptionInfo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
      onClick={() => setShowEncryptionInfo(false)}
    >
      <div
        className="glass-card max-h-[90vh] w-full max-w-2xl animate-scale-in overflow-y-auto rounded-3xl shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sage-100 dark:border-ink-700/60 bg-white/85 dark:bg-ink-850/85 p-6 backdrop-blur-xl">
          <h2 className="font-display text-2xl font-bold text-warm-800 dark:text-warm-50">
            How End-to-End Encryption Works
          </h2>
          <button onClick={() => setShowEncryptionInfo(false)} className="btn-ghost-icon">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="mb-2 font-display text-lg font-semibold text-warm-800 dark:text-warm-50">
                Your Messages Are Private
              </h3>
              <p className="leading-relaxed text-warm-600 dark:text-warm-300">
                ValCrypta uses end-to-end encryption, which means only you and the person
                you're chatting with can read your messages. Not even we can access them.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-primary shadow-glow">
              <Key className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="mb-2 font-display text-lg font-semibold text-warm-800 dark:text-warm-50">
                How It Works
              </h3>
              <p className="mb-3 leading-relaxed text-warm-600 dark:text-warm-300">
                When you sign up, a unique pair of encryption keys is created on your device:
              </p>
              <ul className="space-y-2 text-warm-600 dark:text-warm-300">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span>
                    <strong>Public Key:</strong> Shared with others to encrypt messages sent
                    to you
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span>
                    <strong>Private Key:</strong> Stored securely on your device, encrypted
                    with your password. Only you can decrypt messages.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-gold to-amber-600 shadow-lift">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="mb-2 font-display text-lg font-semibold text-warm-800 dark:text-warm-50">
                Important Security Information
              </h3>
              <ul className="space-y-2 text-warm-600 dark:text-warm-300">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span>
                    Messages are encrypted on your device <strong>before</strong> being sent
                    to the server
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span>The server only stores encrypted data that cannot be read</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span>
                    If you lose your password, your messages <strong>cannot be recovered</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span>
                    Your private key never leaves your device and is encrypted with your
                    password
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-sage-50 to-sage-100/50 dark:from-ink-800 dark:to-ink-700/50 p-5">
            <h4 className="mb-2 font-display font-semibold text-warm-800 dark:text-warm-100">
              Technical Details
            </h4>
            <p className="text-sm leading-relaxed text-warm-600 dark:text-warm-200">
              ValCrypta encrypts each message with a fresh AES-GCM 256-bit key, which is
              then wrapped with RSA-OAEP 2048-bit for both the recipient and the sender.
              Your private key is protected with AES-GCM 256-bit encryption derived from
              your password using PBKDF2 with 100,000 iterations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
