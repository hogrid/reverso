<p align="center">
  <img src="./public/img/logo.svg" alt="Reverso CMS" width="400" />
</p>

<p align="center">
  <strong>The front-to-back CMS for modern web development</strong>
</p>

<p align="center">
  Add markers to your React code. Get a fully-featured CMS automatically.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/create-reverso">
    <img src="https://img.shields.io/npm/v/create-reverso.svg?color=blue" alt="npm version" />
  </a>
  <a href="https://github.com/hogrid/reverso/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  </a>
  <a href="https://www.npmjs.com/package/@reverso/core">
    <img src="https://img.shields.io/npm/dm/@reverso/core.svg?color=green" alt="Downloads" />
  </a>
  <a href="https://github.com/hogrid/reverso">
    <img src="https://img.shields.io/github/stars/hogrid/reverso?style=social" alt="GitHub Stars" />
  </a>
</p>

<p align="center">
  <a href="https://docs.reverso.dev">Documentation</a> &bull;
  <a href="https://docs.reverso.dev/getting-started">Quick Start</a> &bull;
  <a href="https://discord.gg/reverso">Discord</a> &bull;
  <a href="https://twitter.com/reversocms">Twitter</a>
</p>

---

## What is Reverso?

**Reverso** is a headless CMS that works backwards from traditional systems. Instead of creating fields in the backend and then connecting them to your frontend, you simply add `data-reverso` attributes to your existing React/Next.js code, and Reverso automatically generates:

- Admin panel with all your fields
- Database schema and migrations
- REST API (GraphQL planned)
- TypeScript types

> **"From front to back, not the other way around."**

```tsx
// Just add markers to your existing code
<h1 data-reverso="home.hero.title" data-reverso-type="text">
  Welcome to our site
</h1>

<p data-reverso="home.hero.description" data-reverso-type="textarea">
  This is the hero description that editors can change.
</p>

<img
  data-reverso="home.hero.image"
  data-reverso-type="image"
  src="/placeholder.jpg"
  alt="Hero image"
/>
```

Run `reverso dev` and your CMS is ready. That's it.

---

## Why Reverso?

| Traditional CMS | Reverso |
|-----------------|---------|
| Create fields manually in the backend | Fields are auto-detected from your code |
| Keep frontend and backend in sync manually | Single source of truth in your JSX |
| WordPress + ACF + plugins = slow | Node.js + Fastify = 10x faster |
| No TypeScript support | Full type safety out of the box |
| Hours of setup | Ready in 5 minutes |

### Perfect replacement for WordPress + ACF PRO

Reverso covers the core of WordPress + Advanced Custom Fields today:

