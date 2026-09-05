import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import {
  ExternalLink,
  FileText,
  FormInput,
  Image,
  LayoutDashboard,
  Settings,
  LogOut,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    return name[0]?.toUpperCase() ?? '?';
  }
  return email[0]?.toUpperCase() ?? '?';
}

export function Sidebar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      aria-label="Main navigation"
      data-testid="sidebar"
      className="hidden md:flex flex-col items-center w-[72px] bg-[hsl(var(--sidebar))] py-6"
    >
      {/* Logo Mark */}
      <Link
        to="/"
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-[hsl(var(--brand))] mb-8 transition-opacity hover:opacity-90"
        aria-label="Reverso home"
      >
        <span className="text-white font-display text-lg font-bold">R</span>
      </Link>

      {/* Main Navigation */}
      <nav aria-label="Primary navigation" className="flex flex-col items-center gap-2 flex-1">
        {mainNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  to={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-white/20',
                    active
                      ? 'bg-[hsl(var(--sidebar-accent))]'
                      : 'hover:bg-[hsl(var(--sidebar-accent))]'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px]',
                      active ? 'text-white' : 'text-[hsl(var(--subtle-foreground))]'
                    )}
                    strokeWidth={active ? 2 : 1.5}
                    aria-hidden="true"
                  />
                  <span className="sr-only">{item.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-sans text-xs px-2 py-1">
                {item.title}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/settings"
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-white/20',
                'hover:bg-[hsl(var(--sidebar-accent))]'
              )}
            >
              <Settings
                className="h-[18px] w-[18px] text-[hsl(var(--subtle-foreground))]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="sr-only">Settings</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-sans text-xs px-2 py-1">
            Settings
          </TooltipContent>
        </Tooltip>

        {/* Account menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              data-testid="account-menu"
              className="w-10 h-10 rounded-full bg-[hsl(var(--sidebar-accent))] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <span className="text-xs font-medium text-[hsl(var(--subtle-foreground))]">
                {user ? getInitials(user.name, user.email) : '?'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm font-medium truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
            >
              <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
