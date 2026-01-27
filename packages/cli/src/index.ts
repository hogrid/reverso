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

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get CLI version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgPath = join(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
export const VERSION = pkg.version;

// Export commands for programmatic use
export { initCommand, scanCommand, devCommand, migrateCommand } from './commands/index.js';
