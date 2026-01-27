# Reverso CMS v0.1.0

The first public release of Reverso CMS - The front-to-back headless CMS.

## What is Reverso?

Reverso is a headless CMS that works differently from traditional CMS systems. Instead of defining your content model in the CMS and then building your frontend, you add `data-reverso` attributes to your React/JSX components and Reverso automatically generates:

- Admin panel for content editing
- Database schema
- REST API endpoints
- TypeScript types

## Installation

```bash
# Create a new project
npx create-reverso my-project
cd my-project

# Start development
npm run dev
```

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| `@reverso/core` | 0.1.0 | Shared types, utilities, and configuration |
| `@reverso/scanner` | 0.1.0 | AST parser for `data-reverso-*` markers |
| `@reverso/db` | 0.1.0 | Drizzle ORM schema and migrations |
| `@reverso/api` | 0.1.0 | Fastify REST API server |
| `@reverso/admin` | 0.1.0 | React + shadcn/ui admin panel |
| `@reverso/blocks` | 0.1.0 | Tiptap-based block editor |
| `@reverso/forms` | 0.1.0 | Form builder system |
| `@reverso/cli` | 0.1.0 | CLI commands |
| `@reverso/mcp` | 0.1.0 | MCP Server for AI integration |
| `create-reverso` | 0.1.0 | Project scaffolding wizard |

## Features

### Core Features
- **35+ Field Types**: text, textarea, wysiwyg, image, gallery, repeater, flexible, blocks, relation, taxonomy, date, color, map, and more
- **Auto-generated Admin Panel**: Beautiful UI with shadcn/ui components
- **TypeScript First**: Full type safety throughout
- **Database Agnostic**: SQLite for development, PostgreSQL for production

### Security
- Rate limiting
- CSRF protection
- Brute force protection
- HMAC webhook signatures
- Role-based access control (Admin/Editor/Viewer)

### Developer Experience
- Watch mode for automatic schema updates
- Hot reload during development
- Interactive CLI wizard
- MCP integration for AI assistants

## Quick Example

```tsx
// Add data-reverso attributes to your components
export function Hero() {
  return (
    <section>
      <h1 data-reverso="home.hero.title" data-reverso-type="text">
        Welcome
      </h1>
      <p data-reverso="home.hero.subtitle" data-reverso-type="textarea">
        Your content here
      </p>
      <img
        data-reverso="home.hero.image"
        data-reverso-type="image"
        src="/placeholder.jpg"
      />
    </section>
  );
}
```

Run `reverso scan` and the admin panel will show fields for title, subtitle, and image.

## Documentation

Full documentation available at [https://reverso.dev/docs](https://reverso.dev/docs)

## Requirements

- Node.js 20+
- React 18+

## License

MIT

## Links

- [Documentation](https://reverso.dev/docs)
- [GitHub Repository](https://github.com/nicholasoxford/reverso)
- [npm Organization](https://www.npmjs.com/org/reverso)
