/**
 * Schema tools for the MCP server.
 */

import type { DrizzleDatabase } from '@reverso/db';
import { getPages, getFields, type Page, type Field } from '@reverso/db';
import type { FieldType } from '@reverso/core';
import { z } from 'zod';
import type { FieldTypeSuggestion } from '../types.js';

export const schemaTools = {
  get_schema: {
    description: 'Get the complete project schema with all pages, sections, and fields',
    inputSchema: z.object({
      pageSlug: z.string().optional().describe('Filter by specific page slug'),
    }),
    handler: async (db: DrizzleDatabase, input: { pageSlug?: string }) => {
      const pages = await getPages(db);

      if (input.pageSlug) {
        const filtered = pages.filter((p: Page) => p.slug === input.pageSlug);
        return { pages: filtered, totalPages: filtered.length };
      }

      return { pages, totalPages: pages.length };
    },
  },

  get_fields: {
    description: 'Get all fields in the schema with their types and configuration',
    inputSchema: z.object({
      type: z.string().optional().describe('Filter by field type (e.g., "text", "image")'),
      pageSlug: z.string().optional().describe('Filter by page slug'),
    }),
    handler: async (db: DrizzleDatabase, input: { type?: string; pageSlug?: string }) => {
      let fields = await getFields(db);

      if (input.type) {
        fields = fields.filter((f: Field) => f.type === input.type);
      }

      if (input.pageSlug) {
        fields = fields.filter((f: Field) => f.path.startsWith(`${input.pageSlug}.`));
      }

      return { fields, totalFields: fields.length };
    },
  },

  suggest_field_type: {
    description: 'Suggest the best field type based on content or context',
    inputSchema: z.object({
      content: z.string().optional().describe('Sample content to analyze'),
      fieldName: z.string().optional().describe('Field name to analyze'),
      context: z.string().optional().describe('Context about the field usage'),
    }),
    handler: async (
      _db: DrizzleDatabase,
      input: { content?: string; fieldName?: string; context?: string }
    ): Promise<FieldTypeSuggestion[]> => {
      const suggestions: FieldTypeSuggestion[] = [];
      const content = input.content?.toLowerCase() ?? '';
      const fieldName = input.fieldName?.toLowerCase() ?? '';
      const context = input.context?.toLowerCase() ?? '';
      const combined = `${content} ${fieldName} ${context}`;

      // Image detection
      if (
        fieldName.includes('image') ||
        fieldName.includes('photo') ||
        fieldName.includes('avatar') ||
        fieldName.includes('logo') ||
        fieldName.includes('banner') ||
        fieldName.includes('thumbnail')
      ) {
        suggestions.push({
          type: 'image',
          confidence: 0.95,
          reason: 'Field name suggests image content',
        });
      }

      // Gallery detection
      if (
        fieldName.includes('gallery') ||
        fieldName.includes('photos') ||
        fieldName.includes('images') ||
        fieldName.includes('slides')
      ) {
        suggestions.push({
          type: 'gallery',
          confidence: 0.9,
          reason: 'Field name suggests multiple images',
        });
      }

      // Email detection
      if (fieldName.includes('email') || content.includes('@')) {
        suggestions.push({
          type: 'email',
          confidence: 0.95,
          reason: 'Field appears to be for email addresses',
        });
      }

      // URL detection
      if (
        fieldName.includes('url') ||
        fieldName.includes('link') ||
        fieldName.includes('website') ||
        content.startsWith('http')
      ) {
        suggestions.push({
          type: 'url',
          confidence: 0.9,
          reason: 'Field appears to be for URLs',
        });
      }

      // Date detection
      if (
        fieldName.includes('date') ||
        fieldName.includes('time') ||
        fieldName.includes('created') ||
        fieldName.includes('updated') ||
        fieldName.includes('published')
      ) {
        suggestions.push({
          type: 'date',
          confidence: 0.9,
          reason: 'Field name suggests date/time content',
        });
      }

      // Number detection
      if (
        fieldName.includes('count') ||
        fieldName.includes('number') ||
        fieldName.includes('quantity') ||
        fieldName.includes('price') ||
        fieldName.includes('amount') ||
        /^\d+$/.test(content)
      ) {
        suggestions.push({
          type: 'number',
          confidence: 0.85,
          reason: 'Field appears to be numeric',
        });
      }

      // Boolean detection
      if (
        fieldName.includes('is_') ||
        fieldName.includes('has_') ||
        fieldName.includes('enabled') ||
        fieldName.includes('active') ||
        fieldName.includes('visible') ||
        fieldName.includes('published')
      ) {
        suggestions.push({
          type: 'boolean',
          confidence: 0.9,
          reason: 'Field name suggests a boolean flag',
        });
      }

      // Rich text / WYSIWYG detection
      if (
        fieldName.includes('content') ||
        fieldName.includes('body') ||
        fieldName.includes('description') ||
        content.includes('<') ||
        combined.includes('rich text') ||
        combined.includes('html')
      ) {
        suggestions.push({
          type: 'wysiwyg',
          confidence: 0.8,
          reason: 'Field appears to need rich text editing',
        });
      }

      // Textarea detection
      if (
        fieldName.includes('bio') ||
        fieldName.includes('summary') ||
        fieldName.includes('excerpt') ||
        content.length > 100
      ) {
        suggestions.push({
          type: 'textarea',
          confidence: 0.75,
          reason: 'Field appears to need multi-line text',
        });
      }

      // Color detection
      if (fieldName.includes('color') || fieldName.includes('colour') || /^#[0-9a-f]{6}$/i.test(content)) {
        suggestions.push({
          type: 'color',
          confidence: 0.95,
          reason: 'Field appears to be a color value',
        });
      }

      // File detection
      if (fieldName.includes('file') || fieldName.includes('document') || fieldName.includes('attachment')) {
        suggestions.push({
          type: 'file',
          confidence: 0.85,
          reason: 'Field name suggests file upload',
        });
      }

      // Map detection
      if (
        fieldName.includes('location') ||
        fieldName.includes('address') ||
        fieldName.includes('map') ||
        fieldName.includes('coordinates')
      ) {
        suggestions.push({
          type: 'map',
          confidence: 0.85,
          reason: 'Field appears to be a location/map',
        });
      }

      // Select detection
      if (
        fieldName.includes('category') ||
        fieldName.includes('type') ||
        fieldName.includes('status') ||
        fieldName.includes('role')
      ) {
        suggestions.push({
          type: 'select',
          confidence: 0.7,
          reason: 'Field might benefit from predefined options',
        });
      }

      // Default to text
      if (suggestions.length === 0) {
        suggestions.push({
          type: 'text',
          confidence: 0.6,
          reason: 'Default suggestion for short text content',
        });
      }

      // Sort by confidence
      return suggestions.sort((a, b) => b.confidence - a.confidence);
    },
  },

  list_field_types: {
    description: 'List all available field types with descriptions',
    inputSchema: z.object({}),
    handler: async (): Promise<Array<{ type: FieldType; description: string; category: string }>> => {
      return [
        // Basic
        { type: 'text', description: 'Single line text input', category: 'basic' },
        { type: 'textarea', description: 'Multi-line text input', category: 'basic' },
        { type: 'number', description: 'Numeric input', category: 'basic' },
        { type: 'boolean', description: 'True/false toggle', category: 'basic' },
        { type: 'email', description: 'Email address input', category: 'basic' },
        { type: 'url', description: 'URL input', category: 'basic' },
        { type: 'phone', description: 'Phone number input', category: 'basic' },

        // Selection
        { type: 'select', description: 'Single selection dropdown', category: 'selection' },
        { type: 'multiselect', description: 'Multiple selection', category: 'selection' },
        { type: 'radio', description: 'Radio button group', category: 'selection' },
        { type: 'checkbox', description: 'Single checkbox', category: 'selection' },
        { type: 'checkboxgroup', description: 'Checkbox group', category: 'selection' },

        // Date/Time
        { type: 'date', description: 'Date picker', category: 'datetime' },
        { type: 'datetime', description: 'Date and time picker', category: 'datetime' },
        { type: 'time', description: 'Time picker', category: 'datetime' },

        // Media
        { type: 'image', description: 'Single image upload', category: 'media' },
        { type: 'gallery', description: 'Multiple images', category: 'media' },
        { type: 'file', description: 'File upload', category: 'media' },
        { type: 'video', description: 'Video embed/upload', category: 'media' },
        { type: 'audio', description: 'Audio file', category: 'media' },
        { type: 'oembed', description: 'Embed from URL', category: 'media' },

        // Rich Text
        { type: 'wysiwyg', description: 'Rich text editor', category: 'richtext' },
        { type: 'markdown', description: 'Markdown editor', category: 'richtext' },
        { type: 'code', description: 'Code editor with syntax highlighting', category: 'richtext' },
        { type: 'blocks', description: 'Block-based editor', category: 'richtext' },

        // Complex
        { type: 'repeater', description: 'Repeatable group of fields', category: 'complex' },
        { type: 'group', description: 'Group of fields', category: 'complex' },
        { type: 'flexible', description: 'Flexible content layouts', category: 'complex' },
        { type: 'relation', description: 'Relation to other content', category: 'complex' },
        { type: 'taxonomy', description: 'Categories/tags', category: 'complex' },

        // Special
        { type: 'color', description: 'Color picker', category: 'special' },
        { type: 'range', description: 'Range slider', category: 'special' },
        { type: 'map', description: 'Map location picker', category: 'special' },
        { type: 'link', description: 'Link with URL and text', category: 'special' },
        { type: 'pagelink', description: 'Link to internal page', category: 'special' },
        { type: 'user', description: 'User selector', category: 'special' },

        // UI helpers
        { type: 'message', description: 'Display message', category: 'ui' },
        { type: 'tab', description: 'Tab group', category: 'ui' },
        { type: 'accordion', description: 'Accordion group', category: 'ui' },
        { type: 'buttongroup', description: 'Button group', category: 'ui' },
      ];
    },
  },
};