- 35+ field types (text, image, repeater, flexible content, gallery...)
- Block editor (like Gutenberg, powered by Tiptap)
- Forms system with public submissions, spam honeypot, webhooks and CSV export
- Redirects and sitemap (like Yoast's basics)
- Media library with uploads
- Admin accounts with sessions, API keys for scripts and CI
- REST API, with public read endpoints for your frontend
- Content history kept per field (bounded), publish/unpublish per field

**Plus things WordPress can't do:**

- AI integration via MCP Server
- Full TypeScript support
- Works with Next.js, Vite and Astro
- Auto-generated admin panel from your code

Not there yet (see [ROADMAP.md](./ROADMAP.md)): GraphQL, multi-language UI,
scheduled publishing, a revisions UI, roles beyond admin/editor/viewer, and
PostgreSQL (SQLite is the only database provider implemented today).

---

## Quick Start

### Option A: Add to an existing project (recommended)

```bash
# In your existing React/Next.js project
npx @reverso/cli@latest init
```

This will:
1. Create `reverso.config.ts` with your project settings
2. Create `.reverso/` output directory
3. Set up admin credentials for the first login
4. Install required dependencies

### Option B: Create a new project from scratch

```bash
npx create-reverso@latest
```

### Add markers to your components

```tsx
// app/page.tsx
export default function Home() {
  return (
    <section>
      <h1 data-reverso="home.hero.title" data-reverso-type="text">
        Hello World
      </h1>
      <p data-reverso="home.hero.subtitle" data-reverso-type="textarea">
        Welcome to my website
      </p>
      <img
        data-reverso="home.hero.background"
        data-reverso-type="image"
        src="/hero.jpg"
        alt="Hero"
      />
    </section>
  );
}
```

### Start the dev server

```bash
npx reverso dev
```

This single command will:
1. Scan your code for `data-reverso` markers
2. Start the API server and admin panel (default port 3001)
3. Create the database (or upgrade it) with the bundled migrations
4. Sync the detected schema to the database
5. Watch for file changes and re-sync automatically

Open `http://localhost:3001/admin`. On the first run the login page opens in
**create your account** mode: register the first admin (or let
`reverso init` pre-seed it) and start editing. Every API call is
authenticated; the dev server keeps a per-session API key in
`.reverso/dev-server.json` so `reverso scan` can sync from another terminal.

### Read CMS content in your frontend

Install the lightweight client SDK and fetch published content — your JSX
fallbacks keep rendering whenever the CMS is unreachable:

```bash
npm install @reverso/client
```

```tsx
// src/lib/reverso.ts
import { createReversoClient } from '@reverso/client';

export const reverso = createReversoClient({
  url: process.env.NEXT_PUBLIC_REVERSO_URL ?? 'http://localhost:3001',
});
```

```tsx
// app/components/Hero.tsx (React Server Component)
import { reverso } from '@/lib/reverso';

export async function Hero() {
  const home = await reverso.getPage('home');

  return (
    <h1 data-reverso="home.hero.title" data-reverso-type="text">
      {home.get('home.hero.title', 'Welcome to our site')}
    </h1>
  );
}
```

`get()` always returns the kind of value you passed as fallback (an image
becomes its URL, a number stays a number). Rich fields have typed accessors,
and repeater items come back as arrays:

```tsx
const hero = home.image('home.hero.image');      // { url, alt, width, height } | null
const files = home.file('home.downloads.brochure'); // { url, filename, size, mimeType } | null
const shots = home.images('home.gallery');       // ReversoImage[]
const where = home.map('home.contact.location'); // { lat, lng, zoom, address } | null
const tags = home.list('home.meta.tags');        // string[]
const posts = home.items('home.posts');          // [{ title, image, ... }, ...]
```

Uploaded files come back as absolute URLs on the CMS origin, so `<img src>`
works from any domain. Pass `mediaBaseUrl` to serve them from a CDN instead.

See `examples/showcase` (every field type), `examples/blog`, and
`examples/portfolio` for complete integrations.

---

## Try it locally (no npm publish required)

This monorepo is fully self-contained: every internal package is linked via
`workspace:*`, so you can run the **entire end-to-end flow** — scan → admin →
edit → frontend — straight from a clone, without publishing anything to npm.

The `examples/showcase` app is built specifically for this: a single front-end
that exercises **every Reverso field type** across multiple sections, so you can
verify the full integration in one place.

### Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 20 or newer | `node -v` |
| pnpm | 9 or newer | `pnpm -v` (install: `npm i -g pnpm`) |
| Git | any | `git --version` |

> Reverso uses SQLite (via `better-sqlite3`) by default — no database server to
> install. On first build it compiles a small native module, so a C toolchain
> may be needed on Linux (`build-essential`/`python3`); macOS and Windows
> usually work out of the box.

### 1. Install and build once

```bash
git clone https://github.com/hogrid/reverso.git
cd reverso
pnpm install      # installs all workspace dependencies
pnpm build        # builds every package (required before running the examples)
```

### 2. Start Reverso against the showcase example

```bash
cd examples/showcase
npx reverso dev
```

This scans the showcase components, generates the schema, and starts the API +
admin panel on **http://localhost:3001** (it auto-picks the next free port if
3001 is taken — watch the console output for the actual URL).

### 3. Open the admin and create content

1. Open **http://localhost:3001/admin**
2. First run: the page opens in **create your account** mode. Register the
   first admin user (password must be at least 8 characters).
3. You'll see the **Showcase** page with every detected field, grouped by
   section (text, rich text, choices, media, date/time, repeaters, relations,
   map, …).
4. Edit some fields — including a **repeater** (add/remove/reorder items) — and
   click **Save**.

### 4. Run the front-end and see your content

In a second terminal:

```bash
cd examples/showcase
NEXT_PUBLIC_REVERSO_URL=http://localhost:3001 PORT=3010 npm run dev
```

Open **http://localhost:3010**. The content you just edited in the admin is
rendered on the page. That's the complete loop: **your JSX markers became a CMS,
and the CMS content flows back into your front-end.**

