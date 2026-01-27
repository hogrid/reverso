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
  forms,
  formFields,
  formSubmissions,
  redirects,
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
  type Form,
  type NewForm,
  type FormStatus,
  type FormField,
  type NewFormField,
  type FormFieldType,
  type FormSubmission,
  type NewFormSubmission,
  type FormSubmissionStatus,
  type Redirect,
  type NewRedirect,
  type RedirectStatusCode,
  type User,
  type NewUser,
  type Session,
  type NewSession,
  type Account,
  type NewAccount,
  type Verification,
  type NewVerification,
  loginAttempts,
  type LoginAttempt,
  type NewLoginAttempt,
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
  // Forms
  createForm,
  getForms,
  getFormsByStatus,
  getFormById,
  getFormBySlug,
  updateForm,
  deleteForm,
  publishForm,
  unpublishForm,
  duplicateForm,
  parseFormSteps,
  parseFormSettings,
  parseNotifyEmails,
  type FormStep,
  type FormSettings,
  type CreateFormInput,
  type UpdateFormInput,
  // Form Fields
  createFormField,
  getFormFields,
  getFormFieldsByStep,
  getFormFieldById,
  getFormFieldByName,
  updateFormField,
  deleteFormField,
  reorderFormFields,
  duplicateFormFields,
  parseFormFieldConfig,
  parseFormFieldCondition,
  type FieldCondition,
  type FieldConfig,
  type CreateFormFieldInput,
  type UpdateFormFieldInput,
  // Form Submissions
  createFormSubmission,
  getFormSubmissions,
  getFormSubmissionsByFormId,
  getFormSubmissionById,
  updateFormSubmission,
  updateFormSubmissionStatus,
  markSubmissionAsRead,
  markSubmissionAsSpam,
  archiveSubmission,
  deleteFormSubmission,
  bulkDeleteFormSubmissions,
  getFormSubmissionCount,
  getFormSubmissionStats,
  recordWebhookSent,
  parseSubmissionData,
  parseSubmissionAttachments,
  parseWebhookResponse,
  type CreateFormSubmissionInput,
  type UpdateFormSubmissionInput,
  type FormSubmissionListOptions,
  // Redirects
  createRedirect,
  getRedirects,
  getEnabledRedirects,
  getRedirectById,
  getRedirectByFromPath,
  updateRedirect,
  deleteRedirect,
  enableRedirect,
  disableRedirect,
  recordRedirectHit,
  bulkCreateRedirects,
  getRedirectCount,
  getRedirectStats,
  type CreateRedirectInput,
  type UpdateRedirectInput,
  type RedirectListOptions,
  // Sessions
  getSessionByToken,
  deleteSessionByToken,
  deleteUserSessions,
  getUserById,
  type SessionWithUser,
  // Auth
  getUserByEmail,
  getFirstUser,
  createUser,
  getAccountByUserId,
  createAccount,
  createSession,
  getSessionWithUser,
  // Login Attempts (Brute Force Protection)
  getLoginAttempt,
  isLockedOut,
  recordFailedLoginAttempt,
  clearLoginAttempts,
  cleanupOldLoginAttempts,
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
