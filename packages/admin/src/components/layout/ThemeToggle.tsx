import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Theme, useUIStore } from '@/stores/ui';
import { Monitor, Moon, Sun, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
          className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground transition-colors duration-150"
          aria-label={`Change theme, current: ${themeLabels[theme]}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 p-1">
        {(Object.keys(themeLabels) as Theme[]).map((t) => {
          const ItemIcon = themeIcons[t];
          const isSelected = theme === t;
          return (
            <DropdownMenuItem
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] cursor-pointer',
                'focus:bg-accent focus:text-accent-foreground',
                isSelected && 'bg-accent'
              )}
            >
              <ItemIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{themeLabels[t]}</span>
              {isSelected && (
                <Check className="h-3.5 w-3.5 ml-auto text-foreground" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
