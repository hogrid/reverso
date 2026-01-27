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

// Forms Tables
export { forms, type Form, type NewForm, type FormStatus } from './forms.js';
export {
  formFields,
  type FormField,
  type NewFormField,
  type FormFieldType,
} from './form-fields.js';
export {
  formSubmissions,
  type FormSubmission,
  type NewFormSubmission,
  type FormSubmissionStatus,
} from './form-submissions.js';

// SEO Tables
export {
  redirects,
  type Redirect,
  type NewRedirect,
  type RedirectStatusCode,
} from './redirects.js';

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

// Security Tables
export {
  loginAttempts,
  type LoginAttempt,
  type NewLoginAttempt,
} from './login-attempts.js';

import { accounts, sessions, users, verifications } from './auth.js';
import { loginAttempts } from './login-attempts.js';
import { contentHistory } from './content-history.js';
import { content } from './content.js';
import { fields } from './fields.js';
import { formFields } from './form-fields.js';
import { formSubmissions } from './form-submissions.js';
import { forms } from './forms.js';
import { media } from './media.js';
// Import all tables for schema object
import { pages } from './pages.js';
import { redirects } from './redirects.js';
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
  forms,
  formFields,
  formSubmissions,
  redirects,
  users,
  sessions,
  accounts,
  verifications,
  loginAttempts,
};
