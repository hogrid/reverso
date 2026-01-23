# Active Context - Reverso CMS

## Current Status
**Phase 1 COMPLETE** - Core + Scanner implemented and tested.

## Last Session Summary (2025-01-23)

### What Was Done
1. **Implemented @reverso/core**
   - 35+ field types in `types/fields.ts`
   - Schema types (PageSchema, SectionSchema, ProjectSchema)
   - Configuration system with `defineConfig()` helper
   - Path utilities (parsePath, buildPath, matchPath, etc.)
   - Naming utilities (formatLabel, slugify, camelCase, etc.)
   - Validation utilities with Zod schemas

2. **Implemented @reverso/scanner**
   - AST parser using ts-morph
   - Attribute extractor for `data-reverso-*` markers
   - JSX walker for element traversal
   - Schema generator (fields → pages/sections hierarchy)
   - JSON and TypeScript output writers
   - Schema diff comparison
   - Watch mode with chokidar

3. **Code Review & Fixes**
   - Fixed `buildPath()` to validate empty parts and $ placement
   - Fixed `parsePath()` to validate multiple $ placeholders
   - Fixed `parseOptions()` to handle edge cases
   - Fixed `isWatching()` to return boolean instead of undefined
   - Added biome-ignore for valid Unicode regex pattern

4. **Tests**
   - 92 tests for @reverso/core
   - 59 tests for @reverso/scanner
   - All 151 tests passing

### Commit
```
6e62cdc feat: implement @reverso/core and @reverso/scanner (Phase 1)
41 files changed, 7037 insertions(+)
```

---

## Next Steps

### Immediate (Phase 2)

#### @reverso/db
1. Define Drizzle schema for content storage
   - `pages` table
   - `sections` table
   - `fields` table
   - `field_values` table (content storage)
   - `media` table (file uploads)
   - `users` table (auth)
2. Create migrations system
3. Add seed data utilities
4. Write tests

#### @reverso/api
1. Set up Fastify server
2. Implement REST endpoints:
   - `GET /api/content/:page` - Get page content
   - `POST /api/content/:page/:section/:field` - Update field
   - `GET /api/schema` - Get schema
   - `POST /api/schema/sync` - Sync from scanner
3. Add GraphQL endpoint (optional)
4. Implement file upload handling
5. Add authentication (Better Auth)

### Later (Phase 3+)
- Admin panel with React/shadcn
- Block editor with Tiptap
- CLI commands integration
- MCP server for AI

---

## Key Files to Reference

### @reverso/core
- `packages/core/src/types/fields.ts` - Field type definitions
- `packages/core/src/types/schema.ts` - Schema structure
- `packages/core/src/utils/path.ts` - Path parsing utilities
- `packages/core/src/utils/validation.ts` - Zod schemas

### @reverso/scanner
- `packages/scanner/src/scanner.ts` - Main Scanner class
- `packages/scanner/src/parser/ast-parser.ts` - AST parsing
- `packages/scanner/src/schema/generator.ts` - Schema generation
- `packages/scanner/src/output/json-writer.ts` - JSON output + diff

---

## Decisions Made

1. **ts-morph over Babel** - Better TypeScript/JSX support
2. **Hierarchical schema** - page → section → field (3 levels)
3. **$ placeholder for repeaters** - Must be at position 3
4. **Watch mode full rescan** - Simple now, optimize later
5. **Biome for lint/format** - Faster than ESLint/Prettier

---

## Open Questions

1. Should `loadConfigSync()` use jiti or tsx for loading TypeScript configs?
2. Watch mode optimization - incremental updates vs full rescan?
3. Database schema - normalize or denormalize field values?

---

## Environment Notes

- Node.js 20+
- pnpm 9+
- TypeScript strict mode
- Biome for linting (warnings for non-null assertions in tests are acceptable)
