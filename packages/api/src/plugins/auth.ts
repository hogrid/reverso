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

      // Validate token format to prevent DoS from oversized tokens
      if (!token || token.length < 16 || token.length > 256) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token format',
        });
      }

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
            // Get role from user record (default to 'viewer' if not set)
            const userRole = (session.user?.role as AuthUser['role']) || 'viewer';
            request.user = {
              id: session.userId,
              email: session.user?.email,
              role: userRole,
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
    const xApiKey = request.headers['x-api-key']?.toString();
    if (xApiKey && xApiKey.length >= 16 && xApiKey.length <= 256 && apiKey && xApiKey === apiKey) {
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

// Type declaration for requireAuth decorator
declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (roles?: AuthUser['role'][]) => (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

/**
 * Role hierarchy for permission checks.
 * admin > editor > viewer
 */
export const ROLE_HIERARCHY: Record<AuthUser['role'], number> = {
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Check if user has at least the required role level.
 */
export function hasMinimumRole(userRole: AuthUser['role'], requiredRole: AuthUser['role']): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Permission definitions for different actions.
 */
export const PERMISSIONS = {
  // Content management
  'content:read': ['viewer', 'editor', 'admin'] as AuthUser['role'][],
  'content:write': ['editor', 'admin'] as AuthUser['role'][],
  'content:delete': ['admin'] as AuthUser['role'][],
  'content:publish': ['editor', 'admin'] as AuthUser['role'][],

  // Media management
  'media:read': ['viewer', 'editor', 'admin'] as AuthUser['role'][],
  'media:upload': ['editor', 'admin'] as AuthUser['role'][],
  'media:delete': ['admin'] as AuthUser['role'][],

  // Forms management
  'forms:read': ['viewer', 'editor', 'admin'] as AuthUser['role'][],
  'forms:write': ['editor', 'admin'] as AuthUser['role'][],
  'forms:delete': ['admin'] as AuthUser['role'][],

  // Schema management
  'schema:read': ['viewer', 'editor', 'admin'] as AuthUser['role'][],
  'schema:sync': ['admin'] as AuthUser['role'][],

  // Redirects management
  'redirects:read': ['viewer', 'editor', 'admin'] as AuthUser['role'][],
  'redirects:write': ['editor', 'admin'] as AuthUser['role'][],
  'redirects:delete': ['admin'] as AuthUser['role'][],

  // User management
  'users:read': ['admin'] as AuthUser['role'][],
  'users:write': ['admin'] as AuthUser['role'][],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if user has a specific permission.
 */
export function hasPermission(userRole: AuthUser['role'], permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}
