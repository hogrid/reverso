/**
 * Media tools for the MCP server.
 */

import type { DrizzleDatabase } from '@reverso/db';
import { getMediaList, getMediaById, getMediaByFilename, deleteMedia, getMediaCount, type Media } from '@reverso/db';
import { z } from 'zod';

export const mediaTools = {
  list_media: {
    description: 'List all media files in the CMS',
    inputSchema: z.object({
      type: z.enum(['image', 'video', 'audio', 'document', 'other']).optional().describe('Filter by media type'),
      limit: z.number().optional().describe('Maximum number of results (default: 50)'),
      offset: z.number().optional().describe('Offset for pagination'),
    }),
    handler: async (
      db: DrizzleDatabase,
      input: { type?: string; limit?: number; offset?: number }
    ) => {
      let media = await getMediaList(db, { limit: 1000 });

      if (input.type) {
        media = media.filter((m: Media) => {
          const mimeType = m.mimeType?.toLowerCase() ?? '';
          switch (input.type) {
            case 'image':
              return mimeType.startsWith('image/');
            case 'video':
              return mimeType.startsWith('video/');
            case 'audio':
              return mimeType.startsWith('audio/');
            case 'document':
              return (
                mimeType.includes('pdf') ||
                mimeType.includes('document') ||
                mimeType.includes('text/')
              );
            default:
              return true;
          }
        });
      }

      const total = media.length;
      const offset = input.offset ?? 0;
      const limit = input.limit ?? 50;

      media = media.slice(offset, offset + limit);

      return { media, total, offset, limit };
    },
  },

  get_media: {
    description: 'Get details of a specific media file',
    inputSchema: z.object({
      id: z.string().optional().describe('Media ID'),
      filename: z.string().optional().describe('Media filename'),
    }),
    handler: async (db: DrizzleDatabase, input: { id?: string; filename?: string }) => {
      if (!input.id && !input.filename) {
        throw new Error('Either id or filename must be provided');
      }

      let media: Media | null | undefined = null;
      if (input.id) {
        media = await getMediaById(db, input.id);
      } else if (input.filename) {
        media = await getMediaByFilename(db, input.filename);
      }

      if (!media) {
        throw new Error(`Media not found: ${input.id ?? input.filename}`);
      }

      return media;
    },
  },

  delete_media: {
    description: 'Delete a media file from the CMS',
    inputSchema: z.object({
      id: z.string().describe('Media ID to delete'),
    }),
    handler: async (db: DrizzleDatabase, input: { id: string }) => {
      const media = await getMediaById(db, input.id);
      if (!media) {
        throw new Error(`Media not found: ${input.id}`);
      }

      const deleted = await deleteMedia(db, input.id);
      return { deleted, media };
    },
  },

  get_media_stats: {
    description: 'Get statistics about media files in the CMS',
    inputSchema: z.object({}),
    handler: async (db: DrizzleDatabase) => {
      const media = await getMediaList(db, { limit: 10000 });
      const total = await getMediaCount(db);

      const byType = media.reduce(
        (acc: Record<string, number>, m: Media) => {
          const mimeType = m.mimeType?.toLowerCase() ?? 'unknown';
          let type = 'other';
          if (mimeType.startsWith('image/')) type = 'image';
          else if (mimeType.startsWith('video/')) type = 'video';
          else if (mimeType.startsWith('audio/')) type = 'audio';
          else if (mimeType.includes('pdf') || mimeType.includes('document')) type = 'document';

          acc[type] = (acc[type] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const totalSize = media.reduce((sum: number, m: Media) => sum + (m.size ?? 0), 0);

      return {
        total,
        byType,
        totalSizeBytes: totalSize,
        totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
      };
    },
  },

  search_media: {
    description: 'Search media files by filename or alt text',
    inputSchema: z.object({
      query: z.string().describe('Search query'),
      type: z.enum(['image', 'video', 'audio', 'document', 'other']).optional().describe('Filter by media type'),
    }),
    handler: async (db: DrizzleDatabase, input: { query: string; type?: string }) => {
      let media = await getMediaList(db, { limit: 10000 });
      const query = input.query.toLowerCase();

      media = media.filter((m: Media) => {
        const filename = m.filename?.toLowerCase() ?? '';
        const alt = m.alt?.toLowerCase() ?? '';
        return filename.includes(query) || alt.includes(query);
      });

      if (input.type) {
        media = media.filter((m: Media) => {
          const mimeType = m.mimeType?.toLowerCase() ?? '';
          switch (input.type) {
            case 'image':
              return mimeType.startsWith('image/');
            case 'video':
              return mimeType.startsWith('video/');
            case 'audio':
              return mimeType.startsWith('audio/');
            case 'document':
              return mimeType.includes('pdf') || mimeType.includes('document');
            default:
              return true;
          }
        });
      }

      return { results: media, count: media.length };
    },
  },
};
