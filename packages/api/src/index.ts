/**
 * @reverso/api
 *
 * REST and GraphQL API server for Reverso CMS using Fastify.
 * Provides endpoints for content management, media, forms, and authentication.
 *
 * @example
 * ```ts
 * import { createServer, startServer, registerRoutes } from '@reverso/api';
 * import { databasePlugin } from '@reverso/api/plugins';
 *
 * const server = await createServer({ port: 3001 });
 *
 * // Register database
 * await server.register(databasePlugin, { url: '.reverso/dev.db' });
 *
 * // Register routes
 * await registerRoutes(server);
 *
 * // Start server
 * await startServer(server);
 * ```
 */

export const VERSION = '0.1.0';

// Server exports
export {
  createServer,
  registerAuth,
  startServer,
  stopServer,
  type ServerConfig,
  type CorsOptions,
} from './server.js';

// Plugin exports
export { databasePlugin } from './plugins/index.js';

// Route exports
export {
  registerRoutes,
  schemaRoutes,
  pagesRoutes,
  contentRoutes,
  mediaRoutes,
} from './routes/index.js';

// Type exports
export type {
  ApiRequest,
  ApiError,
  ApiResponse,
  AuthUser,
  SchemaSyncBody,
  ContentUpdateBody,
  BulkContentUpdateBody,
  MediaUploadResult,
  PaginationParams,
  ListResponse,
} from './types.js';

/**
 * Create and start a fully configured API server.
 * Convenience function that combines createServer, registerDatabase, and registerRoutes.
 */
export async function createApiServer(options: {
  port?: number;
  host?: string;
  databaseUrl: string;
  prefix?: string;
  cors?: boolean;
  logger?: boolean;
}) {
  const { createServer, registerAuth } = await import('./server.js');
  const { databasePlugin } = await import('./plugins/index.js');
  const { registerRoutes } = await import('./routes/index.js');
  const { createDatabaseSchema } = await import('@reverso/db');

  // Create database schema if needed
  await createDatabaseSchema(options.databaseUrl);

  // Create server (without auth - auth must come after database)
  const server = await createServer({
    port: options.port,
    host: options.host,
    cors: options.cors,
    logger: options.logger,
    prefix: options.prefix,
  });

  // Register database plugin FIRST so request.db is available
  await server.register(databasePlugin, { url: options.databaseUrl });

  // Register auth AFTER database so session validation can access request.db
  await registerAuth(server);

  // Register routes
  await registerRoutes(server, options.prefix);

  return server;
}
