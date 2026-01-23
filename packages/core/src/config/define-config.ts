/**
 * Configuration helper for type-safe Reverso configuration.
 */

import type { ReversoConfig } from '../types/config.js';
import { mergeWithDefaults } from './defaults.js';

/**
 * Define a Reverso configuration with full TypeScript support.
 *
 * @example
 * ```ts
 * // reverso.config.ts
 * import { defineConfig } from '@reverso/core';
 *
 * export default defineConfig({
 *   database: {
 *     provider: 'sqlite',
 *     url: '.reverso/dev.db',
 *   },
 *   auth: {
 *     enabled: true,
 *     provider: 'better-auth',
 *     secret: process.env.AUTH_SECRET!,
 *   },
 * });
 * ```
 */
export function defineConfig(config: ReversoConfig): ReversoConfig {
  return mergeWithDefaults(config);
}

/**
 * Type helper for configuration objects.
 * Use this when you need to define partial configuration that will be merged later.
 *
 * @example
 * ```ts
 * const dbConfig = configPartial<DatabaseConfig>({
 *   provider: 'postgresql',
 *   url: process.env.DATABASE_URL!,
 * });
 * ```
 */
export function configPartial<T extends Record<string, unknown>>(config: T): T {
  return config;
}
