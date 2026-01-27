import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingState({
  message = 'Loading...',
  className,
  size = 'md',
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="loading"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-muted-foreground',
        className
      )}
    >
      <Loader2 className={cn('animate-spin mb-2', sizeClasses[size])} aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingState size="lg" message="Loading page..." />
    </div>
  );
}

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading content" data-testid="skeleton">
      <span className="sr-only">Loading content...</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2" aria-hidden="true">
          <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
