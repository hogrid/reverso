/**
 * Fastify server setup.
 */

import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import csrfProtection from '@fastify/csrf-protection';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import authPlugin, { type AuthPluginOptions } from './plugins/auth.js';

export interface ServerConfig {
  /** Server port */
  port?: number;
  /** Server host */
  host?: string;
  /** Enable CORS */
  cors?: boolean | CorsOptions;
  /** Cookie secret */
  cookieSecret?: string;
  /** Uploads directory */
  uploadsDir?: string;
  /** Enable request logging */
  logger?: boolean;
  /** API prefix */
  prefix?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Enable authentication (default: true in production) */
  authEnabled?: boolean;
}

export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  credentials?: boolean;
}

/**
 * Get cookie secret from environment or use development fallback.
 * In production, REVERSO_COOKIE_SECRET must be set.
 */
function getCookieSecret(): string {
  const envSecret = process.env.REVERSO_COOKIE_SECRET;
  if (envSecret) {
    return envSecret;
  }

  // Only allow fallback in non-production environments
  if (process.env.NODE_ENV === 'production') {
    throw new Error('REVERSO_COOKIE_SECRET environment variable must be set in production');
  }

  return 'reverso-dev-secret-do-not-use-in-production';
}

const defaultConfig: Required<ServerConfig> = {
  port: 3001,
  host: '0.0.0.0',
  cors: true,
  cookieSecret: getCookieSecret(),
  uploadsDir: '.reverso/uploads',
  logger: true,
  prefix: '/api/reverso',
  apiKey: process.env.REVERSO_API_KEY || '',
  authEnabled: process.env.NODE_ENV === 'production',
};

/**
 * Create a Fastify server instance.
 */
export async function createServer(config: ServerConfig = {}): Promise<FastifyInstance> {
  const opts = { ...defaultConfig, ...config };

  const fastifyOptions: FastifyServerOptions = {
    logger: opts.logger
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        }
      : false,
  };

  const server = Fastify(fastifyOptions);

  // Register CORS
  if (opts.cors) {
    // In production, require explicit origin configuration
    const isProduction = process.env.NODE_ENV === 'production';
    const defaultOrigin = isProduction
      ? process.env.REVERSO_CORS_ORIGIN || 'http://localhost:3000'
      : true;

    const corsOptions =
      typeof opts.cors === 'object'
        ? {
            origin: opts.cors.origin ?? defaultOrigin,
            methods: opts.cors.methods ?? ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            credentials: opts.cors.credentials ?? true,
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
          }
        : {
            origin: defaultOrigin,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
          };

    await server.register(cors, corsOptions);
  }

  // Register security headers (helmet)
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for media uploads
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for assets
  });

  // Register cookies
  await server.register(cookie, {
    secret: opts.cookieSecret,
    parseOptions: {},
  });

  // Register CSRF protection (only for production or when explicitly enabled)
  if (process.env.NODE_ENV === 'production' || process.env.REVERSO_CSRF_ENABLED === 'true') {
    await server.register(csrfProtection, {
      sessionPlugin: '@fastify/cookie',
      cookieOpts: {
        signed: true,
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
      // Skip CSRF for public endpoints and API key authentication
      getToken: (request) => {
        return (
          request.headers['x-csrf-token']?.toString() ||
          request.headers['csrf-token']?.toString()
        );
      },
    });

    // Add hook to skip CSRF for safe methods and API key auth
    server.addHook('onRequest', async (request, reply) => {
      const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
      if (safeMethods.includes(request.method)) return;

      // Skip CSRF if API key is provided
      if (request.headers['x-api-key']) return;

      // Skip CSRF for public form submissions (they have their own validation)
      if (request.url.startsWith('/api/reverso/public/')) return;
    });

    // Add CSRF token generation endpoint
    server.get('/api/csrf-token', async (request, reply) => {
      const token = await reply.generateCsrf();
      return { csrfToken: token };
    });
  }

  // Register rate limiting
  await server.register(rateLimit, {
    max: 100, // Max 100 requests per window
    timeWindow: '1 minute',
    // Stricter limits for specific routes
    keyGenerator: (request) => {
      // Use API key or IP for rate limiting
      return (
        request.headers['x-api-key']?.toString() ||
        request.headers['x-forwarded-for']?.toString() ||
        request.ip
      );
    },
    // Skip rate limiting for health checks
    allowList: ['/health'],
    // Custom error response
    errorResponseBuilder: () => ({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
  });

  // Register multipart for file uploads
  await server.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 10,
    },
  });

  // Register authentication plugin
  await server.register(authPlugin, {
    apiKey: opts.apiKey,
    enabled: opts.authEnabled,
    publicPaths: [
      /^\/api\/reverso\/public\//,
      /^\/sitemap\.xml$/,
    ],
  });

  // Ensure uploads directory exists
  if (!existsSync(opts.uploadsDir)) {
    mkdirSync(opts.uploadsDir, { recursive: true });
  }

  // Serve static files from uploads directory
  await server.register(fastifyStatic, {
    root: join(process.cwd(), opts.uploadsDir),
    prefix: '/uploads/',
    decorateReply: false,
  });

  // Health check endpoint
  server.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // Store config in server instance
  server.decorate('config', opts);

  return server;
}

/**
 * Start the server.
 */
export async function startServer(
  server: FastifyInstance,
  config: ServerConfig = {}
): Promise<string> {
  const opts = { ...defaultConfig, ...config };

  try {
    const address = await server.listen({
      port: opts.port,
      host: opts.host,
    });
    return address;
  } catch (err) {
    server.log.error(err);
    throw err;
  }
}

/**
 * Stop the server gracefully.
 */
export async function stopServer(server: FastifyInstance): Promise<void> {
  await server.close();
}

// Type declaration for config decorator
declare module 'fastify' {
  interface FastifyInstance {
    config: Required<ServerConfig>;
  }
}
