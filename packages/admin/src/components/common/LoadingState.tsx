import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingState({
  message = 'Loading...',
  className,
  size = 'md',
}: LoadingStateProps) {
  return (
    <output
      aria-live="polite"
      aria-busy="true"
      data-testid="loading"
      className={cn(
        'flex flex-col items-center justify-center p-12 text-muted-foreground',
        className
      )}
    >
      <Loader2 className={cn('animate-spin mb-3', sizeClasses[size])} aria-hidden="true" />
      <p className="text-[13px]">{message}</p>
    </output>
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
    <output className="block space-y-4" aria-label="Loading content" data-testid="skeleton">
      <span className="sr-only">Loading content...</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`skeleton-${String(i)}`} className="space-y-2" aria-hidden="true">
          <div className="h-4 w-1/4 animate-pulse rounded-md bg-accent" />
          <div className="h-10 w-full animate-pulse rounded-md bg-accent" />
        </div>
      ))}
    </output>
  );
}
