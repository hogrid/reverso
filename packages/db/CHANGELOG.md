# @reverso/db

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

- 3af5c39: Security hardening.

  - **Role checks on every mutating route.** Forms, redirects and the sitemap invalidation now enforce roles like content and media do: viewers read, editors write, admins delete. Previously any signed-in role (a `viewer` included) could create or delete forms, submissions and redirects.
  - **Uploaded files are sandboxed.** Files a browser can run as a document (SVG, HTML, XML) are served under `/uploads/` with `Content-Security-Policy: sandbox; script-src 'none'`, so an SVG with an embedded `<script>` can no longer run on the admin origin; PDFs, video and audio stay viewable. Every upload gets `nosniff`.
  - **Admin CSP.** `script-src` no longer allows `'unsafe-inline'` (the admin build has no inline scripts); `img-src` allows `https:` so image fields can preview external URLs; `connect-src` allows the OpenStreetMap geocoder used by the map field.
  - **Login and first admin.** Emails are matched case-insensitively and stored lowercase; the first admin is created in one atomic transaction so concurrent registrations on an empty database can no longer create several admins; login errors no longer return internal messages in production.
  - **Errors.** 5xx responses never include the internal error message in production; an explicit non-empty `cookieSecret` passed to `createServer` no longer requires `REVERSO_COOKIE_SECRET`.
  - **SSRF.** Webhook URLs reject private, loopback, link-local, CGNAT and reserved IPv4 ranges and every IPv6 form that can carry one (mapped, compatible, SIIT, NAT64, 6to4, Teredo); only global unicast IPv6 is allowed. Webhooks are sent with the address resolved and validated in the same step that opens the socket, so DNS rebinding between a check and the request cannot reach a private host; failed deliveries are recorded on the submission.
  - **Proxy trust.** `REVERSO_TRUST_PROXY` accepts a hop count (`1` for one proxy) or a list of proxy addresses/CIDRs; `true` still trusts every hop.

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

- Updated dependencies [d96eda3]
- Updated dependencies [ff5d8ee]
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

- Updated dependencies [2be80c8]
- Updated dependencies
- Updated dependencies [2be80c8]
  - @reverso/core@0.3.0

## 0.1.18

### Patch Changes

- fix: resolve critical setup flow issues, add error logging to auth, fix missing DB tables, and read CLI version dynamically

## 0.1.15

### Patch Changes

- fix: add missing login_attempts table to database schema creation

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
