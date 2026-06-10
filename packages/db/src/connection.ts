/**
 * Database connection management.
 * Supports SQLite (development) and PostgreSQL (production).
 */

import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema/index.js';

export type DrizzleDatabase = BetterSQLite3Database<typeof schema> & {
  /** Underlying better-sqlite3 connection (exposed by drizzle's factory). */
  $client: Database.Database;
};

export interface DatabaseConfig {
  /** Database file path for SQLite, or connection URL for PostgreSQL */
  url: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

let dbInstance: DrizzleDatabase | null = null;
let sqliteInstance: Database.Database | null = null;

/**
 * Create a new database connection.
 */
export function createDatabase(config: DatabaseConfig): DrizzleDatabase {
  const sqlite = new Database(config.url);

  // Enable WAL mode for better performance
  sqlite.pragma('journal_mode = WAL');

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  const db = drizzleSqlite(sqlite, {
    schema,
    logger: config.verbose,
  });

  return db;
}

/**
 * Get or create the database instance (singleton).
 */
export function getDatabase(config?: DatabaseConfig): DrizzleDatabase {
  if (!dbInstance) {
    if (!config) {
      throw new Error('Database not initialized. Call initDatabase(config) first.');
    }
    const result = initDatabase(config);
    dbInstance = result.db;
    sqliteInstance = result.sqlite;
  }
  return dbInstance;
}

/**
 * Initialize the database connection.
 */
export function initDatabase(config: DatabaseConfig): {
  db: DrizzleDatabase;
  sqlite: Database.Database;
} {
  if (dbInstance && sqliteInstance) {
    return { db: dbInstance, sqlite: sqliteInstance };
  }

  const sqlite = new Database(config.url);

  // Enable WAL mode for better performance
  sqlite.pragma('journal_mode = WAL');

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  const db = drizzleSqlite(sqlite, {
    schema,
    logger: config.verbose,
  });

  dbInstance = db;
  sqliteInstance = sqlite;

  return { db, sqlite };
}

/**
 * Close the database connection.
 */
export function closeDatabase(): void {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    dbInstance = null;
  }
}

/**
 * Reset the database (for testing).
 */
export function resetDatabaseInstance(): void {
  dbInstance = null;
  sqliteInstance = null;
}

/**
 * Run a callback inside an atomic, connection-level SQLite transaction.
 *
 * Why not `db.transaction(cb)`?
 * The drizzle better-sqlite3 driver only supports a *synchronous* callback for
 * `db.transaction`. Our query helpers (`upsertPage`, `upsertField`,
 * `upsertContent`, etc.) are declared `async` and internally `await` the drizzle
 * query builders. An un-awaited drizzle query never executes (the builder is
 * lazy/thenable), and an awaited one resolves on a later microtask — after a
 * synchronous `db.transaction` callback has already returned. Either way the
 * writes would escape the transaction boundary.
 *
 * Because better-sqlite3 is 100% synchronous, every awaited statement actually
 * hits the database in order on the *same* connection. By issuing the
 * `BEGIN`/`COMMIT`/`ROLLBACK` ourselves on that connection (via `db.$client`),
 * we get a real, connection-scoped transaction that wraps all of those awaited
 * statements. Any thrown error rolls everything back (all-or-nothing).
 *
 * @example
 * ```ts
 * await withTransaction(db, async (tx) => {
 *   await upsertPage(tx, page);
 *   await upsertField(tx, field); // if this throws, the page upsert is rolled back
 * });
 * ```
 */
export async function withTransaction<T>(
  db: DrizzleDatabase,
  callback: (tx: DrizzleDatabase) => Promise<T>
): Promise<T> {
  const client = db.$client;

  // Nested transactions are not supported by SQLite's plain BEGIN; if a
  // transaction is already open on this connection, just run inline and let the
  // outermost caller own the commit/rollback.
  if (client.inTransaction) {
    return callback(db);
  }

  client.exec('BEGIN');
  try {
    const result = await callback(db);
    client.exec('COMMIT');
    return result;
  } catch (error) {
    if (client.inTransaction) {
      client.exec('ROLLBACK');
    }
    throw error;
  }
}
