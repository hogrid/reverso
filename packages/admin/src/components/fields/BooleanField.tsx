import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatLabel } from '@/lib/utils';
import type { FieldRendererProps } from './FieldRenderer';

export function BooleanField({ field, value, onChange, disabled }: FieldRendererProps) {
  const boolValue = Boolean(value);
  const label = field.label || formatLabel(field.path);

  // Checkbox style
  if (field.type === 'checkbox') {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          id={field.path}
          checked={boolValue}
          onCheckedChange={(checked) => onChange(checked === true)}
          disabled={disabled}
        />
        <Label htmlFor={field.path} className="text-sm font-normal">
          {label}
        </Label>
      </div>
    );
  }

  // Switch style (default for boolean)
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={field.path} className="text-sm font-normal">
        {label}
      </Label>
      <Switch
        id={field.path}
        checked={boolValue}
        onCheckedChange={(checked) => onChange(checked)}
        disabled={disabled}
      />
    </div>
  );
}
