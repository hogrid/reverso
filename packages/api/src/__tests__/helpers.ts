/**
 * Shared bootstrap for API integration tests: a real Fastify server on a
 * throw-away SQLite file, with routes and auth registered exactly like
 * `createApiServer` does.
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import type { ProjectSchema } from '@reverso/core';
import { closeDatabase, createDatabaseSchema, resetDatabaseInstance } from '@reverso/db';
import type { FastifyInstance } from 'fastify';
import { databasePlugin } from '../plugins/index.js';
import { registerRoutes } from '../routes/index.js';
import { createServer, registerAuth, stopServer } from '../server.js';

export interface TestServerOptions {
  /** Unique name so parallel test files never share a database file. */
  name: string;
  authEnabled?: boolean;
  apiKey?: string;
}

export interface TestServer {
  server: FastifyInstance;
  dbPath: string;
  uploadsDir: string;
  close: () => Promise<void>;
}

export async function createTestServer(options: TestServerOptions): Promise<TestServer> {
  const dbPath = `.test/${options.name}.db`;
  const uploadsDir = `.test/${options.name}-uploads`;

  resetDatabaseInstance();
  for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (existsSync(f)) rmSync(f, { force: true });
  }
  if (existsSync(uploadsDir)) rmSync(uploadsDir, { recursive: true, force: true });
  mkdirSync('.test', { recursive: true });
  mkdirSync(uploadsDir, { recursive: true });

  await createDatabaseSchema(dbPath);

  const server = await createServer({
    logger: false,
    uploadsDir,
    authEnabled: options.authEnabled ?? false,
    apiKey: options.apiKey,
  });
  await server.register(databasePlugin, { url: dbPath });
  await registerAuth(server);
  await registerRoutes(server);

  return {
    server,
    dbPath,
    uploadsDir,
    close: async () => {
      await stopServer(server);
      closeDatabase();
      resetDatabaseInstance();
      for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
        if (existsSync(f)) rmSync(f, { force: true });
      }
      if (existsSync(uploadsDir)) rmSync(uploadsDir, { recursive: true, force: true });
    },
  };
}

/** Minimal schema: one page, one section, two text fields. */
export const HOME_SCHEMA: ProjectSchema = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  pages: [
    {
      slug: 'home',
      name: 'Home Page',
      sourceFiles: ['src/pages/home.tsx'],
      fieldCount: 2,
      sections: [
        {
          slug: 'hero',
          name: 'Hero Section',
          isRepeater: false,
          order: 0,
          fields: [
            {
              path: 'home.hero.title',
              type: 'text',
              label: 'Title',
              file: 'src/pages/home.tsx',
              line: 10,
              column: 5,
            },
            {
              path: 'home.hero.plan',
              type: 'radio',
              label: 'Plan',
              options: 'free,pro',
              file: 'src/pages/home.tsx',
              line: 15,
              column: 5,
            },
          ],
        },
      ],
    },
  ],
  pageCount: 1,
  totalFields: 2,
  meta: { srcDir: 'src', filesScanned: 1, filesWithMarkers: 1, scanDuration: 1 },
};

/** Parse an inject() response body as JSON. */
// biome-ignore lint/suspicious/noExplicitAny: test helper
export function json(response: { payload: string }): any {
  return JSON.parse(response.payload);
}

/** Build a multipart/form-data body for a single file upload. */
export function multipartFile(
  filename: string,
  mimeType: string,
  content: Buffer
): { payload: Buffer; headers: Record<string, string> } {
  const boundary = '----reverso-test-boundary';
  const payload = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    ),
    content,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return {
    payload,
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

/** A valid 1x1 GIF. */
export const TINY_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/** Extract the session cookie from a login/register response. */
export function sessionCookie(response: { headers: Record<string, unknown> }): string {
  const raw = response.headers['set-cookie'];
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (typeof header !== 'string') throw new Error('No set-cookie header');
  return header.split(';')[0] ?? '';
}
