/**
 * Reverso MCP Server
 *
 * Provides AI assistants with tools to interact with Reverso CMS content.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createDatabase, type DrizzleDatabase } from '@reverso/db';
import type { McpServerConfig } from './types.js';
import { contentTools } from './tools/content.js';
import { schemaTools } from './tools/schema.js';
import { mediaTools } from './tools/media.js';
import { formsTools } from './tools/forms.js';
import { generationTools } from './tools/generation.js';

export class ReversoMcpServer {
  private server: McpServer;
  private db: DrizzleDatabase | null = null;
  private config: McpServerConfig;
  private isAuthenticated = false;

  constructor(config: McpServerConfig) {
    this.config = config;

    // Validate API key if authentication is enabled
    const apiKey = config.apiKey || process.env.REVERSO_MCP_API_KEY;
    const authEnabled = config.authEnabled ?? !!apiKey;

    if (authEnabled && !apiKey) {
      console.error('[MCP] Warning: Authentication enabled but no API key provided.');
      console.error('[MCP] Set REVERSO_MCP_API_KEY environment variable or pass apiKey in config.');
    }

    // In production-like environments, authentication is validated at startup
    this.isAuthenticated = !authEnabled || !!apiKey;

    this.server = new McpServer({
      name: config.name ?? 'reverso-mcp',
      version: config.version ?? '0.0.0',
    });

    this.registerTools();
    this.registerResources();
  }

  /**
   * Validate that the server is authenticated.
   * Throws if auth is required but not provided.
   */
  private validateAuth(): void {
    if (!this.isAuthenticated) {
      throw new Error('MCP Server requires authentication. Set REVERSO_MCP_API_KEY environment variable.');
    }
  }

  /**
   * Register all tools with the MCP server.
   */
  private registerTools(): void {
    // Content tools
    this.registerToolGroup(contentTools, 'content');

    // Schema tools
    this.registerToolGroup(schemaTools, 'schema');

    // Media tools
    this.registerToolGroup(mediaTools, 'media');

    // Forms tools
    this.registerToolGroup(formsTools, 'forms');

    // Generation tools
    this.registerToolGroup(generationTools, 'ai');
  }

  /**
   * Register a group of tools.
   */
  private registerToolGroup(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: Record<string, { description: string; inputSchema: z.ZodType; handler: (db: DrizzleDatabase, input: any) => Promise<unknown> }>,
    prefix: string
  ): void {
    for (const [name, tool] of Object.entries(tools)) {
      const toolName = `${prefix}_${name}`;

      this.server.tool(
        toolName,
        tool.description,
        tool.inputSchema instanceof z.ZodObject
          ? (tool.inputSchema as z.ZodObject<Record<string, z.ZodType>>).shape
          : {},
        async (input: Record<string, unknown>) => {
          try {
            // Validate authentication before executing any tool
            this.validateAuth();

            const db = await this.getDatabase();
            const result = await tool.handler(db, input);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({
                    error: true,
                    message: error instanceof Error ? error.message : String(error),
                  }),
                },
              ],
              isError: true,
            };
          }
        }
      );
    }
  }

  /**
   * Register resources with the MCP server.
   */
  private registerResources(): void {
    // Schema resource
    this.server.resource(
      'schema',
      'reverso://schema',
      async () => {
        const db = await this.getDatabase();
        const result = await schemaTools.get_schema.handler(db, {});
        return {
          contents: [
            {
              uri: 'reverso://schema',
              mimeType: 'application/json',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    // Pages resource template
    this.server.resource(
      'page',
      'reverso://pages/{slug}',
      async (uri) => {
        const db = await this.getDatabase();
        const slug = uri.pathname.split('/').pop() ?? '';
        const result = await contentTools.get_page.handler(db, { slug });
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'application/json',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    // Content resource template
    this.server.resource(
      'content',
      'reverso://content/{path}',
      async (uri) => {
        const db = await this.getDatabase();
        const path = uri.pathname.replace('/content/', '');
        const result = await contentTools.get_content.handler(db, { path });
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'application/json',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );
  }

  /**
   * Get or create database connection.
   */
  private async getDatabase(): Promise<DrizzleDatabase> {
    if (!this.db) {
      this.db = await createDatabase({ url: this.config.databasePath });
    }
    return this.db;
  }

  /**
   * Start the MCP server with stdio transport.
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  /**
   * Close the server and database connection.
   */
  async close(): Promise<void> {
    if (this.db) {
      // Database cleanup if needed
      this.db = null;
    }
  }
}

/**
 * Create and start a Reverso MCP server.
 */
export async function createMcpServer(config: McpServerConfig): Promise<ReversoMcpServer> {
  const server = new ReversoMcpServer(config);
  return server;
}

/**
 * Start the MCP server with the given configuration.
 */
export async function startMcpServer(config: McpServerConfig): Promise<void> {
  const server = await createMcpServer(config);
  await server.start();
}
