---
title: REST API
description: Complete REST API reference for Reverso CMS
---

# REST API Reference

Complete documentation for all Reverso CMS REST API endpoints.

## Base URL

```
http://localhost:4000/api/reverso
```

## Authentication

Most endpoints require authentication. Include the session cookie or Bearer token:

```bash
# Cookie-based (from login)
curl -b "session=<token>" http://localhost:4000/api/reverso/content/home.hero.title

# Bearer token
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/reverso/content/home.hero.title
```

### Public Endpoints

These don't require authentication:
- `POST /public/forms/:slug/submit`

---

## Schema Endpoints

### Get Full Schema

```http
GET /schema
```

Returns the complete content schema including pages, sections, and fields.

**Response:**

```json
{
  "success": true,
  "data": {
    "pages": [
      {
        "id": "page_abc123",
        "name": "Home",
        "slug": "home",
        "path": "/",
        "description": "Homepage"
      }
    ],
    "sections": [
      {
        "id": "section_def456",
        "pageId": "page_abc123",
        "name": "Hero",
        "slug": "hero",
        "isRepeater": false
      }
    ],
    "fields": [
      {
        "id": "field_ghi789",
        "sectionId": "section_def456",
        "name": "title",
        "type": "text",
        "label": "Title",
        "required": true
      }
    ]
  }
}
```

### List Pages

```http
GET /schema/pages
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "page_abc123",
      "name": "Home",
      "slug": "home",
      "path": "/",
      "sectionsCount": 3,
      "fieldsCount": 12
    }
  ]
}
```

### Get Page Details

```http
GET /schema/pages/:slug
```

**Parameters:**
- `slug` - Page slug (e.g., `home`)

**Response:**

```json
{
  "success": true,
  "data": {
    "page": {
      "id": "page_abc123",
      "name": "Home",
      "slug": "home"
    },
    "sections": [...],
    "fields": [...]
  }
}
```

### Sync Schema

```http
POST /schema/sync
```

Sync schema from scan results. Used internally by CLI.

**Request Body:**

```json
{
  "pages": [...],
  "sections": [...],
  "fields": [...]
}
```

---

## Content Endpoints

### Get Content by Path

```http
GET /content/:path
```

**Parameters:**
- `path` - Content path (e.g., `home.hero.title`)

**Query Parameters:**
- `locale` - Locale code (default: `en`)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "content_xyz123",
    "fieldId": "field_ghi789",
    "value": "Welcome to Our Site",
    "locale": "en",
    "version": 3,
    "publishedAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

### Get Page Content

```http
GET /content/page/:slug
```

Get all content for a page.

**Parameters:**
- `slug` - Page slug

**Query Parameters:**
- `locale` - Locale code

**Response:**

```json
{
  "success": true,
  "data": {
    "home.hero.title": "Welcome",
    "home.hero.subtitle": "Subtitle text",
    "home.hero.image": "/uploads/hero.jpg"
  }
}
```

### Update Content

```http
PUT /content/:path
```

**Request Body:**

```json
{
  "value": "New content value",
  "locale": "en"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "content_xyz123",
    "value": "New content value",
    "version": 4
  }
}
```

### Bulk Update Content

```http
POST /content/bulk
```

**Request Body:**

```json
{
  "locale": "en",
  "updates": [
    { "path": "home.hero.title", "value": "Title" },
    { "path": "home.hero.subtitle", "value": "Subtitle" }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "updated": 2
  }
}
```

### Publish Content

```http
POST /content/:id/publish
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "content_xyz123",
    "publishedAt": "2025-01-15T12:00:00Z"
  }
}
```

### Unpublish Content

```http
POST /content/:id/unpublish
```

---

## Media Endpoints

### List Media

```http
GET /media
```

**Query Parameters:**
- `type` - Filter by type (`image`, `video`, `audio`, `document`)
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset
- `search` - Search filename

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "media_abc123",
      "filename": "hero-image-abc123.jpg",
      "originalName": "hero.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "width": 1920,
      "height": 1080,
      "url": "/uploads/hero-image-abc123.jpg",
      "alt": "Hero image",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Media by ID

```http
GET /media/:id
```

### Upload Media

```http
POST /media
Content-Type: multipart/form-data
```

**Form Data:**
- `file` - The file to upload (required)
- `alt` - Alt text
- `caption` - Caption

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "media_new123",
    "filename": "uploaded-abc123.jpg",
    "url": "/uploads/uploaded-abc123.jpg"
  }
}
```

### Update Media

```http
PATCH /media/:id
```

**Request Body:**

```json
{
  "alt": "Updated alt text",
  "caption": "New caption"
}
```

### Delete Media

```http
DELETE /media/:id
```

---

## Forms Endpoints

### List Forms

```http
GET /forms
```

**Query Parameters:**
- `status` - Filter by status (`draft`, `published`, `archived`)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "form_abc123",
      "name": "Contact Form",
      "slug": "contact",
      "status": "published",
      "fieldsCount": 5,
      "submissionsCount": 42
    }
  ]
}
```

### Create Form

```http
POST /forms
```

**Request Body:**

```json
{
  "name": "Newsletter",
  "slug": "newsletter",
  "description": "Newsletter signup form"
}
```

### Get Form

```http
GET /forms/:id
```

Returns form with fields.

### Update Form

```http
PUT /forms/:id
```

### Delete Form

```http
DELETE /forms/:id
```

### Form Fields

```http
POST /forms/:id/fields           # Add field
PUT /forms/:id/fields/:fieldId   # Update field
DELETE /forms/:id/fields/:fieldId # Delete field
PUT /forms/:id/fields/reorder    # Reorder fields
```

### List Submissions

```http
GET /forms/:id/submissions
```

**Query Parameters:**
- `status` - Filter (`new`, `read`, `spam`, `archived`)
- `limit` - Results per page
- `offset` - Pagination offset

### Get Submission

```http
GET /forms/:id/submissions/:submissionId
```

### Update Submission Status

```http
PUT /forms/:id/submissions/:submissionId/status
```

**Request Body:**

```json
{
  "status": "read"
}
```

### Export Submissions

```http
POST /forms/:id/submissions/export
```

Returns CSV file.

### Public Form Submit

```http
POST /public/forms/:slug/submit
```

No authentication required.

**Request Body:**

```json
{
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello!"
  }
}
```

---

## Redirects Endpoints

### List Redirects

```http
GET /redirects
```

**Query Parameters:**
- `enabled` - Filter by enabled status

### Create Redirect

```http
POST /redirects
```

**Request Body:**

```json
{
  "fromPath": "/old-page",
  "toPath": "/new-page",
  "statusCode": 301
}
```

### Update Redirect

```http
PUT /redirects/:id
```

### Delete Redirect

```http
DELETE /redirects/:id
```

### Bulk Import

```http
POST /redirects/bulk-import
Content-Type: multipart/form-data
```

**Form Data:**
- `file` - CSV file

### Export Redirects

```http
GET /redirects/export
```

Returns CSV file.

---

## Authentication Endpoints

### Login

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "admin@example.com",
      "name": "Admin"
    },
    "token": "eyJhbGc..."
  }
}
```

### Logout

```http
POST /auth/logout
```

### Get Current User

```http
GET /auth/me
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Content not found",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

Default limits:
- 100 requests per minute per IP
- 1000 requests per minute per authenticated user

Headers in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705327200
```
