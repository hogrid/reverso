---
title: Schema Structure
description: Understanding the Reverso schema format
---

# Schema Structure

Reverso generates a schema from your markers that defines the entire CMS structure.

## Schema File

The schema is stored at `.reverso/schema.json`:

```json
{
  "version": "1.0.0",
  "generatedAt": "2025-01-15T10:30:00Z",
  "pages": [...],
  "totalFields": 42
}
```

## Pages

Each unique first segment in your paths becomes a page:

```tsx
// These markers create a "home" page
<h1 data-reverso="home.hero.title">...</h1>
<p data-reverso="home.hero.subtitle">...</p>
<div data-reverso="home.features.$.title">...</div>

// These markers create an "about" page
<h1 data-reverso="about.team.title">...</h1>
```

Schema output:

```json
{
  "pages": [
    {
      "id": "abc123",
      "slug": "home",
      "title": "Home",
      "sections": [...]
    },
    {
      "id": "def456",
      "slug": "about",
      "title": "About",
      "sections": [...]
    }
  ]
}
```

## Sections

The second segment creates sections within pages:

```tsx
// Section: hero
<h1 data-reverso="home.hero.title">...</h1>
<p data-reverso="home.hero.subtitle">...</p>

// Section: features
<div data-reverso="home.features.$.title">...</div>
```

Schema output:

```json
{
  "slug": "home",
  "sections": [
    {
      "id": "sec1",
      "slug": "hero",
      "title": "Hero",
      "fields": [...]
    },
    {
      "id": "sec2",
      "slug": "features",
      "title": "Features",
      "isRepeater": true,
      "fields": [...]
    }
  ]
}
```

## Fields

Each marker creates a field:

```tsx
<h1
  data-reverso="home.hero.title"
  data-reverso-type="text"
  data-reverso-label="Hero Title"
  data-reverso-required="true"
>
  Welcome
</h1>
```

Schema output:

```json
{
  "id": "field1",
  "slug": "title",
  "path": "home.hero.title",
  "type": "text",
  "label": "Hero Title",
  "required": true,
  "defaultValue": "Welcome"
}
```

## Complete Example

Given this component:

```tsx
export function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section>
        <h1
          data-reverso="home.hero.title"
          data-reverso-type="text"
          data-reverso-label="Main Title"
        >
          Welcome to Our Site
        </h1>
        <p
          data-reverso="home.hero.subtitle"
          data-reverso-type="textarea"
        >
          We build amazing things
        </p>
        <img
          data-reverso="home.hero.background"
          data-reverso-type="image"
        />
      </section>

      {/* Features Section (Repeater) */}
      <section>
        {features.map((f, i) => (
          <div key={i}>
            <h3 data-reverso="home.features.$.title">{f.title}</h3>
            <p data-reverso="home.features.$.description">{f.desc}</p>
            <img data-reverso="home.features.$.icon" />
          </div>
        ))}
      </section>
    </>
  );
}
```

The generated schema:

```json
{
  "version": "1.0.0",
  "generatedAt": "2025-01-15T10:30:00Z",
  "pages": [
    {
      "id": "p_home",
      "slug": "home",
      "title": "Home",
      "sections": [
        {
          "id": "s_hero",
          "slug": "hero",
          "title": "Hero",
          "isRepeater": false,
          "fields": [
            {
              "id": "f_title",
              "slug": "title",
              "path": "home.hero.title",
              "type": "text",
              "label": "Main Title",
              "defaultValue": "Welcome to Our Site"
            },
            {
              "id": "f_subtitle",
              "slug": "subtitle",
              "path": "home.hero.subtitle",
              "type": "textarea",
              "label": "Subtitle",
              "defaultValue": "We build amazing things"
            },
            {
              "id": "f_background",
              "slug": "background",
              "path": "home.hero.background",
              "type": "image",
              "label": "Background"
            }
          ]
        },
        {
          "id": "s_features",
          "slug": "features",
          "title": "Features",
          "isRepeater": true,
          "fields": [
            {
              "id": "f_feat_title",
              "slug": "title",
              "path": "home.features.$.title",
              "type": "text",
              "label": "Title"
            },
            {
              "id": "f_feat_desc",
              "slug": "description",
              "path": "home.features.$.description",
              "type": "text",
              "label": "Description"
            },
            {
              "id": "f_feat_icon",
              "slug": "icon",
              "path": "home.features.$.icon",
              "type": "image",
              "label": "Icon"
            }
          ]
        }
      ]
    }
  ],
  "totalFields": 6
}
```

## Schema Sync

When the schema changes, Reverso:

1. **Detects** differences between old and new schema
2. **Creates** new pages, sections, and fields
3. **Updates** changed fields (type, label, etc.)
4. **Preserves** existing content
5. **Optionally removes** orphaned fields (configurable)

## TypeScript Types

Reverso generates TypeScript types at `.reverso/types.ts`:

```typescript
export interface HomeHero {
  title: string;
  subtitle: string;
  background: ImageValue;
}

export interface HomeFeature {
  title: string;
  description: string;
  icon: ImageValue;
}

export interface HomePage {
  hero: HomeHero;
  features: HomeFeature[];
}
```

## Database Structure

The schema maps to database tables:

| Table | Description |
|-------|-------------|
| `pages` | One row per page |
| `sections` | One row per section, FK to page |
| `fields` | One row per field, FK to section |
| `content` | Field values with locale support |
| `content_history` | Audit trail of changes |

## Next Steps

- [Creating Pages](/guides/creating-pages/) - Build your first page
- [Using Repeaters](/guides/repeaters/) - Create repeatable content
