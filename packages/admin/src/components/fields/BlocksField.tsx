import { BlockEditor } from '@reverso/blocks';
import type { FieldRendererProps } from './FieldRenderer';

export function BlocksField({ field, value, onChange, disabled }: FieldRendererProps) {
  const htmlValue = typeof value === 'string' ? value : '';

  return (
    <BlockEditor
      content={htmlValue}
      onChange={(html) => onChange(html)}
      placeholder={field.placeholder || 'Start writing...'}
      disabled={disabled}
      minHeight={field.rows ? field.rows * 24 : 200}
      showWordCount
    />
  );
}
