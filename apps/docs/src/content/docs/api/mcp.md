---
title: MCP Tools
description: Model Context Protocol tools reference for Reverso CMS
---

# MCP Tools Reference

Complete documentation for all MCP tools available in Reverso CMS.

## Overview

MCP (Model Context Protocol) tools allow AI assistants to interact with your Reverso CMS. Each tool has defined inputs and outputs.

## Setup

Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "reverso": {
      "command": "npx",
      "args": ["@reverso/mcp"],
      "env": {
        "DATABASE_PATH": "/path/to/.reverso/data.db"
      }
    }
  }
}
```

---

## Content Tools

### list_pages

List all pages in the content schema.

**Input:**
```json
{}
```

**Output:**
```json
{
  "pages": [
    {
      "slug": "home",
      "name": "Home",
      "path": "/",
      "sectionsCount": 3,
      "fieldsCount": 12
    }
  ]
}
```

---

### get_page

Get detailed information about a specific page.

**Input:**
```json
{
  "slug": "home"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Page slug |

**Output:**
```json
{
  "page": {
    "slug": "home",
    "name": "Home",
    "path": "/"
  },
  "sections": [
    {
      "slug": "hero",
      "name": "Hero",
      "isRepeater": false,
      "fields": [
        {
          "name": "title",
          "type": "text",
          "label": "Title"
        }
      ]
    }
  ]
}
```

---

### get_content

Get content value by path.

**Input:**
```json
{
  "path": "home.hero.title",
  "locale": "en"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Content path |
| `locale` | string | No | Locale code (default: "en") |

**Output:**
```json
{
  "path": "home.hero.title",
  "value": "Welcome to Our Site",
  "locale": "en",
  "publishedAt": "2025-01-15T10:30:00Z"
}
```

---

### update_content

Update content value.

**Input:**
```json
{
  "path": "home.hero.title",
  "value": "New Title",
  "locale": "en"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Content path |
| `value` | any | Yes | New value |
| `locale` | string | No | Locale code |

**Output:**
```json
{
  "success": true,
  "path": "home.hero.title",
  "previousValue": "Welcome to Our Site",
  "newValue": "New Title"
}
```

---

### publish_content

Publish content at a path.

**Input:**
```json
{
  "path": "home.hero.title",
  "locale": "en"
}
```

**Output:**
```json
{
  "success": true,
  "path": "home.hero.title",
  "publishedAt": "2025-01-15T12:00:00Z"
}
```

---

### unpublish_content

Unpublish content at a path.

**Input:**
```json
{
  "path": "home.hero.title",
  "locale": "en"
}
```

---

### bulk_update_content

Update multiple content items at once.

**Input:**
```json
{
  "updates": [
    { "path": "home.hero.title", "value": "Title" },
    { "path": "home.hero.subtitle", "value": "Subtitle" }
  ],
  "locale": "en"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `updates` | array | Yes | Array of path/value pairs |
| `locale` | string | No | Locale for all updates |

**Output:**
```json
{
  "success": true,
  "updated": 2
}
```

---

## Schema Tools

### get_schema

Get the complete content schema.

**Input:**
```json
{}
```

**Output:**
```json
{
  "pages": [...],
  "sections": [...],
  "fields": [...]
}
```

---

### get_fields

Get fields for a specific page or section.

**Input:**
```json
{
  "pageSlug": "home",
  "sectionSlug": "hero"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageSlug` | string | Yes | Page slug |
| `sectionSlug` | string | No | Section slug |

**Output:**
```json
{
  "fields": [
    {
      "name": "title",
      "path": "home.hero.title",
      "type": "text",
      "label": "Title",
      "required": true
    }
  ]
}
```

---

### suggest_field_type

AI suggests the best field type based on description.

**Input:**
```json
{
  "description": "A hero background image for the homepage",
  "context": "website hero section"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | Yes | Field description |
| `context` | string | No | Additional context |

**Output:**
```json
{
  "suggestedType": "image",
  "confidence": 0.95,
  "alternatives": ["gallery", "video"],
  "reasoning": "The description mentions 'image' and 'background', suggesting a single image field."
}
```

---

### list_field_types

List all available field types with descriptions.

**Input:**
```json
{}
```

**Output:**
```json
{
  "types": [
    {
      "name": "text",
      "description": "Single-line text input",
      "category": "text"
    },
    {
      "name": "image",
      "description": "Image upload with preview",
      "category": "media"
    }
  ]
}
```

---

## Media Tools

### list_media

List media files in the library.

**Input:**
```json
{
  "type": "image",
  "limit": 20,
  "offset": 0
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Filter by type |
| `limit` | number | No | Results limit (default: 20) |
| `offset` | number | No | Pagination offset |

**Output:**
```json
{
  "media": [
    {
      "id": "media_abc123",
      "filename": "hero.jpg",
      "url": "/uploads/hero.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "width": 1920,
      "height": 1080
    }
  ],
  "total": 50,
  "hasMore": true
}
```

---

### get_media

Get media by ID.

**Input:**
```json
{
  "id": "media_abc123"
}
```

---

### delete_media

Delete a media file.

**Input:**
```json
{
  "id": "media_abc123"
}
```

---

### get_media_stats

Get media library statistics.

**Input:**
```json
{}
```

**Output:**
```json
{
  "total": 150,
  "byType": {
    "image": 120,
    "video": 15,
    "audio": 5,
    "document": 10
  },
  "totalSize": 524288000,
  "recentUploads": 12
}
```

---

### search_media

Search media by filename.

**Input:**
```json
{
  "query": "hero",
  "type": "image"
}
```

---

## Form Tools

### list_forms

List all forms.

**Input:**
```json
{
  "status": "published"
}
```

**Output:**
```json
{
  "forms": [
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

---

### get_form

Get form with fields.

**Input:**
```json
{
  "id": "form_abc123"
}
```

**Output:**
```json
{
  "form": {
    "id": "form_abc123",
    "name": "Contact Form",
    "slug": "contact"
  },
  "fields": [
    {
      "name": "name",
      "type": "text",
      "label": "Your Name",
      "required": true
    }
  ]
}
```

---

### list_submissions

List form submissions.

**Input:**
```json
{
  "formId": "form_abc123",
  "status": "new",
  "limit": 20
}
```

**Output:**
```json
{
  "submissions": [
    {
      "id": "sub_xyz789",
      "data": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "status": "new",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 42
}
```

---

### get_submission

Get submission details.

**Input:**
```json
{
  "formId": "form_abc123",
  "submissionId": "sub_xyz789"
}
```

---

### update_submission_status

Update submission status.

**Input:**
```json
{
  "formId": "form_abc123",
  "submissionId": "sub_xyz789",
  "status": "read"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | Yes | new, read, spam, archived |

---

### get_form_stats

Get form statistics.

**Input:**
```json
{
  "formId": "form_abc123"
}
```

**Output:**
```json
{
  "total": 42,
  "byStatus": {
    "new": 5,
    "read": 30,
    "spam": 2,
    "archived": 5
  },
  "thisWeek": 12,
  "thisMonth": 35
}
```

---

## Generation Tools

### analyze_content

Analyze content quality and provide insights.

**Input:**
```json
{
  "path": "home.about.content",
  "locale": "en"
}
```

**Output:**
```json
{
  "wordCount": 450,
  "readability": {
    "score": 65,
    "grade": "8th grade",
    "level": "accessible"
  },
  "seo": {
    "hasKeywords": true,
    "metaDescription": false,
    "suggestions": ["Add meta description"]
  }
}
```

---

### suggest_content_improvements

Get AI suggestions for content improvements.

**Input:**
```json
{
  "path": "home.hero.title",
  "locale": "en",
  "goal": "increase conversions"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Content path |
| `goal` | string | No | Optimization goal |

**Output:**
```json
{
  "currentValue": "Welcome",
  "suggestions": [
    {
      "value": "Transform Your Business Today",
      "reasoning": "Action-oriented headline with urgency"
    },
    {
      "value": "The Solution You've Been Looking For",
      "reasoning": "Addresses pain points"
    }
  ]
}
```

---

### generate_slug

Generate URL-friendly slug from text.

**Input:**
```json
{
  "text": "Hello World! This is a Test"
}
```

**Output:**
```json
{
  "slug": "hello-world-this-is-a-test"
}
```

---

### generate_excerpt

Generate excerpt from long content.

**Input:**
```json
{
  "content": "Long article content here...",
  "maxLength": 150
}
```

**Output:**
```json
{
  "excerpt": "First 150 characters of content..."
}
```

---

### count_words

Count words in content.

**Input:**
```json
{
  "content": "This is some text content."
}
```

**Output:**
```json
{
  "words": 5,
  "characters": 27,
  "sentences": 1
}
```

---

## Prompts

The MCP server also provides these prompts:

### content-editor

System prompt for content editing tasks.

### content-analyst

System prompt for content analysis and improvement suggestions.

---

## Error Handling

All tools return errors in this format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Content not found at path: home.hero.title"
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input |
| `PERMISSION_DENIED` | Access denied |
| `INTERNAL_ERROR` | Server error |
