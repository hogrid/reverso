---
title: "@reverso/db"
description: Database layer with Drizzle ORM for Reverso CMS
---

# @reverso/db

The database package provides Drizzle ORM schemas, migrations, and query functions.

## Installation

```bash
npm install @reverso/db
```

## Supported Databases

| Database | Environment | Connection |
|----------|-------------|------------|
| SQLite | Development | File path |
| PostgreSQL | Production | Connection URL |

## Setup

### Create Database Instance

```typescript
import { createDatabase } from '@reverso/db';

// SQLite (development)
const db = await createDatabase({
  url: '.reverso/data.db',
});

// PostgreSQL (production)
const db = await createDatabase({
  url: process.env.DATABASE_URL,
});
```

### Run Migrations

```typescript
import { migrate } from '@reverso/db';

await migrate(db);
```

Or via CLI:

```bash
reverso migrate
```

## Schema

### Pages Table

```typescript
const pages = {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  path: text('path').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
};
```

### Sections Table

```typescript
const sections = {
  id: text('id').primaryKey(),
  pageId: text('page_id').references(() => pages.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  isRepeater: integer('is_repeater', { mode: 'boolean' }),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
};
```

### Fields Table

```typescript
const fields = {
  id: text('id').primaryKey(),
  sectionId: text('section_id').references(() => sections.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // FieldType
  label: text('label'),
  help: text('help'),
  required: integer('required', { mode: 'boolean' }),
  config: text('config', { mode: 'json' }),
  sortOrder: integer('sort_order').default(0),
};
```

### Content Table

```typescript
const content = {
  id: text('id').primaryKey(),
  fieldId: text('field_id').references(() => fields.id),
  value: text('value', { mode: 'json' }),
  locale: text('locale').default('en'),
  version: integer('version').default(1),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
};
```

### Media Table

```typescript
const media = {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt'),
  caption: text('caption'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
};
```

### Forms Tables

```typescript
// Forms
const forms = {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  status: text('status').default('draft'), // draft, published, archived
  isMultiStep: integer('is_multi_step', { mode: 'boolean' }),
  steps: text('steps', { mode: 'json' }),
  settings: text('settings', { mode: 'json' }),
  // ... notification settings
};

// Form Fields
const formFields = {
  id: text('id').primaryKey(),
  formId: text('form_id').references(() => forms.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  label: text('label'),
  // ... validation, config, etc.
};

// Form Submissions
const formSubmissions = {
  id: text('id').primaryKey(),
  formId: text('form_id').references(() => forms.id),
  data: text('data', { mode: 'json' }),
  status: text('status').default('new'),
  // ... metadata
};
```

### Redirects Table

```typescript
const redirects = {
  id: text('id').primaryKey(),
  fromPath: text('from_path').notNull().unique(),
  toPath: text('to_path').notNull(),
  statusCode: integer('status_code').default(301),
  isEnabled: integer('is_enabled', { mode: 'boolean' }),
  hitCount: integer('hit_count').default(0),
  lastHitAt: integer('last_hit_at', { mode: 'timestamp' }),
};
```

## Query Functions

### Pages

```typescript
import {
  getPages,
  getPageById,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
} from '@reverso/db';

// Get all pages
const pages = await getPages(db);

// Get by slug
const page = await getPageBySlug(db, 'home');

// Create page
await createPage(db, {
  name: 'About',
  slug: 'about',
  path: '/about',
});

// Update page
await updatePage(db, pageId, { description: 'About us' });

// Delete page
await deletePage(db, pageId);
```

### Content

```typescript
import {
  getContent,
  getContentByPath,
  upsertContent,
  publishContent,
  unpublishContent,
  bulkUpdateContent,
} from '@reverso/db';

// Get content by field ID
const content = await getContent(db, fieldId, 'en');

// Get content by path
const content = await getContentByPath(db, 'home.hero.title', 'en');

// Upsert content
await upsertContent(db, {
  fieldId: 'field_123',
  value: 'Hello World',
  locale: 'en',
});

// Publish content
await publishContent(db, contentId);

// Bulk update
await bulkUpdateContent(db, [
  { fieldId: 'field_1', value: 'Value 1', locale: 'en' },
  { fieldId: 'field_2', value: 'Value 2', locale: 'en' },
]);
```

### Media

```typescript
import {
  getMediaList,
  getMediaById,
  createMedia,
  updateMedia,
  deleteMedia,
  getMediaCount,
} from '@reverso/db';

// List media
const media = await getMediaList(db, {
  type: 'image',
  limit: 20,
  offset: 0,
});

// Create media record
await createMedia(db, {
  filename: 'image-123.jpg',
  originalName: 'photo.jpg',
  mimeType: 'image/jpeg',
  size: 1024000,
  width: 1920,
  height: 1080,
});

// Delete media
await deleteMedia(db, mediaId);
```

### Forms

```typescript
import {
  getForms,
  getFormById,
  getFormBySlug,
  createForm,
  updateForm,
  deleteForm,
  getFormFields,
  createFormField,
  updateFormField,
  deleteFormField,
  getFormSubmissions,
  createFormSubmission,
  updateSubmissionStatus,
} from '@reverso/db';

// Get form with fields
const form = await getFormById(db, formId);
const fields = await getFormFields(db, formId);

// Create submission
await createFormSubmission(db, {
  formId: 'form_123',
  data: { name: 'John', email: 'john@example.com' },
});

// List submissions
const submissions = await getFormSubmissions(db, formId, {
  status: 'new',
  limit: 50,
});
```

### Redirects

```typescript
import {
  getRedirects,
  getRedirectById,
  createRedirect,
  updateRedirect,
  deleteRedirect,
  incrementRedirectHit,
} from '@reverso/db';

// Get enabled redirects
const redirects = await getRedirects(db, { enabled: true });

// Create redirect
await createRedirect(db, {
  fromPath: '/old-page',
  toPath: '/new-page',
  statusCode: 301,
});

// Track hit
await incrementRedirectHit(db, redirectId);
```

## Transactions

```typescript
import { createDatabase, withTransaction } from '@reverso/db';

const db = await createDatabase({ url: '.reverso/data.db' });

await withTransaction(db, async (tx) => {
  await createPage(tx, { name: 'New Page', slug: 'new-page', path: '/new-page' });
  await createSection(tx, { pageId: page.id, name: 'Hero', slug: 'hero' });
  // If any fails, all changes are rolled back
});
```

## Type Safety

All functions are fully typed:

```typescript
import type {
  Page,
  Section,
  Field,
  Content,
  Media,
  Form,
  FormField,
  FormSubmission,
  Redirect,
  DrizzleDatabase,
} from '@reverso/db';

// Functions accept typed parameters
async function getPage(db: DrizzleDatabase, id: string): Promise<Page | null>;
```

## Raw Queries

For advanced use cases:

```typescript
import { createDatabase, schema } from '@reverso/db';
import { eq, and, gt } from 'drizzle-orm';

const db = await createDatabase({ url: '.reverso/data.db' });

// Direct Drizzle query
const results = await db
  .select()
  .from(schema.content)
  .where(
    and(
      eq(schema.content.locale, 'en'),
      gt(schema.content.updatedAt, new Date('2025-01-01'))
    )
  );
```

## Next Steps

- [@reverso/api](/packages/api/) - REST API server
- [@reverso/scanner](/packages/scanner/) - AST parser
