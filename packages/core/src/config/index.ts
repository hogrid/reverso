/**
 * Configuration exports for @reverso/core
 */

export { defineConfig, configPartial } from './define-config.js';
export {
  defaultConfig,
  defaultDatabaseConfig,
  defaultScannerConfig,
  defaultAdminConfig,
  defaultApiConfig,
  defaultDevConfig,
  mergeWithDefaults,
} from './defaults.js';
export {
  loadConfig,
  loadConfigSync,
  findConfigFile,
  type LoadConfigOptions,
  type LoadConfigResult,
} from './loader.js';
export {
  configSchema,
  databaseConfigSchema,
  authConfigSchema,
  uploadsConfigSchema,
  adminConfigSchema,
  apiConfigSchema,
  scannerConfigSchema,
  pluginConfigSchema,
  hooksConfigSchema,
  devConfigSchema,
  type ValidatedConfig,
} from './validation.js';
