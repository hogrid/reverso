import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

function describeError(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`.trim();
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred.';
}

/**
 * Router `errorElement`: replaces React Router's developer error screen with a
 * friendly card when a page throws while rendering or loading.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        role="alert"
        className="w-full max-w-md rounded-lg border bg-background p-6 text-center shadow-sm"
      >
        <div className="mx-auto mb-4 w-fit rounded-lg bg-destructive/5 p-3" aria-hidden="true">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="mb-1 text-sm font-semibold">Something went wrong</h2>
        <p className="mb-4 break-words text-[13px] text-muted-foreground">{describeError(error)}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Reload page
        </Button>
      </div>
    </div>
  );
}
