---
title: Packages Overview
description: Overview of all packages in the Reverso CMS monorepo
---

# Packages Overview

Reverso is organized as a monorepo with multiple packages, each handling a specific concern.

## Package Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     create-reverso                          │
│                    (Project Wizard)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      @reverso/cli                           │
│                   (CLI Commands)                            │
└──────┬──────────────────┬───────────────────────┬───────────┘
       │                  │                       │
       ▼                  ▼                       ▼
┌──────────────┐  ┌──────────────┐        ┌──────────────┐
│ @reverso/    │  │ @reverso/db  │        │ @reverso/api │
│   scanner    │  │  (Database)  │        │   (Server)   │
└──────┬───────┘  └──────┬───────┘        └──────┬───────┘
       │                 │                       │
       │                 │          ┌────────────┼────────────┐
       │                 │          │            │            │
       ▼                 ▼          ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                      @reverso/core                          │
│                  (Types & Utilities)                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     @reverso/admin                          │
│                    (Admin Panel)                            │
├─────────────────────────┬───────────────────────────────────┤
│    @reverso/blocks      │         @reverso/forms            │
│   (Block Editor)        │        (Form Builder)             │
└─────────────────────────┴───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      @reverso/mcp                           │
│                    (AI Integration)                         │
└─────────────────────────────────────────────────────────────┘
```

## Package Summary

| Package | Description | npm |
|---------|-------------|-----|
| [`@reverso/core`](/packages/core/) | Shared types, utilities, and configuration | `@reverso/core` |
| [`@reverso/scanner`](/packages/scanner/) | AST parser for detecting markers | `@reverso/scanner` |
| [`@reverso/db`](/packages/db/) | Drizzle ORM schema and queries | `@reverso/db` |
| [`@reverso/api`](/packages/api/) | Fastify REST API server | `@reverso/api` |
| [`@reverso/admin`](/packages/admin/) | React admin panel | `@reverso/admin` |
| [`@reverso/blocks`](/packages/blocks/) | Tiptap block editor | `@reverso/blocks` |
| [`@reverso/forms`](/packages/forms/) | Form builder components | `@reverso/forms` |
| [`@reverso/cli`](/packages/cli/) | CLI commands | `@reverso/cli` |
| [`@reverso/mcp`](/packages/mcp/) | MCP server for AI | `@reverso/mcp` |
| [`create-reverso`](/packages/create-reverso/) | Project wizard | `create-reverso` |

## Dependency Flow

### Core Layer

**@reverso/core** is the foundation:
- TypeScript types for the entire system
- Configuration schema and loader
- Validation utilities
- No external Reverso dependencies

### Data Layer

**@reverso/scanner** → `@reverso/core`
- Parses JSX/TSX files
- Extracts `data-reverso-*` markers
- Generates schema

**@reverso/db** → `@reverso/core`
- Drizzle ORM schemas
- Database migrations
- Query functions

### Server Layer

**@reverso/api** → `@reverso/core`, `@reverso/db`
- REST API endpoints
- Serves admin panel
- Handles media uploads

### UI Layer

**@reverso/admin** → `@reverso/blocks`, `@reverso/forms`
- React admin interface
- Page editor
- Content management

**@reverso/blocks** (standalone)
- Tiptap-based block editor
- Used by admin for WYSIWYG fields

**@reverso/forms** (standalone)
- Form rendering components
- Used by admin and frontend

### CLI Layer

**@reverso/cli** → `@reverso/scanner`, `@reverso/db`, `@reverso/api`
- `reverso scan` - Run scanner
- `reverso dev` - Development server
- `reverso migrate` - Run migrations

### Integration Layer

**@reverso/mcp** → `@reverso/db`, `@reverso/core`
- Model Context Protocol server
- AI tool definitions
- Content operations via MCP

### Installer

**create-reverso** → `@reverso/cli`
- Project scaffolding
- Framework selection
- Database setup

## Installation

Most users only need the CLI:

```bash
# Create new project
npx create-reverso my-project

# Or install globally
npm install -g @reverso/cli
```

For manual setup:

```bash
# Core packages
npm install @reverso/core @reverso/db @reverso/api

# Optional packages
npm install @reverso/scanner  # If running scanner manually
npm install @reverso/blocks   # If using block editor
npm install @reverso/forms    # If using form builder
npm install @reverso/mcp      # If using MCP integration
```

## Development

### Building All Packages

```bash
# From monorepo root
pnpm install
pnpm build
```

### Running Tests

```bash
# All packages
pnpm test

# Specific package
pnpm --filter @reverso/core test
```

### Package Scripts

Each package supports:

| Script | Description |
|--------|-------------|
| `build` | Build for production |
| `dev` | Development mode |
| `test` | Run tests |
| `typecheck` | TypeScript check |
| `lint` | Run linter |

## Next Steps

- [@reverso/core](/packages/core/) - Core types and utilities
- [@reverso/cli](/packages/cli/) - CLI commands reference
