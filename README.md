<p align="center">
  <img src="./assets/logo.svg" alt="Reverso CMS" width="400" />
</p>

<p align="center">
  <strong>The front-to-back CMS for modern web development</strong>
</p>

<p align="center">
  Add markers to your React code. Get a fully-featured CMS automatically.
</p>

<p align="center">
  <a href="https://github.com/hogrid/reverso/actions/workflows/ci.yml">
    <img src="https://github.com/hogrid/reverso/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  </a>
  <a href="https://www.npmjs.com/package/create-reverso">
    <img src="https://img.shields.io/npm/v/create-reverso.svg" alt="npm version" />
  </a>
  <a href="https://github.com/hogrid/reverso/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  </a>
  <a href="https://discord.gg/reverso">
    <img src="https://img.shields.io/discord/1234567890?color=7289da&label=discord" alt="Discord" />
  </a>
</p>

<p align="center">
  <a href="https://docs.reverso.dev">Documentation</a> •
  <a href="https://docs.reverso.dev/getting-started">Quick Start</a> •
  <a href="https://discord.gg/reverso">Discord</a> •
  <a href="https://twitter.com/reversocms">Twitter</a>
</p>

---

## What is Reverso?

**Reverso** is a headless CMS that works backwards from traditional systems. Instead of creating fields in the backend and then connecting them to your frontend, you simply add `data-reverso` attributes to your existing React/Next.js code, and Reverso automatically generates:

- ✅ Admin panel with all your fields
- ✅ Database schema
- ✅ REST & GraphQL APIs
- ✅ TypeScript types

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

Run `reverso scan` and your CMS is ready. That's it.

---

## Why Reverso?

| Traditional CMS | Reverso |
|-----------------|---------|
| Create fields manually in the backend | Fields are auto-detected from your code |
| Keep frontend and backend in sync manually | Single source of truth |
| WordPress + ACF + plugins = slow | Node.js + Fastify = 10x faster |
| No TypeScript support | Full type safety out of the box |
| Hours of setup | Ready in 5 minutes |

### Perfect replacement for WordPress + ACF PRO

Reverso covers everything you need from WordPress + Advanced Custom Fields:

- ✅ 35+ field types (text, image, repeater, flexible content, gallery...)
- ✅ Block editor (like Gutenberg)
- ✅ Forms system (like Gravity Forms)
- ✅ SEO & Permalinks (like Yoast)
- ✅ Multi-language support
- ✅ User roles & permissions
- ✅ REST & GraphQL APIs
- ✅ Media library
- ✅ Content scheduling
- ✅ Revision history

**Plus things WordPress can't do:**

- 🚀 AI integration via MCP Server
- 🚀 Full TypeScript support
- 🚀 Works with Next.js, Remix, Astro
- 🚀 10x better performance

---

## Quick Start

### 1. Create a new project

```bash
npx create-reverso@latest
```

### 2. Add markers to your components

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
    </section>
  );
}
```

### 3. Scan and start

```bash
# Scan your code for markers
npx reverso scan

# Start the CMS
npx reverso dev
```

### 4. Edit content

Open `http://localhost:3001/admin` and start editing!

---

## Field Types

Reverso supports 35+ field types:

| Category | Types |
|----------|-------|
| **Basic** | `text`, `textarea`, `number`, `email`, `url`, `password` |
| **Content** | `wysiwyg`, `markdown`, `blocks` (block editor) |
| **Choice** | `select`, `checkbox`, `radio`, `boolean`, `buttongroup` |
| **Media** | `image`, `gallery`, `file`, `video`, `audio`, `oembed` |
| **Relational** | `relation`, `taxonomy`, `user`, `pagelink` |
| **Advanced** | `repeater`, `flexible`, `group`, `clone` |
| **Data** | `date`, `datetime`, `time`, `daterange`, `color` |
| **Location** | `googlemaps`, `address` |
| **Layout** | `tab`, `accordion`, `message` |

### Example: Repeater field

```tsx
<div data-reverso="home.features" data-reverso-type="repeater">
  <div data-reverso="home.features.$.icon" data-reverso-type="image" />
  <h3 data-reverso="home.features.$.title" data-reverso-type="text">Feature</h3>
  <p data-reverso="home.features.$.description" data-reverso-type="textarea">
    Description
  </p>
</div>
```

