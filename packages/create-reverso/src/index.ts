/**
 * create-reverso
 *
 * CLI installer for Reverso CMS - The front-to-back CMS.
 * Run with: npx create-reverso@latest [project-name] [--yes]
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';

export const VERSION = '0.0.0';

export type Framework = 'nextjs' | 'vite' | 'astro';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface ProjectConfig {
  projectName: string;
  framework: Framework;
  database: 'sqlite' | 'postgres';
  packageManager: PackageManager;
  typescript: boolean;
  git: boolean;
  install: boolean;
}

/** Relative file path → file content. */
export type ProjectFiles = Record<string, string>;

/**
 * Versions of the Reverso packages written into generated projects.
 *
 * They are read from this package's own `dependencies`, which changesets keeps
 * in lock-step with the published packages, so a scaffolded project always
 * pins the same release as the installer that created it.
 */
export function reversoVersions(): { cli: string; core: string; client: string } {
  const fallback = 'latest';
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
      dependencies?: Record<string, string>;
    };
    const deps = pkg.dependencies ?? {};
    const pick = (name: string) => {
      const v = deps[name];
      // workspace:* inside the monorepo → no usable range, use latest.
      return v && !v.startsWith('workspace:') ? v : fallback;
    };
    return {
      cli: pick('@reverso/cli'),
      core: pick('@reverso/core'),
      client: pick('@reverso/client'),
    };
  } catch {
    return { cli: fallback, core: fallback, client: fallback };
  }
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

  // Parse CLI args: optional positional project name + --yes/-y for defaults.
  const argv = process.argv.slice(2);
  const skipPrompts = argv.includes('--yes') || argv.includes('-y');
  const positionalName = argv.find((a) => !a.startsWith('-'));

  const config = skipPrompts ? defaultConfig(positionalName) : await promptConfig(positionalName);
  if (!config) {
    console.log(chalk.gray('Setup cancelled.'));
    return;
  }

  await createProject(config);
  printSuccessMessage(config);
}

/**
 * Default configuration for non-interactive (`--yes`) project creation.
 */
export function defaultConfig(projectName?: string): ProjectConfig {
  return {
    projectName: projectName || 'my-reverso-app',
    framework: 'nextjs',
    database: 'sqlite',
    packageManager: 'npm',
    typescript: true,
    git: true,
    install: true,
  };
}

/**
 * Prompt user for project configuration.
 */
