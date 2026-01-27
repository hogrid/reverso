/**
 * Start command - starts the production server.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

interface StartOptions {
  port: string;
  host: string;
  database: string;
}

export function startCommand(program: Command): void {
  program
    .command('start')
    .description('Start the production server')
    .option('-p, --port <port>', 'Server port', process.env.REVERSO_PORT || '3001')
    .option('-H, --host <host>', 'Server host', process.env.REVERSO_HOST || '0.0.0.0')
    .option('-d, --database <path>', 'Database file path', process.env.REVERSO_DB_PATH || '.reverso/reverso.db')
    .action(async (options: StartOptions) => {
      const spinner = ora();

      try {
        const port = Number.parseInt(options.port, 10);
        const dbPath = resolve(options.database);

        // Validate database exists
        if (!existsSync(dbPath)) {
          console.error(chalk.red(`Database not found: ${dbPath}`));
          console.error(chalk.yellow('Run `reverso build` first to initialize the database.'));
          process.exit(1);
        }

        console.log(chalk.blue.bold('Starting Reverso CMS production server...'));
        console.log();
        console.log(chalk.gray(`Database: ${dbPath}`));
        console.log();

        // Initialize database
        spinner.start('Connecting to database...');
        const { initDatabase } = await import('@reverso/db');
        initDatabase({ url: dbPath });
        spinner.succeed('Database connected');

        // Start API server
        spinner.start('Starting server...');
        const { createApiServer, startServer, registerRoutes } = await import('@reverso/api');

        const server = await createApiServer({
          port,
          host: options.host,
          databaseUrl: dbPath,
          cors: true,
          logger: true,
        });

        // Register routes with database
        await registerRoutes(server);

        const address = await startServer(server);
        spinner.succeed(`Server running at ${address}`);

        console.log();
        console.log(chalk.green.bold('Production server ready!'));
        console.log();
        console.log(chalk.bold('Endpoints:'));
        console.log(chalk.gray(`  API:     ${address}/api/reverso`));
        console.log(chalk.gray(`  Health:  ${address}/health`));
        console.log(chalk.gray(`  Auth:    ${address}/auth/login`));
        console.log();

        // Log security reminders in production
        if (process.env.NODE_ENV === 'production') {
          if (!process.env.REVERSO_COOKIE_SECRET) {
            console.log(chalk.yellow('Warning: REVERSO_COOKIE_SECRET not set. Using development fallback.'));
          }
          if (!process.env.REVERSO_API_KEY) {
            console.log(chalk.yellow('Info: No API key configured. Only session auth available.'));
          }
        }

        console.log(chalk.gray('Press Ctrl+C to stop'));

        // Handle shutdown
        const shutdown = async () => {
          console.log(chalk.gray('\nShutting down gracefully...'));
          await server.close();
          const { closeDatabase } = await import('@reverso/db');
          await closeDatabase();
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
