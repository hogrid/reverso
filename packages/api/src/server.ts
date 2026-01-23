/**
 * Fastify server setup.
 */

import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';

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
    const corsOptions =
      typeof opts.cors === 'object'
        ? {
            origin: opts.cors.origin ?? true,
            methods: opts.cors.methods ?? ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            credentials: opts.cors.credentials ?? true,
          }
        : {
            origin: true,
            credentials: true,
          };

    await server.register(cors, corsOptions);
  }

  // Register cookies
  await server.register(cookie, {
    secret: opts.cookieSecret,
    parseOptions: {},
  });

  // Register multipart for file uploads
  await server.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 10,
    },
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
