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
  /** Item field schemas for repeater/group containers (paths with `$`). */
  subFields?: FieldSchema[];
  /**
   * Renderer injected into container fields (repeater/group) so they can
   * render their sub-fields without importing FieldRenderer back
   * (avoids a module cycle).
   */
  renderField?: React.ComponentType<FieldRendererProps>;
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
  link: TextField, // URL input (stored as a string)
  user: RelationField, // Similar to relation
  oembed: TextField, // Embed URL (stored as a string)
  buttongroup: SelectField, // Single choice, rendered as radios below

  // Advanced
  map: MapField,

  // Structural markers carry no value of their own: their children are the
  // fields. Rendered as a notice instead of a broken input.
  group: StructuralNotice,
  tab: StructuralNotice,
  accordion: StructuralNotice,

  // Admin-only message: read-only by definition
  message: MessageNotice,
};

function StructuralNotice({ field }: FieldRendererProps) {
  return (
    <p className="text-xs text-muted-foreground rounded-md border border-dashed px-3 py-2">
      <code>{field.type}</code> groups the fields marked inside it; it has no value to edit.
    </p>
  );
}

function MessageNotice({ field }: FieldRendererProps) {
  return (
    <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
      {field.defaultContent || field.help || field.label || field.path}
    </p>
  );
}

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

export function FieldRenderer({
  field,
  value,
  onChange,
  className,
  disabled,
  subFields,
}: FieldRendererProps) {
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

  // Boolean renderers place the label next to the control themselves.
  const rendersOwnLabel = fieldType === 'boolean' || fieldType === 'checkbox';

  return (
    <div className={cn('space-y-2', widthClass, className)}>
      {!rendersOwnLabel && (
        <div className="flex items-center justify-between">
          <Label htmlFor={field.path}>
            {label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      )}

      <Renderer
        field={field}
        value={value}
        onChange={onChange}
        disabled={disabled || field.readonly}
        subFields={subFields}
        renderField={FieldRenderer}
      />

      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
    </div>
  );
}
