# @reverso/mcp

## 0.4.0

### Minor Changes

- aeb0830: The MCP server is now a client of the Reverso HTTP API instead of opening the SQLite database.

  **Breaking**

  - `reverso-mcp` no longer takes a database path. The `--database` / `-d` flag (and the old `.reverso/dev.db` default) is gone; the server exits with a clear message if it is passed. Configure the server with `REVERSO_API_URL` (default `http://localhost:3001`, or `--api-url`) and `REVERSO_API_KEY` (or `--api-key`), the admin API key your CMS runs with. The key is **required** and must be at least 16 characters: the server refuses to start otherwise, instead of accepting any key and failing on the first call.
  - `McpServerConfig.databasePath` was replaced by `apiUrl` / `apiKey`. `@reverso/db` is no longer a runtime dependency.
  - `publish_content` / `unpublish_content` take only `path`; `get_submission` and `update_submission_status` require `formId` as well as `id`; `update_content` and `bulk_update_content` no longer accept `changedBy` (the API records the key's user).

  **Fixed**

  - Authentication was fake: any key present in the environment counted as "authenticated" and every write tool wrote straight into the database, bypassing the API's validation, role checks, publish semantics and webhooks. Every tool and resource now calls the API with `X-API-Key`, so a wrong key is a `401` tool error and unknown fields or fields of another page are rejected by the API (`400`/`404`) instead of being written. `update_content` publishes by default (pass `publish: false` for a draft), matching `PUT /content/:path`.
  - Tool inputs are validated with zod before any request: a write without a `value` is rejected.
  - API errors (400/401/403/404, unreachable API) are returned as tool errors carrying the HTTP status and the API's message.
  - `reverso://pages/{slug}` and `reverso://content/{path}` are registered as real resource templates (`ResourceTemplate`), so clients can list pages as resources and read them by URI; previously they were static URIs that never matched.
  - `close()` closes the MCP server.

### Patch Changes

- b97c9de: Fixes from the review of the launch-readiness branch.

  - `@reverso/api`: the cross-site check for cookie-authenticated mutations compares the Origin against the proxy-aware host and the configured CORS origins, so an admin behind nginx or the Vite dev proxy can save again instead of getting 403; a rejected cookie now falls through to API-key and Bearer authentication. The rate limiter only gives a bucket of its own to the configured API key, so an arbitrary `X-API-Key` header can no longer mint unlimited buckets. Login lockout is tracked per account _and_ source address, so a stranger can no longer keep a known account locked out; expired attempt rows are pruned periodically. Creating the first admin on an empty database is restricted to the machine running the server unless `REVERSO_ALLOW_BOOTSTRAP=true`; locality is read from the TCP peer, never from `X-Forwarded-For`, and behind a proxy only the explicit opt-in works.
  - `@reverso/db`: adopting a legacy database drops obsolete `NOT NULL` columns that the current schema no longer writes, so form submissions stop failing on `form_submissions.updated_at`. Media search escapes `%` and `_` with an explicit `ESCAPE` clause, so filenames containing them are found.
  - `@reverso/scanner`: a scan that cannot read its source directory reports the failure instead of producing an empty schema, which used to be written to disk and pushed to the server.
  - `@reverso/cli`: `scan` and `dev` never sync a schema with no fields, so a wrong `srcDir` cannot delete every field and its content; `scan` exits non-zero on a failed scan and prints the configured output directory instead of `undefined`.
  - `@reverso/admin`: the WYSIWYG editor keeps its content when the Visual tab is reopened after the HTML tab, instead of coming back empty and overwriting the field on the next save.
  - `@reverso/mcp`: pending migrations are applied before the first query, so pointing the server at a database written by an older Reverso no longer fails on renamed columns.

  The Vite dev proxy no longer rewrites `Host`, which is what made the standalone admin's own writes look cross-site.

- Updated dependencies [d96eda3]
- Updated dependencies [ff5d8ee]
  - @reverso/core@0.4.0

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
