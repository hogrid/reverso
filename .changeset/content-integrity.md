---
"@reverso/api": minor
"@reverso/db": minor
"@reverso/scanner": patch
"@reverso/cli": minor
"@reverso/admin": patch
"@reverso/core": patch
---

Stop losing and corrupting content.

- **Schema sync never deletes by default.** `POST /schema/sync` and `syncSchema()` now default `deleteRemoved` to `false`; `reverso dev` (initial sync and watch mode) never prunes, so a half-typed marker, a file with a syntax error or a checked-out branch with fewer markers no longer erases fields and their content. Fields that are no longer in the code are kept and reported (`orphaned` in the sync result, a hint in the CLI). `reverso scan --prune` deletes them explicitly; `reverso build` still prunes, but neither prunes when the scan is incomplete (markers skipped as invalid, reported in `schema.meta.skippedMarkers`, or no markers found) nor from watch mode.
- **Scanner runs one scan at a time.** Overlapping file events are queued instead of racing (no concurrent `schema.json` writes, no stale schema finishing last), scanned files are sorted so duplicate paths resolve deterministically, and `reverso dev` reports a watch-mode startup failure instead of dying on an unhandled rejection.
- **`PATCH /content/page/:slug` is validated.** The body is checked with zod, the page must exist (404), every path must belong to that page and to a known field (400 listing the offenders instead of silently skipping them), and `?locale=` is honoured like on the GET.
- **Behaviour change: `PUT /content/:path` publishes by default**, matching the editor's bulk save and the public API (a PUT without `publish` used to leave the flag untouched, so it now re-publishes content that was unpublished); pass `publish: false` for a draft.
- **Slugs and paths accept what the scanner generates**: page slugs may contain `_` and repeated `-`/`_`, and section/field names may contain `-`, so `about_us` and `hero-banner` pages are readable and editable instead of returning 400.
- **`parsePath` rejects segments containing whitespace**, so an unclosed quote in a marker (which makes the parser swallow the rest of the line) can no longer be synced as a bogus field.
- **Admin editor**: the editor store is scoped per page (leaving a page without saving discards its edits instead of autosaving them into the next page), the saving flag can no longer get stuck after navigating mid-save, autosave stops retrying after a failure until you edit again, and edits typed during an in-flight save are kept and saved next.
