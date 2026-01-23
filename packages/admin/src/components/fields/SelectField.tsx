import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, parseOptions } from '@/lib/utils';
import type { FieldRendererProps } from './FieldRenderer';

export function SelectField({ field, value, onChange, disabled }: FieldRendererProps) {
  const options = parseOptions(field.options || '');
  const stringValue = String(value ?? '');

  // Radio group style
  if (field.type === 'radio') {
    return (
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <input
              type="radio"
              id={`${field.path}-${option.value}`}
              name={field.path}
              value={option.value}
              checked={stringValue === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className={cn(
                'h-4 w-4 border-gray-300 text-primary focus:ring-primary',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            />
            <Label htmlFor={`${field.path}-${option.value}`} className="text-sm font-normal">
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    );
  }

  // Select dropdown (default)
  return (
    <Select value={stringValue} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={field.path}>
        <SelectValue placeholder={field.placeholder || 'Select an option'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
