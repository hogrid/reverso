import { Textarea } from '@/components/ui/textarea';
import type { FieldRendererProps } from './FieldRenderer';

export function TextareaField({ field, value, onChange, disabled }: FieldRendererProps) {
  return (
    <Textarea
      id={field.path}
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled}
      required={field.required}
      maxLength={field.max}
      minLength={field.min}
      rows={field.rows ?? 4}
    />
  );
}
