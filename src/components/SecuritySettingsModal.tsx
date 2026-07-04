import { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, Cloud, CloudOff, Smartphone, RefreshCw, Check } from 'lucide-react';
import { useUIStore } from '../stores/ui-store';
import { useAuthStore } from '../stores/auth-store';
import { getEncryptedPrivateKey } from '../lib/storage';
import {
  SecurityLevel,
  persistUnlockedKey,
  clearUnlockedKey,
  uploadKeyBackup,
  deleteKeyBackup,
} from '../lib/key-session';
import { security } from '../lib/copy';

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

export default function SecuritySettingsModal() {
  const { showSecuritySettings, setShowSecuritySettings, securityLevel, setSecurityLevel, setNotification } =
    useUIStore();
  const { user, privateKey } = useAuthStore();
  const [isApplying, setIsApplying] = useState<SecurityLevel | null>(null);

  if (!showSecuritySettings) return null;

  const applyLevel = async (level: SecurityLevel) => {
    if (!user || !privateKey || level === securityLevel || isApplying) return;
    setIsApplying(level);

    try {
      await persistUnlockedKey(user.id, privateKey, level);

      if (level === 'maximum') {
        await deleteKeyBackup(user.id);
        setNotification({
          message: security.notifyMaximum,
          type: 'success',
        });
      } else {
        const blob = await getEncryptedPrivateKey(user.id);
        const uploaded = blob ? await uploadKeyBackup(user.id, blob) : false;
        setNotification({
          message: uploaded
            ? security.notifyEnabled(security.levels[level].name)
            : security.notifyBackupFailed,
          type: uploaded ? 'success' : 'info',
        });
      }

      setSecurityLevel(level);
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
      onClick={() => setShowSecuritySettings(false)}
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
          <button onClick={() => setShowSecuritySettings(false)} className="btn-ghost-icon">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          {LEVELS.map(({ id, name, tagline, icon: Icon, points }) => {
            const isActive = securityLevel === id;
            const isBusy = isApplying === id;
            return (
              <button
                key={id}
                onClick={() => applyLevel(id)}
                disabled={isApplying !== null}
                className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all duration-200 sm:p-5 ${
                  isActive
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
