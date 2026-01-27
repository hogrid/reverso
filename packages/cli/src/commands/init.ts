/**
 * Init command - initialize Reverso in an existing project.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

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

export function initCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize Reverso in an existing project')
    .option('-f, --force', 'Overwrite existing configuration', false)
    .option('--example', 'Create an example component with markers', false)
    .action(async (options: { force: boolean; example: boolean }) => {
      const spinner = ora();

      console.log();
      console.log(chalk.blue.bold('Initializing Reverso CMS...'));
      console.log();

      const configPath = resolve('reverso.config.ts');
      const configPathJs = resolve('reverso.config.js');

      // Check if config already exists
      if (!options.force && (existsSync(configPath) || existsSync(configPathJs))) {
        console.log(chalk.yellow('⚠ Configuration file already exists.'));
        console.log(chalk.gray('  Use --force to overwrite.'));
        console.log();
        return;
      }

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
        const reversoDir = resolve('.reverso');
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
          const srcDir = resolve('src');
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
        const gitignorePath = resolve('.gitignore');
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
      console.log(chalk.green.bold('✓ Reverso initialized successfully!'));
      console.log();
      console.log(chalk.bold('Next steps:'));
      console.log();
      console.log(chalk.gray('  1. Install dependencies:'));
      console.log(chalk.cyan('     npm install @reverso/core'));
      console.log();
      console.log(chalk.gray('  2. Add markers to your components:'));
      console.log(chalk.cyan('     <h1 data-reverso="page.section.field" data-reverso-type="text">'));
      console.log();
      console.log(chalk.gray('  3. Scan and start:'));
      console.log(chalk.cyan('     npx reverso scan'));
      console.log(chalk.cyan('     npx reverso dev'));
      console.log();
      console.log(chalk.gray('  4. Open admin panel:'));
      console.log(chalk.cyan('     http://localhost:4000/admin'));
      console.log();
    });
}
