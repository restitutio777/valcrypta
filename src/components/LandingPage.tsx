import ValCryptaLogo from './ValCryptaLogo';
import { landing, security } from '../lib/copy';

const LEVEL_ORDER = ['maximum', 'balanced', 'comfort'] as const;

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

// Soft mist hills dissolving into the ground fog — pure SVG, no imagery.
// Three layers, increasingly present toward the front, all heavily blurred.
function MistHills() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-[1]">
      <svg
        className="w-full blur-2xl"
        viewBox="0 0 1440 240"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 190 Q 240 110 480 165 T 900 150 T 1440 175 V 240 H 0 Z"
          className="fill-mist-400/30 dark:fill-ink-700/50"
        />
      </svg>
      <svg
        className="-mt-24 w-full blur-xl"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 160 Q 320 90 640 140 T 1100 125 T 1440 150 V 200 H 0 Z"
          className="fill-mist-500/25 dark:fill-ink-600/40"
        />
      </svg>
      <svg
        className="-mt-16 w-full blur-lg"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 110 Q 360 60 760 100 T 1440 95 V 140 H 0 Z"
          className="fill-mist-600/20 dark:fill-ink-500/30"
        />
      </svg>
    </div>
  );
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-porcelain-50 dark:bg-ink-950">
      {/* ---------------------------------------------------------------- */}
      {/* Hero: luminous haze scene                                         */}
      {/* ---------------------------------------------------------------- */}
      <header className="haze-hero grain">
        {/* drifting tonal washes */}
        <div
          aria-hidden
          className="haze-wash animate-float-slow h-[34rem] w-[34rem] -left-40 top-10 bg-mist-300/40 dark:bg-ink-700/40"
        />
        <div
          aria-hidden
          className="haze-wash animate-float-slow h-[28rem] w-[28rem] -right-32 top-40 bg-porcelain-300/50 dark:bg-ink-600/30"
          style={{ animationDirection: 'reverse', animationDuration: '20s' }}
        />
        {/* Warm dawn note so the haze isn't purely cool. */}
        <div
          aria-hidden
          className="haze-wash animate-float-slow left-1/2 top-56 h-[22rem] w-[22rem] -translate-x-1/2 bg-brass-300/20 dark:bg-brass-500/10"
          style={{ animationDuration: '26s' }}
        />
        <MistHills />

        <div className="relative z-10">
          <nav className="container mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <ValCryptaLogo size="md" showText={true} />
              <button
                onClick={onSignIn}
                className="btn-glass px-5 py-2 text-sm"
              >
                {landing.ctaSecondary}
              </button>
            </div>
          </nav>

          <div className="container mx-auto px-6 pb-40 pt-16 text-center sm:pt-24 md:pb-52">
            <div className="mx-auto max-w-4xl">
              <span className="glass-chip animate-fade-in">
                <span className="h-1.5 w-1.5 rounded-full bg-brass-400" />
                <span className="spec-label !text-porcelain-700 dark:!text-porcelain-300">
                  {landing.kicker}
                </span>
              </span>

              <h1 className="mt-8 animate-fade-in-up font-display font-semibold leading-[1.02] tracking-[-0.02em] text-porcelain-900 dark:text-porcelain-100 [font-size:clamp(3rem,8.5vw,6rem)]">
                {landing.heroLine1}
                <br />
                {landing.heroLine2Pre}
                <span className="text-gradient-brass">{landing.heroEmphasis}</span>
              </h1>

              <p
                className="mx-auto mt-7 max-w-xl animate-fade-in-up text-lg leading-relaxed text-porcelain-600 dark:text-porcelain-300 md:text-xl"
                style={{ animationDelay: '100ms' }}
              >
                {landing.heroSub}
              </p>

              <div
                className="mt-10 flex flex-col items-center justify-center gap-3 animate-fade-in-up sm:flex-row"
                style={{ animationDelay: '200ms' }}
              >
                <button
                  onClick={onGetStarted}
                  className="btn-primary w-full px-9 py-3.5 text-base sm:w-auto"
                >
                  {landing.ctaPrimary}
                </button>
                <button
                  onClick={onSignIn}
                  className="btn-glass w-full px-9 py-3.5 text-base sm:w-auto"
                >
                  {landing.ctaSecondary}
                </button>
              </div>

              <div
                className="mt-16 flex flex-wrap items-center justify-center gap-2.5 animate-fade-in-up sm:gap-3"
                style={{ animationDelay: '320ms' }}
              >
                {landing.specs.map((s) => (
                  <span key={s} className="glass-chip">
                    <span className="spec-label">{s}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Wie ValCrypta funktioniert — typographic, numbered, no icons       */}
      {/* ---------------------------------------------------------------- */}
      <section className="container mx-auto max-w-3xl px-6 py-20 md:py-28">
        <span className="spec-label">Protokoll</span>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-porcelain-900 dark:text-porcelain-100 md:text-4xl">
          {landing.how.title}
        </h2>
        <div className="mt-12">
          {landing.how.steps.map(({ num, claim, body }) => (
            <div
              key={num}
              className="hairline grid grid-cols-[4.5rem_1fr] gap-5 border-t py-9 md:grid-cols-[5.5rem_1fr] md:gap-8"
            >
              <span className="text-gradient-brass font-display text-4xl font-semibold leading-none md:text-5xl">
                {num}
              </span>
              <div>
                <h3 className="font-display text-2xl font-semibold tracking-[-0.02em] text-porcelain-900 dark:text-porcelain-100 md:text-3xl">
                  {claim}
                </h3>
                <p className="mt-3 max-w-xl leading-relaxed text-porcelain-600 dark:text-porcelain-300">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Drei Sicherheitsstufen — kurz, bevor man sich registriert           */}
      {/* ---------------------------------------------------------------- */}
      <section className="container mx-auto max-w-4xl px-6 py-4 md:py-8">
        <div className="text-center">
          <span className="spec-label">{landing.levelsTeaser.kicker}</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-porcelain-900 dark:text-porcelain-100 md:text-4xl">
            {landing.levelsTeaser.title}
          </h2>
          <p className="mx-auto mt-3 max-w-lg leading-relaxed text-porcelain-600 dark:text-porcelain-300">
            {landing.levelsTeaser.sub}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {LEVEL_ORDER.map((id) => (
            <div key={id} className="glass-card rounded-2xl p-5">
              <p className="spec-label !text-brass-600 dark:!text-brass-300">
                {security.levels[id].name}
              </p>
              <p className="mt-2 text-sm leading-snug text-porcelain-600 dark:text-porcelain-300">
                {security.levels[id].tagline}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-porcelain-500 dark:text-porcelain-400">
          {landing.levelsTeaser.footnote}
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Was wir speichern — und was nicht                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="container mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
        <div className="gradient-ring rounded-[2rem] shadow-lift">
          <div className="dusk-panel grain rounded-[calc(2rem-1px)] px-6 py-12 sm:px-10 md:px-14 md:py-16">
            <div className="relative z-10">
              <span className="spec-label !text-brass-300">{landing.storage.kicker}</span>
              <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-[-0.02em] text-porcelain-50 md:text-4xl">
                {landing.storage.title}
              </h2>
              <p className="mt-3 text-porcelain-400">{landing.storage.sub}</p>

              <div className="mt-10 grid gap-10 md:grid-cols-[1fr_auto_1fr] md:gap-12">
                <div>
                  <h3 className="spec-label !text-brass-300">{landing.storage.weStore.title}</h3>
                  <ul className="mt-4">
                    {landing.storage.weStore.items.map((item, i) => (
                      <li
                        key={item}
                        className="grid grid-cols-[2.5rem_1fr] items-baseline border-t border-white/10 py-4"
                      >
                        <span className="font-mono text-[11px] text-brass-300/80">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-lg text-porcelain-100">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div aria-hidden className="gradient-rule-y hidden md:block" />

                <div>
                  <h3 className="spec-label !text-porcelain-500">
                    {landing.storage.weDont.title}
                  </h3>
                  <ul className="mt-4">
                    {landing.storage.weDont.items.map((item) => (
                      <li
                        key={item}
                        className="grid grid-cols-[2.5rem_1fr] items-baseline border-t border-white/[0.06] py-4"
                      >
                        <span className="font-mono text-[11px] text-porcelain-600">—</span>
                        <span className="text-lg text-porcelain-500 line-through decoration-porcelain-600/60 decoration-1">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6">
                {landing.specs.map((s) => (
                  <span key={s} className="spec-label !text-porcelain-500">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Wer dahintersteckt — Transparenz statt Impressum-Floskeln           */}
      {/* ---------------------------------------------------------------- */}
      <section className="container mx-auto max-w-2xl px-6 py-16 text-center md:py-20">
        <span className="spec-label">{landing.transparency.kicker}</span>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-porcelain-900 dark:text-porcelain-100 md:text-4xl">
          {landing.transparency.title}
        </h2>
        <p className="mx-auto mt-5 max-w-xl leading-relaxed text-porcelain-600 dark:text-porcelain-300">
          {landing.transparency.body}
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Final CTA                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="aurora-bg">
        <div className="container mx-auto px-6 py-24 text-center md:py-32">
          <p className="mx-auto max-w-2xl font-display text-3xl font-semibold leading-snug tracking-[-0.02em] text-porcelain-900 dark:text-porcelain-100 md:text-5xl">
            {landing.finalCta.pre}
            <span className="text-gradient-brass">{landing.finalCta.emphasis}</span>
            {landing.finalCta.post}
          </p>
          <button
            onClick={onGetStarted}
            className="btn-primary mt-10 px-9 py-3.5 text-base"
          >
            {landing.finalCta.button}
          </button>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Footer                                                             */}
      {/* ---------------------------------------------------------------- */}
      <footer className="hairline border-t">
        <div className="container mx-auto flex flex-col items-center gap-4 px-6 py-10">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {landing.specs.map((s) => (
              <span key={s} className="spec-label !text-[10px]">
                {s}
              </span>
            ))}
          </div>
          <p className="text-sm text-porcelain-500 dark:text-porcelain-400">
            {landing.footerLegal} · Von dir verschlüsselt. Für uns unlesbar.
          </p>
        </div>
      </footer>
    </div>
  );
}
