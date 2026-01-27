import { test as base, expect, type Page } from '@playwright/test';

/**
 * Test credentials for E2E tests.
 * In CI, these should be set via environment variables.
 */
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@example.com',
  password: process.env.TEST_USER_PASSWORD || 'password123',
};

/**
 * Extended test fixture with authentication helpers.
 */
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Perform login
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await use(page);
  },
});

export { expect };

/**
 * Helper to wait for network idle.
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Helper to take a screenshot with a descriptive name.
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `playwright-report/screenshots/${name}.png`,
    fullPage: true,
  });
}

/**
 * Helper to clear and type in an input.
 */
export async function clearAndType(page: Page, selector: string, text: string) {
  const input = page.locator(selector);
  await input.clear();
  await input.fill(text);
}

/**
 * Data-testid selectors for common elements.
 */
export const selectors = {
  sidebar: '[data-testid="sidebar"]',
  sidebarLink: (name: string) => `[data-testid="sidebar-link-${name}"]`,
  pageTitle: '[data-testid="page-title"]',
  saveButton: '[data-testid="save-button"]',
  deleteButton: '[data-testid="delete-button"]',
  confirmButton: '[data-testid="confirm-button"]',
  cancelButton: '[data-testid="cancel-button"]',
  loadingSpinner: '[data-testid="loading"]',
  errorMessage: '[data-testid="error-message"]',
  successMessage: '[data-testid="success-message"]',
  mediaUploader: '[data-testid="media-uploader"]',
  mediaGrid: '[data-testid="media-grid"]',
  mediaItem: '[data-testid="media-item"]',
};
