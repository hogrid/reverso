/**
 * Media table schema.
 * Stores uploaded files metadata.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(), // Bytes
  width: integer('width'), // For images
  height: integer('height'), // For images
  alt: text('alt'),
  caption: text('caption'),
  storagePath: text('storage_path').notNull(),
  storageProvider: text('storage_provider').default('local'), // local, s3, cloudinary
  metadata: text('metadata'), // JSON: Additional metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