> **Tip:** the same steps work with `examples/blog` and `examples/portfolio`.
> Run `reverso scan --verbose` to list every field detected from your code.

---

## The three usage scenarios

The walkthrough above is the quickest way to see Reverso working. The three
scenarios below cover the real lifecycles a project goes through. They were each
validated against a local npm registry (see *Validating a real install* further
down) so they behave exactly like installing from npm.

### Scenario A — Add Reverso to an existing front-end

You already have a React/Next.js site and want to make it editable.

```bash
# in your existing project, add data-reverso markers to your JSX first, then:
npm install -D @reverso/cli @reverso/core

# scaffold config + admin account (interactive)
npx reverso init
# …or fully non-interactive (generates a random admin password and prints it once):
npx reverso init --yes

# start the CMS
npx reverso dev
```

`reverso init` creates `reverso.config.ts`, a `.reverso/` directory, and admin
credentials. `reverso dev` then scans your existing components, builds the
schema, and serves the admin at `http://localhost:3001/admin`. On first run the
admin account from `init` is seeded automatically — log in with it (or, if you
skipped `init`, register the first user in the UI).

### Scenario B — Start a brand-new project with Reverso

Nothing exists yet. Scaffold everything at once:

```bash
# interactive wizard
npx create-reverso

# …or non-interactive with a project name + defaults
npx create-reverso my-app --yes

cd my-app
npm run dev   # runs reverso dev
```

`create-reverso` generates a Next.js front-end (with example `data-reverso`
markers), a valid `reverso.config.ts`, and installs the Reverso packages — ready
to edit in the admin immediately.

### Scenario C — Sync new fields into a running CMS

Reverso is already running (`reverso dev` is up in watch mode). You add new
content fields simply by adding markers to your code:

```tsx
// add a new marker anywhere in a watched component
<span data-reverso="home.hero.badge" data-reverso-type="text">New</span>
```

Save the file. The watcher re-scans, the new field appears in the admin panel
automatically, and **all existing content is preserved** — no restart, no
migration step. Removing a marker removes the field; renaming a path is treated
as a new field (the old content stays until you delete it).

> You can also trigger a one-off sync without watch mode by running
> `reverso scan` in another terminal while `reverso dev` is running.

### Validating a real install (optional, advanced)

