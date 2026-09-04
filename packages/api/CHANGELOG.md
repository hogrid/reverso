# @reverso/api

## 0.3.0

### Minor Changes

- 2be80c8: Make the end-to-end flow (scan → admin → edit → frontend) fully functional:
  - Internal packages now link via workspace:\* (local code actually runs in the monorepo)
  - Default dev port unified to 3001; init/example configs match the real ReversoConfig schema
  - Scanner: invalid marker paths are skipped with a warning instead of crashing the dev server; repeater sections get a synthetic `page.section.$` container field
  - Admin: repeater editor renders real sub-fields (add/remove/reorder/edit items), page deep links survive reload, first-account registration copy fixed, CSP allows Google Fonts
  - API: page content endpoint returns the nested shape the editor consumes; new public endpoints `/api/reverso/public/content/...` serve published content to frontends; editor saves publish immediately
  - CLI: `reverso dev` and `reverso migrate*` honor reverso.config.ts (port, database, srcDir, scanner include/exclude)
  - New `@reverso/client` SDK for reading published content from any frontend (with graceful fallbacks)

- Launch-readiness release: the whole flow (scan, admin, edit, publish, read,
  production start) now works end to end and is covered by tests.

  **Breaking**
  - Authentication is enabled by default in every environment. `reverso dev`
    and `reverso start` require a login (first account is created in the admin)
    or an API key. Set `REVERSO_AUTH_ENABLED=false` only for local experiments.
  - `@reverso/db` creates its schema from Drizzle migrations shipped with the
    package. Existing databases created by older versions are upgraded in place
    on first open. `reverso migrate:create` was removed; `reverso migrate:status`
    now reports applied and pending migrations.

  **Fixed**
  - `reverso start` crashed with a duplicate `/auth/login` route; the Docker
    image started a file that did not exist.
  - Forms, redirects, sitemap and submissions returned 500 because the tables
    lacked the columns the query layer uses.
  - The admin could never call a protected API: the auth plugin ignored the
    session cookie. The admin now sends the cookie, handles 401 by returning to
    login, and cross-site cookie mutations are rejected.
  - Radio/select fields had no options in the editor; boolean fields showed two
    labels; redirects and media pages never rendered rows; the media "Upload"
    button did nothing; opening `/admin/login` directly left the button disabled.
  - `npx reverso dev` failed on a fresh clone because the binary was linked
    before `dist/` existed (committed `bin/` shims for cli, create-reverso, mcp).
  - Rate limiting counted admin assets and answered 500 instead of 429.
  - MCP `content_get_content` returned JSON-encoded strings; page lookups
    matched slug prefixes.

  **Added**
  - `reverso dev` records its URL and a per-session API key in
    `.reverso/dev-server.json`; `reverso scan` uses it automatically and accepts
    `--api-url` / `--api-key` (or `REVERSO_API_URL` / `REVERSO_API_KEY`) to sync a
    remote server.
  - `GET /api/reverso/media?search=` and `meta.total` on the media list;
    `GET /api/reverso/redirect?path=` is public for frontend middleware.
  - `REVERSO_TRUST_PROXY=true` for deployments behind a reverse proxy.
  - `create-reverso` scaffolds Next.js 15 / React 19 (or Vite, Astro) projects
    wired to `@reverso/client`, with versions pinned to the installer release.
  - Scanner `startWatch()` resolves when the watcher is ready.

- 2be80c8: Production-hardening pass across the stack (audit-driven):
  - **Data integrity:** `syncSchema` and `bulkUpdateContent` now run inside atomic transactions (`withTransaction`, rollback-tested); content history is pruned to a bounded size.
  - **Performance:** removed N+1 queries from `GET /schema` and `/schema/stats` (batched loads).
  - **Security:** WYSIWYG/Markdown HTML sanitized with DOMPurify; session token no longer mirrored into localStorage (httpOnly cookie remains the source of truth); CSRF protection gated by `REVERSO_CSRF_ENABLED`; SSRF validation on form webhook creation/update; file uploads validate extension before streaming; CLI uses `execFileSync` (no shell).
  - **Config loading:** `reverso.config.ts` loads on Node 20+ via jiti; CLI `scan`/`dev`/`migrate` read config through the real loader instead of regex; unified default values; `create-reverso` now emits a valid config and dependency set.
  - **Reliability:** scanner releases AST sources and debounce timers between runs (no watch-mode leak); admin fetches have timeouts and tolerate non-JSON responses; the `@reverso/client` SDK exposes an `onError` hook.
  - **Quality:** removed module import cycles in the admin field renderer; de-duplicated upload logic behind a shared `useFileDropZone` hook; replaced mock data in relation/map fields with real sources; tightened `any` casts.

### Patch Changes

- Updated dependencies [2be80c8]
- Updated dependencies
- Updated dependencies [2be80c8]
  - @reverso/core@0.3.0
  - @reverso/db@0.3.0
  - @reverso/admin@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies
  - @reverso/admin@0.2.0

