import { Input } from '@/components/ui/input';
import type { FieldRendererProps } from './FieldRenderer';

export function TextField({ field, value, onChange, disabled }: FieldRendererProps) {
  const inputType =
    field.type === 'email'
      ? 'email'
      : field.type === 'url'
        ? 'url'
        : field.type === 'phone'
          ? 'tel'
          : 'text';

  return (
    <Input
      id={field.path}
      type={inputType}
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled}
      required={field.required}
      maxLength={field.max}
      minLength={field.min}
    />
  );
}
