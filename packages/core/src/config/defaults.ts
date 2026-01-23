/**
 * Default configuration values for Reverso CMS.
 */

import {
  DEFAULT_ADMIN_PATH,
  DEFAULT_API_PATH,
  DEFAULT_DEV_PORT,
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_OUTPUT_DIR,
  DEFAULT_SRC_DIR,
  DEFAULT_WATCH_DEBOUNCE,
} from '../constants.js';
import type {
  AdminConfig,
  ApiConfig,
  DatabaseConfig,
  ReversoConfig,
  ScannerConfig,
} from '../types/config.js';

/**
 * Default database configuration (SQLite for development).
 */
export const defaultDatabaseConfig: DatabaseConfig = {
  provider: 'sqlite',
  url: '.reverso/reverso.db',
  autoMigrate: true,
  logging: false,
};

/**
 * Default scanner configuration.
 */
export const defaultScannerConfig: Required<ScannerConfig> = {
  srcDir: DEFAULT_SRC_DIR,
  include: [...DEFAULT_INCLUDE_PATTERNS],
  exclude: [...DEFAULT_EXCLUDE_PATTERNS],
  outputDir: DEFAULT_OUTPUT_DIR,
  watch: {
    enabled: true,
    debounce: DEFAULT_WATCH_DEBOUNCE,
  },
};

/**
 * Default admin configuration.
 */
export const defaultAdminConfig: Required<AdminConfig> = {
  path: DEFAULT_ADMIN_PATH,
  title: 'Reverso',
  logo: '',
  primaryColor: '#6366f1',
  darkMode: true,
  favicon: '',
  disabled: false,
};

/**
 * Default API configuration.
 */
export const defaultApiConfig: Required<Omit<ApiConfig, 'rateLimit' | 'apiKey'>> &
  Pick<ApiConfig, 'rateLimit' | 'apiKey'> = {
  path: DEFAULT_API_PATH,
  graphql: true,
  rest: true,
  cors: true,
  rateLimit: undefined,
  apiKey: undefined,
};

/**
 * Default development configuration.
 */
export const defaultDevConfig: Required<NonNullable<ReversoConfig['dev']>> = {
  port: DEFAULT_DEV_PORT,
  hotReload: true,
};

/**
 * Complete default configuration.
 */
export const defaultConfig: Omit<ReversoConfig, 'database'> & { database: DatabaseConfig } = {
  name: 'Reverso',
  srcDir: DEFAULT_SRC_DIR,
  outputDir: DEFAULT_OUTPUT_DIR,
  database: defaultDatabaseConfig,
  auth: undefined,
  uploads: undefined,
  admin: defaultAdminConfig,
  api: defaultApiConfig,
  scanner: defaultScannerConfig,
  plugins: [],
  hooks: undefined,
  dev: defaultDevConfig,
};

/**
 * Merge user config with defaults.
 */
export function mergeWithDefaults(userConfig: ReversoConfig): ReversoConfig {
  return {
    name: userConfig.name ?? defaultConfig.name,
    srcDir: userConfig.srcDir ?? defaultConfig.srcDir,
    outputDir: userConfig.outputDir ?? defaultConfig.outputDir,
    database: {
      ...defaultDatabaseConfig,
      ...userConfig.database,
    },
    auth: userConfig.auth,
    uploads: userConfig.uploads,
    admin: userConfig.admin ? { ...defaultAdminConfig, ...userConfig.admin } : defaultAdminConfig,
    api: userConfig.api ? { ...defaultApiConfig, ...userConfig.api } : defaultApiConfig,
    scanner: userConfig.scanner
      ? {
          ...defaultScannerConfig,
          ...userConfig.scanner,
          watch: userConfig.scanner.watch
            ? { ...defaultScannerConfig.watch, ...userConfig.scanner.watch }
            : defaultScannerConfig.watch,
        }
      : defaultScannerConfig,
    plugins: userConfig.plugins ?? [],
    hooks: userConfig.hooks,
    dev: userConfig.dev ? { ...defaultDevConfig, ...userConfig.dev } : defaultDevConfig,
  };
}
