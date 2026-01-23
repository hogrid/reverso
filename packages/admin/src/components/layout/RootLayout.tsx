import { TooltipProvider } from '@/components/ui/tooltip';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function RootLayout() {
  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
