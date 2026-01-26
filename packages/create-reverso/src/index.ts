/**
 * create-reverso
 *
 * CLI installer for Reverso CMS - The front-to-back CMS.
 * Run with: npx create-reverso@latest
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';

export const VERSION = '0.0.0';

interface ProjectConfig {
  projectName: string;
  framework: 'nextjs' | 'vite' | 'astro';
  database: 'sqlite' | 'postgres';
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  typescript: boolean;
  git: boolean;
  install: boolean;
}

/**
 * Main entry point for the create-reverso CLI.
 */
export async function createReverso(): Promise<void> {
  console.log();
  console.log(chalk.bold.blue('  ╭─────────────────────────────────────╮'));
  console.log(chalk.bold.blue('  │                                     │'));
  console.log(chalk.bold.blue('  │  ') + chalk.bold.white('Reverso CMS') + chalk.bold.blue('                       │'));
  console.log(chalk.bold.blue('  │  ') + chalk.gray('The front-to-back headless CMS') + chalk.bold.blue('  │'));
  console.log(chalk.bold.blue('  │                                     │'));
  console.log(chalk.bold.blue('  ╰─────────────────────────────────────╯'));
  console.log();

  // Get project configuration from user
  const config = await promptConfig();
  if (!config) {
    console.log(chalk.gray('Setup cancelled.'));
    return;
  }

  // Create the project
  await createProject(config);

  // Print success message
  printSuccessMessage(config);
}

/**
 * Prompt user for project configuration.
 */
async function promptConfig(): Promise<ProjectConfig | null> {
  const response = await prompts(
    [
      {
        type: 'text',
        name: 'projectName',
        message: 'Project name:',
        initial: 'my-reverso-app',
        validate: (value: string) => {
          if (!value) return 'Project name is required';
          if (!/^[a-z0-9-]+$/.test(value)) {
            return 'Project name can only contain lowercase letters, numbers, and hyphens';
          }
          return true;
        },
      },
      {
        type: 'select',
        name: 'framework',
        message: 'Framework:',
        choices: [
          { title: 'Next.js', value: 'nextjs', description: 'React framework with SSR/SSG' },
          { title: 'Vite + React', value: 'vite', description: 'Fast build tool with React' },
          { title: 'Astro', value: 'astro', description: 'Content-focused static site builder' },
        ],
        initial: 0,
      },
      {
        type: 'select',
        name: 'database',
        message: 'Database:',
        choices: [
          { title: 'SQLite', value: 'sqlite', description: 'Simple file-based database (great for development)' },
          { title: 'PostgreSQL', value: 'postgres', description: 'Production-ready relational database' },
        ],
        initial: 0,
      },
      {
        type: 'select',
        name: 'packageManager',
        message: 'Package manager:',
        choices: [
          { title: 'pnpm', value: 'pnpm', description: 'Fast, disk space efficient' },
          { title: 'npm', value: 'npm', description: 'Default Node.js package manager' },
          { title: 'yarn', value: 'yarn', description: 'Classic Yarn' },
          { title: 'bun', value: 'bun', description: 'Fast all-in-one JavaScript runtime' },
        ],
        initial: 0,
      },
      {
        type: 'confirm',
        name: 'typescript',
        message: 'Use TypeScript?',
        initial: true,
      },
      {
        type: 'confirm',
        name: 'git',
        message: 'Initialize git repository?',
        initial: true,
      },
      {
        type: 'confirm',
        name: 'install',
        message: 'Install dependencies?',
        initial: true,
      },
    ],
    {
      onCancel: () => {
        return false;
      },
    }
  );

  // Check if user cancelled
  if (!response.projectName) {
    return null;
  }

  return response as ProjectConfig;
}

/**
 * Create the project with the given configuration.
 */
