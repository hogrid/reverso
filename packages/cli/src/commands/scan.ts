/**
 * Scan command - scans project for data-reverso markers.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import type { ScanOptions as CoreScanOptions } from '@reverso/core';
import { createScanner, scan, type ScannerOptions } from '@reverso/scanner';

interface CliScanOptions {
  src: string;
  output: string;
  watch: boolean;
  verbose: boolean;
  include: string[];
  exclude: string[];
}

export function scanCommand(program: Command): void {
  program
    .command('scan')
    .description('Scan project for data-reverso markers and generate schema')
    .option('-s, --src <dir>', 'Source directory to scan', './src')
    .option('-o, --output <dir>', 'Output directory for schema', '.reverso')
    .option('-w, --watch', 'Watch for changes', false)
    .option('-v, --verbose', 'Verbose output', false)
    .option('--include <patterns...>', 'Glob patterns to include', ['**/*.tsx', '**/*.jsx'])
    .option('--exclude <patterns...>', 'Glob patterns to exclude', ['**/node_modules/**', '**/dist/**'])
    .action(async (options: CliScanOptions) => {
      const spinner = ora();

      try {
        if (options.watch) {
          // Watch mode uses ScannerOptions
          const scannerOptions: ScannerOptions = {
            srcDir: options.src,
            outputDir: options.output,
            include: options.include,
            exclude: options.exclude,
          };

          console.log(chalk.blue('Starting scanner in watch mode...'));
          console.log(chalk.gray(`  Source: ${options.src}`));
          console.log(chalk.gray(`  Output: ${options.output}`));
          console.log();

          const scanner = createScanner(scannerOptions);

          scanner.on((event) => {
            switch (event.type) {
              case 'start':
                spinner.start('Scanning...');
                break;
              case 'complete':
                if (event.schema) {
                  spinner.succeed(
                    chalk.green(
                      `Found ${event.schema.totalFields} fields across ${event.schema.pages.length} pages`
                    )
                  );
                }
                break;
              case 'error':
                spinner.fail(chalk.red(`Error: ${event.error?.message || 'Unknown error'}`));
                break;
              case 'change':
                if (event.changedFile) {
                  console.log(chalk.gray(`File changed: ${event.changedFile}`));
                }
                break;
            }
          });

          await scanner.startWatch();

          // Keep process running
          console.log(chalk.yellow('\nWatching for changes. Press Ctrl+C to stop.\n'));
          process.on('SIGINT', () => {
            scanner.stopWatch();
            console.log(chalk.gray('\nStopped watching.'));
            process.exit(0);
          });
        } else {
          // One-time scan uses CoreScanOptions
          const scanOptions: CoreScanOptions = {
            srcDir: options.src,
            include: options.include,
            exclude: options.exclude,
            verbose: options.verbose,
          };

          spinner.start('Scanning for data-reverso markers...');

          const result = await scan(scanOptions);

          spinner.succeed(chalk.green('Scan complete!'));

          console.log();
          console.log(chalk.bold('Results:'));
          console.log(chalk.gray(`  Pages: ${result.schema.pages.length}`));
          console.log(chalk.gray(`  Total fields: ${result.schema.totalFields}`));
          console.log(chalk.gray(`  Output: ${options.output}/schema.json`));

          if (options.verbose && result.schema.pages.length > 0) {
            console.log();
            console.log(chalk.bold('Pages:'));
            for (const page of result.schema.pages) {
              const fieldCount = page.sections.reduce((sum, s) => sum + s.fields.length, 0);
              console.log(chalk.gray(`  - ${page.slug} (${fieldCount} fields)`));
              for (const section of page.sections) {
                console.log(chalk.gray(`      ${section.slug}: ${section.fields.length} fields`));
              }
            }
          }

          if (result.schema.totalFields === 0) {
            console.log();
            console.log(chalk.yellow('No data-reverso markers found.'));
            console.log(chalk.gray('Add markers to your components like:'));
            console.log(chalk.gray('  <h1 data-reverso="home.hero.title">Welcome</h1>'));
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Scan failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
