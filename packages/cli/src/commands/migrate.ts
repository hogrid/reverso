/**
 * Migrate command - database migrations.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'node:path';

interface MigrateOptions {
  database: string;
  verbose: boolean;
}

export function migrateCommand(program: Command): void {
  program
    .command('migrate')
    .description('Run database migrations')
    .option('-d, --database <path>', 'Database file path', '.reverso/dev.db')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options: MigrateOptions) => {
      const spinner = ora();

      try {
        const dbPath = resolve(options.database);

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

  // Sub-command: migrate create
  program
    .command('migrate:create <name>')
    .description('Create a new migration file')
    .option('-d, --dir <path>', 'Migrations directory', '.reverso/migrations')
    .action(async (name: string, options: { dir: string }) => {
      const spinner = ora();

      try {
        const { writeFileSync, mkdirSync, existsSync } = await import('node:fs');
        const { join } = await import('node:path');

        const migrationsDir = resolve(options.dir);

        // Create directory if needed
        if (!existsSync(migrationsDir)) {
          mkdirSync(migrationsDir, { recursive: true });
        }

        // Generate timestamp
        const timestamp = new Date()
          .toISOString()
          .replace(/[-:T]/g, '')
          .slice(0, 14);

        const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
        const filepath = join(migrationsDir, filename);

        const template = `-- Migration: ${name}
-- Created at: ${new Date().toISOString()}

-- Write your migration SQL here
-- Example:
-- ALTER TABLE pages ADD COLUMN new_column TEXT;

`;

        writeFileSync(filepath, template);

        spinner.succeed(chalk.green(`Created migration: ${filename}`));
        console.log(chalk.gray(`  Path: ${filepath}`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to create migration'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Sub-command: migrate reset
  program
    .command('migrate:reset')
    .description('Reset database (drop all tables and recreate)')
    .option('-d, --database <path>', 'Database file path', '.reverso/dev.db')
    .option('--force', 'Skip confirmation', false)
    .action(async (options: { database: string; force: boolean }) => {
      const spinner = ora();

      try {
        const { existsSync, unlinkSync } = await import('node:fs');
        const dbPath = resolve(options.database);

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
    .option('-d, --database <path>', 'Database file path', '.reverso/dev.db')
    .action(async (options: { database: string }) => {
      try {
        const { existsSync } = await import('node:fs');
        const dbPath = resolve(options.database);

        if (!existsSync(dbPath)) {
          console.log(chalk.yellow('Database does not exist yet.'));
          console.log(chalk.gray(`  Expected: ${dbPath}`));
          console.log(chalk.gray('  Run "reverso migrate" to create it.'));
          return;
        }

        console.log(chalk.green('Database exists'));
        console.log(chalk.gray(`  Path: ${dbPath}`));

        // Get file stats
        const { statSync } = await import('node:fs');
        const stats = statSync(dbPath);
        console.log(chalk.gray(`  Size: ${(stats.size / 1024).toFixed(2)} KB`));
        console.log(chalk.gray(`  Modified: ${stats.mtime.toISOString()}`));
      } catch (error) {
        console.error(chalk.red('Failed to check status'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
