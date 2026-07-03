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
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-warm-50 to-sage-100 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-warm-200 dark:border-slate-700 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ValCryptaLogo size="lg" showText={false} />
          </div>
          <h1 className="text-3xl font-bold text-warm-800 dark:text-warm-50 mb-2">
            Create Account
          </h1>
          <p className="text-warm-600 dark:text-warm-300">
            Encrypted by you. Not stored for us.
          </p>
        </div>

        <div className="bg-accent-gold/10 dark:bg-accent-gold/20 border border-accent-gold/30 dark:border-accent-gold/40 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-accent-gold dark:text-accent-gold flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warm-700 dark:text-warm-200">
              <strong>Important:</strong> Your password encrypts your messages. If you lose
              it, your messages cannot be recovered. Write it down somewhere safe.
            </div>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-200 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-warm-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 focus:border-transparent bg-warm-50 dark:bg-slate-700 text-warm-800 dark:text-slate-100"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-200 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-warm-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 focus:border-transparent bg-warm-50 dark:bg-slate-700 text-warm-800 dark:text-slate-100"
                placeholder="johndoe"
                required
                minLength={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-200 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-warm-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 focus:border-transparent bg-warm-50 dark:bg-slate-700 text-warm-800 dark:text-slate-100"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-warm-400 hover:text-warm-600 dark:hover:text-warm-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${
                        i < passwordStrength.score
                          ? passwordStrength.score < 3
                            ? 'bg-red-500'
                            : passwordStrength.score < 5
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-warm-200 dark:bg-sage-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-warm-600 dark:text-warm-300 mt-1">
                  {passwordStrength.feedback}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-200 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-warm-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 focus:border-transparent bg-warm-50 dark:bg-slate-700 text-warm-800 dark:text-slate-100"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-dark disabled:bg-warm-300 text-white font-medium py-3 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-warm-600 dark:text-warm-300">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary dark:text-primary-light hover:underline font-medium"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