### Example: Flexible content

```tsx
<div data-reverso="home.sections" data-reverso-type="flexible">
  {/* Each layout is defined separately */}
</div>
```

---

## Naming Convention

Reverso uses a simple, consistent naming pattern:

```
{page}.{section}.{field}
```

Examples:
- `home.hero.title` → Home page, hero section, title field
- `about.team.members` → About page, team section, members field
- `blog.post.content` → Blog page, post section, content field

For repeaters, use `$` as the item placeholder:
- `home.features.$.title` → Title of each feature item

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js 20+ |
| **API Framework** | Fastify |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **ORM** | Drizzle |
| **Admin UI** | React + shadcn/ui |
| **Auth** | Better Auth |
| **Editor** | Tiptap (WYSIWYG) |

---

## Packages

Reverso is a monorepo with the following packages:

| Package | Description |
|---------|-------------|
| `create-reverso` | CLI installer |
| `@reverso/core` | Core types and utilities |
| `@reverso/scanner` | AST parser for detecting markers |
| `@reverso/db` | Database schema and migrations |
| `@reverso/api` | REST & GraphQL API server |
| `@reverso/admin` | Admin panel UI |
| `@reverso/blocks` | Block editor |
| `@reverso/forms` | Form builder |
| `@reverso/cli` | Command line tools |
| `@reverso/mcp` | AI integration (MCP Server) |

---

## CLI Commands

```bash
reverso init          # Initialize a new project
reverso scan          # Scan code for markers
reverso dev           # Start development server
reverso build         # Build for production
reverso start         # Start production server

reverso db:migrate    # Run database migrations
reverso db:seed       # Seed initial data
reverso db:studio     # Open Drizzle Studio
reverso db:backup     # Backup database & media
reverso db:restore    # Restore from backup

reverso generate      # Generate TypeScript types
reverso user:create   # Create admin user
reverso export        # Export content as JSON
reverso import        # Import content from JSON
reverso update        # Update Reverso
reverso doctor        # Diagnose issues
```

---

## Deployment

Reverso works great with:

- **[Coolify](https://coolify.io)** — Self-hosted PaaS (recommended)
- **[Vercel](https://vercel.com)** — Serverless deployment
- **[Railway](https://railway.app)** — Simple cloud hosting
- **[Docker](https://docker.com)** — Container deployment
- **Self-hosted** — Any Node.js server

See the [deployment guide](https://docs.reverso.dev/deployment) for detailed instructions.

---

## Roadmap

### v1.0 (Current)
- [x] Scanner and field detection
- [x] 35+ field types
- [x] Admin panel
- [x] Block editor
- [x] Forms system
- [x] REST & GraphQL APIs
- [x] CLI tools
- [x] Documentation

### v1.1
- [ ] VSCode extension
- [ ] Online playground
- [ ] More examples

### v1.2
- [ ] WordPress importer
- [ ] React hooks (`@reverso/react`)
- [ ] Scheduled publishing UI

### v2.0
- [ ] Plugin system
- [ ] Marketplace
- [ ] Reverso Cloud
- [ ] Multi-tenancy

See the full [roadmap](https://github.com/hogrid/reverso/blob/main/ROADMAP.md).

---

## Contributing

We love contributions! Whether it's:

- 🐛 Bug reports
- 💡 Feature requests
- 📖 Documentation improvements
- 🔧 Code contributions

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

# Start development
pnpm dev
```

---

## Community

- 💬 [Discord](https://discord.gg/reverso) — Chat with the community
- 🐦 [Twitter](https://twitter.com/reversocms) — Follow for updates
- 📖 [Documentation](https://docs.reverso.dev) — Learn how to use Reverso
- 🐛 [Issues](https://github.com/hogrid/reverso/issues) — Report bugs
- 💡 [Discussions](https://github.com/hogrid/reverso/discussions) — Share ideas

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
  <sub>Built with ❤️ by <a href="https://hogrid.com/">Emerson Nunes - Hogrid</a></sub>
</p>

<p align="center">
  <sub><strong>Reverso</strong> — From front to back, not the other way around.</sub>
</p>
