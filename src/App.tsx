import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/auth-store';
import { getEncryptedPrivateKey } from './lib/storage';
import { decryptPrivateKey, importPrivateKey } from './lib/crypto';
import LandingPage from './components/LandingPage';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import ChatLayout from './components/Chat/ChatLayout';
import EncryptionInfoModal from './components/EncryptionInfoModal';
import Notification from './components/Notification';

function App() {
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');
  const { user, setUser, setKeys, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-warm-50 to-accent/10 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary dark:border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-warm-600 dark:text-slate-300">Loading...</p>
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

  return (
    <>
      <ChatLayout />
      <EncryptionInfoModal />
      <Notification />
    </>
  );
}

export default App;
