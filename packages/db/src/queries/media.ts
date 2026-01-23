/**
 * Media queries.
 */

import { desc, eq, like, sql } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import { type Media, type NewMedia, media } from '../schema/index.js';
import { generateId, now, parseJson, toJson } from '../utils.js';

export interface CreateMediaInput {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  storagePath: string;
  storageProvider?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateMediaInput {
  alt?: string;
  caption?: string;
  metadata?: Record<string, unknown>;
}

export interface MediaListOptions {
  mimeType?: string;
  limit?: number;
  offset?: number;
}

/**
 * Create new media.
 */
export async function createMedia(db: DrizzleDatabase, input: CreateMediaInput): Promise<Media> {
  const id = generateId();
  const timestamp = now();

  const newMedia: NewMedia = {
    id,
    filename: input.filename,
    originalName: input.originalName,
    mimeType: input.mimeType,
    size: input.size,
    width: input.width,
    height: input.height,
    alt: input.alt,
    caption: input.caption,
    storagePath: input.storagePath,
    storageProvider: input.storageProvider ?? 'local',
    metadata: toJson(input.metadata),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(media).values(newMedia);

  return {
    id,
    filename: input.filename,
    originalName: input.originalName,
    mimeType: input.mimeType,
    size: input.size,
    width: newMedia.width ?? null,
    height: newMedia.height ?? null,
    alt: newMedia.alt ?? null,
    caption: newMedia.caption ?? null,
    storagePath: input.storagePath,
    storageProvider: newMedia.storageProvider ?? null,
    metadata: newMedia.metadata ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Get all media with optional filtering.
 */
export async function getMediaList(
  db: DrizzleDatabase,
  options: MediaListOptions = {}
): Promise<Media[]> {
  let query = db.select().from(media).orderBy(desc(media.createdAt));

  if (options.mimeType) {
    query = query.where(like(media.mimeType, `${options.mimeType}%`)) as typeof query;
  }

  if (options.limit) {
    query = query.limit(options.limit) as typeof query;
  }

  if (options.offset) {
    query = query.offset(options.offset) as typeof query;
  }

  return query;
}

/**
 * Get media by ID.
 */
export async function getMediaById(db: DrizzleDatabase, id: string): Promise<Media | undefined> {
  const result = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return result[0];
}

/**
 * Get media by filename.
 */
export async function getMediaByFilename(
  db: DrizzleDatabase,
  filename: string
): Promise<Media | undefined> {
  const result = await db.select().from(media).where(eq(media.filename, filename)).limit(1);
  return result[0];
}

/**
 * Get images only.
 */
export async function getImages(
  db: DrizzleDatabase,
  options: Omit<MediaListOptions, 'mimeType'> = {}
): Promise<Media[]> {
  return getMediaList(db, { ...options, mimeType: 'image/' });
}

/**
 * Update media.
 */
export async function updateMedia(
  db: DrizzleDatabase,
  id: string,
  input: UpdateMediaInput
): Promise<Media | undefined> {
  const existing = await getMediaById(db, id);
  if (!existing) return undefined;

  const updates: Partial<NewMedia> = {
    updatedAt: now(),
  };

  if (input.alt !== undefined) updates.alt = input.alt;
  if (input.caption !== undefined) updates.caption = input.caption;
  if (input.metadata !== undefined) updates.metadata = toJson(input.metadata);

  await db.update(media).set(updates).where(eq(media.id, id));

  return getMediaById(db, id);
}

/**
 * Delete media.
 */
export async function deleteMedia(db: DrizzleDatabase, id: string): Promise<Media | undefined> {
  const existing = await getMediaById(db, id);
  if (!existing) return undefined;

  await db.delete(media).where(eq(media.id, id));
  return existing;
}

/**
 * Get total media count.
 */
export async function getMediaCount(db: DrizzleDatabase): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(media);
  return result[0]?.count ?? 0;
}

/**
 * Parse media metadata from JSON string.
 */
export function parseMediaMetadata(record: Media): Record<string, unknown> {
  return parseJson<Record<string, unknown>>(record.metadata) ?? {};
}

/**
 * Check if media is an image.
 */
export function isImage(record: Media): boolean {
  return record.mimeType.startsWith('image/');
}

/**
 * Check if media is a video.
 */
export function isVideo(record: Media): boolean {
  return record.mimeType.startsWith('video/');
}

/**
 * Check if media is audio.
 */
export function isAudio(record: Media): boolean {
  return record.mimeType.startsWith('audio/');
}
