# @reverso/client

Lightweight, framework-agnostic SDK for reading **published** Reverso CMS
content from any frontend. Designed for React Server Components, works in any
runtime with `fetch`. It never throws: when the API is unreachable every
helper returns the fallback you pass, so the site keeps rendering its
hardcoded content.

```bash
npm install @reverso/client
```

## Usage

```ts
// src/lib/reverso.ts
import { createReversoClient } from '@reverso/client';

export const reverso = createReversoClient({
  // Server components: use the runtime REVERSO_URL (see below).
  url: process.env.REVERSO_URL ?? process.env.NEXT_PUBLIC_REVERSO_URL ?? 'http://localhost:3001',
});
```

```tsx
const page = await reverso.getPage('home');

<h1 data-reverso="home.hero.title">{page.get('home.hero.title', 'Welcome')}</h1>
<img src={page.get('home.hero.image', '/hero.jpg')} alt="" />
{page.items('home.features').map((item) => /* ... */)}
```

`page.get(path, fallback)` returns a value of the same kind as the fallback
(an image becomes its URL when the fallback is a string). Use the typed
accessors (`image`, `file`, `images`, `map`, `code`, `list`, `items`) for the
full objects.

## `REVERSO_URL` vs `NEXT_PUBLIC_REVERSO_URL`

Next.js inlines every `NEXT_PUBLIC_*` variable into the bundle **at build
time**. A server component that reads `NEXT_PUBLIC_REVERSO_URL` keeps calling
whatever URL was set when `next build` ran, even if you change the variable
when the server starts. Server components should read the plain
`REVERSO_URL`, which is resolved at runtime:

```ts
url: process.env.REVERSO_URL ?? process.env.NEXT_PUBLIC_REVERSO_URL ?? 'http://localhost:3001'
```

Only client components need the `NEXT_PUBLIC_` variant. If `reverso dev`
starts on another port than 3001 (it tells you when it does), set
`REVERSO_URL` to the URL it prints.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `url` | (required) | Base URL of the Reverso API. |
| `locale` | API default | Content locale. |
| `timeoutMs` | `5000` | Request timeout. |
| `cache` | `'no-store'` | Fetch cache mode. Not forced when `revalidate` is set. |
| `revalidate` | | Next.js revalidation, sent as `next: { revalidate }`. |
| `tags` | | Next.js cache tags, sent as `next: { tags }` (for `revalidateTag`). |
| `headers` | | Extra request headers, merged over `accept: application/json`. |
| `dedupeMs` | `1000` | Concurrent `getPage` calls for the same slug share one request, and a successful result is reused for this long. `0` disables it. |
| `onError` | | Called on every failed request (`{ path, status?, cause? }`). |
| `mediaBaseUrl` | `url` | Origin for `/uploads/...` paths. `false` keeps stored paths. |

### Failures

Every failure (network error, timeout, non-2xx, invalid JSON) falls back to
your default content. Pass `onError` to report it. Without `onError`, the
client logs one `console.warn` per failing path (per client) with the status
or cause and the full URL, except when `NODE_ENV` is `production`.

### Caching with Next.js

```ts
createReversoClient({ url, revalidate: 60, tags: ['reverso'] });
```

Then call `revalidateTag('reverso')` (for example from a webhook) to refresh
right after an editor publishes.

### Media URLs

Uploads are stored as `/uploads/<file>`. The client rewrites them to absolute
URLs on `mediaBaseUrl`: plain values, objects (`{ url }`), galleries,
repeater items, and upload paths inside rich text (quoted `src`/`href`/...
attribute values in HTML and `](/uploads/...)` targets in Markdown).

## License

MIT
