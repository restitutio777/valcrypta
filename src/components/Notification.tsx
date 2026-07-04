import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useUIStore } from '../stores/ui-store';

export default function Notification() {
  const { notification, clearNotification } = useUIStore();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  if (!notification) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
  };

  const colors = {
    success: 'border-primary/30 text-primary-dark dark:text-primary-light',
    error: 'border-red-300/60 dark:border-red-800/60 text-red-700 dark:text-red-300',
    info: 'border-accent/30 text-warm-700 dark:text-warm-200',
  };

  const Icon = icons[notification.type];

  return (
    <div className="fixed right-4 top-4 z-50 animate-slide-in">
      <div
        className={`glass-card ${colors[notification.type]} flex max-w-md items-start gap-3 rounded-2xl p-4 shadow-lift`}
      >
        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <p className="flex-1 text-sm font-medium">{notification.message}</p>
        <button
          onClick={clearNotification}
          className="text-current opacity-50 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
