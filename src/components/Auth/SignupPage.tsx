import { useState } from 'react';
import { Lock, Mail, User, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import ValCryptaLogo from '../ValCryptaLogo';
import { supabase } from '../../lib/supabase';
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  encryptPrivateKey,
  calculatePasswordStrength,
} from '../../lib/crypto';
import { storeEncryptedPrivateKey } from '../../lib/storage';
import { useAuthStore } from '../../stores/auth-store';

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
  const passwordStrength = calculatePasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 3) {
      setError('Password is too weak. Please use a stronger password.');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed');

      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify session is established
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Session not established. Please try logging in.');
      }

      const keyPair = await generateKeyPair();
      const publicKeyString = await exportPublicKey(keyPair.publicKey);
      const privateKeyString = await exportPrivateKey(keyPair.privateKey);

      const encryptedPrivateKey = await encryptPrivateKey(privateKeyString, password);
      await storeEncryptedPrivateKey(authData.user.id, encryptedPrivateKey);

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
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      setUser(authData.user);
      setKeys(publicKeyString, keyPair.privateKey);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during signup';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="aurora-bg min-h-screen bg-gradient-to-br from-sage-50 via-warm-50 to-sage-100 dark:from-ink-950 dark:via-ink-900 dark:to-ink-850 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-3xl p-8 shadow-lift animate-scale-in">
        <div className="mb-6 text-center">
          <div className="mb-5 flex justify-center">
            <ValCryptaLogo size="lg" showText={false} />
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold text-warm-800 dark:text-warm-50">
            Create Account
          </h1>
          <p className="text-warm-500 dark:text-warm-300">
            Encrypted by you. Not stored for us.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-accent-gold/30 dark:border-accent-gold/25 bg-gradient-to-br from-accent-gold/10 to-accent-gold/5 dark:from-accent-gold/15 dark:to-accent-gold/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-gold" />
            <div className="text-sm leading-relaxed text-warm-700 dark:text-warm-200">
              <strong>Important:</strong> Your password encrypts your messages. If you lose
              it, your messages cannot be recovered. Write it down somewhere safe.
            </div>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
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
              Username
            </label>
            <div className="group relative">
              <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-400 transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field py-3 pl-11 pr-4"
                placeholder="johndoe"
                required
                minLength={3}
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
                minLength={8}
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
                            : 'bg-primary'
                          : 'bg-warm-200 dark:bg-ink-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-warm-500 dark:text-warm-300">
                  {passwordStrength.feedback}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-warm-700 dark:text-warm-200">
              Confirm Password
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
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-warm-500 dark:text-warm-300">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-semibold text-primary-dark dark:text-primary-light transition-colors hover:text-primary"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
