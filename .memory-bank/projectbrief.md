# Project Brief - Reverso CMS

## Vision
Reverso is a **headless CMS that works "front-to-back"** - developers add `data-reverso` attributes to React/Next.js components, and Reverso automatically generates the admin panel, database schema, APIs, and TypeScript types.

This is the opposite of traditional CMS workflows where you define the schema first and then build the frontend.

## Core Concept
```tsx
// Developer writes this:
<h1 data-reverso="home.hero.title" data-reverso-type="text">
  Welcome
</h1>

// Reverso generates:
// - Admin panel field
// - Database column
// - API endpoint
// - TypeScript types
```

## Key Features
1. **AST Scanner** - Detects `data-reverso-*` markers in JSX/TSX
2. **Schema Generator** - Creates structured schema from detected fields
3. **Admin Panel** - Auto-generated React UI for content editing
4. **Database** - SQLite (dev) / PostgreSQL (prod) with Drizzle ORM
5. **API** - REST + GraphQL endpoints via Fastify
6. **Watch Mode** - Real-time detection of marker changes
7. **CLI** - `reverso scan`, `reverso dev`, etc.

## Field Path Convention
- Format: `{page}.{section}.{field}`
- Example: `home.hero.title`, `about.team.name`
- Repeaters: `home.features.$.title` ($ = item placeholder)

## 35+ Field Types
text, textarea, wysiwyg, markdown, code, blocks, image, gallery, video, audio, file, date, datetime, time, color, select, multiselect, checkbox, radio, boolean, number, range, email, url, phone, relation, taxonomy, link, pagelink, repeater, group, flexible, map, user, oembed, tab, accordion, buttongroup, message

## Target Users
- Frontend developers using React/Next.js
- Teams wanting structured content without CMS lock-in
- Projects needing quick prototyping with editable content

## Success Criteria
- Zero-config setup for basic use cases
- Type-safe content access in frontend code
- Intuitive admin UI with visual editor
- Fast development cycle with watch mode
