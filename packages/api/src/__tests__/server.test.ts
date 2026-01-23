/**
 * Server tests.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { createServer, stopServer } from '../server.js';

describe('Server', () => {
  let server: Awaited<ReturnType<typeof createServer>> | null = null;

  afterEach(async () => {
    if (server) {
      await stopServer(server);
      server = null;
    }
  });

  describe('createServer', () => {
    it('creates a Fastify server instance', async () => {
      server = await createServer({ logger: false });
      expect(server).toBeDefined();
      expect(server.server).toBeDefined();
    });

    it('registers health check endpoint', async () => {
      server = await createServer({ logger: false });

      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
    });

    it('applies CORS when enabled', async () => {
      server = await createServer({
        logger: false,
        cors: {
          origin: 'http://localhost:3000',
        },
      });

      const response = await server.inject({
        method: 'OPTIONS',
        url: '/health',
        headers: {
          origin: 'http://localhost:3000',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });

  describe('server configuration', () => {
    it('stores config on server instance', async () => {
      server = await createServer({
        logger: false,
        port: 4000,
        prefix: '/api/test',
      });

      expect(server.config).toBeDefined();
      expect(server.config.port).toBe(4000);
      expect(server.config.prefix).toBe('/api/test');
    });

    it('uses default config values', async () => {
      server = await createServer({ logger: false });

      expect(server.config.port).toBe(3001);
      expect(server.config.host).toBe('0.0.0.0');
      expect(server.config.prefix).toBe('/api/reverso');
    });
  });
});
