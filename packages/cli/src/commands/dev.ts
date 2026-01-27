/**
 * Dev command - starts development server.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

interface DevOptions {
  port: string;
  host: string;
  database: string;
  src: string;
  open: boolean;
}

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(resolve(cwd, 'bun.lockb'))) return 'bun';
  if (existsSync(resolve(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(resolve(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

function getInstallCommand(pm: PackageManager, packages: string[]): string {
  const pkgList = packages.join(' ');
  switch (pm) {
    case 'bun': return `bun add ${pkgList}`;
    case 'pnpm': return `pnpm add ${pkgList}`;
    case 'yarn': return `yarn add ${pkgList}`;
    default: return `npm install ${pkgList}`;
  }
}

async function rebuildNativeModules(spinner: ReturnType<typeof ora>): Promise<boolean> {
  const cwd = process.cwd();
  const pm = detectPackageManager(cwd);

  spinner.start('Rebuilding native modules (better-sqlite3)...');

  try {
    const rebuildCmd = pm === 'yarn'
      ? 'yarn rebuild better-sqlite3'
      : pm === 'bun'
        ? 'bun rebuild'
        : `${pm} rebuild better-sqlite3`;

    execSync(rebuildCmd, { cwd, stdio: 'pipe' });
    spinner.succeed('Native modules rebuilt');
    return true;
  } catch {
    spinner.fail('Failed to rebuild native modules');
    return false;
  }
}

async function installMissingDependencies(spinner: ReturnType<typeof ora>, packages: string[]): Promise<boolean> {
  const cwd = process.cwd();
  const pm = detectPackageManager(cwd);

  spinner.start(`Installing missing dependencies: ${packages.join(', ')}...`);

  try {
    const installCmd = getInstallCommand(pm, packages);
    execSync(installCmd, { cwd, stdio: 'pipe' });
    spinner.succeed('Dependencies installed');

    // Also rebuild native modules after install
    spinner.start('Building native modules...');
    try {
      const rebuildCmd = pm === 'npm' ? 'npm rebuild' : `${pm} rebuild`;
      execSync(rebuildCmd, { cwd, stdio: 'pipe' });
      spinner.succeed('Native modules built');
    } catch {
      // Ignore rebuild errors here, will catch later if needed
    }

    return true;
  } catch {
    spinner.fail('Failed to install dependencies');
    return false;
  }
}

function isPortInUse(port: number): Promise<boolean> {
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

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (await isPortInUse(port) && port < startPort + 100) {
    port++;
  }
  return port;
}

export function devCommand(program: Command): void {
  program
    .command('dev')
    .description('Start development server (API + Admin)')
    .option('-p, --port <port>', 'API server port', '3001')
    .option('-H, --host <host>', 'Server host', 'localhost')
    .option('-d, --database <path>', 'Database file path', '.reverso/dev.db')
    .option('-s, --src <dir>', 'Source directory to watch', './src')
    .option('--open', 'Open admin panel in browser', false)
    .action(async (options: DevOptions) => {
      const spinner = ora();
      const cwd = process.cwd();
      let didRebuild = false;
      let didInstall = false;

      // Pre-flight checks
      console.log(chalk.blue('Starting Reverso development server...'));
      console.log();

      // Check 1: Config file exists
      const configPath = resolve(cwd, 'reverso.config.ts');
      const configPathJs = resolve(cwd, 'reverso.config.js');
      if (!existsSync(configPath) && !existsSync(configPathJs)) {
        console.log(chalk.yellow('No reverso.config found. Running init first...'));
        console.log();
        try {
          execSync('npx @reverso/cli init --yes', { cwd, stdio: 'inherit' });
          return; // init will handle everything
        } catch {
          console.log(chalk.red('Failed to initialize. Run: npx @reverso/cli init'));
          process.exit(1);
        }
      }

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
      let port = parseInt(options.port, 10);
      if (await isPortInUse(port)) {
        spinner.start(`Port ${port} is in use, finding available port...`);
        port = await findAvailablePort(port);
        spinner.succeed(`Using port ${port}`);
      }

      const startServer = async (): Promise<void> => {
        const dbPath = resolve(options.database);

        // Ensure database directory exists
        const dbDir = dirname(dbPath);
        if (!existsSync(dbDir)) {
          mkdirSync(dbDir, { recursive: true });
        }

        // Create database if needed
        spinner.start('Initializing database...');
        const { createDatabaseSchema } = await import('@reverso/db');
        await createDatabaseSchema(dbPath);
        spinner.succeed('Database initialized');

        // Start scanner in watch mode
        spinner.start('Starting file scanner...');
        const { createScanner } = await import('@reverso/scanner');
        const scanner = createScanner({
          srcDir: options.src,
          outputDir: '.reverso',
        });

        // Initial scan
        await scanner.scan();
        spinner.succeed('Initial scan complete');

        // Start watch mode in background
        scanner.on((event) => {
          if (event.type === 'complete' && event.schema) {
            console.log(chalk.gray(`[scanner] Schema updated: ${event.schema.totalFields} fields`));
          }
        });
        scanner.startWatch();

        // Start API server
        spinner.start('Starting API server...');
        const { createApiServer, startServer: startApiServer } = await import('@reverso/api');

        const server = await createApiServer({
          port,
          host: options.host,
          databaseUrl: dbPath,
          cors: true,
          logger: false,
        });

        await startApiServer(server);
        spinner.succeed(`API server running at http://${options.host}:${port}`);

        console.log();
        console.log(chalk.green.bold('Development server ready!'));
        console.log();
        console.log(chalk.bold('Endpoints:'));
        console.log(chalk.gray(`  API:     http://${options.host}:${port}/api/reverso`));
        console.log(chalk.gray(`  Health:  http://${options.host}:${port}/health`));
        console.log();
        console.log(chalk.yellow('Press Ctrl+C to stop'));

        // Open browser if requested
        if (options.open) {
          const { spawn } = await import('node:child_process');

          // Validate host to prevent command injection
          const safeHost = /^[a-zA-Z0-9.-]+$/.test(options.host) ? options.host : 'localhost';
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
          const missingPkgMatch = errorMsg.match(/Cannot find (?:package|module) ['"]?(@?[^'"\/\s]+(?:\/[^'"\/\s]+)?)/);
          const missingPackages: string[] = [];

          if (missingPkgMatch && missingPkgMatch[1]) {
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
