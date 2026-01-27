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
import { Bell, LogOut, Menu, Search, Settings, User } from 'lucide-react';
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

  // Get user initials for avatar fallback
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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
        aria-expanded={!sidebarCollapsed}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      {/* Desktop collapse button */}
      {sidebarCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          onClick={toggleSidebar}
          aria-label="Expand sidebar"
          aria-expanded={false}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      )}

      {/* Search */}
      <form className="flex-1" role="search" aria-label="Site search" onSubmit={(e) => e.preventDefault()}>
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search pages, content..."
            aria-label="Search pages and content"
            className="pl-8 w-full md:w-[300px] lg:w-[400px]"
          />
        </div>
      </form>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="View notifications (1 unread)"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {/* Notification dot */}
          <span
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"
            aria-hidden="true"
          />
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full"
              aria-label={`User menu for ${user?.name || user?.email || 'User'}`}
              data-testid="user-menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.image || undefined} alt="" />
                <AvatarFallback aria-hidden="true">
                  {user ? getInitials(user.name, user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" aria-hidden="true" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
