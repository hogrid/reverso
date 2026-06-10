---
"@reverso/core": minor
"@reverso/scanner": minor
"@reverso/db": minor
"@reverso/api": minor
"@reverso/admin": minor
"@reverso/cli": minor
"@reverso/client": minor
---

Make the end-to-end flow (scan → admin → edit → frontend) fully functional:

- Internal packages now link via workspace:* (local code actually runs in the monorepo)
- Default dev port unified to 3001; init/example configs match the real ReversoConfig schema
- Scanner: invalid marker paths are skipped with a warning instead of crashing the dev server; repeater sections get a synthetic `page.section.$` container field
- Admin: repeater editor renders real sub-fields (add/remove/reorder/edit items), page deep links survive reload, first-account registration copy fixed, CSP allows Google Fonts
- API: page content endpoint returns the nested shape the editor consumes; new public endpoints `/api/reverso/public/content/...` serve published content to frontends; editor saves publish immediately
- CLI: `reverso dev` and `reverso migrate*` honor reverso.config.ts (port, database, srcDir, scanner include/exclude)
- New `@reverso/client` SDK for reading published content from any frontend (with graceful fallbacks)
