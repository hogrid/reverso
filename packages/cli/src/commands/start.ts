/**
 * Start command - starts the production server (API + admin).
 *
 * Settings come from flags, then environment (REVERSO_PORT, REVERSO_HOST,
 * REVERSO_DB_PATH), then reverso.config.ts, exactly like `reverso dev`, so the
 * database prepared by `reverso build` or edited during development is the one
 * served here.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'node:fs';
import { corsOption, resolveRuntimeConfig } from '../runtime-config.js';

interface StartOptions {
  port?: string;
  host?: string;
  database?: string;
}

export function startCommand(program: Command): void {
  program
    .command('start')
    .description('Start the production server')
    .option('-p, --port <port>', 'Server port (default: REVERSO_PORT or reverso.config dev.port)')
    .option('-H, --host <host>', 'Server host (default: REVERSO_HOST or 0.0.0.0)')
    .option('-d, --database <path>', 'Database file path (default: REVERSO_DB_PATH or reverso.config database.url)')
    .action(async (options: StartOptions) => {
      const spinner = ora();

      try {
        const runtime = await resolveRuntimeConfig(process.cwd(), {
          port: options.port,
          // Production binds to every interface unless told otherwise.
          host: options.host ?? process.env.REVERSO_HOST ?? '0.0.0.0',
          database: options.database,
        });
        for (const warning of runtime.warnings) {
          // A missing source dir is irrelevant for `start`; surface the rest.
          if (!warning.startsWith('Source directory')) console.log(chalk.yellow(`Warning: ${warning}`));
        }

        console.log(chalk.blue.bold('Starting Reverso CMS production server...'));
        console.log();
        console.log(chalk.gray(`Database (${runtime.databaseSource}): ${runtime.databasePath}`));
        if (!existsSync(runtime.databasePath)) {
          // A first boot on a fresh volume looks exactly like a mistyped
          // REVERSO_DB_PATH or a volume that failed to mount, so say plainly
          // which path is being created: the content the operator expects is
          // not in it. Claiming the admin account on an empty database is
          // restricted separately (see REVERSO_ALLOW_BOOTSTRAP).
          console.log(chalk.yellow(`Database not found at ${runtime.databasePath}; creating an empty one.`));
          console.log(
            chalk.gray('If this server should already have content, stop it and check the path above.')
          );
          console.log(
            chalk.gray('Run `reverso build` (or `reverso scan --api-url <this server>`) to load the schema.')
          );
          console.log(
            chalk.gray(
              'The first admin can only be created from this machine. Behind a proxy, set REVERSO_ALLOW_BOOTSTRAP=true while you create it.'
            )
          );
        }
        console.log();

        if (!process.env.REVERSO_COOKIE_SECRET) {
          console.log(
            chalk.yellow(
              'Warning: REVERSO_COOKIE_SECRET is not set. Set it in production (openssl rand -hex 32).'
            )
          );
        }
        if (!process.env.REVERSO_API_KEY) {
          console.log(
            chalk.gray('Info: REVERSO_API_KEY not set; `reverso scan --api-url` cannot sync to this server.')
          );
        }

        // createApiServer applies pending migrations, opens the database and
        // registers every route (auth included); nothing else must register
        // routes on this instance or Fastify rejects the duplicates.
        spinner.start('Starting server...');
        const { createApiServer, startServer } = await import('@reverso/api');

        const server = await createApiServer({
          port: runtime.port,
          host: runtime.host,
          databaseUrl: runtime.databasePath,
          cors: corsOption(runtime.config),
          logger: true,
          authEnabled: true,
        });

        const address = await startServer(server);
        spinner.succeed(`Server running at ${address}`);

        console.log();
        console.log(chalk.green.bold('Production server ready!'));
        console.log();
        console.log(chalk.bold('Endpoints:'));
        console.log(chalk.gray(`  Admin:   ${address}/admin`));
        console.log(chalk.gray(`  API:     ${address}/api/reverso`));
        console.log(chalk.gray(`  Health:  ${address}/health`));
        console.log();
        console.log(chalk.gray('Press Ctrl+C to stop'));

        const shutdown = async () => {
          console.log(chalk.gray('\nShutting down gracefully...'));
          await server.close();
          const { closeDatabase } = await import('@reverso/db');
          closeDatabase();
          console.log(chalk.green('Server stopped.'));
          process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      } catch (error) {
        spinner.fail(chalk.red('Failed to start server'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
