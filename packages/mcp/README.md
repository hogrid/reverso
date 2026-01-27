# @reverso/mcp

MCP Server for AI integration with Reverso CMS.

## Installation

```bash
npm install @reverso/mcp
```

## Usage

Start the MCP server:

```bash
reverso-mcp --database ./data/reverso.db
```

### Claude Desktop Configuration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "reverso": {
      "command": "npx",
      "args": ["@reverso/mcp", "--database", "/path/to/reverso.db"]
    }
  }
}
```

## Available Tools

### Content Management
- `list_pages` - List all pages
- `get_page` - Get page details
- `get_content` - Get content by path
- `update_content` - Update content
- `publish_content` / `unpublish_content`

### Schema
- `get_schema` - Get full schema
- `get_fields` - Get fields for a page
- `suggest_field_type` - AI field type suggestion

### Media
- `list_media` - Browse media library
- `search_media` - Search files
- `get_media_stats` - Library statistics

### Forms
- `list_forms` - List all forms
- `get_form` - Get form details
- `list_submissions` - View submissions

## Documentation

See [https://reverso.dev/docs/packages/mcp](https://reverso.dev/docs/packages/mcp)

## License

MIT
