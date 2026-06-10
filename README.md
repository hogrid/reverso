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

Reverso covers everything you need from WordPress + Advanced Custom Fields:

- 35+ field types (text, image, repeater, flexible content, gallery...)
- Block editor (like Gutenberg, powered by Tiptap)
- Forms system (like Gravity Forms)
- SEO & Permalinks (like Yoast)
- Multi-language support
- User roles & permissions
- REST API (GraphQL planned)
- Media library
- Content scheduling
- Revision history

**Plus things WordPress can't do:**

- AI integration via MCP Server
- Full TypeScript support
- Works with Next.js, Remix, Astro
- 10x better performance
- Auto-generated admin panel from your code

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
2. Start the API server (default port 3001)
3. Auto-seed your admin account on first run
4. Sync the detected schema to the database
5. Watch for file changes and re-sync automatically

Open `http://localhost:3001/admin` and start editing!

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

Repeater items come back as arrays:

```tsx
const posts = home.items('home.posts'); // [{ title, image, ... }, ...]
```

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
2. First run: click **"Don't have an account? Create one"** and register the
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

# Non-interactive mode (accept all defaults)
reverso init --yes
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
```

The scan command auto-syncs the schema to a running API server. You can run `reverso scan` while `reverso dev` is active and the admin panel will update in real-time.

### Production

```bash
# Build for production
reverso build

# Start production server
reverso start
```

### Database

```bash
# Run pending migrations
reverso migrate

# Create a new migration
reverso migrate:create

# Check migration status
reverso migrate:status

# Reset database (destructive!)
reverso migrate:reset
```

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
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **ORM** | Drizzle |
| **Auth** | Better Auth + bcrypt |
| **Admin UI** | React 19 + Vite + shadcn/ui + Radix |
| **State** | Zustand + React Query |
| **WYSIWYG** | Tiptap |
| **Forms** | react-hook-form + Zod |
| **Drag & Drop** | @dnd-kit |
| **CSS** | TailwindCSS 4 |
| **Linting** | Biome |
| **Testing** | Vitest + Playwright |
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

When the dev server is running, these endpoints are available:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/admin` | Admin panel UI |
| `GET` | `/api/reverso/schema` | Get current schema |
| `POST` | `/api/reverso/schema/sync` | Sync schema to database |
| `GET` | `/api/reverso/content/page/:slug` | Get all content for a page (authenticated) |
| `PATCH` | `/api/reverso/content/page/:slug` | Bulk update page content |
| `GET` | `/api/reverso/content/:path` | Get content by field path |
| `PUT` | `/api/reverso/content/:path` | Update content by field path |
| `GET` | `/api/reverso/public/content/page/:slug` | Public read of PUBLISHED page content (for frontends) |
| `GET` | `/api/reverso/public/content/:path` | Public read of a PUBLISHED value |
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login |
| `GET` | `/auth/setup-status` | Check if setup is needed |

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
| [Vercel](https://vercel.com) | Serverless | Great for Next.js frontends |
| [Railway](https://railway.app) | Cloud hosting | Simple deploy from Git |
| [Docker](https://docker.com) | Container | Full isolation |
| Self-hosted | Any server | Just run `reverso start` |

**Database in production:** Switch from SQLite to PostgreSQL by updating `reverso.config.ts`:

```ts
export default defineConfig({
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
  },
});
```

See the [deployment guide](https://docs.reverso.dev/deployment) for detailed instructions.

---

## Roadmap

### v0.1.x (Current)
- [x] Scanner and field detection (35+ types)
- [x] Admin panel with auto-generated UI
- [x] Block editor (Tiptap)
- [x] Forms system
- [x] REST API
- [x] CLI tools (init, scan, dev, build, start, migrate)
- [x] MCP Server for AI integration
- [x] Auto-sync schema on scan and dev
- [x] Auto-seed admin credentials

### v0.2.0
- [ ] GraphQL API
- [ ] VSCode extension
- [ ] More examples and templates

### v0.3.0
- [ ] WordPress importer
- [ ] React hooks (`@reverso/react`)
- [ ] Scheduled publishing UI

### v1.0.0
- [ ] Plugin system
- [ ] Marketplace
- [ ] Multi-tenancy

See the full [roadmap](https://github.com/hogrid/reverso/blob/main/ROADMAP.md).

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
