/**
 * Database schema exports.
 * Re-exports all table definitions and types.
 */

// CMS Tables
export { pages, type Page, type NewPage } from './pages.js';
export { sections, type Section, type NewSection } from './sections.js';
export { fields, type Field, type NewField } from './fields.js';
export { content, type Content, type NewContent } from './content.js';
export {
  contentHistory,
  type ContentHistory,
  type NewContentHistory,
} from './content-history.js';
export { media, type Media, type NewMedia } from './media.js';

// Auth Tables
export {
  users,
  sessions,
  accounts,
  verifications,
  type User,
  type NewUser,
  type Session,
  type NewSession,
  type Account,
  type NewAccount,
  type Verification,
  type NewVerification,
} from './auth.js';

import { accounts, sessions, users, verifications } from './auth.js';
import { contentHistory } from './content-history.js';
import { content } from './content.js';
import { fields } from './fields.js';
import { media } from './media.js';
// Import all tables for schema object
import { pages } from './pages.js';
import { sections } from './sections.js';

/**
 * All tables as a single object (useful for migrations and Drizzle kit).
 */
export const allTables = {
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
};
