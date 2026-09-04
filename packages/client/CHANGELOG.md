# @reverso/client

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
