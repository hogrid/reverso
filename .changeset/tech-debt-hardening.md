---
"@reverso/core": minor
"@reverso/db": minor
"@reverso/api": minor
"@reverso/admin": minor
"@reverso/cli": minor
"@reverso/scanner": minor
"@reverso/mcp": minor
"create-reverso": minor
---

Production-hardening pass across the stack (audit-driven):

- **Data integrity:** `syncSchema` and `bulkUpdateContent` now run inside atomic transactions (`withTransaction`, rollback-tested); content history is pruned to a bounded size.
- **Performance:** removed N+1 queries from `GET /schema` and `/schema/stats` (batched loads).
- **Security:** WYSIWYG/Markdown HTML sanitized with DOMPurify; session token no longer mirrored into localStorage (httpOnly cookie remains the source of truth); CSRF protection gated by `REVERSO_CSRF_ENABLED`; SSRF validation on form webhook creation/update; file uploads validate extension before streaming; CLI uses `execFileSync` (no shell).
- **Config loading:** `reverso.config.ts` loads on Node 20+ via jiti; CLI `scan`/`dev`/`migrate` read config through the real loader instead of regex; unified default values; `create-reverso` now emits a valid config and dependency set.
- **Reliability:** scanner releases AST sources and debounce timers between runs (no watch-mode leak); admin fetches have timeouts and tolerate non-JSON responses; the `@reverso/client` SDK exposes an `onError` hook.
- **Quality:** removed module import cycles in the admin field renderer; de-duplicated upload logic behind a shared `useFileDropZone` hook; replaced mock data in relation/map fields with real sources; tightened `any` casts.
