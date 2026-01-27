/**
 * Sidebar - Refined minimal navigation
 *
 * Design principles:
 * - Pure white background
 * - Subtle borders and hover states
 * - Smooth transitions
 * - Clear visual hierarchy
 */

import { usePages } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  FormInput,
  Image,
  Layers,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Pages', href: '/pages', icon: FileText },
  { title: 'Media', href: '/media', icon: Image },
  { title: 'Forms', href: '/forms', icon: FormInput },
  { title: 'Redirects', href: '/redirects', icon: ExternalLink },
];

const bottomNavItems: NavItem[] = [{ title: 'Settings', href: '/settings', icon: Settings }];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { data: pages } = usePages();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    const linkContent = (
      <Link
        to={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-ring/30 focus:ring-offset-1 focus:ring-offset-background',
          active
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" aria-hidden="true" />
        {!sidebarCollapsed && <span>{item.title}</span>}
        {sidebarCollapsed && <span className="sr-only">{item.title}</span>}
      </Link>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-normal text-xs px-2 py-1">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside
      aria-label="Main navigation"
      data-testid="sidebar"
      className={cn(
        'hidden md:flex flex-col bg-background border-r border-border/60',
        'transition-all duration-300 ease-out',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-border/50">
        {!sidebarCollapsed && (
          <Link
            to="/"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/40 transition-colors duration-150"
          >
            <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center">
              <Layers className="h-3 w-3 text-background" strokeWidth={2.5} />
            </div>
            <span className="font-medium text-sm tracking-tight">Reverso</span>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link
            to="/"
            className="mx-auto flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent/40 transition-colors duration-150"
          >
            <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center">
              <Layers className="h-3 w-3 text-background" strokeWidth={2.5} />
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 rounded-md hover:bg-accent/40 transition-colors duration-150',
            sidebarCollapsed && 'hidden'
          )}
          onClick={() => setSidebarCollapsed(true)}
          aria-label="Collapse sidebar"
          aria-expanded={!sidebarCollapsed}
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2.5 py-3">
        <nav aria-label="Primary navigation" className="space-y-0.5">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Pages submenu */}
        {!sidebarCollapsed && pages && pages.length > 0 && (
          <>
            <Separator className="my-3 bg-border/50" />
            <nav aria-label="Content pages" className="space-y-0.5">
              <h4
                id="pages-nav-heading"
                className="px-3 mb-2 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider"
              >
                Pages
              </h4>
              <ul aria-labelledby="pages-nav-heading" className="space-y-0.5">
                {pages.slice(0, 10).map((page) => (
                  <li key={page.slug}>
                    <Link
                      to={`/pages/${page.slug}`}
                      aria-current={location.pathname === `/pages/${page.slug}` ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-ring/30 focus:ring-offset-1 focus:ring-offset-background',
                        location.pathname === `/pages/${page.slug}`
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      )}
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-105" aria-hidden="true" />
                      <span className="truncate">{page.name}</span>
                    </Link>
                  </li>
                ))}
                {pages.length > 10 && (
                  <li>
                    <Link
                      to="/pages"
                      className="group flex items-center gap-2.5 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                    >
                      <span className="truncate">View all {pages.length} pages…</span>
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </>
        )}
      </ScrollArea>

      {/* Bottom nav */}
      <div className="border-t border-border/50 px-2.5 py-3">
        <nav aria-label="Settings navigation" className="space-y-0.5">
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto mt-2 h-7 w-7 rounded-md hover:bg-accent/40 transition-colors duration-150"
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Expand sidebar"
            aria-expanded={sidebarCollapsed}
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </aside>
  );
}
