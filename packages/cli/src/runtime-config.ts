/**
 * One place that decides where the CLI reads sources, writes output, opens the
 * database and listens. Every command (`init`, `dev`, `scan`, `build`,
 * `start`, `migrate`) resolves its settings through here so that development
 * and production never silently point at different files.
 *
 * Precedence, highest first: explicit CLI flag → environment variable →
 * `reverso.config.ts` → built-in default.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_OUTPUT_DIR,
  DEFAULT_SRC_DIR,
  loadConfig,
  mergeWithDefaults,
  type ReversoConfig,
} from '@reverso/core';

/** Default SQLite file, shared by every command (same as @reverso/core). */
export const DEFAULT_DB_PATH = '.reverso/reverso.db';
export const DEFAULT_PORT = 3001;

export interface RuntimeFlags {
  src?: string;
  output?: string;
  database?: string;
  port?: string | number;
  host?: string;
  include?: string[];
  exclude?: string[];
}

export interface RuntimeConfig {
  /** Loaded (or default) reverso.config. */
  config: ReversoConfig;
  /** Whether a reverso.config file was found. */
  hasConfigFile: boolean;
  /** Source directory to scan (relative to cwd as given). */
  srcDir: string;
  /** Directory for schema.json / types.ts. */
  outputDir: string;
  include: string[];
  exclude: string[];
  /** Absolute SQLite path. */
  databasePath: string;
  /** Where the database path came from, for messages. */
  databaseSource: 'flag' | 'env' | 'config' | 'default';
  port: number;
  host: string;
  /** Warnings worth showing the user (missing srcDir, config load failure). */
  warnings: string[];
}

function envString(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : undefined;
}

/**
 * Resolve the effective runtime configuration for the current project.
 */
export async function resolveRuntimeConfig(
  cwd: string,
  flags: RuntimeFlags = {}
): Promise<RuntimeConfig> {
  const warnings: string[] = [];
  let config: ReversoConfig = mergeWithDefaults({
    database: { provider: 'sqlite', url: DEFAULT_DB_PATH },
  });
  let hasConfigFile = false;

  const configExists = ['reverso.config.ts', 'reverso.config.js', 'reverso.config.mjs'].some((f) =>
    existsSync(resolve(cwd, f))
  );
  if (configExists) {
    try {
      ({ config } = await loadConfig({ cwd }));
      hasConfigFile = true;
    } catch (error) {
      warnings.push(
        `Could not load reverso.config (${error instanceof Error ? error.message : String(error)}). Using defaults.`
      );
    }
  }

  const srcDir = flags.src ?? envString('REVERSO_SRC_DIR') ?? config.srcDir ?? config.scanner?.srcDir ?? DEFAULT_SRC_DIR;
  if (!existsSync(resolve(cwd, srcDir))) {
    warnings.push(
      `Source directory "${srcDir}" does not exist. Set "srcDir" in reverso.config.ts (or pass --src) to the folder that holds your components.`
    );
  }

  let databasePath: string;
  let databaseSource: RuntimeConfig['databaseSource'];
  if (flags.database) {
    databasePath = flags.database;
    databaseSource = 'flag';
  } else if (envString('REVERSO_DB_PATH')) {
    databasePath = envString('REVERSO_DB_PATH') as string;
    databaseSource = 'env';
  } else if (hasConfigFile && config.database.provider === 'sqlite' && config.database.url) {
    databasePath = config.database.url;
    databaseSource = 'config';
  } else {
    databasePath = DEFAULT_DB_PATH;
    databaseSource = 'default';
  }

  if (hasConfigFile && config.database.provider !== 'sqlite') {
    warnings.push(
      `database.provider "${config.database.provider}" is not implemented yet; using SQLite at ${databasePath}.`
    );
  }

  const portRaw = flags.port ?? envString('REVERSO_PORT') ?? config.dev?.port ?? DEFAULT_PORT;
  const port = Number.parseInt(String(portRaw), 10);

  return {
    config,
    hasConfigFile,
    srcDir,
    outputDir: flags.output ?? config.outputDir ?? DEFAULT_OUTPUT_DIR,
    include: flags.include ?? config.scanner?.include ?? [...DEFAULT_INCLUDE_PATTERNS],
    exclude: flags.exclude ?? config.scanner?.exclude ?? [...DEFAULT_EXCLUDE_PATTERNS],
    databasePath: resolve(cwd, databasePath),
    databaseSource,
    port: Number.isFinite(port) && port > 0 ? port : DEFAULT_PORT,
    host: flags.host ?? envString('REVERSO_HOST') ?? 'localhost',
    warnings,
  };
}

/** `api.cors` from the config as the server expects it. */
export function corsOption(config: ReversoConfig): boolean | { origin?: string | string[] | boolean } {
  const cors = config.api?.cors;
  if (cors === undefined) return true;
  if (typeof cors === 'boolean') return cors;
  return { origin: cors.origin };
}
