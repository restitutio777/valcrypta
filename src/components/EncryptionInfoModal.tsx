import { X } from 'lucide-react';
import { useUIStore } from '../stores/ui-store';
import { encryption } from '../lib/copy';

export default function EncryptionInfoModal() {
  const { showEncryptionInfo, setShowEncryptionInfo } = useUIStore();

  if (!showEncryptionInfo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
      onClick={() => setShowEncryptionInfo(false)}
    >
      <div
        className="glass-card max-h-[90vh] w-full max-w-xl animate-scale-in overflow-y-auto rounded-3xl shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b hairline bg-white/85 dark:bg-ink-850/85 px-6 py-5 backdrop-blur-xl sm:px-7">
          <h2 className="font-display text-xl font-semibold tracking-[-0.01em] text-warm-800 dark:text-warm-50 sm:text-2xl">
            {encryption.title}
          </h2>
          <button onClick={() => setShowEncryptionInfo(false)} className="btn-ghost-icon">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 sm:px-7">
          <div className="hairline grid grid-cols-[2.25rem_1fr] gap-4 border-t py-7 sm:grid-cols-[2.75rem_1fr] sm:gap-6">
            <span className="spec-label pt-1 !text-brass-600 dark:!text-brass-300">01</span>
            <div>
              <h3 className="text-base font-semibold text-warm-800 dark:text-warm-50">
                {encryption.s1Title}
              </h3>
              <p className="mt-2 leading-relaxed text-warm-600 dark:text-warm-300">
                {encryption.s1Body}
              </p>
            </div>
          </div>

          <div className="hairline grid grid-cols-[2.25rem_1fr] gap-4 border-t py-7 sm:grid-cols-[2.75rem_1fr] sm:gap-6">
            <span className="spec-label pt-1 !text-brass-600 dark:!text-brass-300">02</span>
            <div>
              <h3 className="text-base font-semibold text-warm-800 dark:text-warm-50">
                {encryption.s2Title}
              </h3>
              <p className="mt-2 leading-relaxed text-warm-600 dark:text-warm-300">
                {encryption.s2Body}
              </p>
              <ul className="mt-3 space-y-2">
                {encryption.s2Points.map(([label, rest]) => (
                  <li key={label} className="flex items-start gap-2.5 leading-relaxed text-warm-600 dark:text-warm-300">
                    <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-porcelain-400 dark:bg-porcelain-500" />
                    <span>
                      <strong className="font-semibold text-warm-800 dark:text-warm-100">{label}</strong>
                      {rest}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="hairline grid grid-cols-[2.25rem_1fr] gap-4 border-t py-7 sm:grid-cols-[2.75rem_1fr] sm:gap-6">
            <span className="spec-label pt-1 !text-brass-600 dark:!text-brass-300">03</span>
            <div>
              <h3 className="text-base font-semibold text-warm-800 dark:text-warm-50">
                {encryption.s3Title}
              </h3>
              <ul className="mt-3 space-y-2">
                {encryption.s3Points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 leading-relaxed text-warm-600 dark:text-warm-300">
                    <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-porcelain-400 dark:bg-porcelain-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="hairline border-t px-6 py-6 sm:px-7">
          <p className="spec-label">{encryption.techTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-warm-500 dark:text-warm-300">
            {encryption.techBody}
          </p>
        </div>
      </div>
    </div>
  );
}
