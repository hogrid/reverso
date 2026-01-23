/**
 * Database migration runner.
 */

import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface MigrateOptions {
  /** Database file path */
  dbPath: string;
  /** Migrations folder path */
  migrationsFolder?: string;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Run database migrations.
 */
export async function runMigrations(options: MigrateOptions): Promise<void> {
  const { dbPath, migrationsFolder = join(__dirname, '../migrations'), verbose = false } = options;

  // Ensure database directory exists
  const dbDir = dirname(dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  if (verbose) {
    console.log(`Running migrations...`);
    console.log(`  Database: ${dbPath}`);
    console.log(`  Migrations: ${migrationsFolder}`);
  }

  const sqlite = new Database(dbPath);

  // Enable WAL mode
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite);

  try {
    migrate(db, { migrationsFolder });

    if (verbose) {
      console.log('Migrations completed successfully!');
    }
  } finally {
    sqlite.close();
  }
}

/**
 * Create initial database with schema (without migrations).
 * Useful for development and testing.
 */
export async function createDatabase(dbPath: string): Promise<void> {
  const { initDatabase } = await import('./connection.js');
  const { allTables } = await import('./schema/index.js');

  // Ensure database directory exists
  const dbDir = dirname(dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  const { sqlite } = initDatabase({ url: dbPath });

  // Create tables using raw SQL from Drizzle schema
  // This is a simplified approach - in production use migrations
  const createTableStatements = [
    // Pages
    `CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      source_files TEXT,
      field_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    // Sections
    `CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      is_repeater INTEGER DEFAULT 0,
      repeater_config TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(page_id, slug)
    )`,
    // Fields
    `CREATE TABLE IF NOT EXISTS fields (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      path TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      label TEXT,
      placeholder TEXT,
      required INTEGER DEFAULT 0,
      validation TEXT,
      options TEXT,
      condition TEXT,
      config TEXT,
      default_value TEXT,
      help TEXT,
      source_file TEXT,
      source_line INTEGER,
      source_column INTEGER,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    // Content
    `CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
      locale TEXT DEFAULT 'default' NOT NULL,
      value TEXT,
      published INTEGER DEFAULT 0,
      published_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(field_id, locale)
    )`,
    // Content history
    `CREATE TABLE IF NOT EXISTS content_history (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
      value TEXT,
      changed_by TEXT,
      changed_at INTEGER NOT NULL
    )`,
    // Media
    `CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      alt TEXT,
      caption TEXT,
      storage_path TEXT NOT NULL,
      storage_provider TEXT DEFAULT 'local',
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    // Users
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      email_verified INTEGER DEFAULT 0,
      image TEXT,
      role TEXT DEFAULT 'user',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    // Sessions
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    // Accounts
    `CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      access_token_expires_at INTEGER,
      refresh_token_expires_at INTEGER,
      scope TEXT,
      id_token TEXT,
      password TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    // Verifications
    `CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER,
      updated_at INTEGER
    )`,
  ];

  for (const sql of createTableStatements) {
    sqlite.exec(sql);
  }

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_sections_page_id ON sections(page_id)',
    'CREATE INDEX IF NOT EXISTS idx_fields_section_id ON fields(section_id)',
    'CREATE INDEX IF NOT EXISTS idx_fields_path ON fields(path)',
    'CREATE INDEX IF NOT EXISTS idx_content_field_id ON content(field_id)',
    'CREATE INDEX IF NOT EXISTS idx_content_locale ON content(locale)',
    'CREATE INDEX IF NOT EXISTS idx_content_history_content_id ON content_history(content_id)',
    'CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media(mime_type)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)',
    'CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)',
  ];

  for (const sql of indexes) {
    sqlite.exec(sql);
  }
}

// CLI runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dbPath = process.argv[2] || '.reverso/dev.db';
  runMigrations({ dbPath, verbose: true }).catch(console.error);
}
