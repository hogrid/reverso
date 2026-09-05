/**
 * Authentication plugin for Reverso API.
 *
 * Every request outside the public allow-list must carry one of:
 * - the `reverso_session` cookie set by `/auth/login` (admin panel);
 * - a `Bearer <session token>` header (same token, for programmatic use);
 * - the configured API key, as `Bearer <key>` or `X-API-Key: <key>`
 *   (CI, scripts, the scanner sync, MCP).
 *
 * Authentication is ON by default in every environment. It can be switched
 * off only explicitly (`authEnabled: false` or `REVERSO_AUTH_ENABLED=false`),
 * which is meant for local experiments, never for a reachable server.
 */

import { getSessionWithUser } from '@reverso/db';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export interface AuthPluginOptions {
  /** API key for programmatic access */
  apiKey?: string;
  /** Skip auth for these paths (regex patterns) */
  publicPaths?: RegExp[];
  /** Enable auth (default: true; `REVERSO_AUTH_ENABLED=false` disables) */
  enabled?: boolean;
}

export type AuthRole = 'admin' | 'editor' | 'viewer';

export interface AuthUser {
  id: string;
  email?: string;
  role: AuthRole;
  authMethod: 'api_key' | 'session';
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export const SESSION_COOKIE = 'reverso_session';

const DEFAULT_PUBLIC_PATHS = [
  /^\/health$/,
  /^\/api\/reverso\/health$/,
  /^\/uploads\//,
  /^\/sitemap\.xml$/,
  /^\/api\/reverso\/sitemap\.xml$/,
  /^\/api\/reverso\/public\//,
  /^\/api\/reverso\/redirect$/, // Redirect lookup used by frontend middleware
  /^\/admin(\/|$)/, // Admin panel shell + static files (the SPA handles login)
  /^\/favicon\.svg$/,
  /^\/auth\//, // Auth routes (login, register, setup-status, etc) - always accessible
];

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const MIN_TOKEN_LENGTH = 16;
const MAX_TOKEN_LENGTH = 256;

/** Resolve the effective "enabled" flag from options and environment. */
export function resolveAuthEnabled(explicit?: boolean): boolean {
  if (explicit !== undefined) return explicit;
  const env = process.env.REVERSO_AUTH_ENABLED;
  if (env === undefined) return true;
  return !['false', '0', 'off', 'no'].includes(env.toLowerCase());
}

function normalizeRole(role: string | null | undefined): AuthRole {
  return role === 'admin' || role === 'editor' || role === 'viewer' ? role : 'viewer';
}

function tokenLooksValid(token: string | undefined): token is string {
  return (
    typeof token === 'string' &&
    token.length >= MIN_TOKEN_LENGTH &&
    token.length <= MAX_TOKEN_LENGTH
  );
}

/**
 * For cookie-authenticated mutations, reject requests whose Origin header
 * points to another site. Browsers always send Origin on cross-site
 * POST/PUT/PATCH/DELETE, so this closes CSRF even where SameSite is not
 * honoured; non-browser clients use the API key and are unaffected.
 */
function isCrossSiteMutation(request: FastifyRequest): boolean {
  if (!MUTATING_METHODS.has(request.method)) return false;
  const origin = request.headers.origin;
  if (!origin) return false;
  try {
    const originHost = new URL(origin).host;
    return originHost !== request.headers.host;
  } catch {
    return true;
  }
}

async function authPlugin(
  fastify: FastifyInstance,
  options: AuthPluginOptions
): Promise<void> {
  const apiKey = options.apiKey || process.env.REVERSO_API_KEY || '';
  const enabled = resolveAuthEnabled(options.enabled);
  const publicPaths = [...DEFAULT_PUBLIC_PATHS, ...(options.publicPaths || [])];

  if (!enabled) {
    fastify.log.warn(
      'Authentication is DISABLED: every request is treated as an admin. Never expose this server.'
    );
  }

  const unauthorized = (reply: FastifyReply, message: string) =>
    reply.status(401).send({ success: false, error: 'Unauthorized', message });

  async function resolveSessionUser(
    request: FastifyRequest,
    token: string
  ): Promise<AuthUser | null> {
    const db = request.db;
    if (!db) return null;
    try {
      const result = await getSessionWithUser(db, token);
      if (!result) return null;
      return {
        id: result.user.id,
        email: result.user.email,
        role: normalizeRole(result.user.role),
        authMethod: 'session',
      };
    } catch {
      return null;
    }
  }

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!enabled) {
      request.user = {
        id: 'dev-user',
        email: 'dev@localhost',
        role: 'admin',
        authMethod: 'api_key',
      };
      return;
    }