## 0.1.24

### Patch Changes

- fix(admin): migrate to data router (createBrowserRouter) to fix useBlocker crash on page editor
- Updated dependencies
  - @reverso/admin@0.1.24

## 0.1.18

### Patch Changes

- fix: resolve critical setup flow issues, add error logging to auth, fix missing DB tables, and read CLI version dynamically
- Updated dependencies
  - @reverso/db@0.1.18
  - @reverso/admin@0.1.18

## 0.1.17

### Patch Changes

- fix: add detailed error logging to auth login route

## 0.1.16

### Patch Changes

- fix: disable CSRF temporarily and add detailed error logging

## 0.1.13

### Patch Changes

- fix(admin): fix login button stuck in loading state
  - Fixed isLoading initial state causing button to be stuck in loading
  - Fixed SPA routing for /admin/\* routes (login page 404)

- Updated dependencies
  - @reverso/admin@0.1.13

## 0.1.12

### Patch Changes

- feat(admin): redesign UI with Notion-inspired white theme

  ### @reverso/admin
  - Redesigned UI with clean, modern Notion-inspired white theme
  - Added stagger animations to LoginPage for smoother UX
  - Fixed auth store API_BASE endpoint configuration
  - Added canRegister state for WordPress-like first-time setup flow
  - Improved Button, Input, Card, and ThemeToggle components
  - Better contrast and accessibility in color system

  ### @reverso/api
  - Added `/auth/setup-status` endpoint for setup detection
  - Updated `/auth/register` to only allow registration when no users exist
  - Improved error responses with proper 401 status codes

  ### @reverso/cli
  - Improved dev server messaging with clearer setup instructions
  - Added admin credentials display on first-time setup
  - Fixed lint issues and added biome.json configuration

  ### @reverso/db
  - Exported `getFirstUser` helper function for setup detection

- Updated dependencies
  - @reverso/admin@0.1.12
  - @reverso/db@0.1.12

## 0.1.11

### Patch Changes

- ### @reverso/admin
  - **BREAKING**: Redesigned UI with Notion-inspired clean white theme
  - Refined color system with better contrast and subtle accents
  - Added stagger animations to LoginPage
  - Fixed auth store API_BASE (was pointing to wrong endpoint)
  - Added `canRegister` state for WordPress-like registration flow
  - Improved Button, Input, Card, and ThemeToggle components

  ### @reverso/api
  - Added `/auth/setup-status` endpoint for setup detection
  - Updated `/auth/register` to only allow registration when no users exist (WordPress-like)
  - Fixed auth routes to return 401 correctly in production

  ### @reverso/cli
  - Improved dev server messaging with clearer setup instructions
  - Added admin credentials display on first-time setup

  ### @reverso/db
  - Exported `getFirstUser` helper function for setup detection

- Updated dependencies
  - @reverso/admin@0.1.11
  - @reverso/db@0.1.11

## 0.1.0

### Minor Changes

- Initial release of Reverso CMS - The front-to-back headless CMS.

  ## Features

  ### @reverso/core
  - Type definitions for fields, schema, content, and configuration
  - Field type constants (35+ types including text, image, blocks, relations)
  - Configuration loader and validation
  - Utility functions for naming conventions and path handling

  ### @reverso/scanner
  - AST parser using ts-morph to detect `data-reverso-*` markers
  - Automatic schema generation from React/JSX components
  - Support for repeaters and flexible content

  ### @reverso/db
  - Drizzle ORM schema for SQLite (dev) and PostgreSQL (prod)
  - Database migrations system
  - Query functions for pages, content, fields, media, forms

  ### @reverso/api
  - Fastify REST API with full CRUD operations
  - Authentication with Better Auth (email/password, magic link, OAuth)
  - Media upload with image processing
  - Form submissions with webhook support
  - Security features: rate limiting, CSRF protection, input validation

  ### @reverso/admin
  - React + shadcn/ui admin panel
  - Visual page and content editor
  - Media library with drag-and-drop upload
  - Form builder interface
  - Real-time preview

  ### @reverso/blocks
  - Tiptap-based block editor
  - Rich text formatting (bold, italic, headings, lists)
  - Code blocks with syntax highlighting
  - Image and table support

  ### @reverso/forms
  - Form builder with 10 field types
  - Multi-step forms with progress indicator
  - Conditional field logic
  - Zod-based validation
  - Honeypot spam protection

  ### @reverso/cli
  - `reverso scan` - Scan codebase for markers
  - `reverso dev` - Development server with hot reload
  - `reverso build` - Production build
  - `reverso migrate` - Database migrations

  ### @reverso/mcp
  - MCP Server for AI integration (Claude, etc.)
  - Tools for content management, schema inspection, media handling

  ### create-reverso
  - Interactive CLI wizard for project setup
  - Framework support: Next.js, Vite, Astro
  - Database options: SQLite, PostgreSQL

### Patch Changes

- Updated dependencies
  - @reverso/core@0.1.0
  - @reverso/db@0.1.0
