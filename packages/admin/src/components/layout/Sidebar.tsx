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
  FileText,
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
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!sidebarCollapsed && <span>{item.title}</span>}
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
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Pages submenu */}
        {!sidebarCollapsed && pages && pages.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-1">
              <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Content Pages
              </h4>
              {pages.slice(0, 10).map((page) => (
                <Link
                  key={page.slug}
                  to={`/pages/${page.slug}`}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    location.pathname === `/pages/${page.slug}`
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{page.name}</span>
                </Link>
              ))}
              {pages.length > 10 && (
                <Link
                  to="/pages"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-accent-foreground"
                >
                  View all {pages.length} pages...
                </Link>
              )}
            </div>
          </>
        )}
      </ScrollArea>

      {/* Bottom nav */}
      <div className="mt-auto border-t px-3 py-4">
        <nav className="flex flex-col gap-1">
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
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}
