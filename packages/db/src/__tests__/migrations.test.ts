/**
 * Migration tests.
 *
 * These guard against the class of bug where the DDL that creates the database
 * drifts from the Drizzle schema the query layer is written against (forms and
 * redirects were unusable because of exactly that).
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import Database from 'better-sqlite3';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, initDatabase, resetDatabaseInstance } from '../connection.js';
import { createDatabaseSchema, getMigrationStatus, isLegacyDatabase, runMigrations } from '../migrate.js';
import { createForm, getForms } from '../queries/forms.js';
import { createFormSubmission, getFormSubmissions } from '../queries/form-submissions.js';
import { createRedirect, getRedirectStats, getRedirects } from '../queries/redirects.js';
import { allTables } from '../schema/index.js';
import { LEGACY_DDL, LEGACY_INDEXES } from './fixtures/legacy-ddl.js';

const TEST_DIR = '.test';
const FRESH_DB = `${TEST_DIR}/migrations-fresh.db`;
const LEGACY_DB = `${TEST_DIR}/migrations-legacy.db`;

function actualColumns(dbPath: string, table: string): Set<string> {
  const sqlite = new Database(dbPath, { readonly: true });
  try {
    const rows = sqlite.prepare(`PRAGMA table_info("${table}")`).all() as { name: string }[];
    return new Set(rows.map((r) => r.name));
  } finally {
    sqlite.close();
  }
}

function expectedColumns(table: (typeof allTables)[keyof typeof allTables]): Set<string> {
  return new Set(Object.values(getTableColumns(table)).map((c) => c.name));
}

function removeDb(path: string): void {
  for (const f of [path, `${path}-wal`, `${path}-shm`]) {
    if (existsSync(f)) rmSync(f, { force: true });
  }
}

describe('migrations', () => {
  beforeEach(() => {
    resetDatabaseInstance();
    if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
    removeDb(FRESH_DB);
    removeDb(LEGACY_DB);
  });

  afterEach(() => {
    closeDatabase();
    removeDb(FRESH_DB);
    removeDb(LEGACY_DB);
  });

  describe('fresh database', () => {
    it('creates every Drizzle table with exactly the Drizzle columns (no drift)', async () => {
      await createDatabaseSchema(FRESH_DB);

      for (const table of Object.values(allTables)) {
        const name = getTableName(table);
        const actual = actualColumns(FRESH_DB, name);
        const expected = expectedColumns(table);
        expect(actual, `columns of ${name}`).toEqual(expected);
      }
    });

    it('is idempotent', async () => {
      await createDatabaseSchema(FRESH_DB);
      await expect(createDatabaseSchema(FRESH_DB)).resolves.toBeUndefined();
      const status = getMigrationStatus(FRESH_DB);
      expect(status.pending).toEqual([]);
      expect(status.applied.length).toBeGreaterThan(0);
      expect(status.legacy).toBe(false);
    });

    it('reports every migration as pending for a missing file', () => {
      const status = getMigrationStatus(FRESH_DB);
      expect(status.applied).toEqual([]);
      expect(status.pending).toEqual(status.available);
    });

    it('lets the forms and redirects query layer work', async () => {
      await createDatabaseSchema(FRESH_DB);
      const { db } = initDatabase({ url: FRESH_DB });

      await createForm(db, { name: 'Contact', slug: 'contact' });
      expect(await getForms(db)).toHaveLength(1);

      await createRedirect(db, { fromPath: '/old', toPath: '/new', statusCode: 301 });
      expect(await getRedirects(db, {})).toHaveLength(1);
      expect((await getRedirectStats(db)).enabled).toBe(1);
    });
  });

  describe('legacy database (created by the pre-migration DDL)', () => {
    function createLegacyDb(): void {
      const sqlite = new Database(LEGACY_DB);
      for (const sql of [...LEGACY_DDL, ...LEGACY_INDEXES]) sqlite.exec(sql);
      // Seed a row in each drifted table so data survives the upgrade.
      const now = Date.now();
      sqlite
        .prepare(
          'INSERT INTO redirects (id, from_path, to_path, status_code, enabled, hits, created_at, updated_at) VALUES (?, ?, ?, 301, 1, 7, ?, ?)'
        )
        .run('r1', '/legacy', '/target', now, now);
      sqlite
        .prepare(
          "INSERT INTO forms (id, slug, name, status, created_at, updated_at) VALUES ('f1', 'legacy-form', 'Legacy', 'draft', ?, ?)"
        )
        .run(now, now);
      // One submission whose webhook was sent, one whose was not (boolean flag).
      const insertSubmission = sqlite.prepare(
        "INSERT INTO form_submissions (id, form_id, data, webhook_sent, created_at, updated_at) VALUES (?, 'f1', '{}', ?, ?, ?)"
      );
      insertSubmission.run('s-sent', 1, now, now);
      insertSubmission.run('s-unsent', 0, now, now);
      sqlite.close();
    }

    it('is detected as legacy before adoption and not after', async () => {
      createLegacyDb();
      let sqlite = new Database(LEGACY_DB);
      expect(isLegacyDatabase(sqlite)).toBe(true);
      sqlite.close();
      expect(getMigrationStatus(LEGACY_DB).legacy).toBe(true);

      await runMigrations({ dbPath: LEGACY_DB });

      sqlite = new Database(LEGACY_DB);
      expect(isLegacyDatabase(sqlite)).toBe(false);
      sqlite.close();
      expect(getMigrationStatus(LEGACY_DB).pending).toEqual([]);
    });

    it('adds the missing columns and renames the changed ones, keeping data', async () => {
      createLegacyDb();
      await runMigrations({ dbPath: LEGACY_DB });

      for (const table of Object.values(allTables)) {
        const name = getTableName(table);
        const actual = actualColumns(LEGACY_DB, name);
        for (const col of expectedColumns(table)) {
          expect(actual.has(col), `${name}.${col} should exist after adoption`).toBe(true);
        }
      }

      const { db } = initDatabase({ url: LEGACY_DB });
      const redirects = await getRedirects(db, {});
      expect(redirects).toHaveLength(1);
      expect(redirects[0]?.fromPath).toBe('/legacy');
      expect(redirects[0]?.hitCount).toBe(7);
      expect(redirects[0]?.isEnabled).toBe(true);

      const forms = await getForms(db);
      expect(forms).toHaveLength(1);
      expect(forms[0]?.slug).toBe('legacy-form');
    });

    it('translates the boolean webhook flag into a timestamp instead of renaming it', async () => {
      createLegacyDb();
      await runMigrations({ dbPath: LEGACY_DB });

      const sqlite = new Database(LEGACY_DB, { readonly: true });
      const columns = new Set(
        (sqlite.prepare('PRAGMA table_info("form_submissions")').all() as { name: string }[]).map((c) => c.name)
      );
      const rows = sqlite
        .prepare('SELECT id, webhook_sent_at, created_at FROM form_submissions ORDER BY id')
        .all() as { id: string; webhook_sent_at: number | null; created_at: number }[];
      sqlite.close();

      expect(columns.has('webhook_sent')).toBe(false);
      expect(columns.has('webhook_sent_at')).toBe(true);
      const sent = rows.find((r) => r.id === 's-sent');
      const unsent = rows.find((r) => r.id === 's-unsent');
      // Unsent must stay NULL (a rename would have produced "sent at 1970").
      expect(unsent?.webhook_sent_at).toBeNull();
      expect(sent?.webhook_sent_at).toBe(sent?.created_at);
    });

    it('accepts new form submissions after adoption', async () => {
      // The legacy DDL has form_submissions.updated_at NOT NULL with no
      // default; the current schema does not write that column, so leaving it
      // in place made every submission fail with a constraint error.
      createLegacyDb();
      await runMigrations({ dbPath: LEGACY_DB });

      const { db } = initDatabase({ url: LEGACY_DB });
      const submission = await createFormSubmission(db, {
        formId: 'f1',
        data: { email: 'someone@example.com' },
      });
      expect(submission.id).toBeTruthy();

      const stored = await getFormSubmissions(db, { formId: 'f1' });
      expect(stored.map((row) => row.id)).toContain(submission.id);
    });

    it('runs the adoption only once', async () => {
      createLegacyDb();
      await runMigrations({ dbPath: LEGACY_DB });
      await expect(runMigrations({ dbPath: LEGACY_DB })).resolves.toBeUndefined();

      const sqlite = new Database(LEGACY_DB, { readonly: true });
      const row = sqlite.prepare('SELECT COUNT(*) AS n FROM __drizzle_migrations').get() as {
        n: number;
      };
      sqlite.close();
      expect(row.n).toBe(getMigrationStatus(LEGACY_DB).available.length);
    });
  });
});
