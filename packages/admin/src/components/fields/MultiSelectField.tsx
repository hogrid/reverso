import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, parseOptions } from '@/lib/utils';
import { Check, ChevronDown, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

export function MultiSelectField({ field, value, onChange, disabled }: FieldRendererProps) {
  const [open, setOpen] = useState(false);

  const options = useMemo(() => parseOptions(field.options || ''), [field.options]);
  const selectedValues = useMemo(() => {
    if (Array.isArray(value)) {
      return value as string[];
    }
    if (typeof value === 'string' && value) {
      return value.split(',').map((v) => v.trim());
    }
    return [];
  }, [value]);

  const handleToggle = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newValues);
  };

  const handleRemove = (optionValue: string) => {
    onChange(selectedValues.filter((v) => v !== optionValue));
  };

  const handleClear = () => {
    onChange([]);
  };

  const selectedLabels = selectedValues.map((v) => {
    const option = options.find((o) => o.value === v);
    return option?.label || v;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !selectedValues.length && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {selectedValues.length === 0 ? (
              <span>{field.placeholder || 'Select options...'}</span>
            ) : selectedValues.length <= 2 ? (
              selectedLabels.map((label, idx) => (
                <Badge key={selectedValues[idx]} variant="secondary" className="mr-1">
                  {label}
                  <button
                    type="button"
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(selectedValues[idx]!);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">{selectedValues.length} selected</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {selectedValues.length > 0 && (
              <button
                type="button"
                className="p-1 hover:bg-accent rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={cn(
                    'flex items-center space-x-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent',
                    isSelected && 'bg-accent'
                  )}
                  onClick={() => handleToggle(option.value)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(option.value)}
                  />
                  <span className="flex-1 text-sm">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              );
            })}
            {options.length === 0 && (
              <p className="text-sm text-muted-foreground p-2">No options available</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
