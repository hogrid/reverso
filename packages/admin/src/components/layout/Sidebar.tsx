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
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {!sidebarCollapsed && <span>{item.title}</span>}
        {sidebarCollapsed && <span className="sr-only">{item.title}</span>}
      </Link>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{item.title}</TooltipContent>
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
        'hidden md:flex flex-col border-r bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!sidebarCollapsed && (
          <Link to="/" className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Reverso</span>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link to="/" className="mx-auto">
            <Layers className="h-6 w-6 text-primary" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', sidebarCollapsed && 'hidden')}
          onClick={() => setSidebarCollapsed(true)}
          aria-label="Collapse sidebar"
          aria-expanded={!sidebarCollapsed}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav aria-label="Primary navigation" className="flex flex-col gap-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Pages submenu */}
        {!sidebarCollapsed && pages && pages.length > 0 && (
          <>
            <Separator className="my-4" />
            <nav aria-label="Content pages" className="space-y-1">
              <h4
                id="pages-nav-heading"
                className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Content Pages
              </h4>
              <ul aria-labelledby="pages-nav-heading" className="space-y-1">
                {pages.slice(0, 10).map((page) => (
                  <li key={page.slug}>
                    <Link
                      to={`/pages/${page.slug}`}
                      aria-current={location.pathname === `/pages/${page.slug}` ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                        location.pathname === `/pages/${page.slug}`
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{page.name}</span>
                    </Link>
                  </li>
                ))}
                {pages.length > 10 && (
                  <li>
                    <Link
                      to="/pages"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      View all {pages.length} pages...
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </>
        )}
      </ScrollArea>

      {/* Bottom nav */}
      <div className="mt-auto border-t px-3 py-4">
        <nav aria-label="Settings navigation" className="flex flex-col gap-1">
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto mt-2 h-8 w-8"
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Expand sidebar"
            aria-expanded={sidebarCollapsed}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </aside>
  );
}
