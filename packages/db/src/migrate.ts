/**
 * Database migration runner.
 *
 * The database schema is defined once, in `src/schema/*.ts` (Drizzle). The SQL
 * that creates it lives in the `migrations/` folder and is *generated* from that
 * schema by `pnpm db:generate` (drizzle-kit). This module applies those
 * migrations; nothing here hand-writes `CREATE TABLE` statements, so the tables
 * can no longer drift from what the query layer expects.
 *
 * Databases created by @reverso/db <= 0.1.18 (before migrations existed) are
 * detected and adopted in place: missing columns are added, renamed columns are
 * renamed, and the baseline migration is recorded as applied so that future
 * migrations run normally on top of it.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Folder shipped with the package (sibling of `dist/`). */
export const DEFAULT_MIGRATIONS_FOLDER = join(__dirname, '../migrations');

const MIGRATIONS_TABLE = '__drizzle_migrations';

export interface MigrateOptions {
  /** Database file path */
  dbPath: string;
  /** Migrations folder path */
  migrationsFolder?: string;
  /** Verbose output */
  verbose?: boolean;
}

export interface MigrationStatus {
  /** Migrations present in the folder, in order. */
  available: string[];
  /** Tags already recorded in the database. */
  applied: string[];
  /** Tags that `runMigrations` would apply. */
  pending: string[];
  /** True when the file exists but predates the migration system. */
  legacy: boolean;
}

interface JournalEntry {
  idx: number;
  when: number;
  tag: string;
}

interface SnapshotColumn {
  name: string;
  type: string;
  notNull: boolean;
  default?: unknown;
}

interface Snapshot {
  tables: Record<string, { name: string; columns: Record<string, SnapshotColumn> }>;
}

function readJournal(migrationsFolder: string): JournalEntry[] {
  const journalPath = join(migrationsFolder, 'meta/_journal.json');
  if (!existsSync(journalPath)) {
    throw new Error(`Migrations journal not found at ${journalPath}`);
  }
  const journal = JSON.parse(readFileSync(journalPath, 'utf-8')) as { entries: JournalEntry[] };
  return journal.entries;
}

function tableExists(sqlite: Database.Database, name: string): boolean {
  const row = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(name);
  return row !== undefined;
}

interface TableColumn {
  name: string;
  notNull: boolean;
  hasDefault: boolean;
}

function tableColumns(sqlite: Database.Database, table: string): TableColumn[] {
  const rows = sqlite.prepare(`PRAGMA table_info("${table}")`).all() as {
    name: string;
    notnull: number;
    dflt_value: unknown;
  }[];
  return rows.map((r) => ({
    name: r.name,
    notNull: r.notnull === 1,
    hasDefault: r.dflt_value !== null && r.dflt_value !== undefined,
  }));
}

function columnNames(sqlite: Database.Database, table: string): Set<string> {
  return new Set(tableColumns(sqlite, table).map((c) => c.name));
}

/**
 * Columns the legacy DDL had and the current schema does not.
 *
 * One left behind as NOT NULL with no default breaks every INSERT, because
 * the application no longer writes it: `form_submissions.updated_at` made
 * each form submission fail on an adopted database. Those are dropped;
 * anything nullable or defaulted is harmless and stays, so a column somebody
 * added on purpose is never silently destroyed.
 */
function dropBlockingLegacyColumns(
  sqlite: Database.Database,
  table: { name: string; columns: Record<string, SnapshotColumn> },
  verbose: boolean
): void {
  if (!tableExists(sqlite, table.name)) return;
  const known = new Set(Object.values(table.columns).map((c) => c.name));
  for (const column of tableColumns(sqlite, table.name)) {
    if (known.has(column.name)) continue;
    if (!column.notNull || column.hasDefault) continue;
    try {
      sqlite.exec(`ALTER TABLE "${table.name}" DROP COLUMN "${column.name}"`);
      if (verbose) console.log(`  dropped legacy column ${table.name}.${column.name}`);
    } catch (error) {
      console.warn(
        `Reverso could not drop the obsolete NOT NULL column ${table.name}.${column.name}: ` +
          `${error instanceof Error ? error.message : String(error)}. ` +
          'Writes to this table will fail until it is removed manually.'
      );
    }
  }
}

