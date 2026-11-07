/**
 * The MCP server against a real Reverso API.
 *
 * A Fastify API server is started in-process on a throw-away SQLite file with
 * authentication enabled, a small schema is synced through the HTTP API, and
 * the MCP tools and resources are exercised end to end through an in-memory
 * MCP client, exactly as an AI assistant would call them.
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  createServer,
  databasePlugin,
  registerAuth,
  registerRoutes,
  stopServer,
} from '@reverso/api';
import type { ProjectSchema } from '@reverso/core';
import { closeDatabase, createDatabaseSchema, resetDatabaseInstance } from '@reverso/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ReversoApiClient } from '../api-client.js';
import { resolveMcpConfig } from '../config.js';
import { ReversoMcpServer } from '../server.js';
import { contentTools } from '../tools/content.js';
import { formsTools } from '../tools/forms.js';
import { generationTools } from '../tools/generation.js';
import { mediaTools } from '../tools/media.js';
import { schemaTools } from '../tools/schema.js';

const TEST_DIR = '.test';
const TEST_DB = `${TEST_DIR}/mcp-api.db`;
const UPLOADS_DIR = `${TEST_DIR}/mcp-api-uploads`;
const API_KEY = 'mcp-test-api-key-0123456789';
const WRONG_KEY = 'mcp-wrong-api-key-0123456789';

const SCHEMA: ProjectSchema = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  pages: [
    {
      slug: 'home',
      name: 'Home',
      sourceFiles: ['src/Home.tsx'],
      fieldCount: 2,
      sections: [
        {
          slug: 'hero',
          name: 'Hero',
          isRepeater: false,
          order: 0,
          fields: [
            { path: 'home.hero.title', type: 'text', label: 'Title', file: 'src/Home.tsx', line: 1, column: 1 },
            { path: 'home.hero.photo', type: 'image', label: 'Photo', file: 'src/Home.tsx', line: 2, column: 1 },
          ],
        },
      ],
    },
  ],
  pageCount: 1,
  totalFields: 2,
  meta: { srcDir: 'src', filesScanned: 1, filesWithMarkers: 1, scanDuration: 1 },
};

interface ToolResult {
  isError: boolean;
  text: string;
  // biome-ignore lint/suspicious/noExplicitAny: test helper
  json: any;
}

/** Text of a resource content item (resources here are always JSON text). */
function resourceText(item: { text?: unknown; blob?: unknown } | undefined): string {
  return typeof item?.text === 'string' ? item.text : '';
}

function cleanupFiles(): void {
  for (const f of [TEST_DB, `${TEST_DB}-wal`, `${TEST_DB}-shm`]) {
    if (existsSync(f)) rmSync(f, { force: true });
  }
  if (existsSync(UPLOADS_DIR)) rmSync(UPLOADS_DIR, { recursive: true, force: true });
}

