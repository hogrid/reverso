import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-display text-[140px] font-medium leading-none text-[hsl(var(--secondary))]" style={{ letterSpacing: '-6px' }}>
          404
        </p>
        <h2 className="font-display text-2xl font-medium" style={{ letterSpacing: '-0.5px' }}>
          Page not found
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Button asChild variant="outline" className="h-10 px-5 text-[13px] font-medium border-[hsl(var(--border))]">
            <Link to="/">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Go Back
            </Link>
          </Button>
          <Button asChild className="h-10 px-5 text-[13px] font-medium bg-foreground text-white hover:bg-foreground/90">
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
