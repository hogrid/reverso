/**
 * Database plugin for Fastify.
 * Adds db instance to request.
 */

import { type DatabaseConfig, type DrizzleDatabase, closeDatabase, initDatabase } from '@reverso/db';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export interface DatabasePluginOptions extends DatabaseConfig {}

const databasePlugin: FastifyPluginAsync<DatabasePluginOptions> = async (
  fastify: FastifyInstance,
  options: DatabasePluginOptions
) => {
  // Initialize database
  const { db } = initDatabase(options);

  // Decorate fastify instance with db
  fastify.decorate('db', db);

  // Add db to each request using addHook
  fastify.addHook('onRequest', async (request) => {
    (request as any).db = db;
  });

  // Close database connection on server shutdown
  fastify.addHook('onClose', async () => {
    closeDatabase();
    fastify.log.info('Database connection closed');
  });

  // Log database connection
  fastify.log.info(`Database connected: ${options.url}`);
};

export default fp(databasePlugin, {
  name: 'database',
  fastify: '5.x',
});

// Type declarations
declare module 'fastify' {
  interface FastifyInstance {
    db: DrizzleDatabase;
  }
  interface FastifyRequest {
    db: DrizzleDatabase;
  }
}
