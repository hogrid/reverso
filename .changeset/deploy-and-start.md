---
"@reverso/cli": patch
---

Production deployment fixes.

- `reverso start` exits with a clear error when `REVERSO_COOKIE_SECRET` is missing instead of printing a warning and then crashing (or silently using the development secret when `NODE_ENV` is unset); it now defaults `NODE_ENV` to `production`.
- `reverso start` and `reverso build` refuse to run when `reverso.config.ts` exists but cannot be loaded, instead of falling back to the default (empty) database.
- The Docker image is assembled with `pnpm deploy`, so the runtime stage ships the CLI with every production dependency and actually starts; `docker-compose.yml` reads `.env`, forwards `REVERSO_ALLOW_BOOTSTRAP` and `REVERSO_ALLOWED_REDIRECT_DOMAINS`, and defaults `REVERSO_TRUST_PROXY` to `false` when the port is published directly.
