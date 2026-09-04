/**
 * Migrate command - database migrations.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolveRuntimeConfig } from '../runtime-config.js';

interface MigrateOptions {
  database?: string;
  verbose: boolean;
}


/**
 * Resolve the database path exactly like `dev`, `build` and `start` do
 * (flag → REVERSO_DB_PATH → reverso.config database.url → default).
 */
async function resolveDatabasePath(flag: string | undefined): Promise<string> {
  const runtime = await resolveRuntimeConfig(process.cwd(), { database: flag });
  return runtime.databasePath;
}

export function migrateCommand(program: Command): void {
  program
    .command('migrate')
    .description('Run database migrations')
    .option('-d, --database <path>', 'Database file path (default: reverso.config database.url)')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options: MigrateOptions) => {
      const spinner = ora();

      try {
        const dbPath = await resolveDatabasePath(options.database);

        spinner.start('Running database migrations...');

        const { runMigrations } = await import('@reverso/db');

        await runMigrations({
          dbPath,
          verbose: options.verbose,
        });

        spinner.succeed(chalk.green('Migrations complete!'));
        console.log(chalk.gray(`  Database: ${dbPath}`));
      } catch (error) {
        spinner.fail(chalk.red('Migration failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Sub-command: migrate reset
  program
    .command('migrate:reset')
    .description('Reset database (drop all tables and recreate)')
    .option('-d, --database <path>', 'Database file path (default: reverso.config database.url)')
    .option('--force', 'Skip confirmation', false)
    .action(async (options: { database?: string; force: boolean }) => {
      const spinner = ora();

      try {
        const { existsSync, unlinkSync } = await import('node:fs');
        const dbPath = await resolveDatabasePath(options.database);

        if (!options.force) {
          const prompts = (await import('prompts')).default;
          const response = await prompts({
            type: 'confirm',
            name: 'confirm',
            message: `This will delete the database at ${dbPath}. Are you sure?`,
            initial: false,
          });

          if (!response.confirm) {
            console.log(chalk.gray('Aborted.'));
            return;
          }
        }

        spinner.start('Resetting database...');

        // Delete database files
        const files = [dbPath, `${dbPath}-shm`, `${dbPath}-wal`];
        for (const file of files) {
          if (existsSync(file)) {
            unlinkSync(file);
          }
        }

        // Recreate database
        const { createDatabaseSchema } = await import('@reverso/db');
        await createDatabaseSchema(dbPath);

        spinner.succeed(chalk.green('Database reset complete!'));
      } catch (error) {
        spinner.fail(chalk.red('Reset failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Sub-command: migrate status
  program
    .command('migrate:status')
    .description('Show migration status')
    .option('-d, --database <path>', 'Database file path (default: reverso.config database.url)')
    .action(async (options: { database?: string }) => {
      try {
        const dbPath = await resolveDatabasePath(options.database);
        const { getMigrationStatus } = await import('@reverso/db');
        const status = getMigrationStatus(dbPath);

        console.log(chalk.bold('Database'));
        console.log(chalk.gray(`  Path: ${dbPath}`));
        if (status.legacy) {
          console.log(
            chalk.yellow('  Created before migrations existed; "reverso migrate" will upgrade it in place.')
          );
        }
        console.log();
        console.log(chalk.bold('Migrations'));
        for (const tag of status.available) {
          const applied = status.applied.includes(tag);
          console.log(`  ${applied ? chalk.green('applied') : chalk.yellow('pending')}  ${tag}`);
        }
        if (status.pending.length > 0) {
          console.log();
          console.log(chalk.gray(`Run "reverso migrate" to apply ${status.pending.length} pending migration(s).`));
        }
      } catch (error) {
        console.error(chalk.red('Failed to check status'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