/**
 * A database is "legacy" when it already has Reverso tables but no migration
 * bookkeeping: it was created by the old hand-written DDL.
 */
export function isLegacyDatabase(sqlite: Database.Database): boolean {
  if (!tableExists(sqlite, 'pages')) return false;
  if (!tableExists(sqlite, MIGRATIONS_TABLE)) return true;
  const row = sqlite.prepare(`SELECT COUNT(*) AS n FROM "${MIGRATIONS_TABLE}"`).get() as {
    n: number;
  };
  return row.n === 0;
}

/** Column renames between the legacy DDL and the Drizzle schema (same type). */
const LEGACY_RENAMES: Array<{ table: string; from: string; to: string }> = [
  { table: 'redirects', from: 'enabled', to: 'is_enabled' },
  { table: 'redirects', from: 'hits', to: 'hit_count' },
];

/**
 * `form_submissions.webhook_sent` (boolean 0/1) became `webhook_sent_at`
 * (timestamp). A plain rename would turn every unsent row into "sent at
 * 1970", so the values are translated: false → NULL, true → the submission's
 * creation time (the closest defensible moment).
 */
function migrateWebhookSentColumn(sqlite: Database.Database, verbose: boolean): void {
  if (!tableExists(sqlite, 'form_submissions')) return;
  const cols = columnNames(sqlite, 'form_submissions');
  if (!cols.has('webhook_sent') || cols.has('webhook_sent_at')) return;
  sqlite.exec('ALTER TABLE "form_submissions" ADD COLUMN "webhook_sent_at" integer');
  sqlite.exec(
    'UPDATE "form_submissions" SET "webhook_sent_at" = "created_at" WHERE "webhook_sent" = 1'
  );
  sqlite.exec('ALTER TABLE "form_submissions" DROP COLUMN "webhook_sent"');
  if (verbose) console.log('  migrated form_submissions.webhook_sent -> webhook_sent_at');
}

function sqlDefault(value: unknown): string {
  if (value === true) return '1';
  if (value === false) return '0';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    // drizzle-kit already quotes string defaults ("'draft'"); keep as-is.
    return value.startsWith("'") ? value : `'${value.replace(/'/g, "''")}'`;
  }
  return 'NULL';
}

/**
 * Bring a legacy database up to the baseline snapshot without dropping data,
 * then record the baseline migration as applied.
 */
