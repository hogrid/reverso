/**
 * Content management tools for the MCP server.
 */

import type { DrizzleDatabase } from '@reverso/db';
import type { ContentValue } from '@reverso/core';
import {
  getPages,
  getPageBySlug,
  getContentByPath,
  getContentByPathPrefix,
  getFieldByPath,
  upsertContent,
  publishContent,
  unpublishContent,
  type Page,
} from '@reverso/db';
import { z } from 'zod';

export const contentTools = {
  list_pages: {
    description: 'List all pages in the CMS with their sections and field counts',
    inputSchema: z.object({
      includeContent: z.boolean().optional().describe('Include content values in response'),
    }),
    handler: async (db: DrizzleDatabase, input: { includeContent?: boolean }) => {
      const pages = await getPages(db);

      if (input.includeContent) {
        const pagesWithContent = await Promise.all(
          pages.map(async (page: Page) => {
            const content = await getContentByPathPrefix(db, page.slug);
            return { ...page, content };
          })
        );
        return pagesWithContent;
      }

      return pages;
    },
  },

  get_page: {
    description: 'Get a specific page by slug with all its sections, fields, and content',
    inputSchema: z.object({
      slug: z.string().describe('The page slug (e.g., "home", "about")'),
      locale: z.string().optional().describe('Locale for content (default: "default")'),
    }),
    handler: async (db: DrizzleDatabase, input: { slug: string; locale?: string }) => {
      const page = await getPageBySlug(db, input.slug);
      if (!page) {
        throw new Error(`Page not found: ${input.slug}`);
      }

      const content = await getContentByPathPrefix(db, input.slug, input.locale);
      return { ...page, content };
    },
  },

  get_content: {
    description: 'Get content for a specific field by its path',
    inputSchema: z.object({
      path: z.string().describe('Field path (e.g., "home.hero.title")'),
      locale: z.string().optional().describe('Locale for content (default: "default")'),
    }),
    handler: async (db: DrizzleDatabase, input: { path: string; locale?: string }) => {
      const content = await getContentByPath(db, input.path, input.locale);
      if (!content) {
        return { path: input.path, value: null, exists: false };
      }
      return { ...content, exists: true };
    },
  },

  update_content: {
    description: 'Update content for a specific field',
    inputSchema: z.object({
      path: z.string().describe('Field path (e.g., "home.hero.title")'),
      value: z.unknown().describe('New value for the field'),
      locale: z.string().optional().describe('Locale for content (default: "default")'),
      changedBy: z.string().optional().describe('User or system that made the change'),
    }),
    handler: async (
      db: DrizzleDatabase,
      input: { path: string; value: unknown; locale?: string; changedBy?: string }
    ) => {
      // Get the field by path to find its ID
      const field = await getFieldByPath(db, input.path);
      if (!field) {
        throw new Error(`Field not found: ${input.path}`);
      }

      const content = await upsertContent(db, {
        fieldId: field.id,
        value: input.value as ContentValue,
        locale: input.locale ?? 'default',
        changedBy: input.changedBy ?? 'mcp-server',
      });
      return { ...content, path: input.path };
    },
  },

  publish_content: {
    description: 'Publish content for a specific field, making it live',
    inputSchema: z.object({
      path: z.string().describe('Field path to publish'),
      locale: z.string().optional().describe('Locale for content (default: "default")'),
    }),
    handler: async (db: DrizzleDatabase, input: { path: string; locale?: string }) => {
      // Get the content by path to find its ID
      const existingContent = await getContentByPath(db, input.path, input.locale);
      if (!existingContent) {
        throw new Error(`Content not found: ${input.path}`);
      }

      const content = await publishContent(db, existingContent.id);
      if (!content) {
        throw new Error(`Failed to publish content: ${input.path}`);
      }
      return { ...content, path: input.path };
    },
  },

  unpublish_content: {
    description: 'Unpublish content for a specific field',
    inputSchema: z.object({
      path: z.string().describe('Field path to unpublish'),
      locale: z.string().optional().describe('Locale for content (default: "default")'),
    }),
    handler: async (db: DrizzleDatabase, input: { path: string; locale?: string }) => {
      // Get the content by path to find its ID
      const existingContent = await getContentByPath(db, input.path, input.locale);
      if (!existingContent) {
        throw new Error(`Content not found: ${input.path}`);
      }

      const content = await unpublishContent(db, existingContent.id);
      if (!content) {
        throw new Error(`Failed to unpublish content: ${input.path}`);
      }
      return { ...content, path: input.path };
    },
  },

  bulk_update_content: {
    description: 'Update multiple content fields at once',
    inputSchema: z.object({
      updates: z.array(
        z.object({
          path: z.string(),
          value: z.unknown(),
          locale: z.string().optional(),
        })
      ).describe('Array of content updates'),
      changedBy: z.string().optional().describe('User or system that made the changes'),
    }),
    handler: async (
      db: DrizzleDatabase,
      input: { updates: Array<{ path: string; value: unknown; locale?: string }>; changedBy?: string }
    ) => {
      const results = await Promise.all(
        input.updates.map(async (update) => {
          // Get the field by path to find its ID
          const field = await getFieldByPath(db, update.path);
          if (!field) {
            return { path: update.path, error: `Field not found: ${update.path}` };
          }

          const content = await upsertContent(db, {
            fieldId: field.id,
            value: update.value as ContentValue,
            locale: update.locale ?? 'default',
            changedBy: input.changedBy ?? 'mcp-server',
          });
          return { ...content, path: update.path };
        })
      );
      return { updated: results.filter(r => !('error' in r)).length, results };
    },
  },
};