async function promptConfig(initialName?: string): Promise<ProjectConfig | null> {
  const response = await prompts(
    [
      {
        type: 'text',
        name: 'projectName',
        message: 'Project name:',
        initial: initialName || 'my-reverso-app',
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
          { title: 'Next.js', value: 'nextjs', description: 'React framework with server components' },
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
          { title: 'SQLite', value: 'sqlite', description: 'File-based, zero setup (recommended)' },
          { title: 'PostgreSQL', value: 'postgres', description: 'Planned; scaffolds a config you can switch later' },
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
      { type: 'confirm', name: 'typescript', message: 'Use TypeScript?', initial: true },
      { type: 'confirm', name: 'git', message: 'Initialize git repository?', initial: true },
      { type: 'confirm', name: 'install', message: 'Install dependencies?', initial: true },
    ],
    { onCancel: () => false }
  );

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

  if (existsSync(projectPath)) {
    console.log(chalk.red(`Error: Directory "${config.projectName}" already exists.`));
    process.exit(1);
  }

  spinner.start('Generating project files...');
  writeProjectFiles(projectPath, generateProjectFiles(config));
  spinner.succeed('Project files generated');

  if (config.git) {
    spinner.start('Initializing git repository...');
    try {
      execSync('git init', { cwd: projectPath, stdio: 'ignore' });
      spinner.succeed('Git repository initialized');
    } catch {
      spinner.warn('Failed to initialize git repository');
    }
  }

  if (config.install) {
    spinner.start(`Installing dependencies with ${config.packageManager}...`);
    try {
      execSync(getInstallCommand(config.packageManager), { cwd: projectPath, stdio: 'ignore' });
      spinner.succeed('Dependencies installed');
    } catch {
      spinner.warn('Failed to install dependencies. Run install manually.');
    }
  }
}

/** Write every generated file, creating directories as needed. */
export function writeProjectFiles(projectPath: string, files: ProjectFiles): void {
  mkdirSync(join(projectPath, '.reverso'), { recursive: true });
  for (const [relativePath, content] of Object.entries(files)) {
    const target = join(projectPath, relativePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
}

/**
 * Build the full set of files for a project. Pure: no filesystem access, so
 * templates can be unit-tested.
 */
export function generateProjectFiles(config: ProjectConfig): ProjectFiles {
  const ext = config.typescript ? 'tsx' : 'jsx';
  const scriptExt = config.typescript ? 'ts' : 'js';

  const files: ProjectFiles = {
    'package.json': generatePackageJson(config),
    [`reverso.config.${scriptExt}`]: generateReversoConfig(config),
    '.gitignore': generateGitignore(),
    '.env.example': generateEnvExample(config),
    'README.md': generateReadme(config),
    [`src/lib/reverso.${scriptExt}`]: generateClientModule(config),
    [`src/components/Hero.${ext}`]: generateHeroComponent(config),
    [`src/components/Features.${ext}`]: generateFeaturesComponent(config),
    [`src/components/About.${ext}`]: generateAboutComponent(config),
  };

  if (config.typescript) {
    files['tsconfig.json'] = generateTsConfig(config);
  }

  switch (config.framework) {
    case 'nextjs':
      Object.assign(files, generateNextJsFiles(config));
      break;
    case 'vite':
      Object.assign(files, generateViteFiles(config));
      break;
    case 'astro':
      Object.assign(files, generateAstroFiles(config));
      break;
  }

  return files;
}

/** Environment variable each framework exposes to the browser/runtime. */
function apiUrlEnvVar(framework: Framework): string {
  switch (framework) {
    case 'nextjs':
      return 'NEXT_PUBLIC_REVERSO_URL';
    case 'vite':
      return 'VITE_REVERSO_URL';
    case 'astro':
      return 'PUBLIC_REVERSO_URL';
  }
}

/**
 * Generate package.json content.
 */
function generatePackageJson(config: ProjectConfig): string {
  const versions = reversoVersions();

  const deps: Record<string, string> = {
    '@reverso/client': versions.client,
    react: '^19.0.0',
    'react-dom': '^19.0.0',
  };

  const devDeps: Record<string, string> = {
    '@reverso/cli': versions.cli,
    '@reverso/core': versions.core,
  };

  if (config.typescript) {
    devDeps.typescript = '^5.7.0';
    devDeps['@types/node'] = '^22.0.0';
    devDeps['@types/react'] = '^19.0.0';
    devDeps['@types/react-dom'] = '^19.0.0';
  }

  let scripts: Record<string, string>;
  switch (config.framework) {
    case 'nextjs':
      deps.next = '^15.0.0';
      scripts = { dev: 'next dev', build: 'next build', start: 'next start' };
      break;
    case 'vite':
      devDeps.vite = '^6.0.0';
      devDeps['@vitejs/plugin-react'] = '^4.3.0';
      scripts = { dev: 'vite', build: 'vite build', start: 'vite preview' };
      break;
    case 'astro':
      deps.astro = '^5.0.0';
      deps['@astrojs/react'] = '^4.0.0';
      scripts = { dev: 'astro dev', build: 'astro build', start: 'astro preview' };
      break;
  }

  const packageJson = {
    name: config.projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      ...scripts,
      'reverso:dev': 'reverso dev',
      'reverso:scan': 'reverso scan',
      'reverso:build': 'reverso build',
      'reverso:start': 'reverso start',
    },
    dependencies: sortKeys(deps),
    devDependencies: sortKeys(devDeps),
  };

  return `${JSON.stringify(packageJson, null, 2)}\n`;
}

function sortKeys(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Generate TypeScript config.
 */
function generateTsConfig(config: ProjectConfig): string {
  const compilerOptions: Record<string, unknown> = {
    target: 'ES2022',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    moduleResolution: 'bundler',
    jsx: config.framework === 'nextjs' ? 'preserve' : 'react-jsx',
    strict: true,
    skipLibCheck: true,
    esModuleInterop: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    paths: { '@/*': ['./src/*'] },
  };

  const include = ['src'];
  if (config.framework === 'nextjs') {
    compilerOptions.allowJs = true;
    compilerOptions.incremental = true;
    compilerOptions.plugins = [{ name: 'next' }];
    include.push('next-env.d.ts', '.next/types/**/*.ts');
  }
  if (config.framework === 'astro') {
    // Astro ships its own base config; keep ours compatible with it.
    compilerOptions.jsx = 'react-jsx';
    compilerOptions.jsxImportSource = 'react';
  }

  return `${JSON.stringify({ compilerOptions, include, exclude: ['node_modules'] }, null, 2)}\n`;
}

/**
 * Generate Reverso config file.
 */
function generateReversoConfig(config: ProjectConfig): string {
  // ReversoConfig.database.provider is 'sqlite' | 'postgresql' | 'mysql'.
  const provider = config.database === 'postgres' ? 'postgresql' : config.database;
  const dbUrl =
    config.database === 'sqlite'
      ? "url: '.reverso/dev.db'"
      : "url: process.env.DATABASE_URL || 'postgresql://localhost:5432/reverso'";

  const body = `defineConfig({
  name: '${config.projectName}',

  // Source directory to scan for data-reverso markers
  srcDir: './src',

  // Output directory for generated schema and types
  outputDir: '.reverso',

  // Database configuration
  database: {
    provider: '${provider}',
    ${dbUrl},
  },

  // Files to scan for markers
  scanner: {
    include: ['**/*.tsx', '**/*.jsx', '**/*.astro'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
  },

  // API server configuration
  api: {
    cors: true,
  },

  // Development server settings (admin + API)
  dev: {
    port: 3001,
  },
})`;

  if (config.typescript) {
    return `import { defineConfig } from '@reverso/core';\n\nexport default ${body};\n`;
  }
  return `import { defineConfig } from '@reverso/core';\n\nexport default ${body};\n`;
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
next-env.d.ts

# Reverso (generated schema is safe to commit; database, uploads and the
# dev server handshake are not)
.reverso/*.db
.reverso/*.db-shm
.reverso/*.db-wal
.reverso/uploads/
.reverso/dev-server.json
.reverso/admin.json

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

function generateEnvExample(config: ProjectConfig): string {
  return `# URL of the Reverso API + admin started by \`npm run reverso:dev\`
${apiUrlEnvVar(config.framework)}=http://localhost:3001
`;
}

function generateReadme(config: ProjectConfig): string {
  const pm = config.packageManager;
  const run = pm === 'npm' ? 'npm run' : pm;
  return `# ${config.projectName}

A ${frameworkLabel(config.framework)} site whose content is managed by
[Reverso CMS](https://github.com/hogrid/reverso).

Every editable element in \`src/components\` carries a \`data-reverso\` marker.
Reverso scans those markers, builds the admin panel from them, and the
components read the published content back through \`@reverso/client\`.

## Run it

\`\`\`bash
# 1. Admin panel + API (scans markers, watches for changes)
${run} reverso:dev

# 2. In another terminal: the site itself
${run} dev
\`\`\`

Open http://localhost:3001/admin, create the first admin account, edit the
content and save. The site (${devUrl(config.framework)}) renders what you saved;
until then it shows the fallback text written in the components.

## Add a field

Add a marker to any component and save the file:

\`\`\`tsx
<span data-reverso="home.hero.badge" data-reverso-type="text">New</span>
\`\`\`

The field appears in the admin automatically. Read it with
\`page.get('home.hero.badge', 'New')\`.

## Production

\`\`\`bash
${run} reverso:build   # scans markers and prepares .reverso/reverso.db
${run} reverso:start   # serves the API + admin (set REVERSO_COOKIE_SECRET)
\`\`\`
`;
}

function frameworkLabel(framework: Framework): string {
  return framework === 'nextjs' ? 'Next.js' : framework === 'vite' ? 'Vite + React' : 'Astro';
}

function devUrl(framework: Framework): string {
  return framework === 'nextjs'
    ? 'http://localhost:3000'
    : framework === 'vite'
      ? 'http://localhost:5173'
      : 'http://localhost:4321';
}

/**
 * Shared Reverso client module.
 */
function generateClientModule(config: ProjectConfig): string {
  const env = apiUrlEnvVar(config.framework);
  const read =
    config.framework === 'nextjs' ? `process.env.${env}` : `import.meta.env.${env}`;

  return `import { createReversoClient } from '@reverso/client';

/**
 * Shared Reverso content client.
 * Reads published content from the Reverso API started by \`reverso dev\`.
 * When the API is unreachable every helper falls back to the default values
 * passed at the call site, so the site keeps rendering.
 */
export const reverso = createReversoClient({
  url: ${read} ?? 'http://localhost:3001',
});
`;
}

/** How a component obtains its page content, per framework. */
function contentAccess(config: ProjectConfig, slug: string): {
  imports: string;
  signature: (name: string) => string;
  prelude: string;
  clientDirective: string;
} {
  if (config.framework === 'nextjs') {
    // React Server Component: fetch on the server, no client JS.
    return {
      imports: "import { reverso } from '@/lib/reverso';",
      signature: (name) => `export async function ${name}()`,
      prelude: `  const page = await reverso.getPage('${slug}');`,
      clientDirective: '',
    };
  }
  // Vite / Astro islands: fetch in the browser after mount.
  const hookType = config.typescript ? '<ReversoPage | null>' : '';
  return {
    imports: `import { useEffect, useState } from 'react';
import { reverso } from '../lib/reverso';${config.typescript ? "\nimport type { ReversoPage } from '@reverso/client';" : ''}`,
    signature: (name) => `export function ${name}()`,
    prelude: `  const [page, setPage] = useState${hookType}(null);
  useEffect(() => {
    reverso.getPage('${slug}').then(setPage);
  }, []);
  const get = (path${config.typescript ? ': string' : ''}, fallback${config.typescript ? ': string' : ''}) =>
    page ? page.get(path, fallback) : fallback;`,
    clientDirective: '',
  };
}

/** Expression that reads a value with a fallback, per framework. */
function getExpr(config: ProjectConfig, path: string, fallback: string): string {
  return config.framework === 'nextjs'
    ? `page.get('${path}', ${fallback})`
    : `get('${path}', ${fallback})`;
}

/**
 * Generate Hero component with Reverso markers.
 */
function generateHeroComponent(config: ProjectConfig): string {
  const access = contentAccess(config, 'home');

  return `${access.imports}

/**
 * Hero section.
 *
 * A marker path is \`page.section.field\`:
 *   home.hero.title = page "home", section "hero", field "title"
 * The JSX children are the fallback shown until content is published.
 */
${access.signature('Hero')} {
${access.prelude}

  return (
    <section className="hero">
      <h1 data-reverso="home.hero.title" data-reverso-type="text">
        {${getExpr(config, 'home.hero.title', "'Welcome to Your Site'")}}
      </h1>

      <p data-reverso="home.hero.subtitle" data-reverso-type="textarea">
        {${getExpr(config, 'home.hero.subtitle', "'Edit this text in the Reverso admin panel.'")}}
      </p>

      <img
        data-reverso="home.hero.image"
        data-reverso-type="image"
        data-reverso-label="Hero image"
        src={${getExpr(config, 'home.hero.image', "'/placeholder.svg'")}}
        alt="Hero"
      />

      <a data-reverso="home.hero.ctaText" data-reverso-type="text" href="#">
        {${getExpr(config, 'home.hero.ctaText', "'Get Started'")}}
      </a>
    </section>
  );
}
`;
}

/**
 * Generate Features component with repeater pattern.
 */
function generateFeaturesComponent(config: ProjectConfig): string {
  const access = contentAccess(config, 'home');
  const itemsExpr =
    config.framework === 'nextjs'
      ? "page.items('home.features', FALLBACK_FEATURES)"
      : "page ? page.items('home.features', FALLBACK_FEATURES) : FALLBACK_FEATURES";

  return `${access.imports}

const FALLBACK_FEATURES = [
  { icon: '🚀', title: 'Fast', description: 'Lightning fast performance' },
  { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' },
  { icon: '🎨', title: 'Beautiful', description: 'Modern, responsive design' },
];

/**
 * Features section: a repeater.
 *
 * Markers inside the .map() use \`$\` as the 3rd path segment:
 *   home.features.$.title = the "title" of each item in the "features" section
 * The whole item list is read with page.items('home.features').
 */
${access.signature('Features')} {
${access.prelude}
  const features = ${itemsExpr};

  return (
    <section className="features">
      <h2 data-reverso="home.intro.heading" data-reverso-type="text">
        {${getExpr(config, 'home.intro.heading', "'Why Choose Us'")}}
      </h2>

      <div className="grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <span data-reverso="home.features.$.icon" data-reverso-type="text" data-reverso-label="Icon">
              {String(feature.icon ?? '')}
            </span>
            <h3 data-reverso="home.features.$.title" data-reverso-type="text" data-reverso-label="Title">
              {String(feature.title ?? '')}
            </h3>
            <p
              data-reverso="home.features.$.description"
              data-reverso-type="textarea"
              data-reverso-label="Description"
            >
              {String(feature.description ?? '')}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
`;
}

/**
 * Generate About component with various field types.
 */
function generateAboutComponent(config: ProjectConfig): string {
  const access = contentAccess(config, 'about');

  return `${access.imports}

/**
 * About section: several field types on a second page ("about").
 */
${access.signature('About')} {
${access.prelude}

  return (
    <section className="about">
      <h2 data-reverso="about.intro.title" data-reverso-type="text">
        {${getExpr(config, 'about.intro.title', "'About Us'")}}
      </h2>

      <p
        data-reverso="about.intro.content"
        data-reverso-type="textarea"
        data-reverso-label="About text"
      >
        {${getExpr(config, 'about.intro.content', "'We are a team dedicated to building great products.'")}}
      </p>

      <div className="stats">
        <span data-reverso="about.stats.years" data-reverso-type="number" data-reverso-label="Years in business">
          {${getExpr(config, 'about.stats.years', "'10'")}}
        </span>
        <span data-reverso="about.stats.clients" data-reverso-type="number" data-reverso-label="Happy clients">
          {${getExpr(config, 'about.stats.clients', "'500'")}}
        </span>
      </div>

      <img
        data-reverso="about.team.photo"
        data-reverso-type="image"
        data-reverso-label="Team photo"
        src={${getExpr(config, 'about.team.photo', "'/placeholder.svg'")}}
        alt="Our team"
      />
    </section>
  );
}
`;
}

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#e2e8f0"/><text x="320" y="190" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#64748b">Upload an image in the Reverso admin</text></svg>
`;

/**
 * Generate Next.js specific files.
 */
function generateNextJsFiles(config: ProjectConfig): ProjectFiles {
  const ext = config.typescript ? 'tsx' : 'jsx';
  const childrenType = config.typescript ? ': { children: React.ReactNode }' : '';

  return {
    [`src/app/layout.${ext}`]: `export const metadata = {
  title: '${config.projectName}',
  description: 'Content managed by Reverso CMS',
};

export default function RootLayout({ children }${childrenType}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
    [`src/app/page.${ext}`]: `import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { About } from '@/components/About';

// Content comes from the Reverso API at request time.
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <About />
    </main>
  );
}
`,
    'next.config.mjs': `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
`,
    'public/placeholder.svg': PLACEHOLDER_SVG,
  };
}

/**
 * Generate Vite specific files.
 */
function generateViteFiles(config: ProjectConfig): ProjectFiles {
  const ext = config.typescript ? 'tsx' : 'jsx';
  const scriptExt = config.typescript ? 'ts' : 'js';

  return {
    [`vite.config.${scriptExt}`]: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
    'index.html': `<!DOCTYPE html>
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
`,
    [`src/main.${ext}`]: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { About } from './components/About';

ReactDOM.createRoot(document.getElementById('root')${config.typescript ? '!' : ''}).render(
  <React.StrictMode>
    <main>
      <Hero />
      <Features />
      <About />
    </main>
  </React.StrictMode>
);
`,
    ...(config.typescript
      ? {
          'src/vite-env.d.ts': `/// <reference types="vite/client" />
`,
        }
      : {}),
    'public/placeholder.svg': PLACEHOLDER_SVG,
  };
}

/**
 * Generate Astro specific files.
 */
function generateAstroFiles(config: ProjectConfig): ProjectFiles {
  return {
    'astro.config.mjs': `import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
});
`,
    'src/pages/index.astro': `---
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { About } from '../components/About';
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
      <Features client:load />
      <About client:load />
    </main>
  </body>
</html>
`,
    'public/placeholder.svg': PLACEHOLDER_SVG,
  };
}

/**
 * Get the install command for the package manager.
 */
export function getInstallCommand(packageManager: PackageManager): string {
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
  const run = config.packageManager === 'npm' ? 'npm run' : config.packageManager;
  let step = 1;
  console.log();
  console.log(chalk.green.bold('✓ Project created successfully!'));
  console.log();
  console.log(chalk.bold('Next steps:'));
  console.log();
  console.log(chalk.gray(`  ${step++}. `) + chalk.white(`cd ${config.projectName}`));
  if (!config.install) {
    console.log(chalk.gray(`  ${step++}. `) + chalk.white(getInstallCommand(config.packageManager)));
  }
  console.log(chalk.gray(`  ${step++}. `) + chalk.white(`${run} reverso:dev`) + chalk.gray('   # admin + API on http://localhost:3001'));
  console.log(chalk.gray(`  ${step++}. `) + chalk.white(`${run} dev`) + chalk.gray('           # your site, in another terminal'));
  console.log();
  console.log(chalk.gray('Open http://localhost:3001/admin, create the first admin account and edit the content.'));
  console.log(chalk.gray('Your site renders whatever you publish; the JSX text is the fallback.'));
  console.log();
  console.log(chalk.bold('Documentation: ') + chalk.blue('https://github.com/hogrid/reverso#readme'));
  console.log();
}
