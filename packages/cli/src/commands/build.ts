/**
 * Build command - prepares the CMS for production.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve, join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

interface BuildOptions {
  src: string;
  output: string;
  database: string;
}

export function buildCommand(program: Command): void {
  program
    .command('build')
    .description('Build the CMS for production deployment')
    .option('-s, --src <dir>', 'Source directory to scan', './src')
    .option('-o, --output <dir>', 'Output directory', '.reverso')
    .option('-d, --database <path>', 'Database file path', '.reverso/reverso.db')
    .action(async (options: BuildOptions) => {
      const spinner = ora();

      try {
        console.log(chalk.blue.bold('Building Reverso CMS for production...'));
        console.log();

        const outputDir = resolve(options.output);
        const dbPath = resolve(options.database);

        // Ensure output directory exists
        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }

        // Step 1: Scan source files
        spinner.start('Scanning source files...');
        const { createScanner } = await import('@reverso/scanner');
        const scanner = createScanner({
          srcDir: options.src,
          outputDir: outputDir,
        });

        const result = await scanner.scan();
        if (!result.success || !result.schema) {
          throw new Error(`Scan failed: ${result.errors?.join(', ') || 'Unknown error'}`);
        }
        spinner.succeed(`Found ${result.schema.totalFields} fields in ${result.schema.pages.length} pages`);

        // Step 2: Generate schema file
        spinner.start('Generating schema...');
        const schemaPath = join(outputDir, 'schema.json');
        writeFileSync(schemaPath, JSON.stringify(result.schema, null, 2));
        spinner.succeed(`Schema saved to ${schemaPath}`);

        // Step 3: Initialize database
        spinner.start('Initializing database...');
        const { createDatabaseSchema, syncSchema, initDatabase, getDatabase, closeDatabase } = await import('@reverso/db');

        // Create database schema
        await createDatabaseSchema(dbPath);

        // Initialize and sync
        initDatabase({ url: dbPath });
        const db = getDatabase();
        await syncSchema(db, result.schema);
        await closeDatabase();

        spinner.succeed('Database initialized and synced');

        // Step 4: Create build manifest
        spinner.start('Creating build manifest...');
        const manifest = {
          version: '1.0.0',
          buildTime: new Date().toISOString(),
          schema: {
            pages: result.schema.pages.length,
            fields: result.schema.totalFields,
          },
          database: dbPath,
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
        console.log(chalk.gray(`  Database:  ${dbPath}`));
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
