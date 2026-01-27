import { TooltipProvider } from '@/components/ui/tooltip';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/**
 * Skip to main content link for keyboard navigation.
 * Becomes visible only when focused.
 */
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
    >
      Skip to main content
    </a>
  );
}

export function RootLayout() {
  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Skip link for keyboard users */}
        <SkipLink />

        {/* Sidebar navigation */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main
            id="main-content"
            className="flex-1 overflow-auto bg-muted/30"
            tabIndex={-1}
            aria-label="Main content"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
