import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Bell,
  ExternalLink,
  FileText,
  FormInput,
  Image,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/pages': 'Pages',
  '/media': 'Media',
  '/forms': 'Forms',
  '/redirects': 'Redirects',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/pages/')) return 'Page Editor';
  if (pathname.startsWith('/forms/') && pathname.endsWith('/submissions')) return 'Submissions';
  if (pathname.startsWith('/forms/')) return 'Form Builder';
  return 'Not Found';
}

interface MobileNavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const mobileNavItems: MobileNavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Pages', href: '/pages', icon: FileText },
  { title: 'Media', href: '/media', icon: Image },
  { title: 'Forms', href: '/forms', icon: FormInput },
  { title: 'Redirects', href: '/redirects', icon: ExternalLink },
  { title: 'Settings', href: '/settings', icon: Settings },
];

export function Header() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileNavOpen]);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <header className="flex items-center justify-between h-16 px-6 md:px-12 bg-white dark:bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </Button>

        {/* Page Title */}
        <h1 className="font-display text-2xl md:text-4xl font-bold tracking-tight" style={{ letterSpacing: '-1px' }}>
          {title}
        </h1>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search */}
          <form className="hidden sm:block" onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search..."
                aria-label="Search"
                className="h-9 w-60 pl-9 pr-3 text-[13px] bg-[hsl(var(--secondary))] border-0 focus:bg-white dark:focus:bg-[hsl(var(--card))]"
              />
            </div>
          </form>

          {/* Notification bell */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
          </Button>

          {/* Theme toggle (with system option) */}
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: backdrop click-to-dismiss, Escape handled by global listener */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Panel */}
          <nav
            className="absolute inset-y-0 left-0 w-72 bg-[hsl(var(--sidebar))] p-6 flex flex-col"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between mb-8">
              <Link
                to="/"
                className="flex items-center gap-3"
                onClick={() => setMobileNavOpen(false)}
              >
                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--brand))] flex items-center justify-center">
                  <span className="text-white font-display text-base font-bold">R</span>
                </div>
                <span className="text-white font-display text-xl font-bold">Reverso</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[hsl(var(--subtle-foreground))] hover:text-white hover:bg-[hsl(var(--sidebar-accent))]"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="flex flex-col gap-1 flex-1">
              {mobileNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-colors duration-150',
                      active
                        ? 'bg-[hsl(var(--sidebar-accent))] text-white'
                        : 'text-[hsl(var(--subtle-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.5} aria-hidden="true" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
