/**
 * Database connection management.
 * Supports SQLite (development) and PostgreSQL (production).
 */

import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema/index.js';

export type DrizzleDatabase = BetterSQLite3Database<typeof schema>;

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
