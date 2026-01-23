import { Input } from '@/components/ui/input';
import type { FieldRendererProps } from './FieldRenderer';

export function DateField({ field, value, onChange, disabled }: FieldRendererProps) {
  const stringValue = String(value ?? '');

  // Format value for input type
  let inputValue = stringValue;
  let inputType = 'date';

  if (field.type === 'datetime') {
    inputType = 'datetime-local';
    // Convert ISO string to datetime-local format
    if (stringValue?.includes('T')) {
      inputValue = stringValue.slice(0, 16); // Remove seconds and timezone
    }
  } else if (field.type === 'time') {
    inputType = 'time';
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Convert datetime-local to ISO format
    if (field.type === 'datetime' && newValue) {
      newValue = new Date(newValue).toISOString();
    }

    onChange(newValue);
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
