---
title: How It Works
description: Understand how Reverso CMS works from scanning to editing
---

# How It Works

Reverso follows a "front-to-back" philosophy. Instead of starting with database schemas and working towards the frontend, you start with your frontend code and Reverso generates everything else.

## The Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your Code                                │
│  <h1 data-reverso="home.hero.title">Welcome</h1>                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Scanner (@reverso/scanner)                  │
│  Parses JSX, extracts markers, builds schema                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Schema (.reverso/schema.json)               │
│  { pages: [{ slug: "home", sections: [{ fields: [...] }] }] }   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Database │   │   API    │   │  Admin   │
        │  Schema  │   │ Endpoints│   │  Panel   │
        └──────────┘   └──────────┘   └──────────┘
```

## Step 1: Add Markers

You add `data-reverso` attributes to your JSX elements:

```tsx
export function Hero() {
  return (
    <section>
      <h1 data-reverso="home.hero.title" data-reverso-type="text">
        Welcome to My Site
      </h1>
      <p data-reverso="home.hero.subtitle" data-reverso-type="textarea">
        This content is editable in the CMS
      </p>
      <img
        data-reverso="home.hero.image"
        data-reverso-type="image"
        src="/placeholder.jpg"
        alt="Hero"
      />
    </section>
  );
}
```

## Step 2: Scanner Detects Markers

When you run `reverso scan`, the scanner:

1. **Parses** your source files using TypeScript AST
2. **Extracts** all `data-reverso-*` attributes
3. **Organizes** fields into pages and sections based on paths
4. **Generates** a schema file at `.reverso/schema.json`

## Step 3: Schema Syncs to Database

The schema is automatically synced to the database:

- Creates tables for pages, sections, and fields
- Tracks content and content history
- Manages media files and relationships

## Step 4: API Serves Content

The API server exposes endpoints for:

- **Content CRUD**: `/api/reverso/content/:path`
- **Pages**: `/api/reverso/pages`
- **Media**: `/api/reverso/media`
- **Schema**: `/api/reverso/schema`

## Step 5: Admin Panel for Editing

The admin panel provides a visual interface to:

- Edit all field types (text, images, repeaters, etc.)
- Manage media library
- Build forms
- Configure SEO and redirects

## Watch Mode

During development, Reverso watches your files:

```bash
reverso dev
```

When you add or modify markers, the schema updates automatically, and the admin panel reflects the changes in real-time.

## Production Flow

In production, the typical flow is:

1. **Build**: Your frontend queries the API for content
2. **Edit**: Content editors use the admin panel
3. **Publish**: Changes are saved to the database
4. **Deploy**: Optionally trigger rebuilds for static sites

## Key Benefits

| Benefit | Description |
|---------|-------------|
| **Single Source of Truth** | Your code defines the schema |
| **Type Safety** | Full TypeScript support throughout |
| **No Sync Issues** | Frontend and backend always match |
| **Developer Experience** | Write code normally, get CMS for free |
| **Content Editor Experience** | Clean admin panel with all field types |

## Next Steps

- [Markers](/concepts/markers/) - Learn the marker syntax
- [Field Types](/concepts/field-types/) - Explore all 35+ field types
