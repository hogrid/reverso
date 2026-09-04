/**
 * Scan command - scans project for data-reverso markers.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import type { ProjectSchema } from '@reverso/core';
import { createScanner, type ScannerOptions } from '@reverso/scanner';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveRuntimeConfig } from '../runtime-config.js';

/** Default API port for sync */
const DEFAULT_API_PORT = 3001;

/** File where a running `reverso dev` records its URL and API key (see dev.ts). */
const DEV_SERVER_FILE = '.reverso/dev-server.json';

function readDevServerFile(cwd: string): { apiUrl?: string; apiKey?: string } {
  const filePath = resolve(cwd, DEV_SERVER_FILE);
  if (!existsSync(filePath)) return {};
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8')) as { apiUrl?: unknown; apiKey?: unknown };
    return {
      apiUrl: typeof parsed.apiUrl === 'string' ? parsed.apiUrl : undefined,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : undefined,
    };
  } catch {
    return {};
  }
}

export interface SyncTarget {
  /** Base URL of the API server (e.g. http://localhost:3001). */
  apiUrl: string;
  /** API key sent as X-API-Key. */
  apiKey?: string;
}

export type SyncOutcome =
  | { ok: true }
  | { ok: false; reason: 'unreachable' | 'unauthorized' | 'error'; detail?: string };

/**
 * Resolve where to sync and how to authenticate, in priority order:
 * --api-url / --api-key flags, then REVERSO_API_URL / REVERSO_API_KEY, then
 * the URL and key recorded by a running `reverso dev` (.reverso/dev-server.json),
 * then localhost on the configured dev port.
 */
export function resolveSyncTarget(
  cwd: string,
  flags: { apiUrl?: string; apiKey?: string },
  port: number
): SyncTarget {
  const devServer = readDevServerFile(cwd);
  const apiUrl = (
    flags.apiUrl ??
    process.env.REVERSO_API_URL ??
    devServer.apiUrl ??
    `http://localhost:${port}`
  ).replace(/\/+$/, '');
  const apiKey = flags.apiKey ?? process.env.REVERSO_API_KEY ?? devServer.apiKey;
  return { apiUrl, apiKey };
}

/**
 * Push a schema to a running API server.
 */
export async function syncSchemaToServer(
  schema: ProjectSchema,
  target: SyncTarget
): Promise<SyncOutcome> {
  try {
    const res = await fetch(`${target.apiUrl}/api/reverso/schema/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(target.apiKey ? { 'X-API-Key': target.apiKey } : {}),
      },
      body: JSON.stringify({ schema, deleteRemoved: true }),
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: 'unauthorized' };
    }
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
    if (res.ok && data.success === true) return { ok: true };
    return { ok: false, reason: 'error', detail: data.message ?? `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, reason: 'unreachable', detail: error instanceof Error ? error.message : String(error) };
  }
}

function reportSync(outcome: SyncOutcome, target: SyncTarget): void {
  if (outcome.ok) {
    console.log(chalk.green(`  Schema synced to ${target.apiUrl}`));
    return;
  }
  switch (outcome.reason) {
    case 'unreachable':
      console.log(chalk.gray(`  No Reverso server at ${target.apiUrl} (start one with "reverso dev" to sync).`));
      break;
    case 'unauthorized':
      console.log(chalk.yellow(`  Server at ${target.apiUrl} rejected the sync: missing or invalid API key.`));
      console.log(chalk.gray('  Pass --api-key, set REVERSO_API_KEY, or run "reverso dev" in this project.'));
      break;
    default:
      console.log(chalk.yellow(`  Schema sync failed: ${outcome.detail ?? 'unknown error'}`));
  }
}

interface CliScanOptions {
  src?: string;
  output?: string;
  watch: boolean;
  verbose: boolean;
  include?: string[];
  exclude?: string[];
  apiUrl?: string;
  apiKey?: string;
}

export function scanCommand(program: Command): void {
  program
    .command('scan')
    .description('Scan project for data-reverso markers and generate schema')
    .option('-s, --src <dir>', 'Source directory to scan')
    .option('-o, --output <dir>', 'Output directory for schema (default: reverso.config outputDir)')
    .option('-w, --watch', 'Watch for changes', false)
    .option('-v, --verbose', 'Verbose output', false)
    .option('--include <patterns...>', 'Glob patterns to include (default: reverso.config scanner.include)')
    .option('--exclude <patterns...>', 'Glob patterns to exclude (default: reverso.config scanner.exclude)')
    .option('--api-url <url>', 'Reverso server to sync the schema to (default: local reverso dev)')
    .option('--api-key <key>', 'API key for the server (default: REVERSO_API_KEY or the running reverso dev)')
    .action(async (options: CliScanOptions) => {
      const spinner = ora();

      // Flags override env, env overrides reverso.config, config overrides defaults.
      const runtime = await resolveRuntimeConfig(process.cwd(), {
        src: options.src,
        output: options.output,
        include: options.include,
        exclude: options.exclude,
      });
      for (const warning of runtime.warnings) {
        console.log(chalk.yellow(`Warning: ${warning}`));
      }
      const srcDir = runtime.srcDir;
      const syncTarget = resolveSyncTarget(process.cwd(), options, runtime.port);

      try {
        if (options.watch) {
          // Watch mode uses ScannerOptions
          const scannerOptions: ScannerOptions = {
            srcDir,
            outputDir: runtime.outputDir,
            include: runtime.include,
            exclude: runtime.exclude,
          };

          console.log(chalk.blue('Starting scanner in watch mode...'));
          console.log(chalk.gray(`  Source: ${srcDir}`));
          console.log(chalk.gray(`  Output: ${runtime.outputDir}`));
          console.log();

          const scanner = createScanner(scannerOptions);

          scanner.on(async (event) => {
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
                  reportSync(await syncSchemaToServer(event.schema, syncTarget), syncTarget);
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
          // One-time scan through the same scanner as watch mode so outputDir
          // and the include/exclude patterns from reverso.config are honoured.
          spinner.start('Scanning for data-reverso markers...');

          const result = await createScanner({
            srcDir,
            outputDir: runtime.outputDir,
            include: runtime.include,
            exclude: runtime.exclude,
          }).scan();

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
          } else {
            // Auto-sync to the configured Reverso server
            console.log();
            reportSync(await syncSchemaToServer(result.schema, syncTarget), syncTarget);
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Scan failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
