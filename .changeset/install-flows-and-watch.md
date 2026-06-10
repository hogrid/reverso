---
"@reverso/scanner": patch
"@reverso/cli": patch
"create-reverso": minor
---

Fix the three real-world install/usage flows (validated against a local npm registry):

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
