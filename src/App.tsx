import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/auth-store';
import { restoreUnlockedKey } from './lib/key-session';
import SecuritySettingsModal from './components/SecuritySettingsModal';
import LandingPage from './components/LandingPage';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import UnlockPage from './components/Auth/UnlockPage';
import ChatLayout from './components/Chat/ChatLayout';
import EncryptionInfoModal from './components/EncryptionInfoModal';
import Notification from './components/Notification';

function App() {
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');
  const { user, privateKey, setUser, setKeys, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setKeys(null, null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, username, public_key, created_at')
          .eq('id', session.user.id)
          .maybeSingle();

        if (userData) {
          setUser(session.user);

          // Balanced/Comfort levels persist the unlocked key so a page
          // reload doesn't ask for the password again. If nothing was
          // persisted (Maximum, or first visit) the unlock screen shows,
          // which can also restore the key from the encrypted cloud backup.
          const restored = await restoreUnlockedKey(session.user.id);
          if (restored) {
            setKeys(userData.public_key, restored);
          }
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="aurora-bg min-h-screen bg-porcelain-100 dark:bg-ink-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mx-auto mb-5 h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <div className="absolute inset-3 rounded-full bg-brand-gradient opacity-20 animate-glow-pulse" />
          </div>
          <p className="font-medium text-warm-500 dark:text-warm-300">Lädt …</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {authView === 'landing' ? (
          <LandingPage
            onGetStarted={() => setAuthView('signup')}
            onSignIn={() => setAuthView('login')}
          />
        ) : authView === 'login' ? (
          <LoginPage onSwitchToSignup={() => setAuthView('signup')} />
        ) : (
          <SignupPage onSwitchToLogin={() => setAuthView('login')} />
        )}
      </>
    );
  }

  // Session restored (e.g. after a page refresh) but the private key only
  // lives in memory: ask for the password to decrypt the stored key.
  if (!privateKey) {
    return <UnlockPage />;
  }

  return (
    <>
      <ChatLayout />
      <EncryptionInfoModal />
      <SecuritySettingsModal />
      <Notification />
    </>
  );
}

export default App;
