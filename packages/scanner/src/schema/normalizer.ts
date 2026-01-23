/**
 * Schema normalization utilities.
 */

import {
  type FieldSchema,
  type PageSchema,
  type ProjectSchema,
  type SectionSchema,
  formatLabel,
  parsePath,
  sortPaths,
} from '@reverso/core';

/**
 * Normalize field paths to ensure consistency.
 */
export function normalizeFieldPath(path: string): string {
  // Trim whitespace
  let normalized = path.trim();

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  // Replace spaces and special characters with underscores
  normalized = normalized.replace(/[^a-z0-9.$_-]/g, '_');

  // Remove consecutive dots or underscores
  normalized = normalized.replace(/\.+/g, '.').replace(/_+/g, '_');

  // Remove leading/trailing dots or underscores
  normalized = normalized.replace(/^[._]+|[._]+$/g, '');

  return normalized;
}

/**
 * Normalize all field paths in a list.
 */
export function normalizeFields(fields: FieldSchema[]): FieldSchema[] {
  return fields.map((field) => ({
    ...field,
    path: normalizeFieldPath(field.path),
  }));
}

/**
 * Sort fields within each section by path.
 */
export function sortSectionFields(section: SectionSchema): SectionSchema {
  return {
    ...section,
    fields: [...section.fields].sort((a, b) => a.path.localeCompare(b.path)),
  };
}

/**
 * Sort sections within a page by slug.
 */
export function sortPageSections(page: PageSchema): PageSchema {
  return {
    ...page,
    sections: [...page.sections]
      .map(sortSectionFields)
      .sort((a, b) => a.slug.localeCompare(b.slug)),
  };
}

/**
 * Sort pages within a schema by slug.
 */
export function sortSchemaPages(schema: ProjectSchema): ProjectSchema {
  return {
    ...schema,
    pages: [...schema.pages].map(sortPageSections).sort((a, b) => a.slug.localeCompare(b.slug)),
  };
}

/**
 * Ensure all fields have labels (generate from path if missing).
 */
export function ensureLabels(fields: FieldSchema[]): FieldSchema[] {
  return fields.map((field) => {
    if (field.label) {
      return field;
    }

    const parsed = parsePath(field.path);
    const fieldName = parsed.repeaterField ?? parsed.field;

    return {
      ...field,
      label: formatLabel(fieldName),
    };
  });
}

/**
 * Remove duplicate fields (same path), keeping the first occurrence.
 */
export function deduplicateFields(fields: FieldSchema[]): FieldSchema[] {
  const seen = new Set<string>();
  const unique: FieldSchema[] = [];

  for (const field of fields) {
    if (!seen.has(field.path)) {
      seen.add(field.path);
      unique.push(field);
    }
  }

  return unique;
}

/**
 * Merge fields with the same path (combine attributes).
 */
export function mergeFields(fields: FieldSchema[]): FieldSchema[] {
  const merged = new Map<string, FieldSchema>();

  for (const field of fields) {
    const existing = merged.get(field.path);

    if (!existing) {
      merged.set(field.path, { ...field });
    } else {
      // Merge attributes, preferring new values over existing
      merged.set(field.path, {
        ...existing,
        ...field,
        // Keep the original file/line info
        file: existing.file,
        line: existing.line,
        column: existing.column,
      });
    }
  }

  return Array.from(merged.values());
}

/**
 * Reorder sections within a page according to a predefined order.
 */
export function reorderSections(page: PageSchema, order: string[]): PageSchema {
  const orderMap = new Map(order.map((slug, index) => [slug, index]));

  return {
    ...page,
    sections: [...page.sections].sort((a, b) => {
      const orderA = orderMap.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
      const orderB = orderMap.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    }),
  };
}

/**
 * Validate schema structure and return any issues.
 */
export function validateSchemaStructure(schema: ProjectSchema): string[] {
  const issues: string[] = [];

  for (const page of schema.pages) {
    if (!page.slug) {
      issues.push('Page missing slug');
    }

    for (const section of page.sections) {
      if (!section.slug) {
        issues.push(`Section in page "${page.slug}" missing slug`);
      }

      for (const field of section.fields) {
        if (!field.path) {
          issues.push(`Field in "${page.slug}.${section.slug}" missing path`);
        }

        if (!field.type) {
          issues.push(`Field "${field.path}" missing type`);
        }

        // Validate path structure
        try {
          const parsed = parsePath(field.path);
          if (parsed.page !== page.slug) {
            issues.push(
              `Field "${field.path}" has page "${parsed.page}" but is in page "${page.slug}"`
            );
          }
          if (parsed.section !== section.slug) {
            issues.push(
              `Field "${field.path}" has section "${parsed.section}" but is in section "${section.slug}"`
            );
          }
        } catch (error) {
          issues.push(
            `Field "${field.path}" has invalid path: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }
  }

  return issues;
}
