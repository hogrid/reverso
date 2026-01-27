# create-reverso

CLI installer for Reverso CMS - The front-to-back CMS.

## Usage

```bash
# npm
npx create-reverso my-project

# pnpm
pnpm create reverso my-project

# yarn
yarn create reverso my-project

# bun
bun create reverso my-project
```

## Interactive Wizard

The wizard will prompt you for:

1. **Project name** - Name of your project
2. **Framework** - Next.js, Vite, or Astro
3. **Database** - SQLite (local) or PostgreSQL
4. **TypeScript** - Enable/disable TypeScript
5. **Package manager** - npm, pnpm, yarn, or bun
6. **Git** - Initialize git repository

## What's Created

```
my-project/
├── src/
│   └── components/
│       └── Hero.tsx       # Example component with markers
├── reverso.config.ts      # CMS configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Quick Start

```bash
npx create-reverso my-project
cd my-project
npm run dev
```

Then open http://localhost:4000/admin to access the admin panel.

## Documentation

See [https://reverso.dev/docs/packages/create-reverso](https://reverso.dev/docs/packages/create-reverso)

## License

MIT
