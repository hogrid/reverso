/**
 * Content management tools for the MCP server.
 *
 * Every tool calls the Reverso REST API; nothing here touches the database.
 */

import { z } from 'zod';
import type { ReversoApiClient } from '../api-client.js';
import { ReversoApiError } from '../api-client.js';
import { type ContentValueInput, contentValueSchema, pageSlugOf } from './shared.js';

/** `GET /pages` item. */
export interface PageSummary {
  slug: string;
  name: string;
  sectionCount: number;
  fieldCount: number;
  sourceFiles: string[];
  createdAt: string;
  updatedAt: string;
}

/** `GET /pages/:slug`. */
export interface PageDetail {
  slug: string;
  name: string;
  fieldCount: number;
  sourceFiles: string[];
  sections: Array<{
    slug: string;
    name: string;
    isRepeater: boolean;
    repeaterConfig: unknown;
    fields: Array<Record<string, unknown> & { path: string; value: unknown; published: boolean }>;
  }>;
}

/** `GET /content/page/:slug`. */
export interface PageContent {
  page: string;
  slug: string;
  locale: string;
  data: Record<string, Record<string, unknown>>;
  content: Record<string, unknown>;
}

/** `GET /content/:path` and `PUT /content/:path`. */
export interface ContentEntry {
  id?: string;
  path: string;
  locale: string;
  value: unknown;
  published: boolean;
  publishedAt?: string | null;
  updatedAt?: string;
}

/** `POST /content/:path/publish|unpublish`. */
export interface PublishResult {
  id?: string;
  path: string;
  published?: boolean;
  publishedAt?: string | null;
}

/** `PATCH /content/page/:slug`. */
export interface PagePatchResult {
  page: string;
  locale: string;
  updated: number;
}

function toEntries(content: Record<string, unknown>): Array<{ path: string; value: unknown }> {
  return Object.entries(content).map(([path, value]) => ({ path, value }));
}

export const contentTools = {
  list_pages: {
    description: 'List all pages in the CMS with their section and field counts',
    inputSchema: z.object({
      includeContent: z.boolean().optional().describe('Include content values in response'),
      locale: z.string().optional().describe('Locale for content values (default: "default")'),
    }),
    handler: async (api: ReversoApiClient, input: { includeContent?: boolean; locale?: string }) => {
      const { data: pages } = await api.get<PageSummary[]>('/pages');

      if (!input.includeContent) {
        return pages;
      }

      return Promise.all(
        pages.map(async (page) => {
          const { data } = await api.get<PageContent>(`/content/page/${encodeURIComponent(page.slug)}`, {
            locale: input.locale,
          });
          return { ...page, content: toEntries(data.content) };
        })
      );
    },
  },

  get_page: {
    description: 'Get a specific page by slug with all its sections, fields, and content',
    inputSchema: z.object({
      slug: z.string().min(1).describe('The page slug (e.g., "home", "about")'),
      locale: z.string().optional().describe('Locale for content (default: "default")'),
    }),
    handler: async (api: ReversoApiClient, input: { slug: string; locale?: string }) => {
      const slug = encodeURIComponent(input.slug);
      const [{ data: page }, { data: content }] = await Promise.all([
        api.get<PageDetail>(`/pages/${slug}`),
        api.get<PageContent>(`/content/page/${slug}`, { locale: input.locale }),
      ]);
      return { ...page, locale: content.locale, content: toEntries(content.content) };
    },
  },

  get_content: {
    description: 'Get content for a specific field by its path',
    inputSchema: z.object({
      path: z.string().min(1).describe('Field path (e.g., "home.hero.title")'),
      locale: z.string().optional().describe('Locale for content (default: "default")'),
    }),
    handler: async (api: ReversoApiClient, input: { path: string; locale?: string }) => {
      const { data } = await api.get<ContentEntry>(`/content/${encodeURIComponent(input.path)}`, {
        locale: input.locale,
      });
      // The API answers `value: null, published: false` without an id when the
      // field exists but nothing was written yet.
      return { ...data, exists: data.id !== undefined };
    },
  },

  update_content: {
    description:
      'Update content for a specific field. The change is published (live) unless publish is false.',
    inputSchema: z.object({
      path: z.string().min(1).describe('Field path (e.g., "home.hero.title")'),
      value: contentValueSchema.describe('New value for the field'),
      locale: z.string().optional().describe('Locale for content (default: "default")'),
      publish: z
        .boolean()
        .optional()
        .describe('Publish the value (default: true). Pass false to store a draft.'),
    }),
    handler: async (
      api: ReversoApiClient,
      input: { path: string; value: ContentValueInput; locale?: string; publish?: boolean }
    ) => {
      const { data } = await api.put<ContentEntry>(`/content/${encodeURIComponent(input.path)}`, {
        value: input.value,
        locale: input.locale,
        publish: input.publish,
      });
      return data;
    },
  },

  publish_content: {
    description: 'Publish content for a specific field, making it live',
    inputSchema: z.object({
      path: z.string().min(1).describe('Field path to publish'),
    }),
    handler: async (api: ReversoApiClient, input: { path: string }) => {
      const { data } = await api.post<PublishResult>(`/content/${encodeURIComponent(input.path)}/publish`);
      return data;
    },
  },

  unpublish_content: {
    description: 'Unpublish content for a specific field, removing it from the public API',
    inputSchema: z.object({
      path: z.string().min(1).describe('Field path to unpublish'),
    }),
    handler: async (api: ReversoApiClient, input: { path: string }) => {
      const { data } = await api.post<PublishResult>(`/content/${encodeURIComponent(input.path)}/unpublish`);
      return data;
    },
  },

  bulk_update_content: {
    description:
      'Update multiple content fields at once (published immediately). Updates are grouped per page and locale; every path must be a known field of its page.',
    inputSchema: z.object({
      updates: z
        .array(
          z.object({
            path: z.string().min(1).describe('Field path (e.g., "home.hero.title")'),
            value: contentValueSchema.describe('New value for the field'),
            locale: z.string().optional().describe('Locale for content (default: "default")'),
          })
        )
        .min(1)
        .describe('Array of content updates'),
    }),
    handler: async (
      api: ReversoApiClient,
      input: { updates: Array<{ path: string; value: ContentValueInput; locale?: string }> }
    ) => {
      // One PATCH per page+locale: the API validates that every path belongs
      // to that page and names an existing field.
      const groups = new Map<string, { slug: string; locale?: string; data: Record<string, unknown> }>();
      for (const update of input.updates) {
        const slug = pageSlugOf(update.path);
        const key = `${slug}\u0000${update.locale ?? ''}`;
        const group = groups.get(key) ?? { slug, locale: update.locale, data: {} };
        group.data[update.path] = update.value;
        groups.set(key, group);
      }

      const pages: PagePatchResult[] = [];
      const errors: Array<{ page: string; locale?: string; paths: string[]; status: number; message: string }> = [];

      for (const group of groups.values()) {
        try {
          const { data } = await api.patch<PagePatchResult>(
            `/content/page/${encodeURIComponent(group.slug)}`,
            { data: group.data },
            { locale: group.locale }
          );
          pages.push(data);
        } catch (error) {
          if (!(error instanceof ReversoApiError)) throw error;
          errors.push({
            page: group.slug,
            locale: group.locale,
            paths: Object.keys(group.data),
            status: error.status,
            message: error.message,
          });
        }
      }

      const updated = pages.reduce((sum, page) => sum + page.updated, 0);
      if (updated === 0 && errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join('; '));
      }
      return { updated, pages, errors };
    },
  },
};