To test scenarios A and B exactly as an end user would — installing the
`@reverso/*` packages from a registry instead of `workspace:*` — publish to a
local [Verdaccio](https://verdaccio.org) registry and point npm at it:

```bash
# 1. start a local registry
npx verdaccio --listen 4873

# 2. publish all packages to it (from the monorepo root)
echo '//localhost:4873/:_authToken=local' > .npmrc
pnpm -r publish --registry http://localhost:4873 --no-git-checks
rm .npmrc

# 3. in a fresh test project, point npm at the local registry
#    (.npmrc in the project)
echo 'registry=http://localhost:4873/'        >  .npmrc
echo '//localhost:4873/:_authToken=local'     >> .npmrc
# now `npx create-reverso my-app --yes` / `npx reverso init` resolve from there
```

This is how the scenarios above were verified end to end without publishing to
the public npm registry.

### Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| `Port 3001 is already in use` | Another process holds the port. `reverso dev` auto-picks the next free port — check the console for the real URL — or pass `reverso dev --port 4000`. Free it with `lsof -ti:3001 \| xargs kill`. |
| Admin page is blank / 404 at `/admin` | The admin panel wasn't built. Run `pnpm build` at the repo root before starting the example. |
| New marker doesn't show up in the admin | Make sure `reverso dev` is running (watch mode) and the file is **inside** `srcDir` and matches `scanner.include`. Save the file; the panel updates within ~1s. As a fallback, run `reverso scan` in another terminal. |
| `must have at least 3 parts` warning during scan | A marker path is invalid. Paths are `page.section.field`; repeaters use `page.section.$.subfield` (the `$` must be the 3rd segment). Invalid markers are skipped, not fatal. |
| Front-end shows fallback text, not CMS content | The front-end can't reach the API. Confirm `reverso dev` is running and `NEXT_PUBLIC_REVERSO_URL` points at the right port. Content also only appears once it's **saved** in the admin. |
| `create-reverso` / `reverso init` hangs waiting for input | Use the non-interactive flags: `npx create-reverso my-app --yes` or `npx reverso init --yes`. |

> **Stop everything:** press `Ctrl+C` in each terminal, or
> `lsof -ti:3001,3010 \| xargs kill` to free the dev ports.

---

## Marker Reference

### Naming Convention

Reverso uses a dot-separated path with **3 or more parts**:

```
{page}.{section}.{field}
```

| Path | Meaning |
|------|---------|
| `home.hero.title` | Home page, hero section, title field |
| `about.team.description` | About page, team section, description field |
| `blog.sidebar.cta.label` | Blog page, sidebar section, cta group, label field |

For repeaters, use `$` as the item placeholder:

| Path | Meaning |
|------|---------|
| `home.features.$.title` | Title of each repeater item |
| `home.features.$.icon` | Icon of each repeater item |

> **Note:** Paths with fewer than 3 parts (e.g., `home.title`) are invalid and will be skipped with a warning during scan.

### Marker Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-reverso` | Field path (required) | `"home.hero.title"` |
| `data-reverso-type` | Field type (default: `text`) | `"textarea"` |
| `data-reverso-label` | Display label in admin | `"Page Title"` |
| `data-reverso-placeholder` | Placeholder text | `"Enter title..."` |
| `data-reverso-required` | Mark as required | `"true"` |
| `data-reverso-validation` | Validation rules | `"min:3,max:100"` |
| `data-reverso-options` | Select/radio options | `"opt1,opt2,opt3"` |
| `data-reverso-default` | Default value | `"Hello World"` |
| `data-reverso-help` | Help text shown below field | `"SEO-friendly title"` |
| `data-reverso-condition` | Conditional display | `"field:value"` |
| `data-reverso-min` | Minimum value/length | `"0"` |
| `data-reverso-max` | Maximum value/length | `"255"` |
| `data-reverso-step` | Step increment (number) | `"0.5"` |
| `data-reverso-accept` | File type filter | `"image/*"` |
| `data-reverso-multiple` | Allow multiple values | `"true"` |
| `data-reverso-rows` | Textarea rows | `"5"` |
| `data-reverso-width` | Field width in admin | `"50"` |
| `data-reverso-readonly` | Read-only field | `"true"` |
| `data-reverso-hidden` | Hidden field | `"true"` |

---

## Field Types

Reverso supports 35+ field types:

### Text & Input

| Type | Description | Example |
|------|-------------|---------|
| `text` | Single line text | Titles, names |
| `textarea` | Multi-line text | Descriptions, bios |
| `number` | Numeric input | Prices, quantities |
| `range` | Slider input | Rating, percentage |
| `email` | Email address | Contact forms |
| `url` | URL input | Links |
| `phone` | Phone number | Contact info |
| `password` | Password field | Credentials |

### Rich Content

| Type | Description | Example |
|------|-------------|---------|
| `wysiwyg` | WYSIWYG editor (Tiptap) | Article body |
| `markdown` | Markdown editor | Technical docs |
| `code` | Code editor | Snippets |
| `blocks` | Block editor | Page builder |

### Selection

| Type | Description | Example |
|------|-------------|---------|
| `select` | Dropdown select | Category |
| `multiselect` | Multiple select | Tags |
| `checkbox` | Single checkbox | Boolean toggle |
| `checkboxgroup` | Checkbox group | Multi-choice |
| `radio` | Radio buttons | Single choice |
| `boolean` | True/false toggle | Visibility |
| `buttongroup` | Button group selector | Alignment |

### Media

| Type | Description | Example |
|------|-------------|---------|
| `image` | Image upload | Photos, icons |
| `gallery` | Multiple images | Photo gallery |
| `file` | File upload | Documents, PDFs |
| `video` | Video upload/embed | Video player |
| `audio` | Audio upload | Podcast |
| `oembed` | Embed URL | YouTube, Twitter |

### Date & Time

| Type | Description | Example |
|------|-------------|---------|
| `date` | Date picker | Publish date |
| `datetime` | Date + time | Event start |
| `time` | Time picker | Opening hours |

### Relational

| Type | Description | Example |
|------|-------------|---------|
| `relation` | Relation to other content | Related posts |
| `taxonomy` | Category/tag system | Post categories |
| `link` | External link | CTAs |
| `pagelink` | Internal page link | Navigation |
| `user` | User reference | Author |

### Advanced Structures

| Type | Description | Example |
|------|-------------|---------|
| `repeater` | Repeatable group | Feature list |
| `group` | Grouped fields | Address fields |
| `flexible` | Flexible content layouts | Page sections |

### Other

| Type | Description | Example |
|------|-------------|---------|
| `color` | Color picker | Theme colors |
| `map` / `googlemaps` | Map location | Store locator |
| `message` | Admin-only message | Instructions |
| `tab` | Tab container | Organized fields |
| `accordion` | Collapsible section | Grouped display |

### Example: Repeater

A repeater is a whole section whose `$` marker paths describe the shape of
each item — no marker is needed on the container element. Reverso creates a
synthetic `page.section.$` field of type `repeater` automatically, and its
content value is the array of items.

```tsx
<div className="features-grid">
  {features.map((feature, index) => (
    <div key={index}>
      <img data-reverso="home.features.$.icon" data-reverso-type="image" src={String(feature.icon)} alt="" />
      <h3 data-reverso="home.features.$.title" data-reverso-type="text">
        {String(feature.title)}
      </h3>
      <p data-reverso="home.features.$.description" data-reverso-type="textarea">
        {String(feature.description)}
      </p>
    </div>
  ))}
</div>
```

> **Note:** the `$` placeholder must be the 3rd path segment
> (`page.section.$.subfield`). Nested repeaters like
> `home.about.stats.$.value` are invalid and skipped with a warning.

### Example: Full page with multiple types

```tsx
export default function About() {
  return (
    <main>
      {/* Text fields */}
      <h1 data-reverso="about.hero.title" data-reverso-type="text">
        About Us
      </h1>

      {/* Rich text */}
      <div data-reverso="about.content.body" data-reverso-type="wysiwyg">
        <p>Our story...</p>
      </div>

      {/* Image with configuration */}
      <img
        data-reverso="about.hero.photo"
        data-reverso-type="image"
        data-reverso-label="Team Photo"
        data-reverso-required="true"
        src="/team.jpg"
        alt="Team"
      />

      {/* Repeater: Team members */}
      <div data-reverso="about.team.members" data-reverso-type="repeater">
        <img data-reverso="about.team.members.$.avatar" data-reverso-type="image" />
        <h3 data-reverso="about.team.members.$.name" data-reverso-type="text">Name</h3>
        <span data-reverso="about.team.members.$.role" data-reverso-type="text">Role</span>
        <p data-reverso="about.team.members.$.bio" data-reverso-type="textarea">Bio</p>
      </div>
    </main>
  );
}
```

---

## Configuration

### reverso.config.ts

```ts
import { defineConfig } from '@reverso/core';

export default defineConfig({
  // Source directory to scan for markers
  srcDir: './src',

  // Output directory for generated files
  outputDir: '.reverso',

  // API server port
  port: 3001,

  // File patterns to include in scan
  include: ['**/*.tsx', '**/*.jsx'],

  // File patterns to exclude from scan
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**',
    '**/*.test.*',
    '**/*.stories.*',
  ],
});
```

> **Tip:** If your components are in the project root instead of `./src`, set `srcDir: './'`.

---

## CLI Commands

### Setup

```bash
# Initialize Reverso in an existing project
reverso init

# Overwrite existing configuration
reverso init --force

# Create with example component
reverso init --example

# Non-interactive mode (accept all defaults; prints the generated admin password once)
reverso init --yes

# Skip installing @reverso packages (monorepos, CI, or when you install yourself)
reverso init --yes --skip-install
```

### Development

```bash
# Start development server (recommended - does everything)
reverso dev

# Start on a specific port
reverso dev --port 4000

# Start with browser auto-open
reverso dev --open

# Specify database location
reverso dev --database ./data/dev.db

# Specify source directory
reverso dev --src ./components
```

The `reverso dev` command handles everything:
- Scans for markers and generates schema
- Starts the API server with admin panel
- Watches for file changes and re-syncs
- Auto-seeds admin user on first run
- Auto-finds an available port if default is in use
- Auto-installs missing dependencies
- Auto-rebuilds native modules if needed

### Scanning

```bash
# One-time scan
reverso scan

# Scan with custom source directory
reverso scan --src ./components

# Watch mode (continuous scanning)
reverso scan --watch

# Verbose output (shows all pages and fields)
reverso scan --verbose

# Custom include/exclude patterns
reverso scan --include "**/*.tsx" --exclude "**/test/**"

# Push the schema to a deployed server (CI, staging, production)
reverso scan --api-url https://cms.example.com --api-key $REVERSO_API_KEY
```

The scan command syncs the schema to a Reverso server. Next to a running
`reverso dev` it finds the URL and key automatically
(`.reverso/dev-server.json`); otherwise pass `--api-url`/`--api-key` or set
`REVERSO_API_URL`/`REVERSO_API_KEY`. Sync failures are reported, never
swallowed.

### Production

```bash
# Scan markers and prepare .reverso/reverso.db
reverso build

# Serve the API + admin (requires REVERSO_COOKIE_SECRET; set REVERSO_API_KEY
# to let `reverso scan --api-url` push schema updates from elsewhere)
reverso start
```

`reverso start` creates the database when it is missing, so a container can
boot empty and receive its schema from `reverso scan --api-url`.

### Database

```bash
# Apply pending migrations (also upgrades databases from older versions)
reverso migrate

# Show applied and pending migrations
reverso migrate:status

# Delete and recreate the database (destructive!)
reverso migrate:reset
```

Migrations are generated from the Drizzle schema (`pnpm db:generate` in
`packages/db`) and shipped with `@reverso/db`; nothing hand-writes SQL.

---

## Architecture

Reverso is a **Turborepo monorepo** with pnpm workspaces.

### Package Dependency Graph

```
create-reverso
  └── @reverso/cli
        ├── @reverso/scanner ─── @reverso/core
        ├── @reverso/db ──────── @reverso/core
        └── @reverso/api
              ├── @reverso/core
              ├── @reverso/db
              ├── @reverso/admin
              │     ├── @reverso/blocks (Tiptap editor)
              │     └── @reverso/forms (react-hook-form)
              └── @reverso/mcp (AI integration)
```

### Packages

| Package | Description |
|---------|-------------|
| [`create-reverso`](https://www.npmjs.com/package/create-reverso) | `npx create-reverso` installer wizard |
| [`@reverso/cli`](https://www.npmjs.com/package/@reverso/cli) | CLI commands (`init`, `scan`, `dev`, `build`, `start`, `migrate`) |
| [`@reverso/core`](https://www.npmjs.com/package/@reverso/core) | Shared types, utilities, config system, Zod schemas |
| [`@reverso/scanner`](https://www.npmjs.com/package/@reverso/scanner) | AST parser (ts-morph) for detecting `data-reverso-*` markers |
| [`@reverso/db`](https://www.npmjs.com/package/@reverso/db) | Drizzle ORM schema + migrations (SQLite dev / PostgreSQL prod) |
| [`@reverso/api`](https://www.npmjs.com/package/@reverso/api) | Fastify server with REST endpoints |
| [`@reverso/admin`](https://www.npmjs.com/package/@reverso/admin) | React + Vite + shadcn/ui admin panel |
| [`@reverso/blocks`](https://www.npmjs.com/package/@reverso/blocks) | Tiptap-based block editor component |
| [`@reverso/forms`](https://www.npmjs.com/package/@reverso/forms) | Form builder (react-hook-form + Zod) |
| [`@reverso/mcp`](https://www.npmjs.com/package/@reverso/mcp) | MCP Server for AI tool integration |
| [`@reverso/client`](https://www.npmjs.com/package/@reverso/client) | Frontend SDK for reading published content |

> Current versions are on npm — see each package's badge or run
> `npm view @reverso/<pkg> version`.

### Apps (not published)

| App | Description |
|-----|-------------|
| `apps/docs` | Documentation site (Astro Starlight) |
| `apps/playground` | Interactive demo (Vite + Monaco Editor) |
| `examples/showcase` | Full-coverage example exercising every field type (best starting point for testing) |
| `examples/blog` | Blog front-end wired to Reverso (`@reverso/client`) |
| `examples/portfolio` | Portfolio front-end wired to Reverso |

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20+ |
| **Package Manager** | pnpm 9+ |
| **Monorepo** | Turborepo |
| **API** | Fastify |
| **Database** | SQLite via better-sqlite3 (PostgreSQL planned) |
| **ORM** | Drizzle (generated migrations) |
| **Auth** | httpOnly session cookies + bcrypt, API keys |
| **Admin UI** | React 19 + Vite + shadcn/ui + Radix |
| **State** | Zustand + React Query |
| **WYSIWYG** | Tiptap |
| **Forms** | react-hook-form + Zod |
| **Drag & Drop** | @dnd-kit |
| **CSS** | TailwindCSS 4 |
| **Linting** | Biome |
| **Testing** | Vitest (unit + API integration on real SQLite) + Playwright (admin in Chromium against `reverso dev`) |
| **Versioning** | Changesets |
| **Git Hooks** | Husky |

---

## How It Works

```
  Your React Code          Scanner           Database          Admin Panel
 ┌──────────────┐    ┌──────────────┐   ┌─────────────┐   ┌──────────────┐
 │  <h1          │    │  ts-morph    │   │  SQLite /   │   │  React +     │
 │   data-reverso│───>│  AST parser  │──>│  PostgreSQL │──>│  shadcn/ui   │
 │   ="home..."> │    │  + chokidar  │   │  (Drizzle)  │   │  auto-gen UI │
 └──────────────┘    └──────────────┘   └─────────────┘   └──────────────┘
                           │                    │                  │
                      schema.json          REST API          Edit content
                      + TS types         in the browser
```

1. **You code** your React components normally, adding `data-reverso` attributes
2. **Scanner** parses your JSX using ts-morph, extracting all markers into a schema
3. **Schema sync** pushes the detected fields to the database via the API
4. **Admin panel** renders the appropriate input fields for each type
5. **API** serves the content back to your frontend via REST
6. **Watch mode** keeps everything in sync as you edit your code

---

## API Endpoints

Everything under `/api/reverso` requires authentication except the `public/`
routes, the redirect lookup, the sitemap and health checks. Authenticate with
the admin session cookie (set by `/auth/login`), the same session token as
`Authorization: Bearer <token>`, or the configured API key as
`X-API-Key: <key>` (`REVERSO_API_KEY`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (also `/api/reverso/health`) |
| `GET` | `/admin` | Admin panel UI |
| `POST` | `/auth/register` | Create the first admin (closed afterwards) |
| `POST` | `/auth/login` / `/auth/logout` | Session login/logout |
| `GET` | `/auth/me` / `/auth/setup-status` | Current user / whether setup is needed |
| `GET` | `/api/reverso/schema` | Get current schema |
| `POST` | `/api/reverso/schema/sync` | Sync schema to database (admin) |
| `GET` | `/api/reverso/pages` / `/pages/:slug` | Pages and their fields |
| `GET` | `/api/reverso/content/page/:slug` | All content for a page |
| `PATCH` | `/api/reverso/content/page/:slug` | Bulk update page content |
| `GET` / `PUT` | `/api/reverso/content/:path` | Read / update a field |
| `GET` | `/api/reverso/public/content/page/:slug` | Public read of PUBLISHED page content |
| `GET` | `/api/reverso/public/content/:path` | Public read of a PUBLISHED value |
| `GET` / `POST` | `/api/reverso/media` | List (`?search=&type=&limit=&offset=`) / upload (multipart `file`) |
| `GET` / `POST` | `/api/reverso/forms` | Forms, fields, submissions, CSV export (`/forms/:id/...`) |
| `POST` | `/api/reverso/public/forms/:slug/submit` | Public submission to a published form |
| `GET` / `POST` | `/api/reverso/redirects` | Redirects CRUD, `bulk-import`, `export` |
| `GET` | `/api/reverso/redirect?path=/old` | Public redirect lookup for frontend middleware |
| `GET` | `/api/reverso/sitemap.xml` | Sitemap of pages and published forms |
| `GET` | `/api/reverso/stats` | Dashboard statistics |

Rate limit: 600 requests per minute per IP (admin assets excluded), 10 public
form submissions per minute per IP, login lockout after repeated failures.

---

## MCP Server (AI Integration)

Reverso includes an MCP (Model Context Protocol) server that allows AI tools like Claude, Cursor, and others to interact with your CMS directly.

```bash
# The MCP server binary is available after installing @reverso/mcp
reverso-mcp
```

This enables AI assistants to read and write content, query the schema, and manage your CMS programmatically.

---

## Deployment

Reverso works with any Node.js hosting platform:

| Platform | Type | Notes |
|----------|------|-------|
| [Coolify](https://coolify.io) | Self-hosted PaaS | Recommended for full control |
| [Railway](https://railway.app) | Cloud hosting | Simple deploy from Git |
| [Docker](https://docker.com) | Container | `docker compose up -d` with the included Dockerfile |
| Self-hosted | Any server | `reverso build && reverso start` |

Your frontend (Vercel, Netlify, anywhere) reads content through
`@reverso/client` from the public endpoints; only the CMS itself needs a
Node.js host with a persistent disk for `.reverso/` (database + uploads).

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REVERSO_COOKIE_SECRET` | yes in production | Signs cookies (`openssl rand -hex 32`) |
| `REVERSO_API_KEY` | for remote sync/CI/MCP | Admin-level key for `X-API-Key` / `reverso scan --api-key` |
| `REVERSO_PORT`, `REVERSO_HOST` | no | Defaults `3001`, `0.0.0.0` |
| `REVERSO_DB_PATH` | no | SQLite file (default `.reverso/reverso.db`) |
| `REVERSO_CORS_ORIGIN` | when a browser calls the API | Origins allowed cross-site, comma-separated (or `*`). Server-side reads need nothing |
| `REVERSO_TRUST_PROXY` | behind a proxy | `true` to honour `X-Forwarded-*` |
| `REVERSO_COOKIE_SECURE` | no | `auto` (default, Secure only over HTTPS), `true` or `false` |
| `REVERSO_API_URL` | for `reverso scan` against a remote CMS | Where the schema is pushed when no local `reverso dev` is running |
| `REVERSO_SRC_DIR` | no | Overrides `srcDir` from `reverso.config.ts` |
| `REVERSO_AUTH_ENABLED` | never in production | `false` disables authentication (local experiments only) |

Uploaded files are served by the CMS at `/uploads/<file>`. `@reverso/client`
rewrites those paths to absolute URLs on the CMS origin, so `<img src>` works
from a frontend on another domain; pass `mediaBaseUrl` to point at a CDN.

### Loading the schema into a deployed CMS

The server has no access to your source code, so push the schema from the
project that holds the markers (locally or in CI):

```bash
reverso scan --api-url https://cms.example.com --api-key "$REVERSO_API_KEY"
```

**Database:** SQLite is the database provider implemented today (WAL mode,
single file, back it up with the uploads directory). PostgreSQL is on the
roadmap; the `docker-compose.yml` Postgres profile is provided for that
future and is not used by the server yet.

---

## Roadmap

The measured state of the project, the launch plan and the backlog live in
[ROADMAP.md](./ROADMAP.md). In short:

- **Working and tested today:** scanner (35+ field types), auto-generated
  admin, block editor, forms, redirects, sitemap, media, REST API with public
  read endpoints, `@reverso/client`, CLI (`init`, `dev`, `scan`, `build`,
  `start`, `migrate`), MCP server, Docker image.
- **Next:** PostgreSQL provider, scheduled publishing UI, revisions UI,
  GraphQL, `@reverso/react` hooks, VS Code extension, WordPress importer.

---

## Contributing

We love contributions! Whether it's:

- Bug reports
- Feature requests
- Documentation improvements
- Code contributions

Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

### Development Setup

```bash
# Clone the repo
git clone https://github.com/hogrid/reverso.git
cd reverso

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Lint and format
pnpm lint

# Start development (all packages in watch mode)
pnpm dev
```

### Release Process

Reverso uses [Changesets](https://github.com/changesets/changesets) for versioning:

```bash
# Create a changeset after making changes
pnpm changeset

# Version packages
pnpm version-packages

# Build and publish
pnpm release
```

---

## Community

- [Discord](https://discord.gg/reverso) — Chat with the community
- [Twitter](https://twitter.com/reversocms) — Follow for updates
- [Documentation](https://docs.reverso.dev) — Learn how to use Reverso
- [Issues](https://github.com/hogrid/reverso/issues) — Report bugs
- [Discussions](https://github.com/hogrid/reverso/discussions) — Share ideas

---

## Sponsors

Reverso is open source and free to use. If you find it useful, please consider [sponsoring the project](https://github.com/sponsors/hogrid).

<p align="center">
  <a href="https://github.com/sponsors/hogrid">
    <img src="https://img.shields.io/badge/sponsor-❤️-ff69b4.svg" alt="Sponsor" />
  </a>
</p>

---

## License

Reverso is [MIT licensed](LICENSE).

---

<p align="center">
  <sub>Built with care by <a href="https://hogrid.com/">Emerson Nunes - Hogrid</a></sub>
</p>

<p align="center">
  <sub><strong>Reverso</strong> — From front to back, not the other way around.</sub>
</p>
