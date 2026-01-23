/**
 * @reverso/db
 *
 * Database schema and migrations for Reverso CMS using Drizzle ORM.
 * Supports SQLite (development) and PostgreSQL (production).
 *
 * @example
 * ```ts
 * import { initDatabase, getDatabase, syncSchema } from '@reverso/db';
 * import { createPage, getPages, upsertContent } from '@reverso/db';
 *
 * // Initialize database
 * initDatabase({ url: '.reverso/dev.db' });
 *
 * // Get database instance
 * const db = getDatabase();
 *
 * // Sync schema from scanner
 * await syncSchema(db, projectSchema);
 *
 * // Query pages
 * const pages = await getPages(db);
 * ```
 */

export const VERSION = '0.0.0';

// Connection management
export {
  createDatabase,
  getDatabase,
  initDatabase,
  closeDatabase,
  resetDatabaseInstance,
  type DrizzleDatabase,
  type DatabaseConfig,
} from './connection.js';

// Schema exports
export {
  // Tables
  pages,
  sections,
  fields,
  content,
  contentHistory,
  media,
  users,
  sessions,
  accounts,
  verifications,
  allTables,
  // Types
  type Page,
  type NewPage,
  type Section,
  type NewSection,
  type Field,
  type NewField,
  type Content,
  type NewContent,
  type ContentHistory,
  type NewContentHistory,
  type Media,
  type NewMedia,
  type User,
  type NewUser,
  type Session,
  type NewSession,
  type Account,
  type NewAccount,
  type Verification,
  type NewVerification,
} from './schema/index.js';

// Query exports
export {
  // Pages
  createPage,
  getPages,
  getPageById,
  getPageBySlug,
  updatePage,
  deletePage,
  upsertPage,
  parseSourceFiles,
  type CreatePageInput,
  type UpdatePageInput,
  // Sections
  createSection,
  getSections,
  getSectionsByPageId,
  getSectionById,
  getSectionBySlug,
  updateSection,
  deleteSection,
  deleteSectionsByPageId,
  upsertSection,
  parseRepeaterConfig,
  type CreateSectionInput,
  type UpdateSectionInput,
  type RepeaterConfig,
  // Fields
  createField,
  getFields,
  getFieldsBySectionId,
  getFieldById,
  getFieldByPath,
  getFieldsByPathPrefix,
  updateField,
  deleteField,
  deleteFieldsBySectionId,
  upsertField,
  parseFieldOptions,
  parseFieldConfig,
  type CreateFieldInput,
  type UpdateFieldInput,
  // Content
  createContent,
  getAllContent,
  getContentById,
  getContentByFieldId,
  getContentByPath,
  getContentByPathPrefix,
  updateContent,
  deleteContent,
  upsertContent,
  bulkUpdateContent,
  publishContent,
  unpublishContent,
  getContentHistory,
  parseContentValue,
  type CreateContentInput,
  type UpdateContentInput,
  // Media
  createMedia,
  getMediaList,
  getMediaById,
  getMediaByFilename,
  getImages,
  updateMedia,
  deleteMedia,
  getMediaCount,
  parseMediaMetadata,
  isImage,
  isVideo,
  isAudio,
  type CreateMediaInput,
  type UpdateMediaInput,
  type MediaListOptions,
} from './queries/index.js';

// Service exports
export {
  syncSchema,
  getSchemaChanges,
  type SyncResult,
  type SyncOptions,
} from './services/index.js';

// Utility exports
export { generateId, now, parseJson, toJson } from './utils.js';

// Migration exports
export {
  runMigrations,
  createDatabase as createDatabaseSchema,
  type MigrateOptions,
} from './migrate.js';
