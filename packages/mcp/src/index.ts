/**
 * @reverso/mcp
 *
 * MCP Server for AI integration with Reverso CMS.
 * Allows AI assistants to interact with CMS content via Model Context Protocol.
 *
 * @example
 * ```typescript
 * import { createMcpServer, startMcpServer } from '@reverso/mcp';
 *
 * // Start the server
 * await startMcpServer({
 *   databasePath: '.reverso/dev.db',
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
 *       "args": ["reverso-mcp", "-d", "/path/to/.reverso/dev.db"]
 *     }
 *   }
 * }
 * ```
 */

export const VERSION = '0.0.0';

// Server exports
export { ReversoMcpServer, createMcpServer, startMcpServer } from './server.js';

// Tool exports
export { contentTools } from './tools/content.js';
export { schemaTools } from './tools/schema.js';
export { mediaTools } from './tools/media.js';
export { formsTools } from './tools/forms.js';
export { generationTools } from './tools/generation.js';

// Type exports
export type { McpServerConfig, ContentUpdateInput, ContentGenerationInput, FieldTypeSuggestion, ContentAnalysis } from './types.js';
