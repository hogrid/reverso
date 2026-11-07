---
title: "@reverso/mcp"
description: Model Context Protocol server for AI integration
---

# @reverso/mcp

The MCP package provides a Model Context Protocol server for AI-powered content management.

## Overview

MCP (Model Context Protocol) allows AI assistants like Claude to interact with Reverso CMS directly. This enables:

- **Content queries** - Ask about pages, sections, and fields
- **Content updates** - Modify content via natural language
- **Media management** - List and manage media files
- **Form handling** - View submissions, manage forms
- **Content generation** - AI-assisted content creation

The server is a **thin client of the Reverso HTTP API**: every tool and
resource calls the API with your admin API key (`X-API-Key`). AI-driven edits
therefore go through the same validation, role checks, publish semantics and
webhooks as the admin editor. The server never opens the database itself, so
it can run on any machine that can reach your CMS.

## Installation

```bash
npm install @reverso/mcp
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `REVERSO_API_KEY` | yes | The admin API key of your CMS: the same `REVERSO_API_KEY` the API runs with. Must be at least 16 characters; the server refuses to start with a clear message when it is missing or too short. |
| `REVERSO_API_URL` | no | Base URL of the Reverso API. Default: `http://localhost:3001`. |

Both can also be given as flags: `--api-url` (`-u`) and `--api-key` (`-k`).

Start your CMS first (`reverso dev` locally, `reverso start` in production),
then start the MCP server pointing at it.

### Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "reverso": {
      "command": "npx",
      "args": ["-y", "@reverso/mcp"],
      "env": {
        "REVERSO_API_URL": "http://localhost:3001",
        "REVERSO_API_KEY": "<your admin API key>"
      }
    }
  }
}
```

### Command line

```bash
REVERSO_API_KEY=<your admin key> reverso-mcp
# or against a deployed CMS
reverso-mcp --api-url https://cms.example.com --api-key <your admin key>
```

### Programmatic

```typescript
import { ReversoMcpServer } from '@reverso/mcp';

const server = new ReversoMcpServer({
  apiUrl: 'http://localhost:3001',
  apiKey: process.env.REVERSO_API_KEY!,
});

await server.start(); // stdio transport
```

## Available Tools

Tool names are prefixed by their group: `content_`, `schema_`, `media_`,
`forms_` and `ai_` (for example `content_update_content`).

### Content Tools

| Tool | Description | API route |
|------|-------------|-----------|
| `list_pages` | List all pages (`includeContent` adds their values) | `GET /pages`, `GET /content/page/:slug` |
| `get_page` | Get a page with its sections, fields and content | `GET /pages/:slug`, `GET /content/page/:slug` |
| `get_content` | Get content by path | `GET /content/:path` |
| `update_content` | Write a field. `value` is required; the value is published unless `publish: false` | `PUT /content/:path` |
| `bulk_update_content` | Write several fields at once, grouped and validated per page | `PATCH /content/page/:slug` |
| `publish_content` | Publish content | `POST /content/:path/publish` |
| `unpublish_content` | Unpublish content | `POST /content/:path/unpublish` |

### Schema Tools

| Tool | Description |
|------|-------------|
| `get_schema` | Get the full content schema (`GET /schema`) |
| `get_fields` | List fields, filtered by type or page |
| `suggest_field_type` | Suggest a field type from a name or sample value |
| `list_field_types` | List all available field types |

### Media Tools

| Tool | Description |
|------|-------------|
| `list_media` | List media files (`GET /media`) |
| `search_media` | Search media by filename or alt text |
| `get_media` | Get media by ID or filename |
| `delete_media` | Delete a media file (`DELETE /media/:id`, admin key) |
| `get_media_stats` | Media library statistics (`GET /stats`) |

### Form Tools

| Tool | Description |
|------|-------------|
| `list_forms` | List all forms |
| `get_form` | Get a form with its fields, by ID or slug |
| `list_submissions` | List submissions of a form |
| `get_submission` | Get a submission (`formId` + `id`) |
| `update_submission_status` | Update a submission's status (`formId` + `id`) |
| `get_form_stats` | Submission statistics of a form |

### Generation Tools

Pure helpers that never call the API.

| Tool | Description |
|------|-------------|
| `analyze_content` | Analyze content quality and readability |
| `suggest_content_improvements` | Content suggestions |
| `generate_slug` | Generate a URL slug |
| `generate_excerpt` | Generate an excerpt |
| `count_words` | Count words in content |

## Resources

| URI | Description |
|-----|-------------|
| `reverso://schema` | The content schema |
| `reverso://pages/{slug}` | A page with its content (one resource is listed per page) |
| `reverso://content/{path}` | A single field's content |

## Errors

Tool inputs are validated before any request is made (a write without a
`value` is rejected). API errors come back as tool errors that keep the HTTP
status, so an assistant can tell them apart:

```json
{ "error": true, "status": 404, "message": "Not found (404): Field \"home.hero.x\" not found", "method": "PUT", "path": "/content/home.hero.x" }
```

| Status | Meaning |
|--------|---------|
| `400` | The API rejected the request (invalid path, unknown field, field of another page, ...) |
| `401` | The configured `REVERSO_API_KEY` was rejected |
| `403` | The key's role is not allowed to perform the action |
| `404` | Page, field, media file or form not found |
| `0` | The API could not be reached; check `REVERSO_API_URL` |

## Example Interactions

### Update Content

```
User: Change the hero title on the homepage to "Welcome to Acme"

Claude: I'll update the hero title for you.

[Uses content_update_content with path="home.hero.title", value="Welcome to Acme"]

Done! The homepage hero title is now "Welcome to Acme" and is live.
```

### Form Submissions

```
User: How many contact form submissions do I have?

Claude: [Uses forms_list_forms, then forms_get_form_stats]

Your contact form has 21 submissions: 12 new, 8 read and 1 marked as spam.
```

## API Reference

```typescript
import {
  ReversoMcpServer,
  ReversoApiClient,
  ReversoApiError,
  resolveMcpConfig,
  type McpServerConfig,
} from '@reverso/mcp';

interface McpServerConfig {
  /** Default: REVERSO_API_URL or http://localhost:3001 */
  apiUrl?: string;
  /** Required, 16+ characters */
  apiKey: string;
  name?: string;
  version?: string;
  /** Injectable fetch, for tests */
  fetch?: typeof fetch;
}

// Reads REVERSO_API_URL / REVERSO_API_KEY and throws a clear error when the key is unusable.
const { apiUrl, apiKey } = resolveMcpConfig(process.env);
```

`ReversoMcpServer` exposes `start()` (stdio), `connect(transport)` for any MCP
transport, and `close()`.

## Next Steps

- [@reverso/api](/packages/api/) - The REST API the server talks to
- [@reverso/cli](/packages/cli/) - CLI commands
