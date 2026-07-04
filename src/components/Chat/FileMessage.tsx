import { useState, useEffect, useRef } from 'react';
import { Download, FileText, X, AlertCircle } from 'lucide-react';
import { downloadFileBytes } from '../../lib/files';
import { useAuthStore } from '../../stores/auth-store';

interface FileMessageProps {
  fileUrl: string;
  keyPayload: string; // messages.encrypted_file_key
  isImage: boolean;
  fileSize: number | null;
  fileName: string;
  fileType: string;
  isOwn: boolean;
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export default function FileMessage({
  fileUrl,
  keyPayload,
  isImage,
  fileSize,
  fileName,
  fileType,
  isOwn,
}: FileMessageProps) {
  const { privateKey } = useAuthStore();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [showLightbox, setShowLightbox] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // Any object URL created here is tracked so it can be revoked on unmount —
  // decrypted bytes must never linger in the URL store.
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current = [];
    };
  }, []);

  // Lazily download + decrypt images once the bubble mounts.
  useEffect(() => {
    if (!isImage || !privateKey) return;
    let cancelled = false;

    (async () => {
      setStatus('loading');
      try {
        const bytes = await downloadFileBytes(fileUrl, keyPayload, privateKey, isOwn);
        if (cancelled) return;
        const url = URL.createObjectURL(new Blob([bytes], { type: fileType }));
        objectUrls.current.push(url);
        setImageUrl(url);
        setStatus('idle');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isImage, privateKey, fileUrl, keyPayload, fileType, isOwn]);

  const handleDownload = async () => {
    if (!privateKey || downloading) return;
    setDownloading(true);
    try {
      const bytes = await downloadFileBytes(fileUrl, keyPayload, privateKey, isOwn);
      const url = URL.createObjectURL(new Blob([bytes], { type: fileType }));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      // The blob is handed to the browser download; release it shortly after.
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      setStatus('error');
    } finally {
      setDownloading(false);
    }
  };

  if (isImage) {
    if (status === 'error') {
      return (
        <div className="flex items-center gap-2 rounded-2xl bg-black/10 px-3 py-2 text-sm dark:bg-white/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span>Could not load image</span>
        </div>
      );
    }
    if (!imageUrl) {
      // Blur-up skeleton while decrypting.
      return (
        <div className="flex h-40 w-56 max-w-full animate-pulse items-center justify-center rounded-2xl bg-black/10 dark:bg-white/10">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-current/40 border-t-transparent opacity-60" />
        </div>
      );
    }
    return (
      <>
        <button
          type="button"
          onClick={() => setShowLightbox(true)}
          className="block overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/60"
          title="Open image"
        >
          <img
            src={imageUrl}
            alt={fileName || 'Encrypted image'}
            className="max-h-80 max-w-full rounded-2xl object-cover"
          />
        </button>
        {showLightbox && (
          <div
            className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setShowLightbox(false)}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              onClick={() => setShowLightbox(false)}
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={imageUrl}
              alt={fileName || 'Encrypted image'}
              className="max-h-full max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  // Non-image file card.
  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className={`glass-card flex min-w-[13rem] max-w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60 ${
        isOwn ? 'text-warm-800 dark:text-warm-100' : 'text-warm-800 dark:text-warm-100'
      }`}
      title="Download file"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-lift">
        <FileText className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{fileName || 'Encrypted file'}</span>
        <span className="block text-xs text-warm-500 dark:text-warm-400">
          {formatBytes(fileSize)}
        </span>
      </span>
      {downloading ? (
        <span className="h-5 w-5 flex-shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ) : (
        <Download className="h-5 w-5 flex-shrink-0 text-primary" />
      )}
    </button>
  );
}
