/**
 * @reverso/cli
 *
 * Command line interface for Reverso CMS.
 * Provides commands for scanning, development, database management, and more.
 *
 * @example
 * ```bash
 * # Scan project for data-reverso markers
 * npx reverso scan
 *
 * # Start development server
 * npx reverso dev
 *
 * # Run database migrations
 * npx reverso migrate
 * ```
 */

export const VERSION = '0.0.0';

// Export commands for programmatic use
export { scanCommand, devCommand, migrateCommand } from './commands/index.js';
