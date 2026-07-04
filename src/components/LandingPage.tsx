import { Lock, MessageSquare, ChevronRight, Shield, KeyRound, Fingerprint } from 'lucide-react';
import ValCryptaLogo from './ValCryptaLogo';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const features = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    body: 'Your messages are encrypted on your device before sending. Only you and your recipient can read them.',
  },
  {
    icon: Shield,
    title: 'Zero Data Storage',
    body: "We don't store your messages or encryption keys. Your privacy is guaranteed by design.",
  },
  {
    icon: MessageSquare,
    title: 'Simple & Secure',
    body: 'Military-grade security doesn’t have to be complicated. Chat naturally while staying protected.',
  },
];

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="aurora-bg min-h-screen bg-gradient-to-br from-sage-50 via-warm-50 to-sage-100 dark:from-ink-950 dark:via-ink-900 dark:to-ink-850">
      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <ValCryptaLogo size="md" showText={true} />
            <button
              onClick={onSignIn}
              className="px-5 py-2.5 text-sm font-semibold text-warm-700 dark:text-warm-200 rounded-xl border border-transparent hover:border-sage-200 dark:hover:border-ink-600 hover:bg-white/60 dark:hover:bg-ink-800/60 backdrop-blur-sm transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </nav>

        <main className="container mx-auto flex-1 px-6 pt-10 pb-16 md:pt-16">
          <div className="mx-auto max-w-4xl text-center">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-sage-200/80 dark:border-ink-600 bg-white/60 dark:bg-ink-800/60 px-4 py-1.5 backdrop-blur-sm animate-fade-in"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary-dark dark:text-primary-light">
                Zero-knowledge messaging
              </span>
            </div>

            <h1 className="mb-5 font-display text-5xl font-bold leading-[1.05] tracking-tight text-warm-900 dark:text-warm-50 md:text-7xl animate-fade-in-up">
              Your Messages,
              <br />
              <span className="animate-gradient-pan bg-gradient-to-r from-primary-light via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
                Truly Private
              </span>
            </h1>

            <p
              className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-warm-600 dark:text-warm-200 md:text-xl animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              ValCrypta uses military-grade encryption to keep your conversations secure.
              Not even we can read your messages.
            </p>

            <div
              className="mb-16 flex flex-col justify-center gap-4 sm:flex-row animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              <button
                onClick={onGetStarted}
                className="btn-primary group flex items-center justify-center gap-2 px-8 py-4 text-lg"
              >
                Get Started Free
                <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button
                onClick={onSignIn}
                className="glass-card rounded-xl px-8 py-4 text-lg font-semibold text-warm-700 dark:text-warm-100 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/40"
              >
                Sign In
              </button>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
              {features.map(({ icon: Icon, title, body }, i) => (
                <div
                  key={title}
                  className="glass-card group rounded-3xl p-8 text-left shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow animate-fade-in-up"
                  style={{ animationDelay: `${300 + i * 120}ms` }}
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-bold text-warm-800 dark:text-warm-50">
                    {title}
                  </h3>
                  <p className="leading-relaxed text-warm-600 dark:text-warm-300">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="border-t border-sage-100/80 dark:border-ink-700/60">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-200/80 dark:border-ink-600 bg-white/50 dark:bg-ink-800/50 px-3 py-1 text-xs font-medium text-warm-600 dark:text-warm-300 backdrop-blur-sm">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  AES-GCM 256-bit messages
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-200/80 dark:border-ink-600 bg-white/50 dark:bg-ink-800/50 px-3 py-1 text-xs font-medium text-warm-600 dark:text-warm-300 backdrop-blur-sm">
                  <Fingerprint className="h-3.5 w-3.5 text-primary" />
                  RSA-OAEP 2048-bit key exchange
                </span>
              </div>
              <p className="text-sm text-warm-500 dark:text-warm-400">
                © 2025 ValCrypta. Encrypted by you. Not stored for us.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
