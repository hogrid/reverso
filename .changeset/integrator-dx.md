---
"@reverso/client": minor
"@reverso/scanner": minor
"@reverso/cli": patch
"create-reverso": patch
---

Integrator experience fixes.

**@reverso/client**
- Outside production, a failing request without `onError` now logs one `console.warn` per path with the status or cause and the full URL, instead of falling back silently.
- New options: `revalidate` and `tags` (sent as Next.js `next: { revalidate, tags }`; `no-store` is no longer forced when `revalidate` is set), `headers`, and `dedupeMs`. Concurrent `getPage` calls for the same slug share one request, and a successful result is reused for `dedupeMs` (default 1000, `0` disables it).
- `/uploads/...` paths inside rich text (quoted HTML attribute values and Markdown link/image targets) are rewritten to absolute URLs.
- `exports` gains a `default` condition.

**@reverso/scanner**
- Fields now get a `defaultContent`. JSX text was never read before; now it is, with entities decoded and whitespace collapsed. The scanner also reads `{x.get(path, 'fallback')}` children, image `src`, link `href` and `data-reverso-default`.
- Dynamic or empty marker paths and unknown `data-reverso-type` values are reported with `file:line`.
- Fields keep source order (file, line, column). `sort` only orders pages and sections.
- Watch mode works for projects under folders named `build`, `dist`, `.next` or `node_modules`. It also catches changes the OS drops while the watch is starting (macOS FSEvents), which made watch tests flaky.

**@reverso/cli**
- `reverso dev` exits with a clear error when an explicitly requested port is busy. When it has to move off the default port, it warns with the new URL and tells you to set `REVERSO_URL`.
- It prints a hint when the initial scan finds no markers.
- `.reverso/dev-server.json` is written only once the API listens, and removed if startup fails.

**create-reverso**
- JavaScript projects get a `jsconfig.json` with the `@/*` alias.
- Project names are validated, including names given with `--yes` or as a positional argument.
- Ctrl+C on any prompt aborts.
- The Next.js template reads the runtime `REVERSO_URL` before `NEXT_PUBLIC_REVERSO_URL`.
