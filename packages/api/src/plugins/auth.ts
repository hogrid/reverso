/**
 * Authentication plugin for Reverso API.
 *
 * Supports:
 * - API Key authentication (for CI/CD, scripts, MCP)
 * - Session token authentication (for admin panel)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

export interface AuthPluginOptions {
  /** API key for programmatic access */
  apiKey?: string;
  /** Skip auth for these paths (regex patterns) */
  publicPaths?: RegExp[];
  /** Enable auth (default: true in production) */
  enabled?: boolean;
}

export interface AuthUser {
  id: string;
  email?: string;
  role: 'admin' | 'editor' | 'viewer';
  authMethod: 'api_key' | 'session';
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

const DEFAULT_PUBLIC_PATHS = [
  /^\/health$/,
  /^\/uploads\//,
  /^\/sitemap\.xml$/,
  /^\/api\/reverso\/public\//,
];

async function authPlugin(
  fastify: FastifyInstance,
  options: AuthPluginOptions
): Promise<void> {
  const apiKey = options.apiKey || process.env.REVERSO_API_KEY;
  const isProduction = process.env.NODE_ENV === 'production';
  const enabled = options.enabled ?? isProduction;

  const publicPaths = [...DEFAULT_PUBLIC_PATHS, ...(options.publicPaths || [])];

  // Add auth check hook
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip if auth is disabled (dev mode)
    if (!enabled) {
      request.user = {
        id: 'dev-user',
        email: 'dev@localhost',
        role: 'admin',
        authMethod: 'api_key',
      };
      return;
    }

    // Check if path is public
    const isPublicPath = publicPaths.some((pattern) => pattern.test(request.url));
    if (isPublicPath) {
      return;
    }

    // Try API key authentication
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      // Check API key
      if (apiKey && token === apiKey) {
        request.user = {
          id: 'api-key-user',
          role: 'admin',
          authMethod: 'api_key',
        };
        return;
      }

      // Check session token (Better Auth format)
      // Session tokens should be validated against the database
      const db = (request as any).db;
      if (db) {
        try {
          const { getSessionByToken } = await import('@reverso/db');
          const session = await getSessionByToken(db, token);
          if (session && new Date(session.expiresAt).getTime() > Date.now()) {
            request.user = {
              id: session.userId,
              role: 'admin', // TODO: Get role from user record
              authMethod: 'session',
            };
            return;
          }
        } catch {
          // Session validation failed, continue to error
        }
      }
    }

    // Check X-API-Key header (alternative)
    const xApiKey = request.headers['x-api-key'];
    if (apiKey && xApiKey === apiKey) {
      request.user = {
        id: 'api-key-user',
        role: 'admin',
        authMethod: 'api_key',
      };
      return;
    }

    // No valid authentication
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: 'Valid authentication required. Use Bearer token or X-API-Key header.',
    });
  });

  // Decorate with auth helper
  fastify.decorate('requireAuth', (roles?: AuthUser['role'][]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      if (roles && !roles.includes(request.user.role)) {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
      }
    };
  });
}

export default fp(authPlugin, {
  name: 'reverso-auth',
  fastify: '5.x',
});
