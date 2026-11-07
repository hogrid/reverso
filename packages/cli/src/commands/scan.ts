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

export interface Orphaned {
  pages: string[];
  sections: string[];
  fields: string[];
}

export type SyncOutcome =
  | { ok: true; orphaned?: Orphaned }
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
export interface SyncOptions {
  /**
   * Delete pages, sections and fields that are no longer in the schema, with
   * their content. Off by default: a scan that misses a marker (half-typed
   * attribute, file with a syntax error, another branch checked out) must
   * never erase what editors wrote.
   */
  prune?: boolean;
}

export interface PruneDecision {
  prune: boolean;
  /** Why pruning was declined although it was requested. */
  reason?: string;
}

/**
 * Decide whether a sync may delete what is missing from the schema. Pruning
 * is only safe when the scan is complete: never from the watcher (every
 * transient keystroke produces a schema), never when markers were skipped as
 * invalid (a half-typed attribute hides a real field) and never for an empty
 * result (almost always a wrong srcDir).
 */
export function resolvePrune(input: {
  requested: boolean;
  watch: boolean;
  schema: ProjectSchema;
}): PruneDecision {
  if (!input.requested) return { prune: false };
  if (input.watch) {
    return { prune: false, reason: 'pruning is disabled in watch mode; run "reverso scan --prune" once instead' };
  }
  const skipped = input.schema.meta.skippedMarkers ?? 0;
  if (skipped > 0) {
    return {
      prune: false,
      reason: `${skipped} marker(s) were skipped as invalid, so the scan is incomplete; fix them and run again`,
    };
  }
  if (input.schema.totalFields === 0) {
    return { prune: false, reason: 'the scan found no markers; check srcDir before deleting everything' };
  }
  return { prune: true };
}

export async function syncSchemaToServer(
  schema: ProjectSchema,
  target: SyncTarget,
  options: SyncOptions = {}
): Promise<SyncOutcome> {
  try {
    const res = await fetch(`${target.apiUrl}/api/reverso/schema/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(target.apiKey ? { 'X-API-Key': target.apiKey } : {}),
      },
      body: JSON.stringify({ schema, deleteRemoved: options.prune === true }),
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: 'unauthorized' };
    }
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
      data?: { orphaned?: Orphaned };
    };
    if (res.ok && data.success === true) {
      return data.data?.orphaned ? { ok: true, orphaned: data.data.orphaned } : { ok: true };
    }
    return { ok: false, reason: 'error', detail: data.message ?? `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, reason: 'unreachable', detail: error instanceof Error ? error.message : String(error) };
  }
}

/** Human summary of what a prune would delete, or null when nothing is orphaned. */
export function describeOrphaned(orphaned: Orphaned | undefined): string | null {
  if (!orphaned) return null;
  const parts: string[] = [];
  if (orphaned.pages.length) parts.push(`${orphaned.pages.length} page(s): ${orphaned.pages.join(', ')}`);
  if (orphaned.sections.length) parts.push(`${orphaned.sections.length} section(s): ${orphaned.sections.join(', ')}`);
  if (orphaned.fields.length) parts.push(`${orphaned.fields.length} field(s): ${orphaned.fields.join(', ')}`);
  return parts.length ? parts.join('; ') : null;
}

function reportSync(outcome: SyncOutcome, target: SyncTarget): void {
  if (outcome.ok) {
    console.log(chalk.green(`  Schema synced to ${target.apiUrl}`));
    const kept = describeOrphaned(outcome.orphaned);
    if (kept) {
      console.log(chalk.yellow(`  Kept on the server but no longer in your code: ${kept}`));
      console.log(chalk.gray('  Their content is untouched. Run "reverso scan --prune" to delete them.'));
    }
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
  prune: boolean;
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
    .option(
      '--prune',
      'Delete fields that are no longer in your code, together with their content (never done automatically)',
      false
    )
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
                  if (event.schema.totalFields === 0) {
                    // Syncing this would delete every field on the server and
                    // the content attached to it. A scan that suddenly finds
                    // nothing is almost always a wrong srcDir or a moved
                    // folder, so say so instead.
                    console.log(
                      chalk.yellow('  No markers found; skipping sync so existing content is kept.')
                    );
                    console.log(chalk.gray(`  Check that "${srcDir}" is the folder with your markers.`));
                    break;
                  }
                  const decision = resolvePrune({ requested: options.prune, watch: true, schema: event.schema });
                  if (decision.reason) console.log(chalk.yellow(`  Not pruning: ${decision.reason}.`));
                  reportSync(
                    await syncSchemaToServer(event.schema, syncTarget, { prune: decision.prune }),
                    syncTarget
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
          // One-time scan through the same scanner as watch mode so outputDir
          // and the include/exclude patterns from reverso.config are honoured.
          spinner.start('Scanning for data-reverso markers...');

          const result = await createScanner({
            srcDir,
            outputDir: runtime.outputDir,
            include: runtime.include,
            exclude: runtime.exclude,
          }).scan();

          if (!result.success) {
            spinner.fail(chalk.red('Scan failed'));
            for (const error of result.errors) {
              console.error(chalk.red(`  ${error.message}`));
            }
            process.exit(1);
          }

          spinner.succeed(chalk.green('Scan complete!'));

          console.log();
          console.log(chalk.bold('Results:'));
          console.log(chalk.gray(`  Pages: ${result.schema.pages.length}`));
          console.log(chalk.gray(`  Total fields: ${result.schema.totalFields}`));
          console.log(chalk.gray(`  Output: ${runtime.outputDir}/schema.json`));

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
            const decision = resolvePrune({ requested: options.prune, watch: false, schema: result.schema });
            if (decision.reason) console.log(chalk.yellow(`  Not pruning: ${decision.reason}.`));
            reportSync(
              await syncSchemaToServer(result.schema, syncTarget, { prune: decision.prune }),
              syncTarget
            );
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Scan failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
