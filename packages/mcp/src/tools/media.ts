/**
 * Media tools for the MCP server.
 *
 * Backed by `GET /media`, `GET /media/:id`, `DELETE /media/:id` and
 * `GET /stats` on the Reverso API.
 */

import { z } from 'zod';
import type { ReversoApiClient } from '../api-client.js';

export const mediaTypeSchema = z.enum(['image', 'video', 'audio', 'document', 'other']);
export type MediaType = z.infer<typeof mediaTypeSchema>;

/** `GET /media` item. */
export interface MediaItem {
  id: string;
  filename: string;
  originalName: string | null;
  mimeType: string;
  size: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  caption: string | null;
  url: string;
  createdAt: string;
}

/** `GET /media/:id`. */
export interface MediaDetail extends MediaItem {
  metadata: unknown;
  updatedAt: string;
}

interface MediaListMeta {
  total: number;
  limit: number | null;
  offset: number;
}

/** `GET /stats` → `data.media`. */
interface StatsResponse {
  media: { total: number; totalSize: number; byType: Record<string, number> };
}

/**
 * The API filters by MIME type prefix; map the tool's friendly type to it.
 * "other" has no prefix of its own and returns every file.
 */
function mimePrefixFor(type: MediaType | undefined): string | undefined {
  switch (type) {
    case 'image':
    case 'video':
    case 'audio':
      return `${type}/`;
    case 'document':
      return 'application/';
    default:
      return undefined;
  }
}

async function listMedia(
  api: ReversoApiClient,
  query: { type?: MediaType; search?: string; limit?: number; offset?: number }
): Promise<{ media: MediaItem[]; meta: MediaListMeta }> {
  const { data, meta } = await api.get<MediaItem[]>('/media', {
    type: mimePrefixFor(query.type),
    search: query.search,
    limit: query.limit,
    offset: query.offset,
  });
  const listMeta = (meta ?? {}) as Partial<MediaListMeta>;
  return {
    media: data,
    meta: {
      total: listMeta.total ?? data.length,
      limit: listMeta.limit ?? null,
      offset: listMeta.offset ?? query.offset ?? 0,
    },
  };
}

export const mediaTools = {
  list_media: {
    description: 'List media files in the CMS',
    inputSchema: z.object({
      type: mediaTypeSchema.optional().describe('Filter by media type'),
      limit: z.number().int().positive().optional().describe('Maximum number of results (default: 50)'),
      offset: z.number().int().min(0).optional().describe('Offset for pagination'),
    }),
    handler: async (api: ReversoApiClient, input: { type?: MediaType; limit?: number; offset?: number }) => {
      const limit = input.limit ?? 50;
      const offset = input.offset ?? 0;
      const { media, meta } = await listMedia(api, { type: input.type, limit, offset });
      return { media, total: meta.total, offset, limit };
    },
  },

  get_media: {
    description: 'Get details of a specific media file by ID or filename',
    inputSchema: z.object({
      id: z.string().optional().describe('Media ID'),
      filename: z.string().optional().describe('Media filename'),
    }),
    handler: async (api: ReversoApiClient, input: { id?: string; filename?: string }) => {
      if (input.id) {
        const { data } = await api.get<MediaDetail>(`/media/${encodeURIComponent(input.id)}`);
        return data;
      }
      if (!input.filename) {
        throw new Error('Either id or filename must be provided');
      }
      const { media } = await listMedia(api, { search: input.filename, limit: 100 });
      const match = media.find((m) => m.filename === input.filename || m.originalName === input.filename);
      if (!match) {
        throw new Error(`Media not found: ${input.filename}`);
      }
      const { data } = await api.get<MediaDetail>(`/media/${encodeURIComponent(match.id)}`);
      return data;
    },
  },

  delete_media: {
    description: 'Delete a media file from the CMS (requires an admin API key)',
    inputSchema: z.object({
      id: z.string().min(1).describe('Media ID to delete'),
    }),
    handler: async (api: ReversoApiClient, input: { id: string }) => {
      const { data } = await api.delete<{ id: string; deleted: boolean }>(
        `/media/${encodeURIComponent(input.id)}`
      );
      return data;
    },
  },

  get_media_stats: {
    description: 'Get statistics about media files in the CMS',
    inputSchema: z.object({}),
    handler: async (api: ReversoApiClient) => {
      const { data } = await api.get<StatsResponse>('/stats');
      const totalSize = data.media.totalSize ?? 0;
      return {
        total: data.media.total,
        byType: data.media.byType,
        totalSizeBytes: totalSize,
        totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
      };
    },
  },

  search_media: {
    description: 'Search media files by filename or alt text',
    inputSchema: z.object({
      query: z.string().min(1).describe('Search query'),
      type: mediaTypeSchema.optional().describe('Filter by media type'),
    }),
    handler: async (api: ReversoApiClient, input: { query: string; type?: MediaType }) => {
      const { media, meta } = await listMedia(api, { search: input.query, type: input.type, limit: 100 });
      return { results: media, count: meta.total };
    },
  },
};
