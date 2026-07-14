import { useState } from 'react';
import { Lock, Mail, User, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import ValCryptaLogo from '../ValCryptaLogo';
import { supabase } from '../../lib/supabase';
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
  encryptPrivateKey,
  calculatePasswordStrength,
} from '../../lib/crypto';
import { storeEncryptedPrivateKey } from '../../lib/storage';
import { uploadKeyBackup, persistUnlockedKey } from '../../lib/key-session';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';
import { useCopy } from '../../lib/use-copy';
import LanguageSwitcher from '../LanguageSwitcher';

interface SignupPageProps {
  onSwitchToLogin: () => void;
}

export default function SignupPage({ onSwitchToLogin }: SignupPageProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { setUser, setKeys } = useAuthStore();
  const { securityLevel } = useUIStore();
  const { common, signup } = useCopy();
  const passwordStrength = calculatePasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(signup.errMismatch);
      return;
    }

    if (password.length < 12) {
      setError(signup.errShort);
      return;
    }

    if (passwordStrength.score < 3) {
      setError(signup.errWeak);
      return;
    }

    if (username.length < 3) {
      setError(signup.errUsername);
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error(signup.errFailed);

      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify session is established
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error(signup.errSession);
      }

      const keyPair = await generateKeyPair();
      const publicKeyString = await exportPublicKey(keyPair.publicKey);
      const privateKeyString = await exportPrivateKey(keyPair.privateKey);

      const encryptedPrivateKey = await encryptPrivateKey(privateKeyString, password);
      await storeEncryptedPrivateKey(authData.user.id, encryptedPrivateKey);

      // Balanced/Comfort (default) keep an encrypted backup server-side so
      // the account isn't tied to this one device. Fire-and-forget: signup
      // must not fail if the backup table is missing.
      if (securityLevel !== 'maximum') {
        uploadKeyBackup(authData.user.id, encryptedPrivateKey);
      }
      await persistUnlockedKey(authData.user.id, privateKeyString, securityLevel);

      // The generated key is extractable (it had to be exported for
      // wrapping); keep only a non-extractable copy in memory.
      const sessionPrivateKey = await importPrivateKey(privateKeyString);

      // Upsert instead of insert: the database has a trigger that creates a
      // placeholder profile row on auth signup, so a plain insert collides.
      const { error: profileError } = await supabase.from('users').upsert(
        {
          id: authData.user.id,
          email,
          username,
          public_key: publicKeyString,
        },
        { onConflict: 'id' }
      );

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`${signup.errProfile}: ${profileError.message}`);
      }

      setUser(authData.user);
      setKeys(publicKeyString, sessionPrivateKey);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : signup.errGeneric;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="aurora-bg grain min-h-screen bg-porcelain-100 dark:bg-ink-950 flex items-center justify-center p-4">
      <div className="glass-card relative z-10 w-full max-w-md rounded-3xl p-8 shadow-lift animate-scale-in">
        <div className="mb-4 flex justify-center">
          <LanguageSwitcher />
        </div>
        <div className="mb-6 text-center">
          <div className="mb-5 flex justify-center">
            <ValCryptaLogo size="lg" showText={false} />
          </div>
          <h1 className="mb-2 text-3xl font-semibold text-porcelain-900 dark:text-porcelain-50">
            {signup.title}
          </h1>
          <p className="text-porcelain-500 dark:text-porcelain-300">{signup.subtitle}</p>
        </div>

        <div className="mb-6 rounded-2xl border border-brass-400/30 bg-brass-400/10 dark:bg-brass-400/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brass-500" />
            <div className="text-sm leading-relaxed text-warm-700 dark:text-warm-200">
              <strong>{signup.warningTitle}</strong>
              {signup.warningBody}
            </div>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-warm-700 dark:text-warm-200">
              {common.email}
            </label>
            <div className="group relative">
              <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-400 transition-colors group-focus-within:text-primary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field py-3 pl-11 pr-4"
                placeholder={common.emailPlaceholder}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-warm-700 dark:text-warm-200">
              {signup.username}
            </label>
            <div className="group relative">
              <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-400 transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field py-3 pl-11 pr-4"
                placeholder={signup.usernamePlaceholder}
                required
                minLength={3}
              />
            </div>
          </div>

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
                minLength={12}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-400 transition-colors hover:text-primary"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {password && (
              <div className="mt-2.5">
                <div className="flex gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i < passwordStrength.score
                          ? passwordStrength.score < 3
                            ? 'bg-red-500'
                            : passwordStrength.score < 5
                            ? 'bg-accent-gold'
                            : 'bg-ink-700 dark:bg-porcelain-300'
                          : 'bg-warm-200 dark:bg-ink-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-warm-500 dark:text-warm-300">
                  {signup.strength[Math.min(passwordStrength.score, 5)]}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-warm-700 dark:text-warm-200">
              {signup.confirmPassword}
            </label>
            <div className="group relative">
              <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-400 transition-colors group-focus-within:text-primary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field py-3 pl-11 pr-4"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="animate-pop-in rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5">
            {isLoading ? signup.submitting : signup.submit}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-warm-500 dark:text-warm-300">
            {signup.haveAccount}{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-semibold text-porcelain-900 dark:text-porcelain-50 underline decoration-brass-400/60 underline-offset-4 transition-colors hover:decoration-brass-400"
            >
              {signup.toLogin}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
