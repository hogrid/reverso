---
title: SEO & Redirects
description: Manage SEO and redirects with Reverso CMS
---

# SEO & Redirects

Reverso provides tools for managing SEO and URL redirects.

## Sitemap

Reverso automatically generates a sitemap at `/sitemap.xml`.

### What's Included

- All pages in the schema
- Published forms
- Custom URLs (if configured)

### Caching

The sitemap is cached for 1 hour. To invalidate:

```bash
POST /api/reverso/sitemap/invalidate
```

### Configuration

```typescript
// reverso.config.ts
export default {
  seo: {
    sitemap: {
      // Base URL for sitemap
      baseUrl: 'https://example.com',
      // Include/exclude patterns
      include: ['**/*'],
      exclude: ['/admin/**', '/api/**'],
      // Default change frequency
      changeFreq: 'weekly',
      // Default priority
      priority: 0.8,
    },
  },
};
```

## Redirects

Manage URL redirects in the admin at `/redirects`.

### Creating Redirects

| Field | Description |
|-------|-------------|
| From Path | Original URL path (e.g., `/old-page`) |
| To Path | Destination URL (e.g., `/new-page`) |
| Status Code | 301 (permanent) or 302 (temporary) |
| Enabled | Toggle redirect on/off |

### Status Codes

| Code | Type | Use Case |
|------|------|----------|
| 301 | Permanent | Page moved forever |
| 302 | Temporary | Temporary redirect |
| 307 | Temporary (strict) | Preserves method |
| 308 | Permanent (strict) | Preserves method |

### Bulk Import

Import redirects from CSV:

```csv
from_path,to_path,status_code
/old-about,/about,301
/blog/old-post,/blog/new-post,301
/services,/solutions,302
```

### Export

Export all redirects to CSV for backup or editing.

### Hit Tracking

Reverso tracks redirect usage:
- Hit count
- Last hit timestamp

This helps identify unused or high-traffic redirects.

## API Endpoints

### Get Sitemap

```bash
GET /sitemap.xml
```

### List Redirects

```bash
GET /api/reverso/redirects
```

### Create Redirect

```bash
POST /api/reverso/redirects

{
  "fromPath": "/old-page",
  "toPath": "/new-page",
  "statusCode": 301
}
```

### Update Redirect

```bash
PUT /api/reverso/redirects/:id

{
  "toPath": "/updated-page",
  "statusCode": 302
}
```

### Delete Redirect

```bash
DELETE /api/reverso/redirects/:id
```

### Bulk Import

```bash
POST /api/reverso/redirects/bulk-import
Content-Type: multipart/form-data

file: redirects.csv
```

### Export

```bash
GET /api/reverso/redirects/export
```

## SEO Fields

Add SEO fields to your pages:

```tsx
<head>
  <title data-reverso="home.seo.title" data-reverso-type="text">
    My Site - Home
  </title>
  <meta
    name="description"
    data-reverso="home.seo.description"
    data-reverso-type="textarea"
    content="Welcome to my site..."
  />
  <meta
    property="og:image"
    data-reverso="home.seo.og_image"
    data-reverso-type="image"
    content="/og-image.jpg"
  />
</head>
```

### Recommended SEO Fields

```tsx
// Title (50-60 chars)
<title data-reverso="page.seo.title">Page Title</title>

// Meta description (150-160 chars)
<meta
  name="description"
  data-reverso="page.seo.description"
  data-reverso-type="textarea"
/>

// Open Graph
<meta property="og:title" data-reverso="page.seo.og_title" />
<meta property="og:description" data-reverso="page.seo.og_description" />
<meta
  property="og:image"
  data-reverso="page.seo.og_image"
  data-reverso-type="image"
/>

// Twitter Card
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" data-reverso="page.seo.twitter_title" />

// Canonical URL
<link
  rel="canonical"
  data-reverso="page.seo.canonical"
  data-reverso-type="url"
/>
```

## Implementing Redirects

### Next.js

```typescript
// next.config.js
const { getRedirects } = require('@reverso/db');

module.exports = {
  async redirects() {
    const redirects = await getRedirects();
    return redirects.map((r) => ({
      source: r.fromPath,
      destination: r.toPath,
      permanent: r.statusCode === 301,
    }));
  },
};
```

### Express/Fastify Middleware

```typescript
import { getEnabledRedirects } from '@reverso/db';

app.use(async (req, res, next) => {
  const redirects = await getEnabledRedirects(db);
  const redirect = redirects.find((r) => r.fromPath === req.path);

  if (redirect) {
    return res.redirect(redirect.statusCode, redirect.toPath);
  }

  next();
});
```

## Best Practices

### Redirects

1. **Use 301 for permanent moves**
   - SEO value transfers to new URL
   - Browsers cache the redirect

2. **Avoid redirect chains**
   - A → B → C is bad
   - A → C is better

3. **Clean up old redirects**
   - Remove unused redirects
   - Consolidate redirect chains

4. **Test after creating**
   - Verify destination exists
   - Check for loops

### SEO

1. **Unique titles per page**
   - Each page needs a distinct title

2. **Write for humans first**
   - Don't keyword stuff

3. **Use descriptive URLs**
   - `/products/blue-widget` not `/products/123`

4. **Keep meta descriptions compelling**
   - They appear in search results

## Next Steps

- [Internationalization](/guides/i18n/) - Multi-language support
- [REST API](/api/rest/) - Full API reference
