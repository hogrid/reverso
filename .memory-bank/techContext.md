# Technical Context - Reverso CMS

## Tech Stack

### Monorepo
- **Turborepo** - Build orchestration
- **pnpm workspaces** - Package management
- **Changesets** - Versioning and publishing

### Core Technologies
- **Runtime:** Node.js 20+
- **Language:** TypeScript (strict mode)
- **Lint/Format:** Biome
- **Testing:** Vitest + Playwright

### Package-Specific

| Package | Technologies |
|---------|-------------|
| @reverso/core | Zod (validation) |
| @reverso/scanner | ts-morph (AST), chokidar (watch), glob |
| @reverso/db | Drizzle ORM, SQLite (dev), PostgreSQL (prod) |
| @reverso/api | Fastify, GraphQL Yoga |
| @reverso/admin | React, Vite, shadcn/ui |
| @reverso/blocks | Tiptap (WYSIWYG) |
| @reverso/forms | React Hook Form, Zod |
| @reverso/cli | Commander, Inquirer |
| @reverso/mcp | MCP SDK |
| create-reverso | npx wizard |

## Project Structure

```
reverso/
├── apps/
│   ├── docs/          # Astro Starlight
│   └── playground/    # Demo app
├── packages/
│   ├── core/          # Types, utils, config
│   ├── scanner/       # AST parser
│   ├── db/            # Drizzle schema
│   ├── api/           # Fastify server
│   ├── admin/         # React admin UI
│   ├── blocks/        # Tiptap editor
│   ├── forms/         # Form components
│   ├── cli/           # CLI commands
│   ├── mcp/           # MCP server
│   └── create-reverso/# npx installer
├── turbo.json
├── pnpm-workspace.yaml
└── biome.json
```

## Package Dependencies

```
create-reverso → @reverso/cli
                   ├── @reverso/scanner → @reverso/core
                   ├── @reverso/db → @reverso/core
                   └── @reverso/api
                         ├── @reverso/core
                         ├── @reverso/db
                         ├── @reverso/admin
                         │     ├── @reverso/blocks
                         │     └── @reverso/forms
                         └── @reverso/mcp
```

## Development Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `turbo.json` | Build pipeline and caching |
| `biome.json` | Linting and formatting rules |
| `tsconfig.json` | TypeScript base config |
| `vitest.config.ts` | Test configuration per package |
| `.changeset/config.json` | Versioning config |

## Environment Requirements
- Node.js 20+
- pnpm 9+
- Git

## External Services (Optional)
- PostgreSQL (production database)
- S3-compatible storage (file uploads)
- Redis (caching, optional)
