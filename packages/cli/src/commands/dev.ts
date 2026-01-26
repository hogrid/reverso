/**
 * Dev command - starts development server.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'node:path';

interface DevOptions {
  port: string;
  host: string;
  database: string;
  src: string;
  open: boolean;
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

      try {
        const port = parseInt(options.port, 10);
        const dbPath = resolve(options.database);

        console.log(chalk.blue('Starting Reverso development server...'));
        console.log();

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
        const { createApiServer, startServer } = await import('@reverso/api');

        const server = await createApiServer({
          port,
          host: options.host,
          databaseUrl: dbPath,
          cors: true,
          logger: false,
        });

        await startServer(server);
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
          const { exec } = await import('node:child_process');
          const url = `http://${options.host}:${port}`;
          const command =
            process.platform === 'darwin'
              ? `open ${url}`
              : process.platform === 'win32'
                ? `start ${url}`
                : `xdg-open ${url}`;
          exec(command);
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
      } catch (error) {
        spinner.fail(chalk.red('Failed to start development server'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
