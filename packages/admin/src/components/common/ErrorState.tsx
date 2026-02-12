import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading the content.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="error-message"
      className={cn('flex flex-col items-center justify-center p-8 text-center', className)}
    >
      <div className="rounded-lg bg-destructive/5 p-3 mb-4" aria-hidden="true">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-[13px] text-muted-foreground mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} aria-label="Retry loading">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}

export function ErrorPage({
  title = 'Page Error',
  message = 'Failed to load this page. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <ErrorState title={title} message={message} onRetry={onRetry} />
    </div>
  );
}