async function connectMcp(apiUrl: string, apiKey: string): Promise<{ client: Client; mcp: ReversoMcpServer }> {
  const mcp = new ReversoMcpServer({ apiUrl, apiKey, name: 'reverso-mcp-test', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcp.connect(serverTransport);
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await client.connect(clientTransport);
  return { client, mcp };
}

async function callTool(client: Client, name: string, args: Record<string, unknown>): Promise<ToolResult> {
  const result = await client.callTool({ name, arguments: args });
  const content = result.content as Array<{ type: string; text?: string }>;
  const text = content.find((c) => c.type === 'text')?.text ?? '';
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { isError: result.isError === true, text, json };
}

describe('MCP server over the Reverso API', () => {
  let api: Awaited<ReturnType<typeof createServer>>;
  let apiUrl: string;
  let client: Client;
  let mcp: ReversoMcpServer;

  beforeAll(async () => {
    resetDatabaseInstance();
    cleanupFiles();
    mkdirSync(TEST_DIR, { recursive: true });
    mkdirSync(UPLOADS_DIR, { recursive: true });

    await createDatabaseSchema(TEST_DB);
    api = await createServer({
      logger: false,
      uploadsDir: UPLOADS_DIR,
      authEnabled: true,
      apiKey: API_KEY,
    });
    await api.register(databasePlugin, { url: TEST_DB });
    await registerAuth(api);
    await registerRoutes(api);
    apiUrl = await api.listen({ port: 0, host: '127.0.0.1' });

    const sync = await fetch(`${apiUrl}/api/reverso/schema/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ schema: SCHEMA }),
    });
    expect(sync.status).toBe(200);

    ({ client, mcp } = await connectMcp(apiUrl, API_KEY));
  });

  afterAll(async () => {
    await client?.close();
    await mcp?.close();
    if (api) await stopServer(api);
    closeDatabase();
    resetDatabaseInstance();
    cleanupFiles();
  });

  it('refuses to start when REVERSO_API_KEY is missing or too short', () => {
    expect(() => resolveMcpConfig({})).toThrow(/REVERSO_API_KEY/);
    expect(() => resolveMcpConfig({ REVERSO_API_KEY: 'short' })).toThrow(/16/);
    expect(() => new ReversoMcpServer({ apiKey: 'short' })).toThrow(/16/);

    const config = resolveMcpConfig({ REVERSO_API_KEY: API_KEY });
    expect(config.apiUrl).toBe('http://localhost:3001');
    expect(config.apiKey).toBe(API_KEY);

    const custom = resolveMcpConfig({ REVERSO_API_KEY: API_KEY, REVERSO_API_URL: 'https://cms.example.com/' });
    expect(custom.apiUrl).toBe('https://cms.example.com');
  });

  it('every tool declares a zod object schema the MCP server can expose', async () => {
    for (const group of [contentTools, schemaTools, mediaTools, formsTools, generationTools]) {
      for (const [name, tool] of Object.entries(group)) {
        expect(tool.description, name).toBeTruthy();
        expect(typeof tool.inputSchema.parse, name).toBe('function');
        expect(typeof tool.handler, name).toBe('function');
      }
    }

    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    for (const expected of [
      'content_list_pages',
      'content_get_page',
      'content_get_content',
      'content_update_content',
      'content_bulk_update_content',
      'content_publish_content',
      'content_unpublish_content',
      'schema_get_schema',
      'schema_get_fields',
      'media_list_media',
      'media_delete_media',
      'forms_list_forms',
      'ai_analyze_content',
    ]) {
      expect(names, expected).toContain(expected);
    }
  });

  it('lists pages through the API', async () => {
    const result = await callTool(client, 'content_list_pages', {});
    expect(result.isError).toBe(false);
    expect(Array.isArray(result.json)).toBe(true);
    expect(result.json).toHaveLength(1);
    expect(result.json[0]).toMatchObject({ slug: 'home', name: 'Home', fieldCount: 2 });
  });

  it('reads the schema and a page through the API', async () => {
    const schema = await callTool(client, 'schema_get_schema', {});
    expect(schema.isError).toBe(false);
    expect(schema.json.totalPages).toBe(1);
    expect(schema.json.pages[0].slug).toBe('home');

    const none = await callTool(client, 'schema_get_schema', { pageSlug: 'missing' });
    expect(none.json.totalPages).toBe(0);

    const images = await callTool(client, 'schema_get_fields', { type: 'image' });
    expect(images.json.totalFields).toBe(1);
    expect(images.json.fields[0].path).toBe('home.hero.photo');

    const page = await callTool(client, 'content_get_page', { slug: 'home' });
    expect(page.isError).toBe(false);
    expect(page.json.slug).toBe('home');
    expect(page.json.sections[0].fields.map((f: { path: string }) => f.path)).toEqual([
      'home.hero.title',
      'home.hero.photo',
    ]);

    const missing = await callTool(client, 'content_get_page', { slug: 'nope' });
    expect(missing.isError).toBe(true);
    expect(missing.text).toMatch(/not found/i);
  });

  it('reads content that has no value yet', async () => {
    const empty = await callTool(client, 'content_get_content', { path: 'home.hero.photo' });
    expect(empty.isError).toBe(false);
    expect(empty.json).toMatchObject({ path: 'home.hero.photo', value: null, published: false, exists: false });

    const unknown = await callTool(client, 'content_get_content', { path: 'home.hero.missing' });
    expect(unknown.isError).toBe(true);
    expect(unknown.text).toMatch(/not found/i);
  });

  it('updates content through the API and the change is published', async () => {
    const updated = await callTool(client, 'content_update_content', {
      path: 'home.hero.title',
      value: 'Hello from MCP',
    });
    expect(updated.isError).toBe(false);
    expect(updated.json).toMatchObject({ path: 'home.hero.title', value: 'Hello from MCP', published: true });

    const current = await callTool(client, 'content_get_content', { path: 'home.hero.title' });
    expect(current.json).toMatchObject({ value: 'Hello from MCP', published: true, exists: true });

    // Published content is what the public, unauthenticated endpoint serves.
    const pub = await fetch(`${apiUrl}/api/reverso/public/content/home.hero.title`);
    expect(pub.status).toBe(200);
    expect(((await pub.json()) as { data: { value: string } }).data.value).toBe('Hello from MCP');

    const unpublished = await callTool(client, 'content_unpublish_content', { path: 'home.hero.title' });
    expect(unpublished.isError).toBe(false);
    expect(unpublished.json.published).toBe(false);
    expect((await fetch(`${apiUrl}/api/reverso/public/content/home.hero.title`)).status).toBe(404);

    const published = await callTool(client, 'content_publish_content', { path: 'home.hero.title' });
    expect(published.isError).toBe(false);
    expect(published.json.published).toBe(true);
    expect((await fetch(`${apiUrl}/api/reverso/public/content/home.hero.title`)).status).toBe(200);

    const draft = await callTool(client, 'content_update_content', {
      path: 'home.hero.title',
      value: 'Draft only',
      publish: false,
    });
    expect(draft.json.published).toBe(false);
    expect((await fetch(`${apiUrl}/api/reverso/public/content/home.hero.title`)).status).toBe(404);
  });

  it('bulk updates the fields of a page and reports unknown fields', async () => {
    const ok = await callTool(client, 'content_bulk_update_content', {
      updates: [
        { path: 'home.hero.title', value: 'Bulk title' },
        { path: 'home.hero.photo', value: '/uploads/a.png' },
      ],
    });
    expect(ok.isError).toBe(false);
    expect(ok.json.updated).toBe(2);
    expect((await callTool(client, 'content_get_content', { path: 'home.hero.photo' })).json.value).toBe(
      '/uploads/a.png'
    );

    const bad = await callTool(client, 'content_bulk_update_content', {
      updates: [{ path: 'home.hero.nope', value: 'x' }],
    });
    expect(bad.isError).toBe(true);
    expect(bad.text).toMatch(/unknown fields/i);

    const unknownPage = await callTool(client, 'content_update_content', {
      path: 'about.hero.title',
      value: 'x',
    });
    expect(unknownPage.isError).toBe(true);
    expect(unknownPage.text).toMatch(/404|not found/i);
  });

  it('rejects a write with a wrong API key as a tool error', async () => {
    const before = (await callTool(client, 'content_get_content', { path: 'home.hero.title' })).json.value;

    const other = await connectMcp(apiUrl, WRONG_KEY);
    try {
      const denied = await callTool(other.client, 'content_update_content', {
        path: 'home.hero.title',
        value: 'Should not be written',
      });
      expect(denied.isError).toBe(true);
      expect(denied.text).toMatch(/401|unauthorized/i);

      const read = await callTool(other.client, 'content_get_content', { path: 'home.hero.title' });
      expect(read.isError).toBe(true);
    } finally {
      await other.client.close();
      await other.mcp.close();
    }

    const after = (await callTool(client, 'content_get_content', { path: 'home.hero.title' })).json.value;
    expect(after).toBe(before);
  });

  it('rejects an update without a value', async () => {
    const before = (await callTool(client, 'content_get_content', { path: 'home.hero.title' })).json;

    const single = await callTool(client, 'content_update_content', { path: 'home.hero.title' });
    expect(single.isError).toBe(true);
    expect(single.text).toMatch(/Input validation error/);
    expect(single.text).toMatch(/\bvalue\b/);

    const bulk = await callTool(client, 'content_bulk_update_content', {
      updates: [{ path: 'home.hero.title' }],
    });
    expect(bulk.isError).toBe(true);
    expect(bulk.text).toMatch(/Input validation error/);
    expect(bulk.text).toMatch(/\bvalue\b/);

    const after = (await callTool(client, 'content_get_content', { path: 'home.hero.title' })).json;
    expect(after).toEqual(before);
  });

  it('maps a missing media file to a tool error', async () => {
    const result = await callTool(client, 'media_delete_media', { id: 'does-not-exist' });
    expect(result.isError).toBe(true);
    expect(result.text).toMatch(/not found/i);
    expect(result.json).toMatchObject({ error: true, status: 404 });

    const list = await callTool(client, 'media_list_media', {});
    expect(list.isError).toBe(false);
    expect(list.json).toMatchObject({ media: [], total: 0 });
  });

  it('serves the schema, pages and content as resources', async () => {
    const { resources } = await client.listResources();
    expect(resources.map((r) => r.uri)).toContain('reverso://schema');
    expect(resources.map((r) => r.uri)).toContain('reverso://pages/home');

    const { resourceTemplates } = await client.listResourceTemplates();
    const templates = resourceTemplates.map((t) => t.uriTemplate);
    expect(templates).toContain('reverso://pages/{slug}');
    expect(templates).toContain('reverso://content/{path}');

    const page = await client.readResource({ uri: 'reverso://pages/home' });
    const pageText = resourceText(page.contents[0]);
    expect(typeof pageText).toBe('string');
    expect(JSON.parse(pageText).slug).toBe('home');

    const content = await client.readResource({ uri: 'reverso://content/home.hero.photo' });
    expect(JSON.parse(resourceText(content.contents[0]))).toMatchObject({
      path: 'home.hero.photo',
      value: '/uploads/a.png',
    });
  });

  it('suggests field types from names without touching the API', async () => {
    const api = new ReversoApiClient({ baseUrl: 'http://127.0.0.1:9', apiKey: API_KEY });
    const suggestions = await schemaTools.suggest_field_type.handler(api, { fieldName: 'heroImage' });
    expect(suggestions[0]?.type).toBe('image');

    const result = await callTool(client, 'schema_suggest_field_type', { fieldName: 'contactEmail' });
    expect(result.json[0].type).toBe('email');
  });
});
