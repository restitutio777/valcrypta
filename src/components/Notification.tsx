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
    success: 'bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40 text-primary-dark dark:text-primary-light',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    info: 'bg-accent/10 dark:bg-accent/20 border-accent/30 dark:border-accent/40 text-warm-800 dark:text-warm-200',
  };

  const Icon = icons[notification.type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${colors[notification.type]} border rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-md`}>
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="flex-1 text-sm font-medium">{notification.message}</p>
        <button
          onClick={clearNotification}
          className="text-current opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
