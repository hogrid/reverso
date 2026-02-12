import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { Bell, LogOut, Menu, Search, Settings, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const { toggleSidebar, sidebarCollapsed } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/40 bg-card px-4">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8 rounded-md text-muted-foreground hover:text-foreground transition-colors duration-150"
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
        aria-expanded={!sidebarCollapsed}
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </Button>

      {/* Desktop collapse button */}
      {sidebarCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex h-8 w-8 rounded-md text-muted-foreground hover:text-foreground transition-colors duration-150"
          onClick={toggleSidebar}
          aria-label="Expand sidebar"
          aria-expanded={false}
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}

      <div className="flex-1" />

      {/* Search */}
      <form className="flex-1 max-w-sm hidden sm:block" role="search" aria-label="Site search" onSubmit={(e) => e.preventDefault()}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search..."
            aria-label="Search pages and content"
            className="h-8 pl-9 pr-3 text-[13px] bg-background border-border/60 focus:bg-card transition-colors"
          />
        </div>
      </form>

      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground transition-colors duration-150"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-auto rounded-md px-2 gap-2 text-muted-foreground hover:text-foreground transition-colors duration-150"
              aria-label={`User menu for ${user?.name || user?.email || 'User'}`}
              data-testid="user-menu"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.image || undefined} alt="" />
                <AvatarFallback className="text-[10px] font-medium bg-accent text-muted-foreground" aria-hidden="true">
                  {user ? getInitials(user.name, user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 p-1" align="end" forceMount>
            <DropdownMenuLabel className="font-normal px-2 py-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/40" />
            <DropdownMenuItem className="rounded-md px-2 py-1.5 text-[13px] cursor-pointer focus:bg-accent">
              <User className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-md px-2 py-1.5 text-[13px] cursor-pointer focus:bg-accent">
              <Settings className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/40" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-md px-2 py-1.5 text-[13px] text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
