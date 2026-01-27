---
title: "@reverso/core"
description: Core types, utilities, and configuration for Reverso CMS
---

# @reverso/core

The foundation package containing shared types, utilities, and configuration system.

## Installation

```bash
npm install @reverso/core
```

## Configuration

### reverso.config.ts

Create a configuration file in your project root:

```typescript
import type { ReversoConfig } from '@reverso/core';

export default {
  // Project name
  name: 'My Website',

  // Content directory to scan
  contentDir: './src',

  // Database configuration
  database: {
    type: 'sqlite',
    path: '.reverso/data.db',
  },

  // i18n configuration (optional)
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt', 'es'],
  },

  // Media configuration (optional)
  media: {
    uploadDir: '.reverso/uploads',
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
} satisfies ReversoConfig;
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | `'Reverso CMS'` | Project name |
| `contentDir` | `string` | `'./src'` | Directory to scan for markers |
| `database` | `DatabaseConfig` | SQLite | Database configuration |
| `i18n` | `I18nConfig` | - | Internationalization settings |
| `media` | `MediaConfig` | - | Media upload settings |
| `auth` | `AuthConfig` | - | Authentication settings |
| `api` | `ApiConfig` | - | API server settings |

### Database Config

```typescript
// SQLite (development)
database: {
  type: 'sqlite',
  path: '.reverso/data.db',
}

// PostgreSQL (production)
database: {
  type: 'postgres',
  url: process.env.DATABASE_URL,
}
```

### I18n Config

```typescript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'pt', 'es', 'fr'],
  localeNames: {
    en: 'English',
    pt: 'Português',
    es: 'Español',
    fr: 'Français',
  },
  fallback: true, // Fall back to default locale
}
```

## Types

### Field Types

```typescript
import type { FieldType } from '@reverso/core';

// All available field types
type FieldType =
  | 'text'
  | 'textarea'
  | 'wysiwyg'
  | 'markdown'
  | 'blocks'
  | 'number'
  | 'range'
  | 'boolean'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'multiselect'
  | 'date'
  | 'datetime'
  | 'time'
  | 'email'
  | 'url'
  | 'phone'
  | 'color'
  | 'image'
  | 'gallery'
  | 'file'
  | 'video'
  | 'audio'
  | 'oembed'
  | 'icon'
  | 'map'
  | 'link'
  | 'pagelink'
  | 'relation'
  | 'taxonomy'
  | 'user'
  | 'repeater'
  | 'flexible'
  | 'group';
```

### Schema Types

```typescript
import type {
  Page,
  Section,
  Field,
  ContentSchema
} from '@reverso/core';

// Page definition
interface Page {
  id: string;
  name: string;
  slug: string;
  path: string;
  description?: string;
}

// Section within a page
interface Section {
  id: string;
  pageId: string;
  name: string;
  slug: string;
  isRepeater: boolean;
  description?: string;
}

// Field definition
interface Field {
  id: string;
  sectionId: string;
  name: string;
  type: FieldType;
  label?: string;
  help?: string;
  required: boolean;
  config: Record<string, unknown>;
  sortOrder: number;
}

// Complete schema
interface ContentSchema {
  pages: Page[];
  sections: Section[];
  fields: Field[];
}
```

### Content Types

```typescript
import type { Content } from '@reverso/core';

interface Content {
  id: string;
  fieldId: string;
  value: unknown;
  locale: string;
  version: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Marker Types

```typescript
import type { MarkerInfo } from '@reverso/core';

interface MarkerInfo {
  path: string;           // e.g., "home.hero.title"
  type: FieldType;        // e.g., "text"
  label?: string;
  help?: string;
  required?: boolean;
  options?: string[];     // For select/radio/checkbox
  config?: Record<string, unknown>;
  filePath: string;       // Source file
  line: number;
  column: number;
}
```

## Utilities

### Path Utilities

```typescript
import { parsePath, buildPath, isRepeaterPath } from '@reverso/core';

// Parse a marker path
const parsed = parsePath('home.hero.title');
// { page: 'home', section: 'hero', field: 'title' }

// Build a path
const path = buildPath('home', 'hero', 'title');
// 'home.hero.title'

// Check for repeater
isRepeaterPath('home.features.$.title'); // true
isRepeaterPath('home.hero.title');       // false
```

### Validation Utilities

```typescript
import { validateFieldType, validateConfig } from '@reverso/core';

// Validate field type
validateFieldType('text');     // true
validateFieldType('invalid');  // false

// Validate configuration
const result = validateConfig(config);
if (!result.success) {
  console.error(result.errors);
}
```

### Config Loader

```typescript
import { loadConfig, defineConfig } from '@reverso/core';

// Load config from file
const config = await loadConfig();

// Define config with type safety
export default defineConfig({
  name: 'My Site',
  contentDir: './src',
});
```

## Constants

```typescript
import {
  FIELD_TYPES,
  DEFAULT_CONFIG,
  MARKER_ATTRIBUTES
} from '@reverso/core';

// All field types
console.log(FIELD_TYPES);
// ['text', 'textarea', 'wysiwyg', ...]

// Default configuration
console.log(DEFAULT_CONFIG);
// { name: 'Reverso CMS', contentDir: './src', ... }

// Marker attribute names
console.log(MARKER_ATTRIBUTES);
// { PATH: 'data-reverso', TYPE: 'data-reverso-type', ... }
```

## TypeScript Support

The package is written in TypeScript and exports all types:

```typescript
import type {
  // Configuration
  ReversoConfig,
  DatabaseConfig,
  I18nConfig,
  MediaConfig,
  AuthConfig,
  ApiConfig,

  // Schema
  Page,
  Section,
  Field,
  FieldType,
  ContentSchema,

  // Content
  Content,
  ContentValue,

  // Scanner
  MarkerInfo,
  ScanResult,

  // Utilities
  PathParts,
  ValidationResult,
} from '@reverso/core';
```

## Next Steps

- [@reverso/scanner](/packages/scanner/) - AST parser for markers
- [@reverso/db](/packages/db/) - Database layer