    const path = request.url.split('?')[0] ?? request.url;
    if (publicPaths.some((pattern) => pattern.test(path))) {
      return;
    }

    // 1. Session cookie (admin panel)
    const cookieToken = request.cookies?.[SESSION_COOKIE];
    if (tokenLooksValid(cookieToken)) {
      const user = await resolveSessionUser(request, cookieToken);
      if (user) {
        if (isCrossSiteMutation(request)) {
          return reply.status(403).send({
            success: false,
            error: 'Forbidden',
            message: 'Cross-site request rejected',
          });
        }
        request.user = user;
        return;
      }
    }

    // 2. Bearer token: API key or session token
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      if (!tokenLooksValid(token)) {
        return unauthorized(reply, 'Invalid token format');
      }
      if (apiKey && token === apiKey) {
        request.user = { id: 'api-key-user', role: 'admin', authMethod: 'api_key' };
        return;
      }
      const user = await resolveSessionUser(request, token);
      if (user) {
        request.user = user;
        return;
      }
    }

    // 3. X-API-Key header
    const xApiKey = request.headers['x-api-key']?.toString();
    if (tokenLooksValid(xApiKey) && apiKey && xApiKey === apiKey) {
      request.user = { id: 'api-key-user', role: 'admin', authMethod: 'api_key' };
      return;
    }

    return unauthorized(
      reply,
      'Valid authentication required. Log in, or use a Bearer token or X-API-Key header.'
    );
  });

  // Decorate with auth helper
  fastify.decorate('requireAuth', (roles?: AuthRole[]) => {
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
    requireAuth: (roles?: AuthRole[]) => (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

/**
 * Role hierarchy for permission checks.
 * admin > editor > viewer
 */
export const ROLE_HIERARCHY: Record<AuthRole, number> = {
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Check if user has at least the required role level.
 */
export function hasMinimumRole(userRole: AuthRole, requiredRole: AuthRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Permission definitions for different actions.
 */
export const PERMISSIONS = {
  // Content management
  'content:read': ['viewer', 'editor', 'admin'] as AuthRole[],
  'content:write': ['editor', 'admin'] as AuthRole[],
  'content:delete': ['admin'] as AuthRole[],
  'content:publish': ['editor', 'admin'] as AuthRole[],

  // Media management
  'media:read': ['viewer', 'editor', 'admin'] as AuthRole[],
  'media:upload': ['editor', 'admin'] as AuthRole[],
  'media:delete': ['admin'] as AuthRole[],

  // Forms management
  'forms:read': ['viewer', 'editor', 'admin'] as AuthRole[],
  'forms:write': ['editor', 'admin'] as AuthRole[],
  'forms:delete': ['admin'] as AuthRole[],

  // Schema management
  'schema:read': ['viewer', 'editor', 'admin'] as AuthRole[],
  'schema:sync': ['admin'] as AuthRole[],

  // Redirects management
  'redirects:read': ['viewer', 'editor', 'admin'] as AuthRole[],
  'redirects:write': ['editor', 'admin'] as AuthRole[],
  'redirects:delete': ['admin'] as AuthRole[],

  // User management
  'users:read': ['admin'] as AuthRole[],
  'users:write': ['admin'] as AuthRole[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if user has a specific permission.
 */
export function hasPermission(userRole: AuthRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}
