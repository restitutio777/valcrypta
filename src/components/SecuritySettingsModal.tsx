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

const LEVELS: {
  id: SecurityLevel;
  name: string;
  tagline: string;
  icon: typeof ShieldCheck;
  points: { icon: typeof Cloud; text: string }[];
}[] = [
  {
    id: 'maximum',
    name: 'Maximum',
    tagline: 'Everything stays on this device',
    icon: ShieldAlert,
    points: [
      { icon: RefreshCw, text: 'Password required after every page reload' },
      { icon: CloudOff, text: 'No cloud backup — losing this device means losing your messages' },
    ],
  },
  {
    id: 'balanced',
    name: 'Balanced',
    tagline: 'Recommended for most people',
    icon: ShieldCheck,
    points: [
      { icon: RefreshCw, text: 'Stays unlocked while this tab is open' },
      { icon: Cloud, text: 'Encrypted key backup — sign in on any device with your password' },
    ],
  },
  {
    id: 'comfort',
    name: 'Comfort',
    tagline: 'Open and chat, no password prompts',
    icon: Smartphone,
    points: [
      { icon: Smartphone, text: 'Stays unlocked on this device until you log out' },
      { icon: Cloud, text: 'Encrypted key backup — sign in on any device with your password' },
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
          message: 'Maximum security enabled. Cloud backup removed.',
          type: 'success',
        });
      } else {
        const blob = await getEncryptedPrivateKey(user.id);
        const uploaded = blob ? await uploadKeyBackup(user.id, blob) : false;
        setNotification({
          message: uploaded
            ? `${level === 'balanced' ? 'Balanced' : 'Comfort'} mode enabled. Encrypted backup saved.`
            : 'Level changed, but the cloud backup could not be saved right now.',
          type: uploaded ? 'success' : 'info',
        });
      }

      setSecurityLevel(level);
    } catch (error) {
      console.error('Failed to apply security level:', error);
      setNotification({ message: 'Could not change the security level', type: 'error' });
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
            <h2 className="font-display text-xl font-bold text-warm-800 dark:text-warm-50 sm:text-2xl">
              Security Level
            </h2>
            <p className="mt-0.5 text-sm text-warm-500 dark:text-warm-300">
              Choose your balance of protection and convenience
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
                    ? 'border-primary bg-sage-50 dark:bg-ink-700/70 shadow-glow'
                    : 'border-sage-100 dark:border-ink-600/60 bg-white/60 dark:bg-ink-800/60 hover:border-primary/50 hover:-translate-y-0.5'
                } disabled:opacity-70`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                      isActive ? 'bg-brand-gradient shadow-glow' : 'bg-sage-100 dark:bg-ink-700'
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-primary'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base font-bold text-warm-800 dark:text-warm-50">
                        {name}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          <Check className="h-3 w-3" /> Active
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
                          <PointIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary/70" />
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
            The cloud backup is your key encrypted with your password on this device —
            the server can never read it. Your messages stay end-to-end encrypted on
            every level.
          </p>
        </div>
      </div>
    </div>
  );
}
