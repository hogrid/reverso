---
title: "@reverso/cli"
description: Command-line interface for Reverso CMS
---

# @reverso/cli

The CLI package provides commands for scanning, developing, and managing your Reverso CMS project.

## Installation

```bash
# Global installation
npm install -g @reverso/cli

# Or use via npx
npx @reverso/cli <command>
```

## Commands

### reverso dev

Start the development server:

```bash
reverso dev

# Options
reverso dev --port 4000      # Custom port (default: 4000)
reverso dev --host 0.0.0.0   # Custom host (default: localhost)
reverso dev --open           # Open browser automatically
```

This command:
1. Runs the scanner to detect markers
2. Starts the API server
3. Serves the admin panel at `/admin`
4. Watches for file changes

### reverso scan

Scan your codebase for `data-reverso` markers:

```bash
reverso scan

# Options
reverso scan --dir ./src        # Custom directory
reverso scan --verbose          # Detailed output
reverso scan --watch            # Watch mode
reverso scan --output schema.json # Export schema
```

Output:
```
Scanning ./src...

Found:
  Pages: 5
  Sections: 12
  Fields: 47

Pages:
  ✓ home (3 sections, 15 fields)
  ✓ about (2 sections, 8 fields)
  ✓ services (4 sections, 18 fields)
  ✓ contact (2 sections, 4 fields)
  ✓ blog (1 section, 2 fields)

Schema synced to database.
```

### reverso start

Start the production server:

```bash
reverso start

# Options
reverso start --port 4000
reverso start --host 0.0.0.0
```

### reverso migrate

Run database migrations:

```bash
reverso migrate

# Options
reverso migrate --seed          # Seed initial data
reverso migrate --force         # Force reset (destructive!)
reverso migrate --dry-run       # Preview changes
```

### reverso build

Build the admin panel for production:

```bash
reverso build

# Options
reverso build --output ./dist
```

### reverso init

Initialize Reverso in an existing project:

```bash
reverso init

# Interactive prompts:
# - Database type (SQLite/PostgreSQL)
# - Content directory
# - i18n configuration
```

Creates:
- `reverso.config.ts`
- `.reverso/` directory
- Database file (if SQLite)

### reverso export

Export content to JSON:

```bash
reverso export

# Options
reverso export --output content.json
reverso export --locale en
reverso export --page home
```

### reverso import

Import content from JSON:

```bash
reverso import content.json

# Options
reverso import content.json --merge     # Merge with existing
reverso import content.json --overwrite # Overwrite existing
```

## Configuration

The CLI reads from `reverso.config.ts`:

```typescript
import type { ReversoConfig } from '@reverso/core';

export default {
  // Required
  contentDir: './src',

  // Database
  database: {
    type: 'sqlite',
    path: '.reverso/data.db',
  },

  // Server
  api: {
    port: 4000,
    host: 'localhost',
  },

  // Scanner
  scanner: {
    extensions: ['.tsx', '.jsx'],
    ignore: ['node_modules/**', '**/*.test.*'],
  },
} satisfies ReversoConfig;
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `HOST` | Server host | `localhost` |
| `DATABASE_URL` | Database connection | `.reverso/data.db` |
| `AUTH_SECRET` | JWT secret | (required in production) |
| `NODE_ENV` | Environment | `development` |

## Programmatic Usage

```typescript
import { cli, commands } from '@reverso/cli';

// Run a command programmatically
await commands.scan({ dir: './src', verbose: true });
await commands.dev({ port: 4000 });
await commands.migrate({ seed: true });
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Scan content
        run: npx @reverso/cli scan

      - name: Run migrations
        run: npx @reverso/cli migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Build
        run: npx @reverso/cli build
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

# Run migrations
RUN npx @reverso/cli migrate

# Build admin
RUN npx @reverso/cli build

# Start production server
CMD ["npx", "@reverso/cli", "start"]
```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
reverso dev --port 4001
# Or kill the process using the port
```

**Database connection failed:**
```bash
# Check database path exists
ls -la .reverso/

# Or check PostgreSQL connection
reverso migrate --dry-run
```

**No markers found:**
```bash
# Check the content directory
reverso scan --dir ./src --verbose

# Verify file extensions
reverso scan --extensions .tsx,.jsx,.ts,.js
```

**Permission denied:**
```bash
# Fix file permissions
chmod +x node_modules/.bin/reverso
```

### Debug Mode

```bash
DEBUG=reverso:* reverso dev
```

Shows detailed logs for:
- Scanner operations
- Database queries
- API requests
- File watching

## TypeScript Support

The CLI is written in TypeScript. Configuration files support:

```typescript
// reverso.config.ts
import type { ReversoConfig } from '@reverso/core';

export default {
  // Full type safety
} satisfies ReversoConfig;
```

## Next Steps

- [Installation Guide](/getting-started/installation/) - Getting started
- [Configuration](/getting-started/configuration/) - Full config options
- [create-reverso](/packages/create-reverso/) - Project wizard
