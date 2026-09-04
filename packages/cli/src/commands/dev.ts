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
import { corsOption, resolveRuntimeConfig } from '../runtime-config.js';

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
      let port = defaultPort;
      if (await isPortInUse(port)) {
        spinner.start(`Port ${port} is in use, finding available port...`);
        port = await findAvailablePort(port);
        spinner.succeed(`Using port ${port}`);
      }

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
        // `reverso scan` authenticate with this key.
        const apiKey = resolveDevApiKey();
        const devServerFile = resolve(cwd, DEV_SERVER_FILE);
        writeFileSync(
          devServerFile,
          JSON.stringify({ apiUrl: `http://${host}:${port}`, apiKey, pid: process.pid }),
          { mode: 0o600 }
        );
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
        await scanner.scan();
        spinner.succeed('Initial scan complete');

        // Get initial schema for sync after server starts
        const initialSchema = scanner.getSchema();

        // Start watch mode in background — sync schema to DB on every change
        scanner.on(async (event) => {
          if (event.type === 'complete' && event.schema) {
            console.log(chalk.gray(`[scanner] Schema updated: ${event.schema.totalFields} fields`));
            try {
              const res = await fetch(`http://${host}:${port}/api/reverso/schema/sync`, {
                method: 'POST',
                headers: syncHeaders,
                body: JSON.stringify({ schema: event.schema, deleteRemoved: true }),
              });
              if (!res.ok) {
                console.log(chalk.yellow(`[scanner] Schema sync failed (HTTP ${res.status})`));
              }
            } catch {
              // Server might not be ready yet, ignore
            }
          }
        });
        scanner.startWatch();

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
              body: JSON.stringify({ schema: initialSchema, deleteRemoved: true }),
            });
            const syncData = await syncRes.json() as { success?: boolean };
            if (syncData.success) {
              console.log(chalk.green(`  Schema synced: ${initialSchema.totalFields} fields across ${initialSchema.pageCount} page(s)`));
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
          try {
            unlinkSync(devServerFile);
          } catch {
            // Already gone
          }
          process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      };

      try {
        await startServer();
      } catch (error) {
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
