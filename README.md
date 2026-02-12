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
- REST & GraphQL APIs
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
- REST & GraphQL APIs
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

```tsx
<div data-reverso="home.features" data-reverso-type="repeater">
  <div data-reverso="home.features.$.icon" data-reverso-type="image" />
  <h3 data-reverso="home.features.$.title" data-reverso-type="text">
    Feature Title
  </h3>
  <p data-reverso="home.features.$.description" data-reverso-type="textarea">
    Feature description goes here.
  </p>
</div>
```

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

| Package | Version | Description |
|---------|---------|-------------|
| [`create-reverso`](https://www.npmjs.com/package/create-reverso) | 0.1.1 | `npx create-reverso` installer wizard |
| [`@reverso/cli`](https://www.npmjs.com/package/@reverso/cli) | 0.1.23 | CLI commands (`init`, `scan`, `dev`, `build`, `start`, `migrate`) |
| [`@reverso/core`](https://www.npmjs.com/package/@reverso/core) | 0.1.1 | Shared types, utilities, config system, Zod schemas |
| [`@reverso/scanner`](https://www.npmjs.com/package/@reverso/scanner) | 0.1.23 | AST parser (ts-morph) for detecting `data-reverso-*` markers |
| [`@reverso/db`](https://www.npmjs.com/package/@reverso/db) | 0.1.18 | Drizzle ORM schema + migrations (SQLite dev / PostgreSQL prod) |
| [`@reverso/api`](https://www.npmjs.com/package/@reverso/api) | 0.1.18 | Fastify server with REST + GraphQL endpoints |
| [`@reverso/admin`](https://www.npmjs.com/package/@reverso/admin) | 0.1.18 | React + Vite + shadcn/ui admin panel |
| [`@reverso/blocks`](https://www.npmjs.com/package/@reverso/blocks) | 0.1.1 | Tiptap-based block editor component |
| [`@reverso/forms`](https://www.npmjs.com/package/@reverso/forms) | 0.1.1 | Form builder (react-hook-form + Zod) |
| [`@reverso/mcp`](https://www.npmjs.com/package/@reverso/mcp) | 0.1.1 | MCP Server for AI tool integration |

### Apps (not published)

| App | Description |
|-----|-------------|
| `apps/docs` | Documentation site (Astro Starlight) |
| `apps/playground` | Interactive demo (Vite + Monaco Editor) |

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20+ |
| **Package Manager** | pnpm 9+ |
| **Monorepo** | Turborepo |
| **API** | Fastify |
| **GraphQL** | Mercurius |
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
                      + TS types         + GraphQL          in the browser
```

1. **You code** your React components normally, adding `data-reverso` attributes
2. **Scanner** parses your JSX using ts-morph, extracting all markers into a schema
3. **Schema sync** pushes the detected fields to the database via the API
4. **Admin panel** renders the appropriate input fields for each type
5. **API** serves the content back to your frontend via REST or GraphQL
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
| `GET` | `/api/reverso/content/:page` | Get page content |
| `PUT` | `/api/reverso/content/:page` | Update page content |
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
