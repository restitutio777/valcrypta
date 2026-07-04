import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/auth-store';
import { getEncryptedPrivateKey } from './lib/storage';
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
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (userData) {
          const encryptedPrivateKey = await getEncryptedPrivateKey(session.user.id);

          if (encryptedPrivateKey) {
            setUser(session.user);
          } else {
            await supabase.auth.signOut();
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
      <div className="aurora-bg min-h-screen bg-gradient-to-br from-sage-50 via-warm-50 to-sage-100 dark:from-ink-950 dark:via-ink-900 dark:to-ink-850 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mx-auto mb-5 h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <div className="absolute inset-3 rounded-full bg-brand-gradient opacity-20 animate-glow-pulse" />
          </div>
          <p className="font-medium text-warm-500 dark:text-warm-300">Loading...</p>
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
      <Notification />
    </>
  );
}

export default App;
