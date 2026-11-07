/**
 * @reverso/mcp
 *
 * MCP Server for AI integration with Reverso CMS.
 * Allows AI assistants to interact with CMS content via Model Context Protocol.
 *
 * The server is a thin client of the Reverso HTTP API (`REVERSO_API_URL`,
 * default `http://localhost:3001`) authenticated with the admin API key
 * (`REVERSO_API_KEY`). It never opens the database itself.
 *
 * @example
 * ```typescript
 * import { startMcpServer } from '@reverso/mcp';
 *
 * await startMcpServer({
 *   apiUrl: 'http://localhost:3001',
 *   apiKey: process.env.REVERSO_API_KEY!,
 * });
 * ```
 *
 * @example
 * Add to Claude Desktop config (claude_desktop_config.json):
 * ```json
 * {
 *   "mcpServers": {
 *     "reverso": {
 *       "command": "npx",
 *       "args": ["-y", "@reverso/mcp"],
 *       "env": {
 *         "REVERSO_API_URL": "http://localhost:3001",
 *         "REVERSO_API_KEY": "<your admin API key>"
 *       }
 *     }
 *   }
 * }
 * ```
 */

/** Package version, read from package.json so it always matches the release. */
import { readFileSync } from 'node:fs';

export const VERSION: string = (() => {
  try {
    const pkg = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
    ) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
})();

// Server exports
export { ReversoMcpServer, createMcpServer, startMcpServer } from './server.js';

// API client and configuration
export { ReversoApiClient, ReversoApiError } from './api-client.js';
export type { ReversoApiClientOptions, ApiResult } from './api-client.js';
export {
  DEFAULT_API_URL,
  MIN_API_KEY_LENGTH,
  resolveMcpConfig,
  validateApiKey,
} from './config.js';
export type { ResolvedMcpConfig, McpConfigOverrides } from './config.js';

// Tool exports
export { contentTools } from './tools/content.js';
export { schemaTools } from './tools/schema.js';
export { mediaTools } from './tools/media.js';
export { formsTools } from './tools/forms.js';
export { generationTools } from './tools/generation.js';
export type { ToolDefinition } from './tools/shared.js';

// Type exports
export type {
  McpServerConfig,
  ContentUpdateInput,
  ContentGenerationInput,
  FieldTypeSuggestion,
  ContentAnalysis,
} from './types.js';
