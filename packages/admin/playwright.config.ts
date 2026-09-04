import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * End-to-end tests against a REAL Reverso server.
 *
 * Playwright starts `reverso dev` on the showcase example (fresh database on
 * every run), then drives the admin panel in a browser and checks the public
 * API, exactly like a user would: scan -> register -> edit -> publish -> read.
 *
 * Run from the repo root with `pnpm test:e2e` (packages must be built first).
 *
 * Env:
 *   E2E_PORT                        port for the dev server (default 3131)
 *   PLAYWRIGHT_CHROMIUM_EXECUTABLE  use a preinstalled Chromium binary
 *   E2E_ALL_BROWSERS=1              also run Firefox and WebKit
 */

const PORT = Number(process.env.E2E_PORT ?? 3131);
const BASE_URL = `http://localhost:${PORT}`;
const SHOWCASE_DIR = resolve(__dirname, '../../examples/showcase');
const CLI_BIN = resolve(__dirname, '../cli/bin/reverso.js');
const STORAGE_STATE = resolve(__dirname, 'e2e/.auth/admin.json');

const chromiumLaunch = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : {};

const browserProjects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], launchOptions: chromiumLaunch, storageState: STORAGE_STATE },
    dependencies: ['setup'],
  },
  ...(process.env.E2E_ALL_BROWSERS
    ? [
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE },
          dependencies: ['setup'],
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'], storageState: STORAGE_STATE },
          dependencies: ['setup'],
        },
      ]
    : []),
];

export default defineConfig({
  testDir: './e2e',
  // One shared server and database: run specs in order, one at a time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions: chromiumLaunch },
    },
    ...browserProjects,
  ],
  webServer: {
    // Fresh database every run so the "first admin" registration is exercised.
    command: `rm -rf .reverso && node ${CLI_BIN} dev --port ${PORT}`,
    cwd: SHOWCASE_DIR,
    url: `${BASE_URL}/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env, REVERSO_COOKIE_SECRET: 'e2e-cookie-secret' },
  },
});
