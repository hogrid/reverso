/**
 * create-reverso template tests: the generated project must be internally
 * consistent (valid markers, valid config, versions from this package).
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  type Framework,
  type ProjectConfig,
  defaultConfig,
  generateProjectFiles,
  getInstallCommand,
  reversoVersions,
  writeProjectFiles,
} from '../index.js';

const FRAMEWORKS: Framework[] = ['nextjs', 'vite', 'astro'];

function cfg(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return { ...defaultConfig('demo-app'), ...overrides };
}

/** Every data-reverso path in the given source. */
function markerPaths(source: string): string[] {
  return [...source.matchAll(/data-reverso="([^"]+)"/g)].map((m) => m[1] ?? '');
}

describe('defaultConfig', () => {
  it('scaffolds a TypeScript Next.js + SQLite project by default', () => {
    expect(defaultConfig()).toMatchObject({
      projectName: 'my-reverso-app',
      framework: 'nextjs',
      database: 'sqlite',
      typescript: true,
    });
    expect(defaultConfig('custom').projectName).toBe('custom');
  });
});

describe('generateProjectFiles', () => {
  it.each(FRAMEWORKS)('%s: produces a complete, consistent project', (framework) => {
    const files = generateProjectFiles(cfg({ framework }));

    for (const required of [
      'package.json',
      'reverso.config.ts',
      'tsconfig.json',
      '.gitignore',
      '.env.example',
      'README.md',
      'src/lib/reverso.ts',
      'src/components/Hero.tsx',
      'src/components/Features.tsx',
      'src/components/About.tsx',
      'public/placeholder.svg',
    ]) {
      expect(files[required], required).toBeDefined();
    }

    const pkg = JSON.parse(files['package.json'] ?? '{}');
    expect(pkg.name).toBe('demo-app');
    expect(pkg.dependencies['@reverso/client']).toBeDefined();
    // Runtime packages: `reverso start` and reverso.config.ts need them in production.
    expect(pkg.dependencies['@reverso/cli']).toBeDefined();
    expect(pkg.dependencies['@reverso/core']).toBeDefined();
    expect(pkg.devDependencies['@reverso/cli']).toBeUndefined();
    expect(pkg.scripts['reverso:dev']).toBe('reverso dev');
    expect(pkg.scripts.dev).toBeDefined();

    // Config uses the real ReversoConfig keys.
    const config = files['reverso.config.ts'] ?? '';
    expect(config).toContain("import { defineConfig } from '@reverso/core'");
    expect(config).toContain("provider: 'sqlite'");
    expect(config).not.toContain('type:');

    // The site reads content through the client SDK.
    expect(files['src/lib/reverso.ts']).toContain("from '@reverso/client'");
    for (const component of ['Hero', 'Features', 'About']) {
      expect(files[`src/components/${component}.tsx`]).toContain('reverso');
    }
  });

  it('writes markers that follow the page.section.field grammar', () => {
    const files = generateProjectFiles(cfg());
    const sources = ['Hero', 'Features', 'About'].map((c) => files[`src/components/${c}.tsx`] ?? '');
    const paths = sources.flatMap(markerPaths);

    expect(paths.length).toBeGreaterThan(8);
    for (const path of paths) {
      const parts = path.split('.');
      expect(parts.length, path).toBeGreaterThanOrEqual(3);
      const dollarIndex = parts.indexOf('$');
      if (dollarIndex !== -1) {
        expect(dollarIndex, path).toBe(2);
        expect(parts.length, path).toBe(4);
      }
    }
    // The repeater is read through items() and its sub-fields marked with $.
    expect(files['src/components/Features.tsx']).toContain("items('home.features'");
    expect(paths).toContain('home.features.$.title');
  });

  it('only uses field types the scanner knows', () => {
    const files = generateProjectFiles(cfg());
    const known = new Set(['text', 'textarea', 'image', 'number', 'wysiwyg']);
    const sources = ['Hero', 'Features', 'About'].map((c) => files[`src/components/${c}.tsx`] ?? '');
    for (const type of sources.flatMap((s) => [...s.matchAll(/data-reverso-type="([^"]+)"/g)].map((m) => m[1]))) {
      expect(known.has(type ?? ''), `field type ${type}`).toBe(true);
    }
  });

  it('adapts the API URL env var and client module to the framework', () => {
    expect(generateProjectFiles(cfg({ framework: 'nextjs' }))['.env.example']).toContain(
      'NEXT_PUBLIC_REVERSO_URL'
    );
    expect(generateProjectFiles(cfg({ framework: 'nextjs' }))['src/lib/reverso.ts']).toContain(
      'process.env.NEXT_PUBLIC_REVERSO_URL'
    );
    expect(generateProjectFiles(cfg({ framework: 'vite' }))['src/lib/reverso.ts']).toContain(
      'import.meta.env.VITE_REVERSO_URL'
    );
    expect(generateProjectFiles(cfg({ framework: 'astro' }))['.env.example']).toContain(
      'PUBLIC_REVERSO_URL'
    );
  });

  it('uses server components on Next.js and client-side fetching elsewhere', () => {
    const next = generateProjectFiles(cfg({ framework: 'nextjs' }))['src/components/Hero.tsx'] ?? '';
    expect(next).toContain('export async function Hero()');
    expect(next).not.toContain('useEffect');

    const vite = generateProjectFiles(cfg({ framework: 'vite' }))['src/components/Hero.tsx'] ?? '';
    expect(vite).toContain('useEffect');
    expect(vite).toContain('useState<ReversoPage | null>');
  });

  it('emits JavaScript files without types when TypeScript is off', () => {
    const files = generateProjectFiles(cfg({ typescript: false, framework: 'vite' }));
    expect(files['tsconfig.json']).toBeUndefined();
    expect(files['src/components/Hero.jsx']).toBeDefined();
    expect(files['src/components/Hero.jsx']).not.toContain(': string');
    expect(files['src/lib/reverso.js']).toBeDefined();
    expect(files['vite.config.js']).toBeDefined();
  });

  it('scaffolds a PostgreSQL config when requested', () => {
    const config = generateProjectFiles(cfg({ database: 'postgres' }))['reverso.config.ts'] ?? '';
    expect(config).toContain("provider: 'postgresql'");
    expect(config).toContain('process.env.DATABASE_URL');
  });

  it('ignores the database, uploads and dev handshake in git', () => {
    const gitignore = generateProjectFiles(cfg())['.gitignore'] ?? '';
    for (const entry of ['.reverso/*.db', '.reverso/uploads/', '.reverso/dev-server.json', '.reverso/admin.json']) {
      expect(gitignore).toContain(entry);
    }
  });
});

describe('reversoVersions', () => {
  it('reads ranges from this package and never emits workspace: ranges', () => {
    const versions = reversoVersions();
    for (const range of Object.values(versions)) {
      expect(range).not.toMatch(/^workspace:/);
      expect(range.length).toBeGreaterThan(0);
    }
  });
});

describe('writeProjectFiles', () => {
  it('creates nested directories and the .reverso folder', () => {
    const dir = mkdtempSync(join(tmpdir(), 'create-reverso-'));
    try {
      writeProjectFiles(dir, generateProjectFiles(cfg()));
      expect(existsSync(join(dir, 'src/components/Hero.tsx'))).toBe(true);
      expect(existsSync(join(dir, '.reverso'))).toBe(true);
      expect(readFileSync(join(dir, 'package.json'), 'utf-8')).toContain('"demo-app"');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('getInstallCommand', () => {
  it('maps every package manager', () => {
    expect(getInstallCommand('npm')).toBe('npm install');
    expect(getInstallCommand('pnpm')).toBe('pnpm install');
    expect(getInstallCommand('yarn')).toBe('yarn');
    expect(getInstallCommand('bun')).toBe('bun install');
  });
});
