/**
 * Build Zod validation schema from form field configurations.
 */

import { z } from 'zod';
import type { FormFieldConfig } from '../types';

/**
 * Build a Zod schema for a single field.
 */
function buildFieldSchema(field: FormFieldConfig): z.ZodTypeAny {
  const { type, required, config } = field;
  let schema: z.ZodTypeAny;

  switch (type) {
    case 'email':
      schema = z.string().email('Please enter a valid email address');
      break;

    case 'number':
      schema = z.coerce.number();
      if (config?.min !== undefined) {
        schema = (schema as z.ZodNumber).min(config.min, `Must be at least ${config.min}`);
      }
      if (config?.max !== undefined) {
        schema = (schema as z.ZodNumber).max(config.max, `Must be at most ${config.max}`);
      }
      break;

    case 'checkbox':
      schema = z.boolean();
      break;

    case 'date':
      schema = z
        .string()
        .refine((val) => !val || !Number.isNaN(Date.parse(val)), 'Please enter a valid date');
      break;

    case 'file':
      // File validation is handled separately
      schema = z.any();
      break;

    case 'select':
    case 'radio':
      if (config?.options && config.options.length > 0) {
        const values = config.options.map((o) => o.value);
        schema = z.enum(values as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;

    default:
      schema = z.string();
      if (config?.minLength !== undefined) {
        schema = (schema as z.ZodString).min(
          config.minLength,
          `Must be at least ${config.minLength} characters`
        );
      }
      if (config?.maxLength !== undefined) {
        schema = (schema as z.ZodString).max(
          config.maxLength,
          `Must be at most ${config.maxLength} characters`
        );
      }
      if (config?.pattern) {
        try {
          const regex = new RegExp(config.pattern);
          schema = (schema as z.ZodString).regex(regex, 'Invalid format');
        } catch {
          // Invalid regex, skip pattern validation
        }
      }
      break;
  }

  // Make optional if not required
  if (!required) {
    schema = schema.optional();
    // For strings, also allow empty strings
    if (type === 'text' || type === 'textarea' || type === 'email') {
      schema = z.union([schema, z.literal('')]);
    }
  }

  return schema;
}

/**
 * Build a complete Zod schema from form fields.
 */
export function buildFormSchema(
  fields: FormFieldConfig[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    shape[field.name] = buildFieldSchema(field);
  }

  return z.object(shape);
}

/**
 * Validate form data against fields.
 */
export function validateFormData(
  fields: FormFieldConfig[],
  data: Record<string, unknown>
): { success: boolean; errors: Record<string, string> } {
  const schema = buildFormSchema(fields);
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, errors: {} };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { success: false, errors };
}