async function createProject(config: ProjectConfig): Promise<void> {
  const spinner = ora();
  const projectPath = resolve(config.projectName);

  // Check if directory already exists
  if (existsSync(projectPath)) {
    console.log(chalk.red(`Error: Directory "${config.projectName}" already exists.`));
    process.exit(1);
  }

  // Create project directory
  spinner.start('Creating project directory...');
  mkdirSync(projectPath, { recursive: true });
  mkdirSync(join(projectPath, 'src'), { recursive: true });
  mkdirSync(join(projectPath, 'src', 'components'), { recursive: true });
  mkdirSync(join(projectPath, '.reverso'), { recursive: true });
  spinner.succeed('Project directory created');

  // Generate files
  spinner.start('Generating project files...');

  // package.json
  writeFileSync(
    join(projectPath, 'package.json'),
    generatePackageJson(config)
  );

  // TypeScript config
  if (config.typescript) {
    writeFileSync(
      join(projectPath, 'tsconfig.json'),
      generateTsConfig(config)
    );
  }

  // Reverso config
  writeFileSync(
    join(projectPath, `reverso.config.${config.typescript ? 'ts' : 'js'}`),
    generateReversoConfig(config)
  );

  // .gitignore
  writeFileSync(
    join(projectPath, '.gitignore'),
    generateGitignore()
  );

  // Example component
  writeFileSync(
    join(projectPath, 'src', 'components', `Hero.${config.typescript ? 'tsx' : 'jsx'}`),
    generateExampleComponent(config)
  );

  // Framework-specific files
  if (config.framework === 'nextjs') {
    generateNextJsFiles(projectPath, config);
  } else if (config.framework === 'vite') {
    generateViteFiles(projectPath, config);
  } else if (config.framework === 'astro') {
    generateAstroFiles(projectPath, config);
  }

  spinner.succeed('Project files generated');

  // Initialize git
  if (config.git) {
    spinner.start('Initializing git repository...');
    try {
      execSync('git init', { cwd: projectPath, stdio: 'ignore' });
      spinner.succeed('Git repository initialized');
    } catch {
      spinner.warn('Failed to initialize git repository');
    }
  }

  // Install dependencies
  if (config.install) {
    spinner.start(`Installing dependencies with ${config.packageManager}...`);
    try {
      const installCmd = getInstallCommand(config.packageManager);
      execSync(installCmd, { cwd: projectPath, stdio: 'ignore' });
      spinner.succeed('Dependencies installed');
    } catch {
      spinner.warn('Failed to install dependencies. Run install manually.');
    }
  }
}

/**
 * Generate package.json content.
 */
function generatePackageJson(config: ProjectConfig): string {
  const deps: Record<string, string> = {
    '@reverso/cli': '^0.0.0',
    react: '^18.3.1',
    'react-dom': '^18.3.1',
  };

  const devDeps: Record<string, string> = {};

  if (config.typescript) {
    devDeps.typescript = '^5.4.0';
    devDeps['@types/react'] = '^18.3.0';
    devDeps['@types/react-dom'] = '^18.3.0';
  }

  // Framework-specific dependencies
  if (config.framework === 'nextjs') {
    deps.next = '^14.2.0';
  } else if (config.framework === 'vite') {
    devDeps.vite = '^5.4.0';
    devDeps['@vitejs/plugin-react'] = '^4.3.0';
  } else if (config.framework === 'astro') {
    deps.astro = '^4.12.0';
    deps['@astrojs/react'] = '^3.6.0';
  }

  const packageJson = {
    name: config.projectName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'reverso dev',
      build: config.framework === 'nextjs' ? 'next build' : config.framework === 'vite' ? 'vite build' : 'astro build',
      start: config.framework === 'nextjs' ? 'next start' : config.framework === 'vite' ? 'vite preview' : 'astro preview',
      scan: 'reverso scan',
      migrate: 'reverso migrate',
    },
    dependencies: deps,
    devDependencies: devDeps,
  };

  return JSON.stringify(packageJson, null, 2);
}

/**
 * Generate TypeScript config.
 */
function generateTsConfig(config: ProjectConfig): string {
  const compilerOptions: Record<string, unknown> = {
    target: 'ES2020',
    useDefineForClassFields: true,
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: 'react-jsx',
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noFallthroughCasesInSwitch: true,
  };

  if (config.framework === 'nextjs') {
    compilerOptions.plugins = [{ name: 'next' }];
    compilerOptions.paths = { '@/*': ['./src/*'] };
  }

  const tsConfig = {
    compilerOptions,
    include: ['src'],
    exclude: ['node_modules'],
  };

  return JSON.stringify(tsConfig, null, 2);
}

/**
 * Generate Reverso config file.
 */
function generateReversoConfig(config: ProjectConfig): string {
  const ext = config.typescript ? 'ts' : 'js';
  const exportType = config.typescript ? 'export default' : 'module.exports =';
  const typeAnnotation = config.typescript ? ': ReversoConfig' : '';
  const typeImport = config.typescript ? "import type { ReversoConfig } from '@reverso/core';\n\n" : '';

  return `${typeImport}${exportType} {
  // Source directory to scan for data-reverso markers
  srcDir: './src',

  // Output directory for generated schema
  outputDir: '.reverso',

  // Database configuration
  database: {
    type: '${config.database}',
    ${config.database === 'sqlite' ? "url: '.reverso/dev.db'" : "url: process.env.DATABASE_URL || 'postgres://localhost:5432/reverso'"},
  },

  // API server configuration
  api: {
    port: 3001,
    cors: true,
  },

  // Admin panel configuration
  admin: {
    title: '${config.projectName}',
  },
}${typeAnnotation};
`;
}

/**
 * Generate .gitignore content.
 */
function generateGitignore(): string {
  return `# Dependencies
node_modules/

# Build output
dist/
.next/
.astro/

# Reverso
.reverso/dev.db
.reverso/dev.db-shm
.reverso/dev.db-wal
.reverso/uploads/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
`;
}

/**
 * Generate example component with Reverso markers.
 */