function adoptLegacyDatabase(
  sqlite: Database.Database,
  migrationsFolder: string,
  verbose: boolean
): void {
  const entries = readJournal(migrationsFolder);
  const baseline = entries[0];
  if (!baseline) {
    throw new Error('Migrations journal is empty');
  }

  const snapshotPath = join(
    migrationsFolder,
    `meta/${String(baseline.idx).padStart(4, '0')}_snapshot.json`
  );
  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8')) as Snapshot;
  const baselineSql = readFileSync(join(migrationsFolder, `${baseline.tag}.sql`), 'utf-8');
  const statements = baselineSql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);

  if (verbose) {
    console.log('Legacy database detected; adopting it into the migration system...');
  }

  const adopt = sqlite.transaction(() => {
    // 1. Renames (only when the old column exists and the new one does not).
    for (const { table, from, to } of LEGACY_RENAMES) {
      if (!tableExists(sqlite, table)) continue;
      const cols = columnNames(sqlite, table);
      if (cols.has(from) && !cols.has(to)) {
        sqlite.exec(`ALTER TABLE "${table}" RENAME COLUMN "${from}" TO "${to}"`);
        if (verbose) console.log(`  renamed ${table}.${from} -> ${to}`);
      }
    }

    // 1b. Columns whose type changed need their values translated.
    migrateWebhookSentColumn(sqlite, verbose);

    // 2. Missing tables: run their CREATE TABLE from the baseline migration.
    //    Missing indexes: create them if absent.
    for (const stmt of statements) {
      const createTable = /^CREATE TABLE `([^`]+)`/i.exec(stmt);
      if (createTable?.[1]) {
        if (!tableExists(sqlite, createTable[1])) {
          sqlite.exec(stmt);
          if (verbose) console.log(`  created table ${createTable[1]}`);
        }
        continue;
      }
      if (/^CREATE (UNIQUE )?INDEX/i.test(stmt)) {
        sqlite.exec(stmt.replace(/^CREATE (UNIQUE )?INDEX/i, 'CREATE $1INDEX IF NOT EXISTS'));
      }
    }

    // 3. Missing columns on existing tables, and obsolete ones that would
    //    block writes.
    for (const table of Object.values(snapshot.tables)) {
      dropBlockingLegacyColumns(sqlite, table, verbose);
      const existing = columnNames(sqlite, table.name);
      for (const column of Object.values(table.columns)) {
        if (existing.has(column.name)) continue;
        // SQLite cannot add a NOT NULL column without a default to a table
        // that may already have rows; relax it (the app always writes it).
        const hasDefault = column.default !== undefined;
        const constraint = hasDefault
          ? ` DEFAULT ${sqlDefault(column.default)}${column.notNull ? ' NOT NULL' : ''}`
          : '';
        sqlite.exec(
          `ALTER TABLE "${table.name}" ADD COLUMN "${column.name}" ${column.type}${constraint}`
        );
        if (verbose) console.log(`  added column ${table.name}.${column.name}`);
      }
    }

    // 4. Record the baseline as applied (same bookkeeping drizzle's migrator uses).
    sqlite.exec(
      `CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)`
    );
    const hash = createHash('sha256').update(baselineSql).digest('hex');
    sqlite
      .prepare(`INSERT INTO "${MIGRATIONS_TABLE}" (hash, created_at) VALUES (?, ?)`)
      .run(hash, baseline.when);
  });

  adopt();
}

/**
 * Open a SQLite database and apply every pending migration.
 * Safe to call repeatedly: already-applied migrations are skipped.
 */
export async function runMigrations(options: MigrateOptions): Promise<void> {
  const { dbPath, migrationsFolder = DEFAULT_MIGRATIONS_FOLDER, verbose = false } = options;

  const dbDir = dirname(dbPath);
  if (dbPath !== ':memory:' && !existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  if (verbose) {
    console.log('Running migrations...');
    console.log(`  Database: ${dbPath}`);
    console.log(`  Migrations: ${migrationsFolder}`);
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  try {
    if (isLegacyDatabase(sqlite)) {
      adoptLegacyDatabase(sqlite, migrationsFolder, verbose);
    }
    migrate(drizzle(sqlite), { migrationsFolder, migrationsTable: MIGRATIONS_TABLE });

    if (verbose) {
      console.log('Migrations completed successfully!');
    }
  } finally {
    sqlite.close();
  }
}

/**
 * Report which migrations are applied and which are pending, without changing
 * the database.
 */
export function getMigrationStatus(
  dbPath: string,
  migrationsFolder: string = DEFAULT_MIGRATIONS_FOLDER
): MigrationStatus {
  const entries = readJournal(migrationsFolder);
  const available = entries.map((e) => e.tag);

  if (!existsSync(dbPath)) {
    return { available, applied: [], pending: available, legacy: false };
  }

  const sqlite = new Database(dbPath, { readonly: true });
  try {
    const legacy = isLegacyDatabase(sqlite);
    let lastApplied = -1;
    if (tableExists(sqlite, MIGRATIONS_TABLE)) {
      const row = sqlite
        .prepare(`SELECT created_at FROM "${MIGRATIONS_TABLE}" ORDER BY created_at DESC LIMIT 1`)
        .get() as { created_at: number } | undefined;
      lastApplied = row ? Number(row.created_at) : -1;
    }
    const applied = entries.filter((e) => e.when <= lastApplied).map((e) => e.tag);
    const pending = entries.filter((e) => e.when > lastApplied).map((e) => e.tag);
    return { available, applied, pending, legacy };
  } finally {
    sqlite.close();
  }
}

/**
 * Create (or upgrade) the database *schema* at `dbPath`.
 *
 * This is the single entry point every runtime uses before opening a
 * connection (`reverso dev`, `reverso build`, the API server, tests). It is an
 * alias of {@link runMigrations} kept for API compatibility; it is distinct from
 * `createDatabase` in `connection.ts`, which only opens a connection.
 */
export async function createDatabaseSchema(dbPath: string): Promise<void> {
  await runMigrations({ dbPath });
}

// CLI runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dbPath = process.argv[2] || '.reverso/dev.db';
  runMigrations({ dbPath, verbose: true }).catch(console.error);
}
