/**
 * Smoke test for the production path: `reverso build` then `reverso start`
 * in a throw-away project, driven through the real binary.
 *
 * Guards the regression where `start` registered the routes twice and
 * crashed on boot, and checks that the started server is authenticated.
 */

import { type ChildProcess, execFileSync, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const BIN = resolve(dirname(fileURLToPath(import.meta.url)), '../../bin/reverso.js');
const API_KEY = 'smoke-test-key-0123456789abcdef';

async function waitFor(url: string, timeoutMs: number, child: ChildProcess, log: () => string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`reverso start exited with code ${child.exitCode}:\n${log()}`);
    }
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Timed out waiting for ${url}:\n${log()}`);
}

describe('reverso build + start', () => {
  let projectDir: string;
  let child: ChildProcess | null = null;
  let output = '';
  const port = 3900 + Math.floor(Math.random() * 500);
  const base = `http://127.0.0.1:${port}`;

  beforeAll(async () => {
    projectDir = mkdtempSync(join(tmpdir(), 'reverso-start-'));
    mkdirSync(join(projectDir, 'src'));
    writeFileSync(
      join(projectDir, 'src/Hero.tsx'),
      `export function Hero() {
  return <h1 data-reverso="home.hero.title" data-reverso-type="text">Hi</h1>;
}
`
    );

    execFileSync(process.execPath, [BIN, 'build'], { cwd: projectDir, stdio: 'pipe' });

    child = spawn(process.execPath, [BIN, 'start', '--port', String(port), '--host', '127.0.0.1'], {
      cwd: projectDir,
      env: { ...process.env, REVERSO_API_KEY: API_KEY, REVERSO_COOKIE_SECRET: 'smoke-cookie-secret' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout?.on('data', (d) => {
      output += d;
    });
    child.stderr?.on('data', (d) => {
      output += d;
    });

    await waitFor(`${base}/health`, 30_000, child, () => output);
  }, 60_000);

  afterAll(async () => {
    if (child && child.exitCode === null) {
      child.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 300));
    }
    rmSync(projectDir, { recursive: true, force: true });
  });

  it('boots without duplicate route errors', () => {
    expect(output).not.toContain('already declared');
    expect(child?.exitCode).toBeNull();
  });

  it('serves the schema prepared by build, behind authentication', async () => {
    const anonymous = await fetch(`${base}/api/reverso/pages`);
    expect(anonymous.status).toBe(401);

    const withKey = await fetch(`${base}/api/reverso/pages`, { headers: { 'x-api-key': API_KEY } });
    expect(withKey.status).toBe(200);
    const body = (await withKey.json()) as { data: Array<{ slug: string; fieldCount: number }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ slug: 'home', fieldCount: 1 });
  });

  it('serves the admin shell and public content', async () => {
    const admin = await fetch(`${base}/admin`);
    expect(admin.status).toBe(200);
    expect(await admin.text()).toContain('<title>Reverso CMS Admin</title>');

    const pub = await fetch(`${base}/api/reverso/public/content/page/home`);
    expect(pub.status).toBe(200);
  });
});
