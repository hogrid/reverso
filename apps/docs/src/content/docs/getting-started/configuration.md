---
title: Configuration
description: Configure Reverso CMS for your project
---

# Configuration

Reverso is configured via a `reverso.config.ts` (or `.js`) file in your project root.

## Full Configuration Example

```typescript
import type { ReversoConfig } from '@reverso/core';

export default {
  // Source directory to scan for markers
  srcDir: './src',

  // Output directory for generated files
  outputDir: '.reverso',

  // File patterns to include/exclude
  include: ['**/*.tsx', '**/*.jsx'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.*'],

  // Database configuration
  database: {
    type: 'sqlite', // or 'postgres'
    url: '.reverso/dev.db',
    // For PostgreSQL:
    // url: process.env.DATABASE_URL,
  },

  // API server configuration
  api: {
    port: 3001,
    host: 'localhost',
    cors: true,
    // Custom CORS origins
    // corsOrigins: ['http://localhost:3000'],
  },

  // Admin panel configuration
  admin: {
    title: 'My CMS',
    // Custom branding
    // logo: '/logo.png',
    // primaryColor: '#2563eb',
  },

  // Media configuration
  media: {
    uploadDir: '.reverso/uploads',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
  },

  // Internationalization
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt', 'es'],
  },
} satisfies ReversoConfig;
```

## Configuration Options

### srcDir

The directory containing your source files to scan for markers.

```typescript
srcDir: './src'
```

### outputDir

Where Reverso stores generated files (schema, database, uploads).

```typescript
outputDir: '.reverso'
```

### include / exclude

Glob patterns for files to include or exclude from scanning.

```typescript
include: ['**/*.tsx', '**/*.jsx'],
exclude: ['**/node_modules/**', '**/*.test.*']
```

### database

Database connection configuration.

#### SQLite (Development)

```typescript
database: {
  type: 'sqlite',
  url: '.reverso/dev.db',
}
```

#### PostgreSQL (Production)

```typescript
database: {
  type: 'postgres',
  url: process.env.DATABASE_URL,
}
```

### api

API server configuration.

```typescript
api: {
  port: 3001,
  host: 'localhost',
  cors: true,
}
```

### admin

Admin panel customization.

```typescript
admin: {
  title: 'My Site Admin',
  logo: '/logo.png',
}
```

### media

Media upload settings.

```typescript
media: {
  uploadDir: '.reverso/uploads',
  maxFileSize: 10 * 1024 * 1024,
  allowedTypes: ['image/*', 'video/*'],
}
```

### i18n

Internationalization settings.

```typescript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'pt', 'es', 'fr'],
}
```

## Environment Variables

Some settings can be overridden with environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Database connection string |
| `REVERSO_PORT` | API server port |
| `REVERSO_HOST` | API server host |
| `REVERSO_COOKIE_SECRET` | Cookie signing secret (required in production) |

## TypeScript Support

For full type safety, import the `ReversoConfig` type:

```typescript
import type { ReversoConfig } from '@reverso/core';

const config: ReversoConfig = {
  // Full autocomplete support
};

export default config;
```

## Next Steps

- [How It Works](/concepts/how-it-works/) - Understand the Reverso workflow
- [Markers](/concepts/markers/) - Learn about data-reverso attributes
