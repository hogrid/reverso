/**
 * Schema generator that converts detected fields into a structured schema.
 */

import {
  DEFAULT_FIELD_TYPE,
  type DetectedField,
  type FieldSchema,
  type FieldType,
  type PageSchema,
  type ProjectSchema,
  SCHEMA_VERSION,
  type SchemaGeneratorOptions,
  type SectionSchema,
  formatLabel,
  groupPathsBySection,
  isValidFieldType,
  parsePath,
} from '@reverso/core';

/**
 * Generate a complete project schema from detected fields.
 */
export function generateSchema(
  fields: DetectedField[],
  options: SchemaGeneratorOptions = {}
): ProjectSchema {
  const startTime = performance.now();

  // Filter out fields with invalid paths (less than 3 parts) and collect warnings
  const validFields: DetectedField[] = [];
  const invalidFields: DetectedField[] = [];
  for (const f of fields) {
    const parts = f.path.split('.');
    if (parts.length >= 3 && parts.every((p) => p.length > 0)) {
      validFields.push(f);
    } else {
      invalidFields.push(f);
    }
  }

  if (invalidFields.length > 0) {
    console.warn(`\n⚠ ${invalidFields.length} marker(s) skipped (invalid path format):`);
    for (const f of invalidFields) {
      console.warn(`  "${f.path}" in ${f.file}:${f.line} — must be page.section.field (3+ parts)`);
    }
    console.warn('');
  }

  // Group valid fields by page and section
  const grouped = groupPathsBySection(validFields.map((f) => f.path));

  // Build pages
  const pages: PageSchema[] = [];

  for (const [pageSlug, sections] of grouped) {
    const pageSections: SectionSchema[] = [];
    let order = 0;

    for (const [sectionSlug, paths] of sections) {
      // Get fields for this section
      const sectionFields = validFields.filter((f) => {
        const parsed = parsePath(f.path);
        return parsed.page === pageSlug && parsed.section === sectionSlug;
      });

      // Convert to FieldSchema
      const fieldSchemas = sectionFields.map((f) => convertToFieldSchema(f, options));

      // Check if this is a repeater section
      const isRepeater = paths.some((p) => p.includes('.$'));

      const section: SectionSchema = {
        slug: sectionSlug,
        name: formatLabel(sectionSlug),
        fields: options.sort
          ? fieldSchemas.sort((a, b) => a.path.localeCompare(b.path))
          : fieldSchemas,
        isRepeater,
        order: order++,
      };

      pageSections.push(section);
    }

    // Sort sections if requested
    const sortedSections = options.sort
      ? pageSections.sort((a, b) => a.slug.localeCompare(b.slug))
      : pageSections;

    const page: PageSchema = {
      slug: pageSlug,
      name: formatLabel(pageSlug),
      sections: sortedSections,
      fieldCount: sortedSections.reduce((sum, s) => sum + s.fields.length, 0),
      sourceFiles: [
        ...new Set(validFields.filter((f) => parsePath(f.path).page === pageSlug).map((f) => f.file)),
      ],
    };

    pages.push(page);
  }

  // Sort pages if requested
  const sortedPages = options.sort ? pages.sort((a, b) => a.slug.localeCompare(b.slug)) : pages;

  const duration = performance.now() - startTime;

  return {
    version: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    pages: sortedPages,
    pageCount: sortedPages.length,
    totalFields: validFields.length,
    meta: {
      srcDir: '',
      filesScanned: 0,
      filesWithMarkers: 0,
      scanDuration: duration,
    },
  };
}

/**
 * Convert a DetectedField to a FieldSchema.
 */
export function convertToFieldSchema(
  field: DetectedField,
  options: SchemaGeneratorOptions = {}
): FieldSchema {
  const defaultType = options.defaultFieldType ?? DEFAULT_FIELD_TYPE;

  // Get the type from attributes, validate it
  let fieldType: FieldType = defaultType as FieldType;
  if (field.attributes.type) {
    const typeAttr = field.attributes.type;
    if (isValidFieldType(typeAttr)) {
      fieldType = typeAttr;
    }
  }

  const schema: FieldSchema = {
    path: field.path,
    type: fieldType,
    file: options.includeSourceInfo !== false ? field.file : field.file,
    line: field.line,
    column: field.column,
    element: field.element,
  };

  // Add optional attributes
  if (field.attributes.label) {
    schema.label = field.attributes.label;
  } else {
    // Generate label from path
    const parsed = parsePath(field.path);
    const fieldName = parsed.repeaterField ?? parsed.field;
    schema.label = formatLabel(fieldName);
  }

  if (field.attributes.placeholder) {
    schema.placeholder = field.attributes.placeholder;
  }

  if (field.attributes.required !== undefined) {
    schema.required = field.attributes.required === 'true' || field.attributes.required === '';
  }

  if (field.attributes.validation) {
    schema.validation = field.attributes.validation;
  }

  if (field.attributes.options) {
    schema.options = field.attributes.options;
  }

  if (field.attributes.condition) {
    schema.condition = field.attributes.condition;
  }

  if (field.attributes.help) {
    schema.help = field.attributes.help;
  }

  if (field.attributes.min !== undefined) {
    const num = Number(field.attributes.min);
    if (!Number.isNaN(num)) {
      schema.min = num;
    }
  }

  if (field.attributes.max !== undefined) {
    const num = Number(field.attributes.max);
    if (!Number.isNaN(num)) {
      schema.max = num;
    }
  }

  if (field.attributes.step !== undefined) {
    const num = Number(field.attributes.step);
    if (!Number.isNaN(num)) {
      schema.step = num;
    }
  }

  if (field.attributes.accept) {
    schema.accept = field.attributes.accept;
  }

  if (field.attributes.multiple !== undefined) {
    schema.multiple = field.attributes.multiple === 'true' || field.attributes.multiple === '';
  }

  if (field.attributes.rows !== undefined) {
    const num = Number(field.attributes.rows);
    if (!Number.isNaN(num)) {
      schema.rows = num;
    }
  }

  if (field.attributes.width !== undefined) {
    const num = Number(field.attributes.width);
    if (!Number.isNaN(num) && num >= 1 && num <= 12) {
      schema.width = num;
    }
  }

  if (field.attributes.readonly !== undefined) {
    schema.readonly = field.attributes.readonly === 'true' || field.attributes.readonly === '';
  }

  if (field.attributes.hidden !== undefined) {
    schema.hidden = field.attributes.hidden === 'true' || field.attributes.hidden === '';
  }

  // Include default content from JSX
  if (options.includeDefaults !== false && field.textContent) {
    schema.defaultContent = field.textContent;
  }

  return schema;
}

/**
 * Update schema metadata with scan information.
 */
export function updateSchemaMeta(
  schema: ProjectSchema,
  meta: {
    srcDir: string;
    filesScanned: number;
    filesWithMarkers: number;
    scanDuration: number;
  }
): ProjectSchema {
  return {
    ...schema,
    meta,
  };
}
