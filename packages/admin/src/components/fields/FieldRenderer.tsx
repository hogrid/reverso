import { Label } from '@/components/ui/label';
import { cn, formatLabel } from '@/lib/utils';
import type { ContentValue, FieldSchema, FieldType } from '@reverso/core';
import { BlocksField } from './BlocksField';
import { BooleanField } from './BooleanField';
import { CodeField } from './CodeField';
import { ColorField } from './ColorField';
import { DateField } from './DateField';
import { FileField } from './FileField';
import { FlexibleField } from './FlexibleField';
import { GalleryField } from './GalleryField';
import { ImageField } from './ImageField';
import { MapField } from './MapField';
import { MarkdownField } from './MarkdownField';
import { MultiSelectField } from './MultiSelectField';
import { NumberField } from './NumberField';
import { RelationField } from './RelationField';
import { RepeaterField } from './RepeaterField';
import { SelectField } from './SelectField';
import { TextField } from './TextField';
import { TextareaField } from './TextareaField';
import { WysiwygField } from './WysiwygField';

export interface FieldRendererProps {
  field: FieldSchema;
  value: ContentValue | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
  className?: string;
  disabled?: boolean;
}

// Map field types to their renderers
const fieldRenderers: Partial<Record<FieldType, React.ComponentType<FieldRendererProps>>> = {
  // Text inputs
  text: TextField,
  email: TextField,
  url: TextField,
  phone: TextField,
  textarea: TextareaField,

  // Number inputs
  number: NumberField,
  range: NumberField,

  // Boolean inputs
  boolean: BooleanField,
  checkbox: BooleanField,

  // Select inputs
  select: SelectField,
  radio: SelectField,
  multiselect: MultiSelectField,
  checkboxgroup: MultiSelectField,

  // Date/Time inputs
  date: DateField,
  datetime: DateField,
  time: DateField,

  // Color
  color: ColorField,

  // Media
  image: ImageField,
  file: FileField,
  gallery: GalleryField,
  video: FileField, // Reuse FileField for now
  audio: FileField, // Reuse FileField for now

  // Rich text
  wysiwyg: WysiwygField,
  markdown: MarkdownField,
  code: CodeField,
  blocks: BlocksField,

  // Complex
  repeater: RepeaterField,
  flexible: FlexibleField,

  // Relationships
  relation: RelationField,
  taxonomy: RelationField, // Similar to relation
  pagelink: RelationField, // Similar to relation
  link: TextField, // URL input
  user: RelationField, // Similar to relation

  // Advanced
  map: MapField,
  group: RepeaterField, // Similar structure

  // UI helpers (render as message)
  message: TextField, // Readonly text display
};

// Pre-defined width classes for Tailwind JIT compatibility
const widthClasses: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};

export function FieldRenderer({ field, value, onChange, className, disabled }: FieldRendererProps) {
  const fieldType = field.type || 'text';
  const Renderer = fieldRenderers[fieldType] || TextField;

  // Calculate label
  const label = field.label || formatLabel(field.path);

  // Calculate width class based on field.width (1-12 grid)
  const width = field.width ? Math.min(12, Math.max(1, field.width)) : 12;
  const widthClass = widthClasses[width] || 'col-span-12';

  // Skip hidden fields
  if (field.hidden) {
    return null;
  }

  return (
    <div className={cn('space-y-2', widthClass, className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={field.path}>
          {label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>

      <Renderer
        field={field}
        value={value}
        onChange={onChange}
        disabled={disabled || field.readonly}
      />

      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
    </div>
  );
}
