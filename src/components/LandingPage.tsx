import ValCryptaLogo from './ValCryptaLogo';
import { landing } from '../lib/copy';

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

              <h1 className="mt-8 animate-fade-in-up font-display font-normal leading-[1.02] text-porcelain-900 dark:text-porcelain-100 [font-size:clamp(3rem,8.5vw,6rem)]">
                {landing.heroLine1}
                <br />
                {landing.heroLine2Pre}
                <em className="italic">{landing.heroEmphasis}</em>
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
        <h2 className="font-display text-3xl font-normal text-porcelain-900 dark:text-porcelain-100 md:text-4xl">
          {landing.how.title}
        </h2>
        <div className="mt-10">
          {landing.how.steps.map(({ num, claim, body }) => (
            <div
              key={num}
              className="hairline grid grid-cols-[3.5rem_1fr] gap-5 border-t py-10 md:gap-8"
            >
              <span className="spec-label pt-2">{num}</span>
              <div>
                <h3 className="font-display text-2xl font-normal text-porcelain-900 dark:text-porcelain-100 md:text-3xl">
                  {claim}
                </h3>
                <p className="mt-3 leading-relaxed text-porcelain-600 dark:text-porcelain-300">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Was wir speichern — und was nicht                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-mist-50 dark:bg-ink-900/60">
        <div className="container mx-auto max-w-4xl px-6 py-20 md:py-28">
          <h2 className="text-center font-display text-3xl font-normal text-porcelain-900 dark:text-porcelain-100 md:text-4xl">
            {landing.storage.title}
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="glass-card rounded-3xl p-8">
              <h3 className="spec-label">{landing.storage.weStore.title}</h3>
              <ul className="mt-5">
                {landing.storage.weStore.items.map((item) => (
                  <li
                    key={item}
                    className="hairline border-t py-3.5 text-porcelain-700 dark:text-porcelain-200"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-3xl p-8">
              <h3 className="spec-label">{landing.storage.weDont.title}</h3>
              <ul className="mt-5">
                {landing.storage.weDont.items.map((item) => (
                  <li
                    key={item}
                    className="hairline border-t py-3.5 text-porcelain-500 dark:text-porcelain-400"
                  >
                    <span className="mr-2 text-porcelain-400 dark:text-porcelain-600">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Final CTA                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="aurora-bg">
        <div className="container mx-auto px-6 py-24 text-center md:py-32">
          <p className="mx-auto max-w-2xl font-display text-3xl font-normal italic leading-snug text-porcelain-900 dark:text-porcelain-100 md:text-5xl">
            {landing.finalCta.line}
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
