/**
 * Media routes.
 * Handles file uploads and media management.
 */

import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { extname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import {
  type MediaListOptions,
  createMedia,
  deleteMedia,
  generateId,
  getImages,
  getMediaById,
  getMediaList,
  parseMediaMetadata,
  updateMedia,
} from '@reverso/db';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { MediaUploadResult } from '../types.js';
import {
  MAX_FILE_SIZE,
  idParamSchema,
  isAllowedMimeType,
  mediaListQuerySchema,
  mediaUpdateSchema,
  paginationSchema,
  sanitizeFilename,
} from '../validation.js';

const mediaRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const uploadsDir = fastify.config?.uploadsDir || '.reverso/uploads';

  // Ensure uploads directory exists
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  /**
   * GET /media
   * List all media files.
   */
  fastify.get<{
    Querystring: {
      type?: string;
      limit?: string;
      offset?: string;
    };
  }>('/media', async (request, reply) => {
    try {
      const queryResult = mediaListQuerySchema.safeParse(request.query);
      if (!queryResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: queryResult.error.issues[0]?.message ?? 'Invalid query parameters',
        });
      }

      const { type, limit, offset } = queryResult.data;
      const db = request.db;

      const options: MediaListOptions = {};
      if (type) options.mimeType = type;
      if (limit) options.limit = limit;
      if (offset) options.offset = offset;

      const media = await getMediaList(db, options);

      return {
        success: true,
        data: media.map((m) => ({
          id: m.id,
          filename: m.filename,
          originalName: m.originalName,
          mimeType: m.mimeType,
          size: m.size,
          width: m.width,
          height: m.height,
          alt: m.alt,
          caption: m.caption,
          url: `/uploads/${m.filename}`,
          createdAt: m.createdAt,
        })),
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to list media');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to list media',
      });
    }
  });

  /**
   * GET /media/images
   * List only image files.
   */
  fastify.get<{
    Querystring: { limit?: string; offset?: string };
  }>('/media/images', async (request, reply) => {
    try {
      const queryResult = paginationSchema.safeParse(request.query);
      if (!queryResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: queryResult.error.issues[0]?.message ?? 'Invalid query parameters',
        });
      }

      const { limit, offset } = queryResult.data;
      const db = request.db;

      const options: Omit<MediaListOptions, 'mimeType'> = {};
      if (limit) options.limit = limit;
      if (offset) options.offset = offset;

      const images = await getImages(db, options);

      return {
        success: true,
        data: images.map((m) => ({
          id: m.id,
          filename: m.filename,
          originalName: m.originalName,
          mimeType: m.mimeType,
          size: m.size,
          width: m.width,
          height: m.height,
          alt: m.alt,
          caption: m.caption,
          url: `/uploads/${m.filename}`,
        })),
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to list images');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to list images',
      });
    }
  });

  /**
   * GET /media/:id
   * Get media by ID.
   */
  fastify.get<{ Params: { id: string } }>('/media/:id', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid media ID',
        });
      }

      const { id } = paramResult.data;
      const db = request.db;

      const media = await getMediaById(db, id);
      if (!media) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Media "${id}" not found`,
        });
      }

      return {
        success: true,
        data: {
          id: media.id,
          filename: media.filename,
          originalName: media.originalName,
          mimeType: media.mimeType,
          size: media.size,
          width: media.width,
          height: media.height,
          alt: media.alt,
          caption: media.caption,
          url: `/uploads/${media.filename}`,
          metadata: parseMediaMetadata(media),
          createdAt: media.createdAt,
          updatedAt: media.updatedAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get media');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to get media',
      });
    }
  });

  /**
   * POST /media
   * Upload a file.
   */
  fastify.post('/media', async (request, reply) => {
    try {
      const db = request.db;

      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'Bad request',
          message: 'No file uploaded',
        });
      }

      // Validate MIME type
      if (!isAllowedMimeType(data.mimetype)) {
        // Consume the stream to prevent memory leaks
        data.file.resume();
        return reply.status(400).send({
          success: false,
          error: 'Invalid file type',
          message: `File type "${data.mimetype}" is not allowed. Allowed types: images, documents, videos, audio.`,
        });
      }

      // Sanitize filename to prevent path traversal
      const sanitizedOriginalName = sanitizeFilename(data.filename);
      const ext = extname(sanitizedOriginalName);
      const id = generateId();
      const filename = `${id}${ext}`;
      const storagePath = join(uploadsDir, filename);

      // Verify the resolved path is within uploads directory
      const resolvedPath = join(process.cwd(), storagePath);
      const resolvedUploadsDir = join(process.cwd(), uploadsDir);
      if (!resolvedPath.startsWith(resolvedUploadsDir)) {
        data.file.resume();
        return reply.status(400).send({
          success: false,
          error: 'Invalid filename',
          message: 'Filename contains invalid characters',
        });
      }

      // Check file size during streaming
      let bytesRead = 0;
      const sizeChecker = new (await import('node:stream')).Transform({
        transform(
          chunk: Buffer,
          _encoding: string,
          callback: (error?: Error | null, data?: Buffer) => void
        ) {
          bytesRead += chunk.length;
          if (bytesRead > MAX_FILE_SIZE) {
            callback(new Error('File size exceeds maximum allowed'));
            return;
          }
          callback(null, chunk);
        },
      });

      // Save file
      try {
        await pipeline(data.file, sizeChecker, createWriteStream(storagePath));
      } catch (err) {
        // Clean up partial file if exists
        if (existsSync(storagePath)) {
          unlinkSync(storagePath);
        }
        if ((err as Error).message === 'File size exceeds maximum allowed') {
          return reply.status(400).send({
            success: false,
            error: 'File too large',
            message: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
          });
        }
        throw err;
      }

      // Get image dimensions if applicable
      let width: number | undefined;
      let height: number | undefined;

      if (data.mimetype.startsWith('image/')) {
        // For now, skip image dimension detection
        // In production, use sharp or similar
      }

      // Create media record
      const media = await createMedia(db, {
        filename,
        originalName: sanitizedOriginalName,
        mimeType: data.mimetype,
        size: bytesRead,
        width,
        height,
        storagePath,
        storageProvider: 'local',
      });

      const result: MediaUploadResult = {
        id: media.id,
        url: `/uploads/${filename}`,
        filename: media.filename,
        mimeType: media.mimeType,
        size: media.size,
        width: media.width ?? undefined,
        height: media.height ?? undefined,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to upload media');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to upload media',
      });
    }
  });

  /**
   * PATCH /media/:id
   * Update media metadata.
   */
  fastify.patch<{
    Params: { id: string };
    Body: { alt?: string; caption?: string };
  }>('/media/:id', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid media ID',
        });
      }

      const bodyResult = mediaUpdateSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: bodyResult.error.issues[0]?.message ?? 'Invalid request body',
        });
      }

      const { id } = paramResult.data;
      const { alt, caption } = bodyResult.data;
      const db = request.db;

      const existing = await getMediaById(db, id);
      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Media "${id}" not found`,
        });
      }

      const updated = await updateMedia(db, id, { alt, caption });

      return {
        success: true,
        data: {
          id: updated?.id,
          alt: updated?.alt,
          caption: updated?.caption,
          updatedAt: updated?.updatedAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to update media');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to update media',
      });
    }
  });

  /**
   * DELETE /media/:id
   * Delete media.
   */
  fastify.delete<{ Params: { id: string } }>('/media/:id', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid media ID',
        });
      }

      const { id } = paramResult.data;
      const db = request.db;

      const media = await deleteMedia(db, id);
      if (!media) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Media "${id}" not found`,
        });
      }

      // Delete file from storage
      const filePath = join(uploadsDir, media.filename);

      // Verify path is within uploads directory before deleting
      const resolvedPath = join(process.cwd(), filePath);
      const resolvedUploadsDir = join(process.cwd(), uploadsDir);
      if (resolvedPath.startsWith(resolvedUploadsDir) && existsSync(filePath)) {
        unlinkSync(filePath);
      }

      return {
        success: true,
        data: {
          id: media.id,
          deleted: true,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to delete media');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to delete media',
      });
    }
  });
};

export default mediaRoutes;
