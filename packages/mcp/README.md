# @reverso/mcp

MCP (Model Context Protocol) server for AI integration with Reverso CMS.

The server is a thin client of the Reverso HTTP API. Every tool and resource
calls the API with your admin API key, so AI-driven edits go through the same
validation, role checks, publish semantics and webhooks as the admin editor.
It never opens the SQLite database itself.

## Installation

```bash
npm install @reverso/mcp
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `REVERSO_API_KEY` | yes | Admin API key of your CMS (the `REVERSO_API_KEY` the API runs with). At least 16 characters; the server refuses to start without a usable key. |
| `REVERSO_API_URL` | no | Base URL of the Reverso API. Default `http://localhost:3001`. |

Both can also be passed as flags: `--api-url` / `-u` and `--api-key` / `-k`.

## Usage

Start your CMS first (`reverso dev` or `reverso start`), then:

```bash
REVERSO_API_KEY=<your admin key> reverso-mcp
# or, against a deployed CMS
reverso-mcp --api-url https://cms.example.com --api-key <your admin key>
```

### Claude Desktop Configuration

Add to `claude_desktop_config.json`:

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

### Programmatic

```typescript
import { startMcpServer } from '@reverso/mcp';

await startMcpServer({
  apiUrl: 'http://localhost:3001',
  apiKey: process.env.REVERSO_API_KEY!,
});
```

## Available Tools

Tool names are prefixed by their group (`content_`, `schema_`, `media_`,
`forms_`, `ai_`).

### Content (`content_*`)
- `list_pages` - List all pages (`includeContent` adds their values)
- `get_page` - Get a page with sections, fields and content
- `get_content` - Get content by path (e.g. `home.hero.title`)
- `update_content` - Write a field (`value` required; published unless `publish: false`)
- `bulk_update_content` - Write several fields, validated per page
- `publish_content` / `unpublish_content`

### Schema (`schema_*`)
- `get_schema` - Get the full schema
- `get_fields` - List fields, filtered by type or page
- `suggest_field_type` - Field type suggestion from a name or sample
- `list_field_types` - All field types with descriptions

### Media (`media_*`)
- `list_media` / `search_media` - Browse the media library
- `get_media` - Get a file by ID or filename
- `delete_media` - Delete a file (admin key)
- `get_media_stats` - Library statistics

### Forms (`forms_*`)
- `list_forms` / `get_form`
- `list_submissions` / `get_submission` / `update_submission_status`
- `get_form_stats`

### Generation (`ai_*`)
- `analyze_content`, `suggest_content_improvements`, `generate_slug`,
  `generate_excerpt`, `count_words` (pure helpers, no API call)

## Resources

- `reverso://schema` - the content schema
- `reverso://pages/{slug}` - a page with its content (listed for every page)
- `reverso://content/{path}` - a single field's content

## Errors

API errors are returned as tool errors with the HTTP status, e.g.
`{"error": true, "status": 404, "message": "Not found (404): Field \"home.hero.x\" not found"}`.
A `401` means the configured `REVERSO_API_KEY` was rejected by the API.

## Documentation

See [https://reverso.dev/docs/packages/mcp](https://reverso.dev/docs/packages/mcp)

## License

MIT
