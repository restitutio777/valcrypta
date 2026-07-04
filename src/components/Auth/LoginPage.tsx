import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import ValCryptaLogo from '../ValCryptaLogo';
import { supabase } from '../../lib/supabase';
import { getEncryptedPrivateKey, storeEncryptedPrivateKey } from '../../lib/storage';
import { decryptPrivateKey, importPrivateKey } from '../../lib/crypto';
import { fetchKeyBackup, uploadKeyBackup, persistUnlockedKey } from '../../lib/key-session';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';

interface LoginPageProps {
  onSwitchToSignup: () => void;
}

export default function LoginPage({ onSwitchToSignup }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { setUser, setKeys } = useAuthStore();
  const { securityLevel } = useUIStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Login failed');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userError) throw userError;
      if (!userData) throw new Error('User profile not found');

      // Prefer the key stored on this device; fall back to the encrypted
      // cloud backup so signing in on a new device just works.
      let encryptedPrivateKey = await getEncryptedPrivateKey(authData.user.id);
      let restoredFromCloud = false;

      if (!encryptedPrivateKey) {
        encryptedPrivateKey = await fetchKeyBackup(authData.user.id);
        restoredFromCloud = !!encryptedPrivateKey;
      }

      if (!encryptedPrivateKey) {
        throw new Error(
          'No key found for this account on this device, and no cloud backup exists. ' +
            'Sign in on your original device and enable a backup in Security Settings.'
        );
      }

      const privateKeyString = await decryptPrivateKey(encryptedPrivateKey, password);
      const privateKey = await importPrivateKey(privateKeyString);

      if (restoredFromCloud) {
        await storeEncryptedPrivateKey(authData.user.id, encryptedPrivateKey);
      } else if (securityLevel !== 'maximum') {
        // Keep the backup fresh for accounts that opted into it.
        uploadKeyBackup(authData.user.id, encryptedPrivateKey);
      }

      await persistUnlockedKey(authData.user.id, privateKey, securityLevel);

      setUser(authData.user);
      setKeys(userData.public_key, privateKey);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during login';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="aurora-bg min-h-screen bg-gradient-to-br from-warm-50 via-sage-50 to-warm-100 dark:from-ink-950 dark:via-ink-900 dark:to-ink-850 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-3xl p-8 shadow-lift animate-scale-in">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <ValCryptaLogo size="lg" showText={false} />
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold text-warm-800 dark:text-warm-50">
            Welcome Back
          </h1>
          <p className="text-warm-500 dark:text-warm-300">
            Encrypted by you. Not stored for us.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-warm-700 dark:text-warm-200">
              Email
            </label>
            <div className="group relative">
              <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-400 transition-colors group-focus-within:text-primary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field py-3 pl-11 pr-4"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-warm-700 dark:text-warm-200">
              Password
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
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-warm-500 dark:text-warm-300">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="font-semibold text-primary-dark dark:text-primary-light transition-colors hover:text-primary"
            >
              Sign Up
            </button>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-sage-100 dark:border-ink-700 pt-5 text-xs text-warm-400 dark:text-warm-500">
          <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
          End-to-end encrypted · Keys never leave your device
        </div>
      </div>
    </div>
  );
}
