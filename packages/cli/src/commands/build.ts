/**
 * Build command - prepares the CMS for production.
 *
 * Scans the markers, writes .reverso/schema.json and types, and creates or
 * upgrades the database with the schema synced. Reads reverso.config.ts like
 * every other command, so the database it prepares is the one `reverso start`
 * (and `reverso dev`) opens.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolveRuntimeConfig } from '../runtime-config.js';

interface BuildOptions {
  src?: string;
  output?: string;
  database?: string;
}

export function buildCommand(program: Command): void {
  program
    .command('build')
    .description('Scan markers and prepare the database for production')
    .option('-s, --src <dir>', 'Source directory to scan (default: reverso.config srcDir)')
    .option('-o, --output <dir>', 'Output directory (default: reverso.config outputDir)')
    .option('-d, --database <path>', 'Database file path (default: REVERSO_DB_PATH or reverso.config database.url)')
    .action(async (options: BuildOptions) => {
      const spinner = ora();

      try {
        console.log(chalk.blue.bold('Building Reverso CMS for production...'));
        console.log();

        const runtime = await resolveRuntimeConfig(process.cwd(), options);
        for (const warning of runtime.warnings) {
          console.log(chalk.yellow(`Warning: ${warning}`));
        }

        const outputDir = join(process.cwd(), runtime.outputDir);
        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }

        // Step 1: Scan source files
        spinner.start(`Scanning ${runtime.srcDir}...`);
        const { createScanner } = await import('@reverso/scanner');
        const scanner = createScanner({
          srcDir: runtime.srcDir,
          outputDir: runtime.outputDir,
          include: runtime.include,
          exclude: runtime.exclude,
        });

        const result = await scanner.scan();
        if (!result.success || !result.schema) {
          throw new Error(
            `Scan failed: ${result.errors.map((e) => e.message).join(', ') || 'Unknown error'}`
          );
        }
        spinner.succeed(
          `Found ${result.schema.totalFields} fields in ${result.schema.pages.length} page(s)`
        );
        if (result.schema.totalFields === 0) {
          console.log(
            chalk.yellow(
              `  No data-reverso markers found under "${runtime.srcDir}". The admin will have nothing to edit.`
            )
          );
        }

        // Step 2: Schema file (the scanner already wrote it; keep the path visible)
        const schemaPath = join(outputDir, 'schema.json');

        // Step 3: Database: apply migrations and sync the schema
        spinner.start('Preparing database...');
        const { createDatabaseSchema, syncSchema, initDatabase, closeDatabase, resetDatabaseInstance } =
          await import('@reverso/db');

        await createDatabaseSchema(runtime.databasePath);
        resetDatabaseInstance();
        const { db } = initDatabase({ url: runtime.databasePath });
        await syncSchema(db, result.schema);
        closeDatabase();
        spinner.succeed(`Database ready (${runtime.databaseSource}): ${runtime.databasePath}`);

        // Step 4: Build manifest
        spinner.start('Creating build manifest...');
        const manifest = {
          version: '1.0.0',
          buildTime: new Date().toISOString(),
          schema: {
            pages: result.schema.pages.length,
            fields: result.schema.totalFields,
          },
          database: runtime.databasePath,
          nodeVersion: process.version,
        };
        const manifestPath = join(outputDir, 'manifest.json');
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        spinner.succeed('Build manifest created');

        console.log();
        console.log(chalk.green.bold('Build complete!'));
        console.log();
        console.log(chalk.bold('Build output:'));
        console.log(chalk.gray(`  Schema:    ${schemaPath}`));
        console.log(chalk.gray(`  Database:  ${runtime.databasePath}`));
        console.log(chalk.gray(`  Manifest:  ${manifestPath}`));
        console.log();
        console.log(chalk.yellow('Run `reverso start` to start the production server'));
      } catch (error) {
        spinner.fail(chalk.red('Build failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
