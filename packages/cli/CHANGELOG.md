# @reverso/cli

## 0.4.0

### Minor Changes

- d96eda3: Stop losing and corrupting content.

  - **Schema sync never deletes by default.** `POST /schema/sync` and `syncSchema()` now default `deleteRemoved` to `false`; `reverso dev` (initial sync and watch mode) never prunes, so a half-typed marker, a file with a syntax error or a checked-out branch with fewer markers no longer erases fields and their content. Fields that are no longer in the code are kept and reported (`orphaned` in the sync result, a hint in the CLI). `reverso scan --prune` deletes them explicitly; `reverso build` still prunes, but neither prunes when the scan is incomplete (markers skipped as invalid, reported in `schema.meta.skippedMarkers`, or no markers found) nor from watch mode.
  - **Scanner runs one scan at a time.** Overlapping file events are queued instead of racing (no concurrent `schema.json` writes, no stale schema finishing last), scanned files are sorted so duplicate paths resolve deterministically, and `reverso dev` reports a watch-mode startup failure instead of dying on an unhandled rejection.
  - **`PATCH /content/page/:slug` is validated.** The body is checked with zod, the page must exist (404), every path must belong to that page and to a known field (400 listing the offenders instead of silently skipping them), and `?locale=` is honoured like on the GET.
  - **Behaviour change: `PUT /content/:path` publishes by default**, matching the editor's bulk save and the public API (a PUT without `publish` used to leave the flag untouched, so it now re-publishes content that was unpublished); pass `publish: false` for a draft.
  - **Slugs and paths accept what the scanner generates**: page slugs may contain `_` and repeated `-`/`_`, and section/field names may contain `-`, so `about_us` and `hero-banner` pages are readable and editable instead of returning 400.
  - **`parsePath` rejects segments containing whitespace**, so an unclosed quote in a marker (which makes the parser swallow the rest of the line) can no longer be synced as a bogus field.
  - **Admin editor**: the editor store is scoped per page (leaving a page without saving discards its edits instead of autosaving them into the next page), the saving flag can no longer get stuck after navigating mid-save, autosave stops retrying after a failure until you edit again, and edits typed during an in-flight save are kept and saved next.

### Patch Changes

- add5c5d: Production deployment fixes.

  - `reverso start` exits with a clear error when `REVERSO_COOKIE_SECRET` is missing instead of printing a warning and then crashing (or silently using the development secret when `NODE_ENV` is unset); it now defaults `NODE_ENV` to `production`.
  - `reverso start` and `reverso build` refuse to run when `reverso.config.ts` exists but cannot be loaded, instead of falling back to the default (empty) database.
  - The Docker image is assembled with `pnpm deploy`, so the runtime stage ships the CLI with every production dependency and actually starts; `docker-compose.yml` reads `.env`, forwards `REVERSO_ALLOW_BOOTSTRAP` and `REVERSO_ALLOWED_REDIRECT_DOMAINS`, and defaults `REVERSO_TRUST_PROXY` to `false` when the port is published directly.

- b7146db: Integrator experience fixes.

  **@reverso/client**
  - Outside production, a failing request without `onError` now logs one `console.warn` per path with the status or cause and the full URL, instead of falling back silently.
  - New options: `revalidate` and `tags` (sent as Next.js `next: { revalidate, tags }`; `no-store` is no longer forced when `revalidate` is set), `headers`, and `dedupeMs`. Concurrent `getPage` calls for the same slug share one request, and a successful result is reused for `dedupeMs` (default 1000, `0` disables it).
  - `/uploads/...` paths inside rich text (quoted HTML attribute values and Markdown link/image targets) are rewritten to absolute URLs.
  - `exports` gains a `default` condition.

  **@reverso/scanner**
  - Fields now get a `defaultContent`. JSX text was never read before; now it is, with entities decoded and whitespace collapsed. The scanner also reads `{x.get(path, 'fallback')}` children, image `src`, link `href` and `data-reverso-default`.
  - Dynamic or empty marker paths and unknown `data-reverso-type` values are reported with `file:line`.
  - Fields keep source order (file, line, column). `sort` only orders pages and sections.
  - Watch mode works for projects under folders named `build`, `dist`, `.next` or `node_modules`. It also catches changes the OS drops while the watch is starting (macOS FSEvents), which made watch tests flaky.

  **@reverso/cli**
  - `reverso dev` exits with a clear error when an explicitly requested port is busy. When it has to move off the default port, it warns with the new URL and tells you to set `REVERSO_URL`.
  - It prints a hint when the initial scan finds no markers.
  - `.reverso/dev-server.json` is written only once the API listens, and removed if startup fails.

  **create-reverso**
  - JavaScript projects get a `jsconfig.json` with the `@/*` alias.
  - Project names are validated, including names given with `--yes` or as a positional argument.
  - Ctrl+C on any prompt aborts.
  - The Next.js template reads the runtime `REVERSO_URL` before `NEXT_PUBLIC_REVERSO_URL`.

