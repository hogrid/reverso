import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Theme, useUIStore } from '@/stores/ui';
import { Monitor, Moon, Sun } from 'lucide-react';

const themeIcons: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeLabels: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();
  const Icon = themeIcons[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Icon className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(themeLabels) as Theme[]).map((t) => {
          const ItemIcon = themeIcons[t];
          return (
            <DropdownMenuItem
              key={t}
              onClick={() => setTheme(t)}
              className={theme === t ? 'bg-accent' : ''}
            >
              <ItemIcon className="mr-2 h-4 w-4" />
              {themeLabels[t]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
