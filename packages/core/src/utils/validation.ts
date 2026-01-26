/**
 * Validation schemas and utilities using Zod.
 */

import { z } from 'zod';
import { PATH_SEPARATOR, REPEATER_PLACEHOLDER, VALID_ATTRIBUTES } from '../constants.js';
import type { FieldType } from '../types/fields.js';

/**
 * All valid field types.
 */
export const FIELD_TYPES: FieldType[] = [
  'text',
  'textarea',
  'number',
  'range',
  'email',
  'url',
  'phone',
  'wysiwyg',
  'markdown',
  'code',
  'blocks',
  'select',
  'multiselect',
  'checkbox',
  'checkboxgroup',
  'radio',
  'boolean',
  'image',
  'file',
  'gallery',
  'video',
  'audio',
  'oembed',
  'date',
  'datetime',
  'time',
  'relation',
  'taxonomy',
  'link',
  'pagelink',
  'user',
  'color',
  'map',
  'repeater',
  'group',
  'flexible',
  'message',
  'tab',
  'accordion',
  'buttongroup',
];

/**
 * Zod schema for field type validation.
 */
export const fieldTypeSchema = z.enum(FIELD_TYPES as [FieldType, ...FieldType[]]);

/**
 * Zod schema for field path validation.
 */
export const fieldPathSchema = z.string().refine(
  (path) => {
    const parts = path.split(PATH_SEPARATOR);
    if (parts.length < 3) return false;
    // All parts must be non-empty (except $ for repeaters)
    return parts.every((part) => part === REPEATER_PLACEHOLDER || part.length > 0);
  },
  {
    message: 'Path must have at least 3 parts (page.section.field) and no empty parts',
  }
);

/**
 * Zod schema for field attributes validation.
 */
export const fieldAttributesSchema = z.object({
  type: fieldTypeSchema.optional(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.coerce.boolean().optional(),
  validation: z.string().optional(),
  options: z.string().optional(),
  condition: z.string().optional(),
  default: z.string().optional(),
  help: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  step: z.coerce.number().optional(),
  accept: z.string().optional(),
  multiple: z.coerce.boolean().optional(),
  rows: z.coerce.number().optional(),
  width: z.coerce.number().min(1).max(12).optional(),
  readonly: z.coerce.boolean().optional(),
  hidden: z.coerce.boolean().optional(),
});

/**
 * Zod schema for a complete field schema.
 */
export const fieldSchema = fieldAttributesSchema.extend({
  path: fieldPathSchema,
  type: fieldTypeSchema,
  file: z.string(),
  line: z.number().positive(),
  column: z.number().nonnegative(),
  element: z.string().optional(),
  defaultContent: z.string().optional(),
});

/**
 * Validate a field type string.
 */
export function isValidFieldType(type: string): type is FieldType {
  return FIELD_TYPES.includes(type as FieldType);
}

/**
 * Validate a field path string.
 */
export function isValidFieldPath(path: string): boolean {
  return fieldPathSchema.safeParse(path).success;
}

/**
 * Validate field attributes.
 */
export function validateFieldAttributes(attrs: Record<string, unknown>): {
  success: boolean;
  data?: z.infer<typeof fieldAttributesSchema>;
  errors?: string[];
} {
  const result = fieldAttributesSchema.safeParse(attrs);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Validate a complete field schema.
 */
export function validateFieldSchema(schema: unknown): {
  success: boolean;
  data?: z.infer<typeof fieldSchema>;
  errors?: string[];
} {
  const result = fieldSchema.safeParse(schema);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Check if an attribute name is a valid data-reverso-* attribute.
 */
export function isValidAttribute(name: string): boolean {
  return VALID_ATTRIBUTES.includes(name as (typeof VALID_ATTRIBUTES)[number]);
}

/**
 * Extract the attribute name from a data-reverso-* attribute.
 *
 * @example
 * ```ts
 * extractAttributeName('data-reverso-type') // 'type'
 * extractAttributeName('data-reverso') // null
 * extractAttributeName('data-other') // null
 * ```
 */
export function extractAttributeName(attr: string): string | null {
  if (attr === 'data-reverso') {
    return null; // This is the path attribute, not a named attribute
  }
  if (attr.startsWith('data-reverso-')) {
    return attr.slice('data-reverso-'.length);
  }
  return null;
}

/**
 * Parse options string into array of option objects.
 *
 * @example
 * ```ts
 * parseOptions('red,green,blue')
 * // [{ label: 'Red', value: 'red' }, { label: 'Green', value: 'green' }, { label: 'Blue', value: 'blue' }]
 *
 * parseOptions('[{"label":"Red","value":"#f00"}]')
 * // [{ label: 'Red', value: '#f00' }]
 * ```
 */
export function parseOptions(optionsStr: string): Array<{ label: string; value: string }> {
  // Handle empty/whitespace-only strings
  const trimmed = optionsStr.trim();
  if (!trimmed) {
    return [];
  }

  // Try JSON first
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown[];

      return parsed
        .filter((opt) => opt != null) // Filter out null/undefined
        .map((opt) => {
          if (typeof opt === 'string') {
            const value = opt.trim();
            return { label: formatOptionLabel(value), value };
          }
          if (typeof opt === 'object' && opt !== null && 'value' in opt) {
            const o = opt as { label?: string; value: unknown };
            const value = String(o.value ?? '').trim();
            const label =
              typeof o.label === 'string' && o.label.trim()
                ? o.label.trim()
                : formatOptionLabel(value);
            return { label, value };
          }
          // For numbers and other primitives
          const value = String(opt).trim();
          return { label: formatOptionLabel(value), value };
        })
        .filter((opt) => opt.value !== ''); // Filter out empty values
    } catch {
      // Fall through to comma-separated
    }
  }

  // Comma-separated values
  return trimmed
    .split(',')
    .map((opt) => opt.trim())
    .filter((opt) => opt !== '') // Filter out empty values
    .map((value) => ({
      label: formatOptionLabel(value),
      value,
    }));
}

/**
 * Format an option value as a label.
 */
function formatOptionLabel(value: string): string {
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Parse a condition string (basic format: field=value or field!=value).
 */
export function parseCondition(conditionStr: string): {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=';
  value: string;
} | null {
  const operators = ['!=', '>=', '<=', '=', '>', '<'] as const;

  for (const op of operators) {
    const index = conditionStr.indexOf(op);
    if (index !== -1) {
      return {
        field: conditionStr.slice(0, index).trim(),
        operator: op,
        value: conditionStr.slice(index + op.length).trim(),
      };
    }
  }

  return null;
}