- ff5d8ee: Production review of the full flow (markers → scanner → editor → publish → frontend).

  - `@reverso/client`: `page.get()` coerces stored values to the kind of the fallback (an image becomes its URL, a map becomes `lat,lng`); new typed accessors `image`, `file`, `images`, `map`, `code`, `list` and the `mediaUrl` helper; relative `/uploads/` paths are rewritten to absolute URLs on the CMS origin (`mediaBaseUrl` to override or disable).
  - `@reverso/api`: cookie `Secure` policy via `REVERSO_COOKIE_SECURE`, CORS allow-list via `REVERSO_CORS_ORIGIN`, CSRF plugin replaced by origin checks on cookie sessions, public page endpoint returns 404 for unknown slugs with cache headers, image uploads record width and height, media filters by type and search, safer path-prefix queries and locale validation.
  - `@reverso/admin`: WYSIWYG no longer reverses typed text, map/date/number/color/repeater fields save reliably, upload failures show the server's reason, file values keep the original filename, settings page and account menu with sign out, save errors surfaced in the editor.
  - `@reverso/cli`: one runtime configuration (flag → env → `reverso.config.ts` → default) shared by `init`, `dev`, `scan`, `build`, `start` and `migrate`; `.env` loaded automatically; `init` detects the source directory.
  - Review follow-ups: `REVERSO_TRUST_PROXY` is honoured when callers forward an undefined `trustProxy`; login lockout tracks the account (5 failures) and the source address (20 failures) as independent buckets; legacy databases translate the boolean `webhook_sent` flag into `webhook_sent_at` instead of renaming it; projects generated by `create-reverso` keep `@reverso/cli` and `@reverso/core` in `dependencies` so `reverso start` works after a production install.
  - `@reverso/scanner`: markers with non-literal expressions are skipped instead of producing bogus paths, duplicate paths are deduplicated with a warning on type conflicts, and a missing `srcDir` is reported clearly.

- b97c9de: Fixes from the review of the launch-readiness branch.

  - `@reverso/api`: the cross-site check for cookie-authenticated mutations compares the Origin against the proxy-aware host and the configured CORS origins, so an admin behind nginx or the Vite dev proxy can save again instead of getting 403; a rejected cookie now falls through to API-key and Bearer authentication. The rate limiter only gives a bucket of its own to the configured API key, so an arbitrary `X-API-Key` header can no longer mint unlimited buckets. Login lockout is tracked per account _and_ source address, so a stranger can no longer keep a known account locked out; expired attempt rows are pruned periodically. Creating the first admin on an empty database is restricted to the machine running the server unless `REVERSO_ALLOW_BOOTSTRAP=true`; locality is read from the TCP peer, never from `X-Forwarded-For`, and behind a proxy only the explicit opt-in works.
  - `@reverso/db`: adopting a legacy database drops obsolete `NOT NULL` columns that the current schema no longer writes, so form submissions stop failing on `form_submissions.updated_at`. Media search escapes `%` and `_` with an explicit `ESCAPE` clause, so filenames containing them are found.
  - `@reverso/scanner`: a scan that cannot read its source directory reports the failure instead of producing an empty schema, which used to be written to disk and pushed to the server.
  - `@reverso/cli`: `scan` and `dev` never sync a schema with no fields, so a wrong `srcDir` cannot delete every field and its content; `scan` exits non-zero on a failed scan and prints the configured output directory instead of `undefined`.
  - `@reverso/admin`: the WYSIWYG editor keeps its content when the Visual tab is reopened after the HTML tab, instead of coming back empty and overwriting the field on the next save.
  - `@reverso/mcp`: pending migrations are applied before the first query, so pointing the server at a database written by an older Reverso no longer fails on renamed columns.

  The Vite dev proxy no longer rewrites `Host`, which is what made the standalone admin's own writes look cross-site.

