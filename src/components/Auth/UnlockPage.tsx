import { useState } from 'react';
import { Lock, Eye, EyeOff, LogOut, KeyRound } from 'lucide-react';
import ValCryptaLogo from '../ValCryptaLogo';
import { supabase } from '../../lib/supabase';
import { getEncryptedPrivateKey, storeEncryptedPrivateKey } from '../../lib/storage';
import { decryptPrivateKey, importPrivateKey } from '../../lib/crypto';
import { fetchKeyBackup, persistUnlockedKey } from '../../lib/key-session';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';
import { common, unlock } from '../../lib/copy';

export default function UnlockPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, setKeys, clearAuth } = useAuthStore();
  const { securityLevel } = useUIStore();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setIsLoading(true);

    try {
      let encryptedPrivateKey = await getEncryptedPrivateKey(user.id);
      let restoredFromCloud = false;

      if (!encryptedPrivateKey) {
        encryptedPrivateKey = await fetchKeyBackup(user.id);
        restoredFromCloud = !!encryptedPrivateKey;
      }

      if (!encryptedPrivateKey) {
        throw new Error(unlock.errNoKey);
      }

      const privateKeyString = await decryptPrivateKey(encryptedPrivateKey, password);
      const privateKey = await importPrivateKey(privateKeyString);

      if (restoredFromCloud) {
        await storeEncryptedPrivateKey(user.id, encryptedPrivateKey);
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('public_key')
        .eq('id', user.id)
        .maybeSingle();

      if (userError) throw userError;
      if (!userData) throw new Error(unlock.errNoProfile);

      await persistUnlockedKey(user.id, privateKey, securityLevel);

      setKeys(userData.public_key, privateKey);
    } catch (err: unknown) {
      // AES-GCM decryption fails with an opaque OperationError on a wrong
      // password, so map it to a friendly message.
      if (err instanceof DOMException) {
        setError(unlock.errWrongPassword);
      } else {
        setError(err instanceof Error ? err.message : unlock.errGeneric);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
  };

  return (
    <div className="aurora-bg grain min-h-screen bg-porcelain-100 dark:bg-ink-950 flex items-center justify-center p-4">
      <div className="glass-card relative z-10 w-full max-w-md rounded-3xl p-8 shadow-lift animate-scale-in">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <ValCryptaLogo size="lg" showText={false} />
          </div>
          <h1 className="mb-2 text-3xl font-semibold text-porcelain-900 dark:text-porcelain-50">
            {unlock.title}
          </h1>
          <p className="text-porcelain-500 dark:text-porcelain-300">{unlock.subtitle}</p>
          {user?.email && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sage-200/80 dark:border-ink-600 bg-white/50 dark:bg-ink-800/50 px-3 py-1 text-sm text-warm-600 dark:text-warm-300">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              {user.email}
            </div>
          )}
        </div>

        <form onSubmit={handleUnlock} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-warm-700 dark:text-warm-200">
              {common.password}
            </label>
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
          </div>

          {error && (
            <div className="animate-pop-in rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5">
            {isLoading ? unlock.submitting : unlock.submit}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 text-sm text-warm-500 dark:text-warm-300 transition-colors hover:text-warm-800 dark:hover:text-warm-100"
          >
            <LogOut className="h-4 w-4" />
            {unlock.signOut}
          </button>
        </div>
      </div>
    </div>
  );
}
