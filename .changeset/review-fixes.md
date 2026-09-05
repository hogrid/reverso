---
"@reverso/api": patch
"@reverso/db": patch
"@reverso/scanner": patch
"@reverso/cli": patch
"@reverso/admin": patch
"@reverso/mcp": patch
---

Fixes from the review of the launch-readiness branch.

- `@reverso/api`: the cross-site check for cookie-authenticated mutations compares the Origin against the proxy-aware host and the configured CORS origins, so an admin behind nginx or the Vite dev proxy can save again instead of getting 403; a rejected cookie now falls through to API-key and Bearer authentication. The rate limiter only gives a bucket of its own to the configured API key, so an arbitrary `X-API-Key` header can no longer mint unlimited buckets. Login lockout is tracked per account *and* source address, so a stranger can no longer keep a known account locked out; expired attempt rows are pruned periodically. Creating the first admin on an empty database is restricted to the machine running the server unless `REVERSO_ALLOW_BOOTSTRAP=true`; locality is read from the TCP peer, never from `X-Forwarded-For`, and behind a proxy only the explicit opt-in works.
- `@reverso/db`: adopting a legacy database drops obsolete `NOT NULL` columns that the current schema no longer writes, so form submissions stop failing on `form_submissions.updated_at`. Media search escapes `%` and `_` with an explicit `ESCAPE` clause, so filenames containing them are found.
- `@reverso/scanner`: a scan that cannot read its source directory reports the failure instead of producing an empty schema, which used to be written to disk and pushed to the server.
- `@reverso/cli`: `scan` and `dev` never sync a schema with no fields, so a wrong `srcDir` cannot delete every field and its content; `scan` exits non-zero on a failed scan and prints the configured output directory instead of `undefined`.
- `@reverso/admin`: the WYSIWYG editor keeps its content when the Visual tab is reopened after the HTML tab, instead of coming back empty and overwriting the field on the next save.
- `@reverso/mcp`: pending migrations are applied before the first query, so pointing the server at a database written by an older Reverso no longer fails on renamed columns.

The Vite dev proxy no longer rewrites `Host`, which is what made the standalone admin's own writes look cross-site.