function generateExampleComponent(config: ProjectConfig): string {
  const props = config.typescript ? ': { className?: string }' : '';

  return `/**
 * Example Hero component with Reverso CMS markers.
 *
 * The data-reverso attribute follows the pattern: page.section.field
 * Example: home.hero.title = page "home", section "hero", field "title"
 */

export function Hero({ className }${props}) {
  return (
    <section className={className}>
      <h1 data-reverso="home.hero.title" data-reverso-type="text">
        Welcome to Your Site
      </h1>

      <p data-reverso="home.hero.subtitle" data-reverso-type="textarea">
        This is an example component with Reverso CMS markers.
        Edit this content in the admin panel.
      </p>

      <img
        data-reverso="home.hero.image"
        data-reverso-type="image"
        src="/placeholder.jpg"
        alt="Hero image"
      />

      <a
        data-reverso="home.hero.cta"
        data-reverso-type="link"
        href="#"
      >
        Get Started
      </a>
    </section>
  );
}
`;
}

/**
 * Generate Next.js specific files.
 */
function generateNextJsFiles(projectPath: string, config: ProjectConfig): void {
  const ext = config.typescript ? 'tsx' : 'jsx';

  // Create app directory
  mkdirSync(join(projectPath, 'src', 'app'), { recursive: true });

  // Layout
  writeFileSync(
    join(projectPath, 'src', 'app', `layout.${ext}`),
    `export default function RootLayout({ children }${config.typescript ? ': { children: React.ReactNode }' : ''}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`
  );

  // Page
  writeFileSync(
    join(projectPath, 'src', 'app', `page.${ext}`),
    `import { Hero } from '@/components/Hero';

export default function HomePage() {
  return (
    <main>
      <Hero />
    </main>
  );
}
`
  );

  // next.config.js
  writeFileSync(
    join(projectPath, 'next.config.js'),
    `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
};

module.exports = nextConfig;
`
  );
}

/**
 * Generate Vite specific files.
 */
function generateViteFiles(projectPath: string, config: ProjectConfig): void {
  const ext = config.typescript ? 'tsx' : 'jsx';

  // vite.config
  writeFileSync(
    join(projectPath, `vite.config.${config.typescript ? 'ts' : 'js'}`),
    `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`
  );

  // index.html
  writeFileSync(
    join(projectPath, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${ext}"></script>
  </body>
</html>
`
  );

  // main.tsx
  writeFileSync(
    join(projectPath, 'src', `main.${ext}`),
    `import React from 'react';
import ReactDOM from 'react-dom/client';
import { Hero } from './components/Hero';

ReactDOM.createRoot(document.getElementById('root')${config.typescript ? '!' : ''}).render(
  <React.StrictMode>
    <main>
      <Hero />
    </main>
  </React.StrictMode>
);
`
  );
}

/**
 * Generate Astro specific files.
 */
function generateAstroFiles(projectPath: string, config: ProjectConfig): void {
  // Create pages directory
  mkdirSync(join(projectPath, 'src', 'pages'), { recursive: true });

  // astro.config.mjs
  writeFileSync(
    join(projectPath, 'astro.config.mjs'),
    `import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
});
`
  );

  // Index page
  writeFileSync(
    join(projectPath, 'src', 'pages', 'index.astro'),
    `---
import { Hero } from '../components/Hero';
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${config.projectName}</title>
  </head>
  <body>
    <main>
      <Hero client:load />
    </main>
  </body>
</html>
`
  );
}

/**
 * Get the install command for the package manager.
 */
function getInstallCommand(packageManager: ProjectConfig['packageManager']): string {
  switch (packageManager) {
    case 'npm':
      return 'npm install';
    case 'pnpm':
      return 'pnpm install';
    case 'yarn':
      return 'yarn';
    case 'bun':
      return 'bun install';
  }
}

/**
 * Print success message with next steps.
 */
function printSuccessMessage(config: ProjectConfig): void {
  console.log();
  console.log(chalk.green.bold('✓ Project created successfully!'));
  console.log();
  console.log(chalk.bold('Next steps:'));
  console.log();
  console.log(chalk.gray('  1. ') + chalk.white(`cd ${config.projectName}`));
  if (!config.install) {
    console.log(chalk.gray('  2. ') + chalk.white(`${config.packageManager} install`));
    console.log(chalk.gray('  3. ') + chalk.white(`${config.packageManager} run dev`));
  } else {
    console.log(chalk.gray('  2. ') + chalk.white(`${config.packageManager} run dev`));
  }
  console.log();
  console.log(chalk.gray('This will:'));
  console.log(chalk.gray('  • Scan your components for data-reverso markers'));
  console.log(chalk.gray('  • Start the API server'));
  console.log(chalk.gray('  • Open the admin panel'));
  console.log();
  console.log(chalk.bold('Documentation: ') + chalk.blue('https://reverso.dev/docs'));
  console.log();
}
