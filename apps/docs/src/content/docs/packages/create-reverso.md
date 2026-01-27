---
title: create-reverso
description: Project wizard for creating new Reverso CMS projects
---

# create-reverso

The create-reverso package is an interactive wizard for scaffolding new Reverso CMS projects.

## Quick Start

```bash
# npm
npx create-reverso my-project

# pnpm
pnpm create reverso my-project

# yarn
yarn create reverso my-project
```

## Interactive Setup

The wizard prompts for:

### 1. Project Name

```
? What is your project name? my-website
```

### 2. Framework

```
? Which framework are you using?
  ❯ Next.js (App Router)
    Next.js (Pages Router)
    Vite + React
    Astro
```

### 3. Database

```
? Which database would you like to use?
  ❯ SQLite (Recommended for development)
    PostgreSQL (Recommended for production)
```

### 4. Package Manager

```
? Which package manager do you prefer?
  ❯ pnpm (Recommended)
    npm
    yarn
```

### 5. Features (Optional)

```
? Select additional features:
  ◉ i18n (Multi-language support)
  ◯ Forms (Form builder)
  ◉ Media Library
  ◯ MCP Integration
```

## Generated Structure

After running the wizard:

```
my-project/
├── .reverso/
│   └── data.db           # SQLite database (if selected)
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── page.tsx     # Example page with markers
│   │   └── layout.tsx
│   └── components/
│       └── Hero.tsx     # Example component
├── public/
├── reverso.config.ts    # Reverso configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Example Files

### reverso.config.ts

```typescript
import type { ReversoConfig } from '@reverso/core';

export default {
  name: 'My Website',
  contentDir: './src',
  database: {
    type: 'sqlite',
    path: '.reverso/data.db',
  },
} satisfies ReversoConfig;
```

### Example Page (Next.js)

```tsx
// src/app/page.tsx
export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <h1 data-reverso="home.hero.title">
          Welcome to My Site
        </h1>
        <p
          data-reverso="home.hero.subtitle"
          data-reverso-type="textarea"
        >
          This is the subtitle
        </p>
        <img
          data-reverso="home.hero.image"
          data-reverso-type="image"
          data-reverso-label="Hero Image"
          src="/placeholder.jpg"
          alt="Hero"
        />
      </section>
    </main>
  );
}
```

## CLI Options

```bash
create-reverso [project-name] [options]

Options:
  --template <template>    Use a specific template
  --skip-install           Skip dependency installation
  --skip-git               Skip git initialization
  --use-npm                Use npm as package manager
  --use-yarn               Use yarn as package manager
  --use-pnpm               Use pnpm as package manager (default)
  -h, --help               Display help
  -V, --version            Show version
```

### Examples

```bash
# Create with specific package manager
npx create-reverso my-site --use-npm

# Skip installation
npx create-reverso my-site --skip-install

# Use template
npx create-reverso my-site --template ecommerce
```

## Templates

### default

Basic setup with example page:
- Homepage with hero section
- About page
- Contact page

### blog

Blog-focused template:
- Blog listing page
- Blog post template
- Categories and tags
- Author pages

### ecommerce

E-commerce template:
- Product listing
- Product detail
- Shopping cart markers
- Category pages

### portfolio

Portfolio template:
- Project gallery
- Case studies
- About/bio section
- Contact form

## After Installation

```bash
cd my-project

# Start development
npm run dev
# or
pnpm dev

# Visit:
# - Frontend: http://localhost:3000
# - Admin: http://localhost:4000/admin
```

## Next Steps After Creation

1. **Add markers** to your components:
   ```tsx
   <h1 data-reverso="page.section.field">Content</h1>
   ```

2. **Run the scanner**:
   ```bash
   reverso scan
   ```

3. **Start the server**:
   ```bash
   reverso dev
   ```

4. **Edit content** in the admin panel at `/admin`

## Updating

Update the CLI:

```bash
npm install -g @reverso/cli@latest
```

Add Reverso to an existing project:

```bash
npx @reverso/cli init
```

## Requirements

- Node.js 18+
- npm, pnpm, or yarn
- Git (optional)

## Troubleshooting

### Permission denied

```bash
# macOS/Linux
sudo npm install -g create-reverso

# Or use npx (recommended)
npx create-reverso my-project
```

### Network errors

```bash
# Use different registry
npm config set registry https://registry.npmmirror.com
npx create-reverso my-project
```

### Template not found

```bash
# Update create-reverso
npm cache clean --force
npx create-reverso@latest my-project
```

## Next Steps

- [Installation Guide](/getting-started/installation/) - Detailed setup
- [Configuration](/getting-started/configuration/) - Config options
- [@reverso/cli](/packages/cli/) - CLI reference
