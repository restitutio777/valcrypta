import { Lock, MessageSquare, ChevronRight, Shield } from 'lucide-react';
import ValCryptaLogo from './ValCryptaLogo';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-warm-50 to-sage-100 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800 relative">

      <div className="relative z-10">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <ValCryptaLogo size="md" showText={true} />
            <button
              onClick={onSignIn}
              className="px-6 py-2.5 text-warm-800 dark:text-slate-200 hover:bg-warm-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors font-medium"
            >
              Sign In
            </button>
          </div>
        </nav>

        <main className="container mx-auto px-6 pt-8 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-warm-900 dark:text-warm-50 mb-4 leading-tight">
              Your Messages,
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary-dark bg-clip-text text-transparent">
                Truly Private
              </span>
            </h1>

            <p className="text-lg text-warm-700 dark:text-warm-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              ValCrypta uses military-grade encryption to keep your conversations secure.
              Not even we can read your messages.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <button
                onClick={onGetStarted}
                className="group px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
              >
                Get Started Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onSignIn}
                className="px-8 py-3 bg-white dark:bg-sage-800 text-warm-800 dark:text-warm-50 rounded-xl transition-all duration-300 font-semibold text-lg border-2 border-warm-200 dark:border-sage-700 hover:border-primary dark:hover:border-primary shadow-sm hover:shadow-md"
              >
                Sign In
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="p-6 bg-white/60 dark:bg-sage-800/60 backdrop-blur-sm rounded-2xl border border-warm-200 dark:border-sage-700 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-warm-800 dark:text-warm-50 mb-3">
                  End-to-End Encryption
                </h3>
                <p className="text-warm-600 dark:text-warm-300 leading-relaxed">
                  Your messages are encrypted on your device before sending. Only you and your recipient can read them.
                </p>
              </div>

              <div className="p-6 bg-white/60 dark:bg-sage-800/60 backdrop-blur-sm rounded-2xl border border-warm-200 dark:border-sage-700 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-accent/20 dark:bg-accent/30 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Shield className="w-6 h-6 text-accent dark:text-accent" />
                </div>
                <h3 className="text-lg font-bold text-warm-800 dark:text-warm-50 mb-3">
                  Zero Data Storage
                </h3>
                <p className="text-warm-600 dark:text-warm-300 leading-relaxed">
                  We don't store your messages or encryption keys. Your privacy is guaranteed by design.
                </p>
              </div>

              <div className="p-6 bg-white/60 dark:bg-sage-800/60 backdrop-blur-sm rounded-2xl border border-warm-200 dark:border-sage-700 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-accent-gold/20 dark:bg-accent-gold/30 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <MessageSquare className="w-6 h-6 text-accent-gold" />
                </div>
                <h3 className="text-lg font-bold text-warm-800 dark:text-warm-50 mb-3">
                  Simple & Secure
                </h3>
                <p className="text-warm-600 dark:text-warm-300 leading-relaxed">
                  Military-grade security doesn't have to be complicated. Chat naturally while staying protected.
                </p>
              </div>
            </div>
          </div>
        </main>

        <footer className="container mx-auto px-6 py-8 border-t border-warm-200 dark:border-sage-800">
          <div className="text-center text-warm-500 dark:text-warm-400 text-sm">
            <p>© 2025 ValCrypta. Encrypted by you. Not stored for us.</p>
            <p className="mt-2">
              <span className="font-medium">AES-GCM 256-bit</span> message encryption ·
              <span className="font-medium"> RSA-OAEP 2048-bit</span> key exchange
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
