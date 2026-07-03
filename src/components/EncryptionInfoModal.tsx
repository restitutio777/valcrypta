import { X, Lock, Key, Shield } from 'lucide-react';
import { useUIStore } from '../stores/ui-store';

export default function EncryptionInfoModal() {
  const { showEncryptionInfo, setShowEncryptionInfo } = useUIStore();

  if (!showEncryptionInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-sage-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-warm-200 dark:border-sage-700">
        <div className="sticky top-0 bg-white dark:bg-sage-800 border-b border-warm-200 dark:border-sage-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-warm-800 dark:text-warm-50">
            How End-to-End Encryption Works
          </h2>
          <button
            onClick={() => setShowEncryptionInfo(false)}
            className="p-2 hover:bg-warm-100 dark:hover:bg-sage-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-warm-600 dark:text-warm-300" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-primary dark:text-primary-light" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50 mb-2">
                Your Messages Are Private
              </h3>
              <p className="text-warm-600 dark:text-warm-300">
                ValCrypta uses end-to-end encryption, which means only you and the person
                you're chatting with can read your messages. Not even we can access them.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 dark:bg-accent/30 flex items-center justify-center flex-shrink-0">
              <Key className="w-6 h-6 text-accent dark:text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50 mb-2">
                How It Works
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                When you sign up, a unique pair of encryption keys is created on your device:
              </p>
              <ul className="space-y-2 text-warm-600 dark:text-warm-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warm-400 mt-2 flex-shrink-0" />
                  <span>
                    <strong>Public Key:</strong> Shared with others to encrypt messages sent
                    to you
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warm-400 mt-2 flex-shrink-0" />
                  <span>
                    <strong>Private Key:</strong> Stored securely on your device, encrypted
                    with your password. Only you can decrypt messages.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-gold/20 dark:bg-accent-gold/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-accent-gold dark:text-accent-gold" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50 mb-2">
                Important Security Information
              </h3>
              <ul className="space-y-2 text-warm-600 dark:text-warm-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warm-400 mt-2 flex-shrink-0" />
                  <span>
                    Messages are encrypted on your device <strong>before</strong> being sent
                    to the server
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warm-400 mt-2 flex-shrink-0" />
                  <span>The server only stores encrypted data that cannot be read</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warm-400 mt-2 flex-shrink-0" />
                  <span>
                    If you lose your password, your messages <strong>cannot be recovered</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warm-400 mt-2 flex-shrink-0" />
                  <span>
                    Your private key never leaves your device and is encrypted with your
                    password
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-accent/10 dark:bg-accent/20 border border-accent/30 dark:border-accent/40 rounded-lg p-4">
            <h4 className="font-semibold text-warm-800 dark:text-warm-100 mb-2">
              Technical Details
            </h4>
            <p className="text-sm text-warm-700 dark:text-warm-200">
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
