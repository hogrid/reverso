# @reverso/forms

## 0.3.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [2be80c8]
- Updated dependencies
- Updated dependencies [2be80c8]
  - @reverso/core@0.3.0

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
