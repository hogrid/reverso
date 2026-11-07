/**
 * create-reverso input handling: JS projects get the `@/*` alias they
 * import, project names are validated before anything is written, and
 * Ctrl+C on any prompt aborts instead of scaffolding half-answered config.
 */

import prompts from 'prompts';
import { describe, expect, it } from 'vitest';
import {
  defaultConfig,
  generateProjectFiles,
  promptConfig,
  validateProjectName,
} from '../index.js';

describe('JavaScript projects', () => {
  it('emit a jsconfig.json with the @/* path the templates import', () => {
    const files = generateProjectFiles({ ...defaultConfig('demo-app'), typescript: false });
    expect(files['tsconfig.json']).toBeUndefined();
    const jsconfig = JSON.parse(files['jsconfig.json'] ?? '{}') as {
      compilerOptions?: { paths?: Record<string, string[]> };
    };
    expect(jsconfig.compilerOptions?.paths?.['@/*']).toEqual(['./src/*']);
    expect(files['src/lib/reverso.js']).toBeDefined();
  });

  it('TypeScript projects keep tsconfig.json and no jsconfig.json', () => {
    const files = generateProjectFiles(defaultConfig('demo-app'));
    expect(files['tsconfig.json']).toBeDefined();
    expect(files['jsconfig.json']).toBeUndefined();
  });
});

describe('validateProjectName', () => {
  it('accepts valid npm package names', () => {
    for (const name of ['my-app', 'site2', 'my.app', 'a_b', 'reverso']) {
      expect(validateProjectName(name)).toBeNull();
    }
  });

  it('rejects paths, spaces, uppercase and other invalid names with a message', () => {
    for (const name of ['', '../x', 'a/b', 'a\\b', 'my app', 'MyApp', '.hidden', '_x', '-x', 'x'.repeat(215)]) {
      expect(validateProjectName(name), name).toEqual(expect.any(String));
    }
  });
});

describe('promptConfig', () => {
  it('returns the answers when every prompt is answered', async () => {
    prompts.inject(['demo-app', 'vite', 'sqlite', 'pnpm', false, false, false]);
    await expect(promptConfig()).resolves.toMatchObject({
      projectName: 'demo-app',
      framework: 'vite',
      packageManager: 'pnpm',
      typescript: false,
    });
  });

  it('aborts when a later prompt is cancelled (Ctrl+C)', async () => {
    prompts.inject(['demo-app', new Error('cancelled')]);
    await expect(promptConfig()).resolves.toBeNull();
  });
});

describe('Next.js API URL', () => {
  it('reads the runtime REVERSO_URL before the build-time NEXT_PUBLIC_REVERSO_URL', () => {
    const files = generateProjectFiles(defaultConfig('demo-app'));
    expect(files['src/lib/reverso.ts']).toContain(
      'process.env.REVERSO_URL ?? process.env.NEXT_PUBLIC_REVERSO_URL ??'
    );
    expect(files['.env.example']).toMatch(/^REVERSO_URL=http:\/\/localhost:3001$/m);
  });
});
