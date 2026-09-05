import { Input } from '@/components/ui/input';
import type { FieldRendererProps } from './FieldRenderer';

/**
 * Normalize a stored datetime for a `datetime-local` input. Plain local
 * strings pass through; legacy UTC ISO strings (with `Z`/offset) are shown in
 * the browser's local time.
 */
function toDatetimeLocal(stored: string): string {
  if (!stored) return '';
  if (/(Z|[+-]\d{2}:\d{2})$/.test(stored)) {
    const d = new Date(stored);
    if (!Number.isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }
  return stored.slice(0, 16);
}

export function DateField({ field, value, onChange, disabled }: FieldRendererProps) {
  const stringValue = String(value ?? '');

  // Format value for input type
  let inputValue = stringValue;
  let inputType = 'date';

  if (field.type === 'datetime') {
    inputType = 'datetime-local';
    inputValue = toDatetimeLocal(stringValue);
  } else if (field.type === 'time') {
    inputType = 'time';
  }

  // Values are stored exactly as typed (`YYYY-MM-DD`, `YYYY-MM-DDTHH:mm`,
  // `HH:mm`), without timezone conversion, so what the editor sees is what
  // the frontend renders and re-saving never shifts the time.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <Input
      id={field.path}
      type={inputType}
      value={inputValue}
      onChange={handleChange}
      disabled={disabled}
      required={field.required}
    />
  );
}
