/**
 * Dev command - starts development server.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { corsOption, DEFAULT_PORT, resolveRuntimeConfig } from '../runtime-config.js';
import { describeOrphaned, type Orphaned } from './scan.js';

interface DevOptions {
  port?: string;
  host?: string;
  database?: string;
  src?: string;
  open: boolean;
}

interface AdminCredentials {
  name: string;
  email: string;
  password: string;
}

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(resolve(cwd, 'bun.lockb'))) return 'bun';
  if (existsSync(resolve(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(resolve(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    import('node:net').then(({ createServer }) => {
      const server = createServer();
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      server.once('listening', () => {
        server.close();
        resolve(false);
      });
      server.listen(port);
    });
  });
}

/**
 * Resolve the install command for the detected package manager as a
 * (binary, args) pair so it can be executed with execFileSync (no shell),
 * avoiding interpolation of package names into a shell string.
 */
function getInstallCommand(
  pm: PackageManager,
  packages: string[]
): { cmd: string; args: string[] } {
  switch (pm) {
    case 'bun': return { cmd: 'bun', args: ['add', ...packages] };
    case 'pnpm': return { cmd: 'pnpm', args: ['add', ...packages] };
    case 'yarn': return { cmd: 'yarn', args: ['add', ...packages] };
    default: return { cmd: 'npm', args: ['install', ...packages] };
  }
}

/**
 * Locate the better-sqlite3 binding.gyp directory without spawning a shell.
 * Uses `find` via execFileSync (argument array, no shell interpolation/pipe)
 * and performs the "first match" selection in JS.
 */
