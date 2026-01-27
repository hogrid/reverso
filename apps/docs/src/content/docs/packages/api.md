---
title: "@reverso/api"
description: Fastify REST API server for Reverso CMS
---

# @reverso/api

The API package provides a Fastify server with REST endpoints for content management, media uploads, forms, and more.

## Installation

```bash
npm install @reverso/api
```

## Quick Start

### Via CLI (Recommended)

```bash
# Start development server
reverso dev

# Start production server
reverso start
```

### Programmatic Usage

```typescript
import { createServer } from '@reverso/api';

const server = await createServer({
  port: 4000,
  databaseUrl: '.reverso/data.db',
  uploadDir: '.reverso/uploads',
});

await server.start();
console.log('Server running at http://localhost:4000');
```

## Configuration

```typescript
const server = await createServer({
  // Server port
  port: 4000,

  // Host binding
  host: '0.0.0.0',

  // Database connection
  databaseUrl: '.reverso/data.db',

  // Media upload directory
  uploadDir: '.reverso/uploads',

  // CORS configuration
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },

  // Authentication
  auth: {
    secret: process.env.AUTH_SECRET,
    sessionDuration: '7d',
  },

  // Rate limiting
  rateLimit: {
    max: 100,
    timeWindow: '1 minute',
  },
});
```

## API Endpoints

### Schema

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reverso/schema` | Get full content schema |
| GET | `/api/reverso/schema/pages` | List all pages |
| GET | `/api/reverso/schema/pages/:slug` | Get page with sections/fields |
| POST | `/api/reverso/schema/sync` | Sync schema from scan |

### Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reverso/content/:path` | Get content by path |
| GET | `/api/reverso/content/page/:slug` | Get all content for page |
| PUT | `/api/reverso/content/:path` | Update content |
| POST | `/api/reverso/content/bulk` | Bulk update content |
| POST | `/api/reverso/content/:id/publish` | Publish content |
| POST | `/api/reverso/content/:id/unpublish` | Unpublish content |

### Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reverso/media` | List media files |
| GET | `/api/reverso/media/:id` | Get media by ID |
| POST | `/api/reverso/media` | Upload media |
| PATCH | `/api/reverso/media/:id` | Update media metadata |
| DELETE | `/api/reverso/media/:id` | Delete media |

### Forms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reverso/forms` | List forms |
| POST | `/api/reverso/forms` | Create form |
| GET | `/api/reverso/forms/:id` | Get form with fields |
| PUT | `/api/reverso/forms/:id` | Update form |
| DELETE | `/api/reverso/forms/:id` | Delete form |
| POST | `/api/reverso/forms/:id/fields` | Add field |
| PUT | `/api/reverso/forms/:id/fields/:fieldId` | Update field |
| DELETE | `/api/reverso/forms/:id/fields/:fieldId` | Delete field |
| GET | `/api/reverso/forms/:id/submissions` | List submissions |
| POST | `/api/reverso/public/forms/:slug/submit` | Submit form (public) |

### Redirects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reverso/redirects` | List redirects |
| POST | `/api/reverso/redirects` | Create redirect |
| PUT | `/api/reverso/redirects/:id` | Update redirect |
| DELETE | `/api/reverso/redirects/:id` | Delete redirect |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reverso/auth/login` | Login |
| POST | `/api/reverso/auth/logout` | Logout |
| GET | `/api/reverso/auth/me` | Get current user |
| POST | `/api/reverso/auth/register` | Register (if enabled) |

## Request Examples

### Get Content

```bash
# Get content by path
curl http://localhost:4000/api/reverso/content/home.hero.title

# With locale
curl http://localhost:4000/api/reverso/content/home.hero.title?locale=pt

# Get all page content
curl http://localhost:4000/api/reverso/content/page/home?locale=en
```

### Update Content

```bash
curl -X PUT http://localhost:4000/api/reverso/content/home.hero.title \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "value": "Welcome to Our Site",
    "locale": "en"
  }'
```

### Bulk Update

```bash
curl -X POST http://localhost:4000/api/reverso/content/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "locale": "en",
    "updates": [
      { "path": "home.hero.title", "value": "Title" },
      { "path": "home.hero.subtitle", "value": "Subtitle" }
    ]
  }'
```

### Upload Media

```bash
curl -X POST http://localhost:4000/api/reverso/media \
  -H "Authorization: Bearer <token>" \
  -F "file=@image.jpg" \
  -F "alt=Description"
```

### Submit Form (Public)

```bash
curl -X POST http://localhost:4000/api/reverso/public/forms/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "Hello!"
    }
  }'
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Content not found"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## Middleware

### Authentication

Routes under `/api/reverso/` (except `/public/`) require authentication:

```typescript
// Protected route
GET /api/reverso/forms

// Public route (no auth needed)
POST /api/reverso/public/forms/:slug/submit
```

### Rate Limiting

```typescript
// Configure in server options
rateLimit: {
  max: 100,           // Max requests
  timeWindow: '1m',   // Per time window
}
```

### CORS

```typescript
cors: {
  origin: ['http://localhost:3000', 'https://mysite.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}
```

## Hooks

Extend the server with custom logic:

```typescript
const server = await createServer({ ... });

// Before request
server.addHook('preHandler', async (request, reply) => {
  // Custom logic
});

// After content update
server.addHook('onContentUpdate', async ({ path, value, locale }) => {
  // Invalidate cache, trigger webhook, etc.
});
```

## Static Files

The server serves:

- Admin panel at `/admin`
- Media files at `/uploads/:filename`

```typescript
// Custom static directory
const server = await createServer({
  uploadDir: './public/uploads',
  adminPath: '/cms', // Serve admin at /cms instead of /admin
});
```

## TypeScript Types

```typescript
import type {
  ServerConfig,
  ContentResponse,
  MediaResponse,
  FormResponse,
  PaginatedResponse,
} from '@reverso/api';
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `DATABASE_URL` | Database connection | `.reverso/data.db` |
| `AUTH_SECRET` | JWT secret | (required in production) |
| `UPLOAD_DIR` | Media upload path | `.reverso/uploads` |
| `CORS_ORIGIN` | Allowed origins | `*` |

## Next Steps

- [REST API Reference](/api/rest/) - Full API documentation
- [@reverso/admin](/packages/admin/) - Admin panel
