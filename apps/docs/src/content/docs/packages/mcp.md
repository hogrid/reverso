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

## Installation

```bash
npm install @reverso/mcp
```

## Configuration

### Claude Desktop

Add to your Claude Desktop config (`~/.config/claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "reverso": {
      "command": "npx",
      "args": ["@reverso/mcp"],
      "env": {
        "DATABASE_PATH": "/path/to/your/.reverso/data.db"
      }
    }
  }
}
```

### Standalone Server

```typescript
import { ReversoMcpServer } from '@reverso/mcp';

const server = new ReversoMcpServer({
  databasePath: '.reverso/data.db',
});

await server.start();
```

## Available Tools

### Content Tools

| Tool | Description |
|------|-------------|
| `list_pages` | List all pages in the schema |
| `get_page` | Get a page with its sections and fields |
| `get_content` | Get content by path |
| `update_content` | Update content value |
| `publish_content` | Publish content |
| `unpublish_content` | Unpublish content |
| `bulk_update_content` | Update multiple content items |

### Schema Tools

| Tool | Description |
|------|-------------|
| `get_schema` | Get full content schema |
| `get_fields` | Get fields for a page/section |
| `suggest_field_type` | AI suggests appropriate field type |
| `list_field_types` | List all available field types |

### Media Tools

| Tool | Description |
|------|-------------|
| `list_media` | List media files |
| `get_media` | Get media by ID |
| `delete_media` | Delete media file |
| `get_media_stats` | Media library statistics |
| `search_media` | Search media by filename |

### Form Tools

| Tool | Description |
|------|-------------|
| `list_forms` | List all forms |
| `get_form` | Get form with fields |
| `list_submissions` | List form submissions |
| `get_submission` | Get submission details |
| `update_submission_status` | Update submission status |
| `get_form_stats` | Form statistics |

### Generation Tools

| Tool | Description |
|------|-------------|
| `analyze_content` | Analyze content quality |
| `suggest_content_improvements` | AI content suggestions |
| `generate_slug` | Generate URL slug |
| `generate_excerpt` | Generate content excerpt |
| `count_words` | Count words in content |

## Example Interactions

### List Pages

```
User: What pages are in my CMS?

Claude: Let me check the pages in your Reverso CMS.

[Uses list_pages tool]

Your CMS has the following pages:
- home - Homepage
- about - About Us
- services - Our Services
- contact - Contact Page
- blog - Blog
```

### Update Content

```
User: Change the hero title on the homepage to "Welcome to Acme"

Claude: I'll update the hero title for you.

[Uses update_content tool with path="home.hero.title", value="Welcome to Acme"]

Done! I've updated the homepage hero title to "Welcome to Acme".
```

### Content Analysis

```
User: Is my About page content good?

Claude: Let me analyze your About page content.

[Uses analyze_content tool]

Here's my analysis:
- Word count: 450 words (good length)
- Readability: Grade 8 (accessible)
- SEO: Missing meta description
- Suggestions:
  1. Add more specific calls-to-action
  2. Include customer testimonials
  3. Add team member photos
```

### Form Submissions

```
User: How many contact form submissions this week?

Claude: Let me check your contact form submissions.

[Uses get_form_stats tool]

This week you received:
- 12 new submissions
- 8 marked as read
- 1 marked as spam
- Most common inquiry: Product pricing
```

## Prompts

The MCP server provides system prompts:

### content-editor

For content editing tasks:
```
You are a content editor for a website using Reverso CMS.
You can view and modify content using the available tools.
Always confirm changes before making them.
```

### content-analyst

For content analysis:
```
You are a content analyst. Analyze content for quality,
SEO, readability, and suggest improvements.
```

## API Reference

### ReversoMcpServer

```typescript
class ReversoMcpServer {
  constructor(config: McpServerConfig);

  // Start the server
  start(): Promise<void>;

  // Stop the server
  stop(): Promise<void>;

  // Register custom tool
  registerTool(tool: McpTool): void;

  // Register custom prompt
  registerPrompt(prompt: McpPrompt): void;
}

interface McpServerConfig {
  databasePath: string;
  transport?: 'stdio' | 'http';
  port?: number;
}
```

### Tool Definition

```typescript
interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required?: string[];
  };
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}
```

## Custom Tools

Extend with your own tools:

```typescript
import { ReversoMcpServer } from '@reverso/mcp';

const server = new ReversoMcpServer({
  databasePath: '.reverso/data.db',
});

server.registerTool({
  name: 'custom_tool',
  description: 'My custom tool',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
    },
    required: ['query'],
  },
  handler: async ({ query }) => {
    // Your logic here
    return { results: [] };
  },
});

await server.start();
```

## Security

### Authentication

The MCP server uses the same authentication as the main API:

```typescript
const server = new ReversoMcpServer({
  databasePath: '.reverso/data.db',
  auth: {
    required: true,
    apiKey: process.env.MCP_API_KEY,
  },
});
```

### Permissions

Configure tool access:

```typescript
const server = new ReversoMcpServer({
  databasePath: '.reverso/data.db',
  permissions: {
    // Read-only mode
    allowWrite: false,

    // Disable specific tools
    disabledTools: ['delete_media', 'bulk_update_content'],

    // Require confirmation for writes
    confirmWrites: true,
  },
});
```

## Debugging

Enable debug logging:

```bash
DEBUG=reverso:mcp npx @reverso/mcp
```

## TypeScript Support

```typescript
import type {
  McpServerConfig,
  McpTool,
  McpPrompt,
  ToolResult,
} from '@reverso/mcp';
```

## Next Steps

- [MCP Tools Reference](/api/mcp/) - Full tool documentation
- [@reverso/cli](/packages/cli/) - CLI commands
