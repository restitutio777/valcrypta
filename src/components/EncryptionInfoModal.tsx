import { X, Lock, Key, Shield } from 'lucide-react';
import { useUIStore } from '../stores/ui-store';
import { useCopy } from '../lib/use-copy';

export default function EncryptionInfoModal() {
  const { showEncryptionInfo, setShowEncryptionInfo } = useUIStore();
  const { encryption } = useCopy();

  if (!showEncryptionInfo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
      onClick={() => setShowEncryptionInfo(false)}
    >
      <div
        className="glass-card max-h-[90vh] w-full max-w-2xl animate-scale-in overflow-y-auto rounded-3xl shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b hairline bg-white/85 dark:bg-ink-850/85 p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-warm-800 dark:text-warm-50">
            {encryption.title}
          </h2>
          <button onClick={() => setShowEncryptionInfo(false)} className="btn-ghost-icon">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-gradient shadow-soft">
              <Lock className="h-6 w-6 text-porcelain-50" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-warm-800 dark:text-warm-50">
                {encryption.s1Title}
              </h3>
              <p className="leading-relaxed text-warm-600 dark:text-warm-300">
                {encryption.s1Body}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-gradient shadow-soft">
              <Key className="h-6 w-6 text-porcelain-50" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-warm-800 dark:text-warm-50">
                {encryption.s2Title}
              </h3>
              <p className="mb-3 leading-relaxed text-warm-600 dark:text-warm-300">
                {encryption.s2Body}
              </p>
              <ul className="space-y-2 text-warm-600 dark:text-warm-300">
                {encryption.s2Points.map(([label, rest]) => (
                  <li key={label} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brass-400" />
                    <span>
                      <strong>{label}</strong>
                      {rest}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-gradient shadow-soft">
              <Shield className="h-6 w-6 text-porcelain-50" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-warm-800 dark:text-warm-50">
                {encryption.s3Title}
              </h3>
              <ul className="space-y-2 text-warm-600 dark:text-warm-300">
                {encryption.s3Points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brass-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border hairline bg-mist-50 dark:bg-ink-800 p-5">
            <h4 className="mb-2 font-semibold text-warm-800 dark:text-warm-100">
              {encryption.techTitle}
            </h4>
            <p className="text-sm leading-relaxed text-warm-600 dark:text-warm-200">
              {encryption.techBody}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
