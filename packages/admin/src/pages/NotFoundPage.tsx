import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-7xl font-bold text-muted-foreground/20 tabular-nums">404</p>
        <h2 className="text-lg font-semibold mt-2 mb-1">Page Not Found</h2>
        <p className="text-[13px] text-muted-foreground mb-6 max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Go Back
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/">
              <Home className="mr-1.5 h-3.5 w-3.5" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
