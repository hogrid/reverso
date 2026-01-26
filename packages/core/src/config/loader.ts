/**
 * Configuration loader for Reverso CMS.
 * Loads and validates reverso.config.ts files.
 */

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CONFIG_FILE_NAMES } from '../constants.js';
import type { ReversoConfig } from '../types/config.js';
import { mergeWithDefaults } from './defaults.js';
import { configSchema } from './validation.js';

/**
 * Options for loading configuration.
 */
export interface LoadConfigOptions {
  /** Working directory to search for config file */
  cwd?: string;
  /** Explicit config file path */
  configFile?: string;
  /** Skip validation */
  skipValidation?: boolean;
}

/**
 * Result of loading configuration.
 */
export interface LoadConfigResult {
  /** Loaded and merged configuration */
  config: ReversoConfig;
  /** Path to the config file that was loaded */
  configPath: string | null;
  /** Whether the config file exists */
  exists: boolean;
}

/**
 * Find the configuration file in the given directory.
 */
export function findConfigFile(cwd: string): string | null {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = join(cwd, fileName);
    if (existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Load configuration from a file.
 */
export async function loadConfig(options: LoadConfigOptions = {}): Promise<LoadConfigResult> {
  const cwd = options.cwd ?? process.cwd();

  // Find config file
  const configPath = options.configFile ? resolve(cwd, options.configFile) : findConfigFile(cwd);

  // If no config file, return defaults
  if (!configPath || !existsSync(configPath)) {
    return {
      config: mergeWithDefaults({
        database: {
          provider: 'sqlite',
          url: '.reverso/reverso.db',
        },
      }),
      configPath: null,
      exists: false,
    };
  }

  // Load the config file
  try {
    const fileUrl = pathToFileURL(configPath).href;
    const module = await import(fileUrl);
    const userConfig = module.default as ReversoConfig;

    // Validate if not skipped
    if (!options.skipValidation) {
      const result = configSchema.safeParse(userConfig);
      if (!result.success) {
        const errors = result.error.issues
          .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
          .join('\n');
        throw new Error(`Invalid configuration:\n${errors}`);
      }
    }

    // Merge with defaults
    const config = mergeWithDefaults(userConfig);

    return {
      config,
      configPath,
      exists: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Load configuration synchronously (blocking).
 * Use loadConfig() when possible for better performance.
 */
export function loadConfigSync(options: LoadConfigOptions = {}): LoadConfigResult {
  const cwd = options.cwd ?? process.cwd();

  // Find config file
  const configPath = options.configFile ? resolve(cwd, options.configFile) : findConfigFile(cwd);

  // If no config file, return defaults
  if (!configPath || !existsSync(configPath)) {
    return {
      config: mergeWithDefaults({
        database: {
          provider: 'sqlite',
          url: '.reverso/reverso.db',
        },
      }),
      configPath: null,
      exists: false,
    };
  }

  // For sync loading, we need to use require for .js files
  // TypeScript files need to be compiled first
  throw new Error(
    'Synchronous config loading is not supported for TypeScript config files. ' +
      'Use loadConfig() instead, or compile your config to .js first.'
  );
}
