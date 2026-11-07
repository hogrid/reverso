---
"@reverso/mcp": minor
---

The MCP server is now a client of the Reverso HTTP API instead of opening the SQLite database.

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
