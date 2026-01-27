---
title: Installation
description: Install Reverso CMS in your project
---

# Installation

There are two ways to get started with Reverso CMS:

## Option 1: Create a New Project (Recommended)

The easiest way to start is using the `create-reverso` CLI:

```bash
npx create-reverso@latest
```

This will guide you through creating a new project with:
- Framework selection (Next.js, Vite, or Astro)
- Database selection (SQLite or PostgreSQL)
- TypeScript configuration
- Example components with markers

## Option 2: Add to Existing Project

### 1. Install the CLI

```bash
# npm
npm install @reverso/cli --save-dev

# pnpm
pnpm add -D @reverso/cli

# yarn
yarn add -D @reverso/cli
```

### 2. Initialize Reverso

Create a `reverso.config.ts` file in your project root:

```typescript
import type { ReversoConfig } from '@reverso/core';

export default {
  srcDir: './src',
  outputDir: '.reverso',
  database: {
    type: 'sqlite',
    url: '.reverso/dev.db',
  },
  api: {
    port: 3001,
    cors: true,
  },
  admin: {
    title: 'My CMS',
  },
} satisfies ReversoConfig;
```

### 3. Add Scripts to package.json

```json
{
  "scripts": {
    "cms:scan": "reverso scan",
    "cms:dev": "reverso dev",
    "cms:migrate": "reverso migrate"
  }
}
```

### 4. Add .gitignore entries

```
# Reverso
.reverso/dev.db
.reverso/dev.db-shm
.reverso/dev.db-wal
.reverso/uploads/
```

## System Requirements

- **Node.js**: 20.0 or higher
- **Package Manager**: npm, pnpm, yarn, or bun
- **Database**: SQLite (included) or PostgreSQL 14+

## Next Steps

- [Configuration](/getting-started/configuration/) - Configure Reverso for your project
- [Quick Start](/getting-started/quick-start/) - Add your first markers
