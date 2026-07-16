import { useEffect, useState } from 'react';
import { X, Users, MessageSquare, Eye } from 'lucide-react';
import { useUIStore } from '../stores/ui-store';
import { useAuthStore } from '../stores/auth-store';
import { isAdminUser, fetchAdminStats, AdminStats } from '../lib/admin';
import { useCopy } from '../lib/use-copy';

// Admin backend: aggregate visitor statistics only. Everything shown here is
// a count returned by the get_admin_stats() RPC — no message contents (they
// are ciphertext anyway), no per-user data, no visitor details.
export default function AdminStatsModal() {
  const { showAdminStats, setShowAdminStats, language } = useUIStore();
  const { user } = useAuthStore();
  const { admin } = useCopy();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!showAdminStats) return;
    setStats(null);
    setFailed(false);
    fetchAdminStats()
      .then(setStats)
      .catch((error) => {
        console.error('Admin stats fetch failed:', error);
        setFailed(true);
      });
  }, [showAdminStats]);

  if (!showAdminStats || !isAdminUser(user)) return null;

  const closeModal = () => setShowAdminStats(false);

  const formatDay = (isoDay: string) =>
    new Date(`${isoDay}T00:00:00`).toLocaleDateString(language, {
      day: 'numeric',
      month: 'short',
    });

  const daily = stats?.visits_daily ?? [];
  const maxDaily = Math.max(1, ...daily.map((d) => d.count));

  const tiles = stats
    ? [
        { icon: Eye, label: admin.visitsToday, value: stats.visits_today },
        { icon: Eye, label: admin.visits7d, value: stats.visits_7d },
        { icon: Eye, label: admin.visits30d, value: stats.visits_30d },
        { icon: Eye, label: admin.visitsTotal, value: stats.visits_total },
        { icon: Users, label: admin.totalUsers, value: stats.total_users },
        { icon: Users, label: admin.newUsers7d, value: stats.new_users_7d },
        { icon: MessageSquare, label: admin.totalMessages, value: stats.total_messages },
        { icon: MessageSquare, label: admin.messages7d, value: stats.messages_7d },
      ]
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        className="glass-card max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-3xl shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sage-100 dark:border-ink-700/60 bg-white/85 dark:bg-ink-850/85 p-5 backdrop-blur-xl sm:p-6">
          <div>
            <h2 className="text-xl font-semibold text-warm-800 dark:text-warm-50 sm:text-2xl">
              {admin.title}
            </h2>
            <p className="mt-0.5 text-sm text-warm-500 dark:text-warm-300">{admin.subtitle}</p>
          </div>
          <button onClick={closeModal} className="btn-ghost-icon">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {failed ? (
            <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
              {admin.errLoad}
            </div>
          ) : !stats ? (
            <div className="flex items-center justify-center gap-3 py-10 text-sm text-warm-500 dark:text-warm-300">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              {admin.loading}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {tiles.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-sage-100 dark:border-ink-600/60 bg-white/60 dark:bg-ink-800/60 p-3"
                  >
                    <Icon className="mb-1.5 h-4 w-4 text-porcelain-500 dark:text-porcelain-400" />
                    <p className="text-2xl font-semibold tabular-nums leading-tight text-warm-800 dark:text-warm-50">
                      {value.toLocaleString(language)}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-warm-500 dark:text-warm-300">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-sage-100 dark:border-ink-600/60 bg-white/60 dark:bg-ink-800/60 p-4">
                <p className="mb-3 text-sm font-semibold text-warm-800 dark:text-warm-50">
                  {admin.chartTitle}
                </p>
                <div className="flex h-28 items-end gap-[2px]" role="img" aria-label={admin.chartTitle}>
                  {daily.map(({ day, count }) => (
                    <div
                      key={day}
                      className="group relative flex h-full flex-1 flex-col justify-end"
                      title={`${formatDay(day)}: ${count}`}
                    >
                      {count === maxDaily && count > 0 && (
                        <span className="mb-0.5 text-center text-[10px] font-semibold tabular-nums text-warm-600 dark:text-warm-200">
                          {count}
                        </span>
                      )}
                      <div
                        className="w-full rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                        style={{ height: `${Math.max(count > 0 ? 4 : 1, (count / maxDaily) * 100)}%` }}
                      />
                    </div>
                  ))}
                </div>
                {daily.length > 0 && (
                  <div className="mt-1.5 flex justify-between text-[10px] text-warm-400 dark:text-warm-500">
                    <span>{formatDay(daily[0].day)}</span>
                    <span>{formatDay(daily[daily.length - 1].day)}</span>
                  </div>
                )}
              </div>

              <p className="pt-1 text-center text-xs leading-relaxed text-warm-400 dark:text-warm-500">
                {admin.privacyNote}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
