/**
 * Init command - initialize Reverso in an existing project.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { hostname } from 'node:os';
import { showBanner, showSuccess, showTip } from '../ui/index.js';

const CONFIG_TEMPLATE = `import { defineConfig } from '@reverso/core';

export default defineConfig({
  // Source directory to scan for data-reverso markers
  srcDir: './src',

  // Output directory for generated files
  outputDir: '.reverso',

  // Database configuration
  database: {
    type: 'sqlite',
    url: '.reverso/dev.db',
  },

  // API server configuration
  api: {
    port: 4000,
    cors: true,
  },
});
`;

const EXAMPLE_COMPONENT = `// Example component with Reverso markers
// Add data-reverso attributes to make content editable

export function Hero() {
  return (
    <section className="hero">
      <h1 data-reverso="home.hero.title" data-reverso-type="text">
        Welcome to My Site
      </h1>
      <p data-reverso="home.hero.subtitle" data-reverso-type="textarea">
        This content can be edited in the Reverso admin panel.
      </p>
      <img
        data-reverso="home.hero.image"
        data-reverso-type="image"
        src="/placeholder.jpg"
        alt="Hero image"
      />
    </section>
  );
}
`;

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
    case 'bun':
      return `bun add ${pkgList}`;
    case 'pnpm':
      return `pnpm add ${pkgList}`;
    case 'yarn':
      return `yarn add ${pkgList}`;
    default:
      return `npm install ${pkgList}`;
  }
}


export function initCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize Reverso in an existing project')
    .option('-f, --force', 'Overwrite existing configuration', false)
    .option('--example', 'Create an example component with markers', false)
    .option('-y, --yes', 'Skip prompts and use defaults', false)
    .action(async (options: { force: boolean; example: boolean; yes: boolean }) => {
      const spinner = ora();

      // Show branded banner
      showBanner({ version: '0.1.9' });

      console.log(chalk.blue.bold('Initializing Reverso CMS...'));
      console.log();

      // Verify current directory exists
      let cwd: string;
      try {
        cwd = process.cwd();
      } catch {
        console.log(chalk.red('Error: Current directory does not exist.'));
        console.log(chalk.gray('  Please navigate to a valid directory and try again.'));
        process.exit(1);
      }

      // Check if package.json exists
      const packageJsonPath = resolve(cwd, 'package.json');
      if (!existsSync(packageJsonPath)) {
        console.log(chalk.red('Error: No package.json found.'));
        console.log(chalk.gray('  Please run this command in a Node.js project directory.'));
        console.log(chalk.gray('  Or create a new project with: npx create-reverso@latest'));
        process.exit(1);
      }

      const configPath = resolve(cwd, 'reverso.config.ts');
      const configPathJs = resolve(cwd, 'reverso.config.js');

      // Check if config already exists
      if (!options.force && (existsSync(configPath) || existsSync(configPathJs))) {
        console.log(chalk.yellow('Configuration file already exists.'));
        console.log(chalk.gray('  Use --force to overwrite.'));
        console.log();
        return;
      }

      // Detect package manager
      const packageManager = detectPackageManager(cwd);
      console.log(chalk.gray(`Detected package manager: ${packageManager}`));
      console.log();

      // Create config file
      spinner.start('Creating configuration file...');
      try {
        writeFileSync(configPath, CONFIG_TEMPLATE);
        spinner.succeed(`Created ${chalk.cyan('reverso.config.ts')}`);
      } catch {
        spinner.fail('Failed to create configuration file');
        return;
      }

      // Create .reverso directory
      spinner.start('Creating .reverso directory...');
      try {
        const reversoDir = resolve(cwd, '.reverso');
        if (!existsSync(reversoDir)) {
          mkdirSync(reversoDir, { recursive: true });
        }
        spinner.succeed(`Created ${chalk.cyan('.reverso/')} directory`);
      } catch {
        spinner.fail('Failed to create .reverso directory');
      }

      // Create example component if requested
      if (options.example) {
        spinner.start('Creating example component...');
        try {
          const srcDir = resolve(cwd, 'src');
          const componentsDir = join(srcDir, 'components');

          if (!existsSync(componentsDir)) {
            mkdirSync(componentsDir, { recursive: true });
          }

          const examplePath = join(componentsDir, 'Hero.tsx');
          if (!existsSync(examplePath) || options.force) {
            writeFileSync(examplePath, EXAMPLE_COMPONENT);
            spinner.succeed(`Created ${chalk.cyan('src/components/Hero.tsx')}`);
          } else {
            spinner.info('Example component already exists, skipping');
          }
        } catch {
          spinner.fail('Failed to create example component');
        }
      }

      // Add to .gitignore if it exists
      spinner.start('Updating .gitignore...');
      try {
        const gitignorePath = resolve(cwd, '.gitignore');
        if (existsSync(gitignorePath)) {
          const { readFileSync, appendFileSync } = await import('node:fs');
          const content = readFileSync(gitignorePath, 'utf-8');
          if (!content.includes('.reverso')) {
            const additions = '\n# Reverso\n.reverso/\n';
            appendFileSync(gitignorePath, additions);
            spinner.succeed('Added .reverso/ to .gitignore');
          } else {
            spinner.info('.reverso/ already in .gitignore');
          }
        } else {
          spinner.info('No .gitignore found, skipping');
        }
      } catch {
        spinner.info('Could not update .gitignore');
      }

      console.log();

      // Admin account setup
      console.log(chalk.bold('Admin Account Setup'));
      console.log();

      const adminAnswers = await prompts([
        {
          type: 'text',
          name: 'name',
          message: 'Admin name',
          initial: 'Admin',
        },
        {
          type: 'text',
          name: 'email',
          message: 'Admin email',
          initial: `admin@${hostname() || 'localhost'}`,
          validate: (value: string) => value.includes('@') ? true : 'Invalid email',
        },
        {
          type: 'password',
          name: 'password',
          message: 'Admin password (min 8 characters)',
          validate: (value: string) => value.length >= 8 ? true : 'Password must be at least 8 characters',
        },
      ], {
        onSubmit: () => {
          // Clear line after prompt for cleaner output
          console.log('');
        }
      });

      if (!adminAnswers.name || !adminAnswers.email || !adminAnswers.password) {
        console.log(chalk.red('Admin setup cancelled.'));
        process.exit(1);
      }

      // Save admin credentials for dev server
      spinner.start('Saving admin credentials...');
      try {
        const adminConfigPath = resolve(cwd, '.reverso/admin.json');
        writeFileSync(adminConfigPath, JSON.stringify({
          name: adminAnswers.name,
          email: adminAnswers.email,
          password: adminAnswers.password,
        }, null, 2));
        spinner.succeed('Admin credentials saved');
      } catch {
        spinner.warn('Could not save admin credentials');
      }

      console.log();

      // Install dependencies
      const installDeps = options.yes || (await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Install Reverso dependencies?',
        initial: true,
      })).value;

      if (installDeps) {
        console.log();
        spinner.start('Installing dependencies...');
        const installCmd = getInstallCommand(packageManager, [
          '@reverso/core',
          '@reverso/cli',
          '@reverso/db',
          '@reverso/scanner',
          '@reverso/api'
        ]);
        spinner.text = `Running: ${chalk.gray(installCmd)}`;

        try {
          execSync(installCmd, { cwd, stdio: 'pipe' });
          spinner.succeed('Dependencies installed');

          // Rebuild native modules using node-gyp directly
          spinner.start('Building native modules (better-sqlite3)...');
          try {
            const findCmd = 'find node_modules -path "*/better-sqlite3/binding.gyp" -type f 2>/dev/null | head -1';
            const bindingPath = execSync(findCmd, { cwd, encoding: 'utf-8' }).trim();

            if (bindingPath) {
              const betterSqliteDir = bindingPath.replace('/binding.gyp', '');
              execSync('npx node-gyp rebuild', {
                cwd: resolve(cwd, betterSqliteDir),
                stdio: 'pipe',
              });
              spinner.succeed('Native modules built');
            } else {
              spinner.info('Native modules not found');
            }
          } catch {
            spinner.warn('Native module build failed - will retry before starting dev');
          }
        } catch {
          spinner.fail('Failed to install dependencies');
          console.log(chalk.gray('  You can install manually:'));
          console.log(chalk.cyan(`  ${installCmd}`));
        }
      }

      // Show success message
      console.log();
      showSuccess('Reverso initialized successfully!', [
        `${chalk.cyan('Config:')} reverso.config.ts`,
        `${chalk.cyan('Output:')} .reverso/`,
      ]);

      // Ask about scanning
      const runScan = options.yes || (await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Scan your project for data-reverso markers now?',
        initial: true,
      })).value;

      if (runScan) {
        console.log();
        spinner.start('Scanning project...');

        try {
          execSync('npx reverso scan', { cwd, stdio: 'pipe' });
          spinner.succeed('Project scanned');
        } catch {
          spinner.warn('No markers found yet. Add data-reverso attributes to your components.');
        }

        // Ask about starting dev server
        const startDev = options.yes || (await prompts({
          type: 'confirm',
          name: 'value',
          message: 'Start the development server?',
          initial: true,
        })).value;

        if (startDev) {
          // Rebuild native modules before starting dev using node-gyp directly
          spinner.start('Building native modules (better-sqlite3)...');
          try {
            // Find better-sqlite3 location and rebuild with node-gyp
            const findCmd = 'find node_modules -path "*/better-sqlite3/binding.gyp" -type f 2>/dev/null | head -1';
            const bindingPath = execSync(findCmd, { cwd, encoding: 'utf-8' }).trim();

            if (bindingPath) {
              const betterSqliteDir = bindingPath.replace('/binding.gyp', '');
              execSync('npx node-gyp rebuild', {
                cwd: resolve(cwd, betterSqliteDir),
                stdio: 'pipe',
              });
              spinner.succeed('Native modules built');
            } else {
              spinner.info('Native modules not found, skipping rebuild');
            }
          } catch {
            spinner.warn('Native module build failed - may need manual rebuild');
          }

          console.log();
          console.log(chalk.blue.bold('Starting Reverso dev server...'));
          console.log();
          console.log(chalk.gray('  Admin:     ') + chalk.cyan.underline('http://localhost:3001/admin'));
          console.log(chalk.gray('  API:       ') + chalk.cyan.underline('http://localhost:3001/api/reverso'));
          console.log(chalk.gray('  Health:    ') + chalk.cyan.underline('http://localhost:3001/health'));
          console.log();
          showTip('Press Ctrl+C to stop the server');
          console.log();

          // Start dev server directly instead of via npx to avoid cache issues
          const child = spawn(process.execPath, [
            resolve(cwd, 'node_modules/@reverso/cli/dist/bin.js'),
            'dev'
          ], {
            cwd,
            stdio: 'inherit',
          });

          child.on('error', () => {
            console.log(chalk.red('Failed to start dev server'));
          });

          // Keep process running
          process.on('SIGINT', () => {
            child.kill('SIGINT');
            process.exit(0);
          });

          return; // Don't show next steps since we're running dev
        }
      }

      // Show next steps only if not starting dev
      console.log();
      console.log(chalk.bold('Next steps:'));
      console.log();
      console.log(chalk.gray('  1. Add markers to your components:'));
      console.log(chalk.cyan('     <h1 data-reverso="page.section.field" data-reverso-type="text">'));
      console.log();
      console.log(chalk.gray('  2. Start the development server:'));
      console.log(chalk.cyan('     npx reverso dev'));
      console.log();
      console.log(chalk.gray('  3. Open the admin panel:'));
      console.log(chalk.cyan('     http://localhost:3001/admin'));
      console.log();
    });
}
