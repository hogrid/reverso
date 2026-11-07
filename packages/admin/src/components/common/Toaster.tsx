import { cn } from '@/lib/utils';
import { useToastStore, type ToastVariant } from '@/stores/toast';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

/**
 * Renders the toast stack. Errors use role="alert" (announced immediately);
 * success/info use role="status" inside a polite live region.
 */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <section
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.variant];
        return (
          <div
            key={t.id}
            role={t.variant === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border bg-background p-3 text-[13px] shadow-lg',
              t.variant === 'error' && 'border-destructive/40'
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                t.variant === 'success' && 'text-green-600',
                t.variant === 'error' && 'text-destructive',
                t.variant === 'info' && 'text-muted-foreground'
              )}
            />
            <p className="flex-1 break-words">{t.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </section>
  );
}
