import { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, Cloud, CloudOff, Smartphone, RefreshCw, Check, Lock, Eye, EyeOff } from 'lucide-react';
import { useUIStore } from '../stores/ui-store';
import { useAuthStore } from '../stores/auth-store';
import { getEncryptedPrivateKey } from '../lib/storage';
import { decryptPrivateKey } from '../lib/crypto';
import {
  SecurityLevel,
  persistUnlockedKey,
  clearUnlockedKey,
  uploadKeyBackup,
  deleteKeyBackup,
  fetchKeyBackup,
} from '../lib/key-session';
import { useCopy } from '../lib/use-copy';

export default function SecuritySettingsModal() {
  const { showSecuritySettings, setShowSecuritySettings, securityLevel, setSecurityLevel, setNotification } =
    useUIStore();
  const { user } = useAuthStore();
  const { security } = useCopy();
  const [isApplying, setIsApplying] = useState<SecurityLevel | null>(null);

  const LEVELS: {
    id: SecurityLevel;
    name: string;
    tagline: string;
    icon: typeof ShieldCheck;
    points: { icon: typeof Cloud; text: string }[];
  }[] = [
    {
      id: 'maximum',
      name: security.levels.maximum.name,
      tagline: security.levels.maximum.tagline,
      icon: ShieldAlert,
      points: [
        { icon: RefreshCw, text: security.levels.maximum.points[0] },
        { icon: CloudOff, text: security.levels.maximum.points[1] },
      ],
    },
    {
      id: 'balanced',
      name: security.levels.balanced.name,
      tagline: security.levels.balanced.tagline,
      icon: ShieldCheck,
      points: [
        { icon: RefreshCw, text: security.levels.balanced.points[0] },
        { icon: Cloud, text: security.levels.balanced.points[1] },
      ],
    },
    {
      id: 'comfort',
      name: security.levels.comfort.name,
      tagline: security.levels.comfort.tagline,
      icon: Smartphone,
      points: [
        { icon: Smartphone, text: security.levels.comfort.points[0] },
        { icon: Cloud, text: security.levels.comfort.points[1] },
      ],
    },
  ];
  // Switching to balanced/comfort re-derives the key from the encrypted
  // blob, so the password must be confirmed first; the target level waits
  // here until then.
  const [pendingLevel, setPendingLevel] = useState<SecurityLevel | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  if (!showSecuritySettings) return null;

  const closeModal = () => {
    setShowSecuritySettings(false);
    setPendingLevel(null);
    setPassword('');
    setPasswordError('');
  };

  const selectLevel = (level: SecurityLevel) => {
    if (!user || level === securityLevel || isApplying) return;

    if (level === 'maximum') {
      void applyMaximum();
      return;
    }

    setPendingLevel(level);
    setPassword('');
    setPasswordError('');
  };

  const applyMaximum = async () => {
    if (!user) return;
    setIsApplying('maximum');
    setPendingLevel(null);

    try {
      await clearUnlockedKey(user.id);
      await deleteKeyBackup(user.id);
      setNotification({ message: security.notifyMaximum, type: 'success' });
      setSecurityLevel('maximum');
    } catch (error) {
      console.error('Failed to apply security level:', error);
      setNotification({ message: security.notifyError, type: 'error' });
    } finally {
      setIsApplying(null);
    }
  };

  const confirmPendingLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pendingLevel || isApplying) return;
    const level = pendingLevel;
    setIsApplying(level);
    setPasswordError('');

    try {
      let blob = await getEncryptedPrivateKey(user.id);
      if (!blob) blob = await fetchKeyBackup(user.id);
      if (!blob) {
        setPasswordError(security.errNoKey);
        return;
      }

      let privateKeyPkcs8: string;
      try {
        privateKeyPkcs8 = await decryptPrivateKey(blob, password);
      } catch (err) {
        // AES-GCM fails with an opaque OperationError on a wrong password.
        if (err instanceof DOMException) {
          setPasswordError(security.errWrongPassword);
          return;
        }
        throw err;
      }

      await persistUnlockedKey(user.id, privateKeyPkcs8, level);

      const uploaded = await uploadKeyBackup(user.id, blob);
      setNotification({
        message: uploaded
          ? security.notifyEnabled(security.levels[level].name)
          : security.notifyBackupFailed,
        type: uploaded ? 'success' : 'info',
      });

      setSecurityLevel(level);
      setPendingLevel(null);
      setPassword('');
    } catch (error) {
      console.error('Failed to apply security level:', error);
      setNotification({ message: security.notifyError, type: 'error' });
      await clearUnlockedKey(user.id).catch(() => {});
    } finally {
      setIsApplying(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        className="glass-card max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-3xl shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sage-100 dark:border-ink-700/60 bg-white/85 dark:bg-ink-850/85 p-5 backdrop-blur-xl sm:p-6">
          <div>
            <h2 className="text-xl font-semibold text-warm-800 dark:text-warm-50 sm:text-2xl">
              {security.title}
            </h2>
            <p className="mt-0.5 text-sm text-warm-500 dark:text-warm-300">
              {security.subtitle}
            </p>
          </div>
          <button onClick={closeModal} className="btn-ghost-icon">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          {LEVELS.map(({ id, name, tagline, icon: Icon, points }) => {
            const isActive = securityLevel === id;
            const isBusy = isApplying === id;
            const isPending = pendingLevel === id;
            return (
              <div key={id}>
                <button
                  onClick={() => selectLevel(id)}
                  disabled={isApplying !== null}
                  className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all duration-200 sm:p-5 ${
                    isActive || isPending
                      ? 'border-ink-800 dark:border-porcelain-200 bg-mist-50 dark:bg-ink-700/70 shadow-soft'
                      : 'border-sage-100 dark:border-ink-600/60 bg-white/60 dark:bg-ink-800/60 hover:border-porcelain-400 dark:hover:border-ink-500 hover:-translate-y-0.5'
                  } disabled:opacity-70`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                        isActive ? 'bg-brand-gradient shadow-soft' : 'bg-sage-100 dark:bg-ink-700'
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          isActive ? 'text-porcelain-50' : 'text-porcelain-600 dark:text-porcelain-300'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-warm-800 dark:text-warm-50">
                          {name}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-ink-800 dark:bg-porcelain-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-porcelain-50 dark:text-ink-900">
                            <Check className="h-3 w-3" /> {security.active}
                          </span>
                        )}
                        {isBusy && (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        )}
                      </div>
                      <p className="mb-2 text-sm text-warm-500 dark:text-warm-300">{tagline}</p>
                      <ul className="space-y-1.5">
                        {points.map(({ icon: PointIcon, text }) => (
                          <li
                            key={text}
                            className="flex items-start gap-2 text-[13px] leading-snug text-warm-600 dark:text-warm-200"
                          >
                            <PointIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-porcelain-500 dark:text-porcelain-400" />
                            {text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </button>

                {isPending && (
                  <form
                    onSubmit={confirmPendingLevel}
                    className="mt-2 animate-fade-in rounded-2xl border border-sage-100 dark:border-ink-600/60 bg-white/70 dark:bg-ink-800/70 p-4"
                  >
                    <p className="mb-3 text-sm text-warm-600 dark:text-warm-200">
                      {security.confirmPrompt(name)}
                    </p>
                    <div className="group relative">
                      <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-400 transition-colors group-focus-within:text-primary" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field py-3 pl-11 pr-12"
                        placeholder="••••••••"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-400 transition-colors hover:text-primary"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    {passwordError && (
                      <div className="mt-3 animate-pop-in rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
                        {passwordError}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <button
                        type="submit"
                        disabled={isApplying !== null || !password}
                        className="btn-primary flex-1 py-2.5"
                      >
                        {security.confirmSubmit}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingLevel(null);
                          setPassword('');
                          setPasswordError('');
                        }}
                        disabled={isApplying !== null}
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-warm-500 dark:text-warm-300 transition-colors hover:text-warm-800 dark:hover:text-warm-100"
                      >
                        {security.confirmCancel}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}

          <p className="pt-1 text-center text-xs leading-relaxed text-warm-400 dark:text-warm-500">
            {security.footnote}
          </p>
        </div>
      </div>
    </div>
  );
}
