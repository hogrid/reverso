import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import type { FieldRendererProps } from './FieldRenderer';

export function NumberField({ field, value, onChange, disabled }: FieldRendererProps) {
  const numValue = typeof value === 'number' ? value : Number(value) || 0;

  // Range slider
  if (field.type === 'range') {
    return (
      <div className="flex items-center gap-4">
        <Slider
          id={field.path}
          value={[numValue]}
          onValueChange={([v]) => onChange(v)}
          min={field.min ?? 0}
          max={field.max ?? 100}
          step={field.step ?? 1}
          disabled={disabled}
          className="flex-1"
        />
        <span className="text-sm font-medium w-12 text-right">{numValue}</span>
      </div>
    );
  }

  // Number input
  return (
    <Input
      id={field.path}
      type="number"
      value={numValue}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={field.placeholder}
      disabled={disabled}
      required={field.required}
      min={field.min}
      max={field.max}
      step={field.step}
    />
  );
}