function findBetterSqliteDir(cwd: string): string | null {
  try {
    const output = execFileSync(
      'find',
      ['node_modules', '-path', '*/better-sqlite3/binding.gyp', '-type', 'f'],
      { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    const bindingPath = output.split('\n').map((l) => l.trim()).filter(Boolean)[0];
    if (!bindingPath) {
      return null;
    }
    return bindingPath.replace('/binding.gyp', '');
  } catch {
    return null;
  }
}

async function rebuildNativeModules(spinner: ReturnType<typeof ora>): Promise<boolean> {
  const cwd = process.cwd();

  spinner.start('Rebuilding native modules (better-sqlite3)...');

  try {
    // Find better-sqlite3 location and rebuild with node-gyp directly
    const betterSqliteDir = findBetterSqliteDir(cwd);

    if (!betterSqliteDir) {
      spinner.fail('Could not find better-sqlite3 module');
      return false;
    }

    execFileSync('npx', ['node-gyp', 'rebuild'], {
      cwd: resolve(cwd, betterSqliteDir),
      stdio: 'pipe',
    });

    spinner.succeed('Native modules rebuilt');
    return true;
  } catch {
    spinner.fail('Failed to rebuild native modules');
    console.log(chalk.gray('  Try manually: cd node_modules/.pnpm/better-sqlite3*/node_modules/better-sqlite3 && npx node-gyp rebuild'));
    return false;
  }
}

async function installMissingDependencies(spinner: ReturnType<typeof ora>, packages: string[]): Promise<boolean> {
  const cwd = process.cwd();
  const pm = detectPackageManager(cwd);

  spinner.start(`Installing missing dependencies: ${packages.join(', ')}...`);

  try {
    const installCmd = getInstallCommand(pm, packages);
    execFileSync(installCmd.cmd, installCmd.args, { cwd, stdio: 'pipe' });
    spinner.succeed('Dependencies installed');

    // Also rebuild native modules after install using node-gyp
    spinner.start('Building native modules...');
    try {
      const betterSqliteDir = findBetterSqliteDir(cwd);

      if (betterSqliteDir) {
        execFileSync('npx', ['node-gyp', 'rebuild'], {
          cwd: resolve(cwd, betterSqliteDir),
          stdio: 'pipe',
        });
        spinner.succeed('Native modules built');
      }
    } catch {
      // Ignore rebuild errors here, will catch later if needed
    }

    return true;
  } catch {
    spinner.fail('Failed to install dependencies');
    return false;
  }
}

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (await isPortInUse(port) && port < startPort + 100) {
    port++;
  }
  return port;
}

/**
 * Whether the user asked for a specific port (`--port`, `REVERSO_PORT` or
 * `dev.port` in reverso.config). The loaded config is merged with defaults,
 * so a `dev.port` equal to the default is treated as "not set".
 */
export function isExplicitPort(
  flags: { port?: string | number },
  env: Record<string, string | undefined>,
  config: { dev?: { port?: number } }
): boolean {
  if (flags.port !== undefined && String(flags.port).trim() !== '') return true;
  if (env.REVERSO_PORT !== undefined && env.REVERSO_PORT.trim() !== '') return true;
  const configPort = config.dev?.port;
  return configPort !== undefined && configPort !== DEFAULT_PORT;
}

export type PortChoice =
  | { ok: true; port: number; changed: boolean }
  | { ok: false; message: string };

/**
 * Pick the port `reverso dev` listens on. An explicitly requested port is
 * used as-is or the command fails: moving silently would leave the frontend
 * SDK calling the old port and rendering fallbacks. The default port moves to
 * the next free one (the caller warns loudly about it).
 */
export async function choosePort(options: {
  port: number;
  explicit: boolean;
  isPortInUse: (port: number) => Promise<boolean>;
  maxAttempts?: number;
}): Promise<PortChoice> {
  const { port, explicit } = options;
  if (!(await options.isPortInUse(port))) {
    return { ok: true, port, changed: false };
  }
  if (explicit) {
    return {
      ok: false,
      message:
        `Port ${port} is already in use. It was requested explicitly (--port, REVERSO_PORT or dev.port), ` +
        'so Reverso will not pick another one: your frontend would keep calling this port. ' +
        'Stop the process using it or choose a different port.',
    };
  }
  const maxAttempts = options.maxAttempts ?? 100;
  for (let candidate = port + 1; candidate < port + maxAttempts; candidate++) {
    if (!(await options.isPortInUse(candidate))) {
      return { ok: true, port: candidate, changed: true };
    }
  }
  return {
    ok: false,
    message: `Ports ${port}-${port + maxAttempts - 1} are all in use. Pass --port to choose one.`,
  };
}

/** Hint printed when the initial scan finds no markers at all. */
export function noMarkersHint(srcDir: string, include: string[]): string {
  return [
    `No data-reverso markers found in ${srcDir} (include: ${include.join(', ')}).`,
    'The admin will have nothing to edit until the scanner finds some. Check that',
    '"srcDir" (and "include") in reverso.config.ts point at your components, or pass --src,',
    'and mark editable elements like <h1 data-reverso="home.hero.title">Welcome</h1>.',
  ].join('\n');
}

/**
 * File where `reverso dev` records where it listens and its API key, so a
 * `reverso scan` in another terminal can sync to it. Removed on shutdown.
 */
export const DEV_SERVER_FILE = '.reverso/dev-server.json';

/**
 * API key used by the scanner (and `reverso scan` in another terminal) to
 * push schema updates into the running dev server. Uses REVERSO_API_KEY when
 * set, otherwise a random key valid for this session only.
 */
function resolveDevApiKey(): string {
  const fromEnv = process.env.REVERSO_API_KEY;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  return randomBytes(24).toString('hex');
}

/**
 * Read admin credentials from .reverso/admin.json
 */
function readAdminCredentials(cwd: string): AdminCredentials | null {
  try {
    const adminConfigPath = resolve(cwd, '.reverso/admin.json');
    if (!existsSync(adminConfigPath)) {
      return null;
    }
    const content = readFileSync(adminConfigPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function devCommand(program: Command): void {
  program
    .command('dev')
    .description('Start development server (API + Admin)')
    .option('-p, --port <port>', 'API server port (default: reverso.config dev.port or 3001)')
    .option('-H, --host <host>', 'Server host (default: REVERSO_HOST or localhost)')
    .option('-d, --database <path>', 'Database file path (default: reverso.config database.url)')
    .option('-s, --src <dir>', 'Source directory to watch (default: reverso.config srcDir)')
    .option('--open', 'Open admin panel in browser', false)
    .action(async (options: DevOptions) => {
      const spinner = ora();
      const cwd = process.cwd();
      let didRebuild = false;
      let didInstall = false;

      // Pre-flight checks
      console.log(chalk.blue('Starting Reverso development server...'));
      console.log();

      // Check 1: Config file exists (otherwise initialise with this very CLI)
      const configPath = resolve(cwd, 'reverso.config.ts');
      const configPathJs = resolve(cwd, 'reverso.config.js');
      if (!existsSync(configPath) && !existsSync(configPathJs)) {
        console.log(chalk.yellow('No reverso.config found. Running `reverso init --yes` first...'));
        console.log();
        try {
          execFileSync(process.execPath, [process.argv[1] as string, 'init', '--yes'], { cwd, stdio: 'inherit' });
        } catch {
          console.log(chalk.red('Failed to initialize. Run: npx reverso init'));
          process.exit(1);
        }
      }

      // Flags override env, env overrides reverso.config, config overrides defaults.
      const runtime = await resolveRuntimeConfig(cwd, {
        src: options.src,
        database: options.database,
        port: options.port,
        host: options.host,
      });
      for (const warning of runtime.warnings) {
        console.log(chalk.yellow(`Warning: ${warning}`));
      }
      const config = runtime.config;
      const host = runtime.host;
      const srcDir = runtime.srcDir;
      const databasePath = runtime.databasePath;
      const defaultPort = runtime.port;

      // Check 2: Create .reverso directory if needed
      const reversoDir = resolve(cwd, '.reverso');
      if (!existsSync(reversoDir)) {
        spinner.start('Creating .reverso directory...');
        try {
          mkdirSync(reversoDir, { recursive: true });
          spinner.succeed('Created .reverso directory');
        } catch {
          spinner.fail('Failed to create .reverso directory');
          process.exit(1);
        }
      }

      // Check 3: Port availability
      const portChoice = await choosePort({
        port: defaultPort,
        explicit: isExplicitPort(options, process.env, config),
        isPortInUse,
      });
      if (!portChoice.ok) {
        console.log(chalk.red(portChoice.message));
        process.exit(1);
      }
      const port = portChoice.port;
      if (portChoice.changed) {
        const url = `http://${host}:${port}`;
        console.log();
        console.log(chalk.bgYellow.black(` Port ${defaultPort} is in use: the API will run on ${url} `));
        console.log(chalk.yellow('  Your frontend must call this URL, or it will keep rendering fallback content.'));
        console.log(chalk.yellow(`  Set REVERSO_URL=${url} for your frontend (and NEXT_PUBLIC_REVERSO_URL if client components read it),`));
        console.log(chalk.yellow(`  or free port ${defaultPort}, or pin a port with --port / REVERSO_PORT.`));
        console.log();
      }

      const devServerFile = resolve(cwd, DEV_SERVER_FILE);
      const removeDevServerFile = (): void => {
        try {
          unlinkSync(devServerFile);
        } catch {
          // Already gone
        }
      };

      const startServer = async (): Promise<void> => {
        const dbPath = resolve(databasePath);

        // Ensure database directory exists
        const dbDir = dirname(dbPath);
        if (!existsSync(dbDir)) {
          mkdirSync(dbDir, { recursive: true });
        }

        // Read admin credentials for auto-seeding after server starts
        const adminCreds = readAdminCredentials(cwd);

        // Every request to the API is authenticated. The scanner and
        // `reverso scan` authenticate with this key. The key file is written
        // only once the API is listening (see below).
        const apiKey = resolveDevApiKey();
        const syncHeaders = { 'Content-Type': 'application/json', 'X-API-Key': apiKey };

        // Start scanner in watch mode
        spinner.start('Starting file scanner...');
        const { createScanner } = await import('@reverso/scanner');
        const scanner = createScanner({
          srcDir,
          outputDir: runtime.outputDir,
          include: runtime.include,
          exclude: runtime.exclude,
        });

        // Initial scan
        const initialScan = await scanner.scan();
        if (initialScan.success) {
          spinner.succeed('Initial scan complete');
          if (initialScan.schema.totalFields === 0) {
            console.log(chalk.yellow(noMarkersHint(resolve(cwd, srcDir), runtime.include)));
          }
        } else {
          spinner.fail('Initial scan failed');
          for (const error of initialScan.errors) {
            console.log(chalk.yellow(`  ${error.message}`));
          }
          console.log(
            chalk.gray('  The server still starts; existing content is left untouched until a scan succeeds.')
          );
        }

        // Get initial schema for sync after server starts
        const initialSchema = scanner.getSchema();

        // Start watch mode in background — sync schema to DB on every change
        scanner.on(async (event) => {
          if (event.type === 'error') {
            console.log(chalk.yellow(`[scanner] ${event.error?.message ?? 'Scan failed'}`));
            return;
          }
          if (event.type === 'complete' && event.schema) {
            console.log(chalk.gray(`[scanner] Schema updated: ${event.schema.totalFields} fields`));
            if (event.schema.totalFields === 0) {
              // An empty result is nearly always a wrong srcDir; nothing to
              // sync, and nothing is ever deleted from the watcher anyway.
              console.log(
                chalk.yellow('[scanner] No markers found; skipping sync so existing content is kept.')
              );
              return;
            }
            try {
              const res = await fetch(`http://${host}:${port}/api/reverso/schema/sync`, {
                method: 'POST',
                headers: syncHeaders,
                // Never prune from the watcher: a half-typed marker must not delete content.
                body: JSON.stringify({ schema: event.schema, deleteRemoved: false }),
              });
              if (!res.ok) {
                console.log(chalk.yellow(`[scanner] Schema sync failed (HTTP ${res.status})`));
              } else {
                const body = (await res.json().catch(() => ({}))) as { data?: { orphaned?: Orphaned } };
                const kept = describeOrphaned(body.data?.orphaned);
                if (kept) {
                  console.log(chalk.gray(`[scanner] Kept (not in code any more): ${kept}. "reverso scan --prune" deletes them.`));
                }
              }
            } catch {
              // Server might not be ready yet, ignore
            }
          }
        });
        // startWatch repeats the initial scan and then watches; a failure
        // here must be reported, not left as an unhandled rejection that
        // kills the process right after "ready".
        scanner.startWatch().catch((error: unknown) => {
          console.log(
            chalk.yellow(`[scanner] Watch mode failed to start: ${error instanceof Error ? error.message : String(error)}`)
          );
        });

        // Start API server
        spinner.start('Starting API server...');
        const { createApiServer, startServer: startApiServer } = await import('@reverso/api');

        const server = await createApiServer({
          port,
          host: host,
          databaseUrl: dbPath,
          cors: corsOption(config),
          logger: false,
          apiKey,
          authEnabled: true,
        });

        await startApiServer(server);
        spinner.succeed(`API server running at http://${host}:${port}`);

        // Record where the server listens for `reverso scan` in another
        // terminal — only now that it actually listens.
        writeFileSync(
          devServerFile,
          JSON.stringify({ apiUrl: `http://${host}:${port}`, apiKey, pid: process.pid }),
          { mode: 0o600 }
        );

        // Auto-seed admin user from .reverso/admin.json if no users exist
        if (adminCreds) {
          try {
            const setupRes = await fetch(`http://${host}:${port}/auth/setup-status`);
            const setupData = await setupRes.json() as { needsSetup?: boolean };
            if (setupData.needsSetup) {
              const registerRes = await fetch(`http://${host}:${port}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: adminCreds.email,
                  password: adminCreds.password,
                  name: adminCreds.name,
                }),
              });
              const registerData = (await registerRes.json()) as {
                success?: boolean;
                message?: string;
                details?: Array<{ path?: unknown[]; message?: string }>;
              };
              if (registerData.success) {
                // Delete admin.json to avoid leaving plaintext credentials on disk
                try {
                  unlinkSync(resolve(cwd, '.reverso/admin.json'));
                } catch {
                  // Ignore if file can't be deleted
                }
                console.log();
                console.log(chalk.green('  Admin account created and credentials removed from disk'));
                console.log(chalk.gray('  Email:    ') + chalk.cyan(adminCreds.email));
              } else {
                // Never fail silently: the user would open /admin expecting to log in.
                const reason =
                  registerData.details?.map((d) => `${(d.path ?? []).join('.')}: ${d.message}`).join('; ') ||
                  registerData.message ||
                  `HTTP ${registerRes.status}`;
                console.log();
                console.log(chalk.yellow(`  Could not create the admin account from .reverso/admin.json (${reason}).`));
                console.log(chalk.gray('  Fix the credentials in that file, or create the account at /admin/login.'));
              }
            }
          } catch (error) {
            console.log();
            console.log(
              chalk.yellow(
                `  Could not create the admin account automatically: ${error instanceof Error ? error.message : String(error)}`
              )
            );
            console.log(chalk.gray('  You can still create it at /admin/login.'));
          }
        }

        // Sync initial schema to database
        if (initialSchema && initialSchema.totalFields > 0) {
          try {
            const syncRes = await fetch(`http://${host}:${port}/api/reverso/schema/sync`, {
              method: 'POST',
              headers: syncHeaders,
              body: JSON.stringify({ schema: initialSchema, deleteRemoved: false }),
            });
            const syncData = (await syncRes.json()) as { success?: boolean; data?: { orphaned?: Orphaned } };
            if (syncData.success) {
              console.log(chalk.green(`  Schema synced: ${initialSchema.totalFields} fields across ${initialSchema.pageCount} page(s)`));
              const kept = describeOrphaned(syncData.data?.orphaned);
              if (kept) {
                console.log(chalk.yellow(`  Kept on the server but no longer in your code: ${kept}`));
                console.log(chalk.gray('  Their content is untouched. Run "reverso scan --prune" to delete them.'));
              }
            } else {
              console.log(chalk.yellow(`  Schema sync failed (HTTP ${syncRes.status})`));
            }
          } catch (error) {
            console.log(chalk.yellow(`  Schema sync failed: ${error instanceof Error ? error.message : error}`));
          }
        }

        console.log();
        console.log(chalk.green.bold('Development server ready!'));
        console.log();
        console.log(chalk.bold('Endpoints:'));
        console.log(chalk.gray('  Admin:   ') + chalk.cyan.underline(`http://${host}:${port}/admin`));
        console.log(chalk.gray(`  API:     http://${host}:${port}/api/reverso`));
        console.log(chalk.gray(`  Health:  http://${host}:${port}/health`));
        console.log();
        console.log(chalk.yellow('Press Ctrl+C to stop'));

        // Open browser if requested
        if (options.open) {
          const { spawn } = await import('node:child_process');

          // Validate host to prevent command injection
          const safeHost = /^[a-zA-Z0-9.-]+$/.test(host) ? host : 'localhost';
          const safePort = Number.isInteger(port) && port > 0 && port < 65536 ? port : 3001;
          const url = `http://${safeHost}:${safePort}`;

          // Use spawn with separate arguments (no shell) to prevent injection
          const openCommand =
            process.platform === 'darwin'
              ? { cmd: 'open', args: [url] }
              : process.platform === 'win32'
                ? { cmd: 'cmd', args: ['/c', 'start', '', url] }
                : { cmd: 'xdg-open', args: [url] };

          spawn(openCommand.cmd, openCommand.args, {
            detached: true,
            stdio: 'ignore'
          }).unref();
        }

        // Handle shutdown
        const shutdown = async () => {
          console.log(chalk.gray('\nShutting down...'));
          scanner.stopWatch();
          await server.close();
          removeDevServerFile();
          process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      };

      try {
        await startServer();
      } catch (error) {
        // Never leave a key file pointing at a server that isn't running.
        removeDevServerFile();
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorCode = (error as NodeJS.ErrnoException)?.code;

        // Error: Native module not found (better-sqlite3)
        if (errorMsg.includes('Could not locate the bindings file') ||
            errorMsg.includes('better_sqlite3.node') ||
            errorMsg.includes('was compiled against a different Node.js version')) {

          if (!didRebuild) {
            console.log();
            console.log(chalk.yellow('Native module issue detected. Attempting to fix...'));
            console.log();

            didRebuild = true;
            const rebuilt = await rebuildNativeModules(spinner);

            if (rebuilt) {
              console.log();
              console.log(chalk.blue('Retrying server startup...'));
              console.log();

              try {
                await startServer();
                return;
              } catch (retryError) {
                spinner.fail(chalk.red('Failed to start after rebuild'));
                console.error(retryError instanceof Error ? retryError.message : String(retryError));
                process.exit(1);
              }
            }
          }
        }

        // Error: Missing dependencies
        if (errorMsg.includes('Cannot find package') ||
            errorMsg.includes('Cannot find module') ||
            errorCode === 'ERR_MODULE_NOT_FOUND') {

          // Extract package name from error
          const missingPkgMatch = errorMsg.match(/Cannot find (?:package|module) ['"]?(@?[^'"/\s]+(?:\/[^'"/\s]+)?)/);
          const missingPackages: string[] = [];

          if (missingPkgMatch?.[1]) {
            const pkg = missingPkgMatch[1];
            if (pkg.startsWith('@reverso/')) {
              missingPackages.push(pkg);
            }
          }

          // Default to core packages if we can't determine
          if (missingPackages.length === 0) {
            missingPackages.push('@reverso/core', '@reverso/cli', '@reverso/db', '@reverso/scanner', '@reverso/api');
          }

          if (!didInstall) {
            console.log();
            console.log(chalk.yellow('Missing dependencies detected. Installing...'));
            console.log();

            didInstall = true;
            const installed = await installMissingDependencies(spinner, missingPackages);

            if (installed) {
              console.log();
              console.log(chalk.blue('Retrying server startup...'));
              console.log();

              try {
                await startServer();
                return;
              } catch (retryError) {
                spinner.fail(chalk.red('Failed to start after installing dependencies'));
                console.error(retryError instanceof Error ? retryError.message : String(retryError));
                process.exit(1);
              }
            }
          }
        }

        // Error: Port in use (shouldn't happen with our check, but just in case)
        if (errorCode === 'EADDRINUSE' || errorMsg.includes('EADDRINUSE')) {
          console.log();
          console.log(chalk.yellow(`Port ${port} is already in use.`));
          const newPort = await findAvailablePort(port + 1);
          console.log(chalk.blue(`Try running with: reverso dev --port ${newPort}`));
          process.exit(1);
        }

        // Error: Permission denied
        if (errorCode === 'EACCES' || errorMsg.includes('EACCES')) {
          console.log();
          console.log(chalk.red('Permission denied.'));
          console.log(chalk.gray('Try running with elevated permissions or check file permissions.'));
          process.exit(1);
        }

        // Error: Database locked
        if (errorMsg.includes('SQLITE_BUSY') || errorMsg.includes('database is locked')) {
          console.log();
          console.log(chalk.red('Database is locked by another process.'));
          console.log(chalk.gray('Close other Reverso instances and try again.'));
          process.exit(1);
        }

        // Generic error
        spinner.fail(chalk.red('Failed to start development server'));
        console.error(errorMsg);
        console.log();
        console.log(chalk.gray('If this persists, try:'));
        console.log(chalk.cyan('  1. Delete node_modules and reinstall'));
        console.log(chalk.cyan('  2. Run: npx @reverso/cli init --force'));
        console.log(chalk.cyan('  3. Report issue: https://github.com/hogrid/reverso/issues'));
        process.exit(1);
      }
    });
}
