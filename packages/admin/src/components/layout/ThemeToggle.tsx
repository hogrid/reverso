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
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Change theme, current: ${themeLabels[theme]}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(themeLabels) as Theme[]).map((t) => {
          const ItemIcon = themeIcons[t];
          const isSelected = theme === t;
          return (
            <DropdownMenuItem
              key={t}
              onClick={() => setTheme(t)}
              className={isSelected ? 'bg-accent' : ''}
            >
              <ItemIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              {themeLabels[t]}
              {isSelected && <span className="sr-only">(current)</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
