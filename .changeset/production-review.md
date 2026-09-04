---
"@reverso/client": minor
"@reverso/api": patch
"@reverso/admin": patch
"@reverso/cli": patch
"@reverso/scanner": patch
"@reverso/db": patch
"@reverso/core": patch
"create-reverso": patch
---

Production review of the full flow (markers → scanner → editor → publish → frontend).

- `@reverso/client`: `page.get()` coerces stored values to the kind of the fallback (an image becomes its URL, a map becomes `lat,lng`); new typed accessors `image`, `file`, `images`, `map`, `code`, `list` and the `mediaUrl` helper; relative `/uploads/` paths are rewritten to absolute URLs on the CMS origin (`mediaBaseUrl` to override or disable).
- `@reverso/api`: cookie `Secure` policy via `REVERSO_COOKIE_SECURE`, CORS allow-list via `REVERSO_CORS_ORIGIN`, CSRF plugin replaced by origin checks on cookie sessions, public page endpoint returns 404 for unknown slugs with cache headers, image uploads record width and height, media filters by type and search, safer path-prefix queries and locale validation.
- `@reverso/admin`: WYSIWYG no longer reverses typed text, map/date/number/color/repeater fields save reliably, upload failures show the server's reason, file values keep the original filename, settings page and account menu with sign out, save errors surfaced in the editor.
- `@reverso/cli`: one runtime configuration (flag → env → `reverso.config.ts` → default) shared by `init`, `dev`, `scan`, `build`, `start` and `migrate`; `.env` loaded automatically; `init` detects the source directory.
- `@reverso/scanner`: markers with non-literal expressions are skipped instead of producing bogus paths, duplicate paths are deduplicated with a warning on type conflicts, and a missing `srcDir` is reported clearly.
