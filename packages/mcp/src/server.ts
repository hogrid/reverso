/**
 * Reverso MCP Server
 *
 * Provides AI assistants with tools to interact with Reverso CMS content.
 *
 * The server is a thin client of the Reverso HTTP API: every tool and
 * resource calls the API with the configured `X-API-Key`, so the API's
 * validation, role checks, publish semantics and webhooks apply to AI-driven
 * changes exactly as they do to the admin editor. It never opens the database.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { ZodError, type ZodRawShape } from 'zod';
import { ReversoApiClient, ReversoApiError } from './api-client.js';
import { DEFAULT_API_URL, validateApiKey } from './config.js';
import { contentTools, type PageSummary } from './tools/content.js';
import { formsTools } from './tools/forms.js';
import { generationTools } from './tools/generation.js';
import { mediaTools } from './tools/media.js';
import { schemaTools } from './tools/schema.js';
import type { ToolDefinition } from './tools/shared.js';
import type { McpServerConfig } from './types.js';

const JSON_MIME = 'application/json';

/** Shape of a tool result for MCP clients. */
interface ToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

function textResult(value: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

/**
 * One line per invalid argument, e.g. `value is required`.
 */
function formatZodError(error: ZodError): string {
  const lines = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.map(String).join('.') : 'input';
    if (issue.code === 'invalid_union') {
      return `${path} is required and must be a JSON value (string, number, boolean, null, array or object)`;
    }
    return `${path}: ${issue.message}`;
  });
  return `Invalid arguments: ${lines.join('; ')}`;
}

/**
 * Turn a thrown error into a tool error result. API errors keep their HTTP
 * status so clients can tell "not found" from "unauthorized".
 */
function errorResult(error: unknown): ToolResult {
  const payload =
    error instanceof ReversoApiError
      ? error.toJSON()
      : error instanceof ZodError
        ? { error: true as const, message: formatZodError(error) }
        : { error: true as const, message: error instanceof Error ? error.message : String(error) };
  return { content: [{ type: 'text', text: JSON.stringify(payload) }], isError: true };
}

export class ReversoMcpServer {
  private readonly server: McpServer;
  private readonly api: ReversoApiClient;

  constructor(config: McpServerConfig) {
    // Refuse to build a server that could not authenticate: the API rejects
    // short tokens outright, so failing here gives a clear message instead of
    // a 401 on the first tool call.
    const apiKey = validateApiKey(config.apiKey);
    const apiUrl = (config.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, '');

    this.api = new ReversoApiClient({ baseUrl: apiUrl, apiKey, fetch: config.fetch });

    this.server = new McpServer({
      name: config.name ?? 'reverso-mcp',
      version: config.version ?? '0.0.0',
    });

    this.registerTools();
    this.registerResources();
  }

  /** The API client every tool uses. */
  get apiClient(): ReversoApiClient {
    return this.api;
  }

  /**
   * Register all tools with the MCP server.
   */
  private registerTools(): void {
    this.registerToolGroup(contentTools, 'content');
    this.registerToolGroup(schemaTools, 'schema');
    this.registerToolGroup(mediaTools, 'media');
    this.registerToolGroup(formsTools, 'forms');
    this.registerToolGroup(generationTools, 'ai');
  }

  /**
   * Register a group of tools.
   *
   * Each tool exposes a zod object `inputSchema`; the MCP SDK validates
   * incoming arguments against its shape before the handler runs. The input
   * is parsed again through the full schema so the handler receives a value
   * matching its declared type.
   */
  private registerToolGroup(tools: Record<string, ToolDefinition>, prefix: string): void {
    for (const [name, tool] of Object.entries(tools)) {
      const toolName = `${prefix}_${name}`;
      const shape = tool.inputSchema.shape as ZodRawShape;

      this.server.registerTool(
        toolName,
        { description: tool.description, inputSchema: shape },
        async (input: unknown): Promise<ToolResult> => {
          try {
            const parsed = tool.inputSchema.parse(input ?? {}) as never;
            const result = await tool.handler(this.api, parsed);
            return textResult(result);
          } catch (error) {
            return errorResult(error);
          }
        }
      );
    }
  }

  /**
   * Register resources with the MCP server.
   */
  private registerResources(): void {
    this.server.registerResource(
      'schema',
      'reverso://schema',
      { description: 'The complete content schema (pages, sections, fields)', mimeType: JSON_MIME },
      async (uri) => {
        const result = await schemaTools.get_schema.handler(this.api, {});
        return { contents: [{ uri: uri.href, mimeType: JSON_MIME, text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.registerResource(
      'page',
      new ResourceTemplate('reverso://pages/{slug}', {
        list: async () => {
          const { data: pages } = await this.api.get<PageSummary[]>('/pages');
          return {
            resources: pages.map((page) => ({
              uri: `reverso://pages/${page.slug}`,
              name: page.name,
              description: `Page "${page.slug}" with its sections, fields and content`,
              mimeType: JSON_MIME,
            })),
          };
        },
      }),
      { description: 'A page with its sections, fields and content', mimeType: JSON_MIME },
      async (uri, variables) => {
        const slug = String(variables.slug ?? '');
        const result = await contentTools.get_page.handler(this.api, { slug });
        return { contents: [{ uri: uri.href, mimeType: JSON_MIME, text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.registerResource(
      'content',
      new ResourceTemplate('reverso://content/{path}', { list: undefined }),
      { description: 'The content of a single field by dotted path (e.g. home.hero.title)', mimeType: JSON_MIME },
      async (uri, variables) => {
        const path = String(variables.path ?? '');
        const result = await contentTools.get_content.handler(this.api, { path });
        return { contents: [{ uri: uri.href, mimeType: JSON_MIME, text: JSON.stringify(result, null, 2) }] };
      }
    );
  }

  /**
   * Connect the server to any MCP transport (stdio, in-memory, ...).
   */
  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }

  /**
   * Start the MCP server with stdio transport.
   */
  async start(): Promise<void> {
    await this.connect(new StdioServerTransport());
  }

  /**
   * Close the server and its transport.
   */
  async close(): Promise<void> {
    await this.server.close();
  }
}

/**
 * Create a Reverso MCP server (not yet connected to a transport).
 */
export async function createMcpServer(config: McpServerConfig): Promise<ReversoMcpServer> {
  return new ReversoMcpServer(config);
}

/**
 * Start the MCP server on stdio with the given configuration.
 */
export async function startMcpServer(config: McpServerConfig): Promise<void> {
  const server = await createMcpServer(config);
  await server.start();
}
