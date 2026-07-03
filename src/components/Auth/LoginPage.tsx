import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import ValCryptaLogo from '../ValCryptaLogo';
import { supabase } from '../../lib/supabase';
import { getEncryptedPrivateKey } from '../../lib/storage';
import { decryptPrivateKey, importPrivateKey } from '../../lib/crypto';
import { useAuthStore } from '../../stores/auth-store';

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

      const encryptedPrivateKey = await getEncryptedPrivateKey(authData.user.id);

      if (!encryptedPrivateKey) {
        throw new Error('Private key not found. Please contact support.');
      }

      const privateKeyString = await decryptPrivateKey(encryptedPrivateKey, password);
      const privateKey = await importPrivateKey(privateKeyString);

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
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-sage-50 to-warm-100 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-warm-200 dark:border-slate-700 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ValCryptaLogo size="lg" showText={false} />
          </div>
          <h1 className="text-3xl font-bold text-warm-800 dark:text-warm-50 mb-2">
            Welcome Back
          </h1>
          <p className="text-warm-600 dark:text-warm-300">
            Encrypted by you. Not stored for us.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-warm-400 hover:text-warm-600 dark:hover:text-warm-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
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
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-warm-600 dark:text-warm-300">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-primary dark:text-primary-light hover:underline font-medium"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