- Updated dependencies [4c655e5]
- Updated dependencies [3af5c39]
- Updated dependencies [d96eda3]
- Updated dependencies [cc30238]
- Updated dependencies [b7146db]
- Updated dependencies [ff5d8ee]
- Updated dependencies [054226d]
- Updated dependencies [b97c9de]
  - @reverso/api@0.4.0
  - @reverso/db@0.4.0
  - @reverso/scanner@0.4.0
  - @reverso/core@0.4.0

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

- 2be80c8: Fix the three real-world install/usage flows (validated against a local npm registry):
  - **Watch mode now detects file changes** (`@reverso/scanner`): chokidar v4+
    dropped glob-pattern support, so the watcher (which passed `src/**/*.tsx`
    globs) never fired — new/edited markers were ignored until a full restart.
    The watcher now watches the source directory and filters with an `ignored`
    predicate (extensions from `include`, dirs from `exclude`). Incremental
    field sync works again. Also recreates the ts-morph Project per scan so
    modified files are always re-read from disk (no stale content).
  - **`reverso init --yes` no longer blocks** on the admin-account prompt; in
    non-interactive mode it generates a strong random password and prints it
    once.
  - **`create-reverso` supports non-interactive use**: accepts an optional
    positional project name and a `--yes` flag to scaffold with defaults
    (e.g. `npx create-reverso my-app --yes`).

- Updated dependencies [2be80c8]
- Updated dependencies [2be80c8]
- Updated dependencies
- Updated dependencies [2be80c8]
  - @reverso/core@0.3.0
  - @reverso/scanner@0.3.0
  - @reverso/db@0.3.0
  - @reverso/api@0.3.0

## 0.2.0

### Patch Changes

- @reverso/api@0.2.0

## 0.1.23

### Patch Changes

- feat(cli): auto-sync schema to database after scan and during watch mode
  fix(scanner): gracefully skip markers with invalid paths instead of crashing
- Updated dependencies
  - @reverso/scanner@0.1.23

## 0.1.21

### Patch Changes

- fix(cli): scan command now reads srcDir from reverso.config.ts instead of always defaulting to ./src

## 0.1.20

### Patch Changes

- security(cli): delete admin.json after seeding admin user to remove plaintext credentials from disk

## 0.1.19

### Patch Changes

- fix(cli): auto-seed admin user from .reverso/admin.json on first dev server start

## 0.1.18

### Patch Changes

- fix: resolve critical setup flow issues, add error logging to auth, fix missing DB tables, and read CLI version dynamically
- Updated dependencies
  - @reverso/api@0.1.18
  - @reverso/db@0.1.18

## 0.1.14

### Patch Changes

- fix: read CLI version dynamically from package.json instead of hardcoded value

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
  - @reverso/api@0.1.12
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
  - @reverso/api@0.1.11
  - @reverso/db@0.1.11

## 0.1.8

### Patch Changes

- Fix port number in init command messages (3001 instead of 4000)

## 0.1.7

### Patch Changes

- Use node-gyp directly to rebuild better-sqlite3 native module instead of pnpm/npm rebuild

## 0.1.6

### Patch Changes

- Run native module rebuild before starting dev server in init command

## 0.1.5

### Patch Changes

- Auto-fix common errors in dev command:
  - Auto-rebuild native modules (better-sqlite3)
  - Auto-install missing dependencies
  - Auto-find available port if default is in use
  - Auto-create .reverso directory
  - Auto-run init if no config found
  - Handle permission and database lock errors gracefully

## 0.1.4

### Patch Changes

- Make init command interactive with auto-install, scan and dev server

## 0.1.3

### Patch Changes

- Add `reverso init` command for existing projects with branded CLI banner

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
  - @reverso/scanner@0.1.0
  - @reverso/db@0.1.0
  - @reverso/api@0.1.0
