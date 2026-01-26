import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

// Validate hex color format
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Normalize partial hex input (add # if missing, etc.)
function normalizeHexInput(input: string): string {
  let normalized = input.trim();
  if (!normalized.startsWith('#')) {
    normalized = `#${normalized}`;
  }
  return normalized.toUpperCase();
}

// Common color presets
const colorPresets = [
  '#000000',
  '#FFFFFF',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#14B8A6',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
];

export function ColorField({ field, value, onChange, disabled }: FieldRendererProps) {
  const colorValue = String(value ?? '#000000');
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(colorValue);

  // Handle hex input changes - only update parent if valid
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      // Only call onChange if it's a valid hex color
      const normalized = normalizeHexInput(newValue);
      if (isValidHexColor(normalized)) {
        onChange(normalized);
      }
    },
    [onChange]
  );

  // Handle blur - normalize the input value
  const handleInputBlur = useCallback(() => {
    const normalized = normalizeHexInput(inputValue);
    if (isValidHexColor(normalized)) {
      setInputValue(normalized);
      onChange(normalized);
    } else {
      // Reset to the last valid value
      setInputValue(colorValue);
    }
  }, [inputValue, colorValue, onChange]);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-10 h-10 p-0 border-2"
            style={{ backgroundColor: colorValue }}
          >
            <span className="sr-only">Pick a color</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-3">
            {/* Native color picker */}
            <div>
              <input
                type="color"
                value={colorValue}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
            </div>

            {/* Color presets */}
            <div className="grid grid-cols-5 gap-2">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded border-2 transition-all',
                    colorValue === color
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-transparent hover:border-gray-300'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color);
                    setOpen(false);
                  }}
                >
                  <span className="sr-only">{color}</span>
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Hex input */}
      <Input
        id={field.path}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder="#000000"
        disabled={disabled}
        className="flex-1 font-mono uppercase"
        maxLength={7}
      />
    </div>
  );
}
