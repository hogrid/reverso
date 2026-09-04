import { ADMIN, expect, test } from './fixtures';

// These tests start without the shared session on purpose.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('authentication', () => {
  test('registration is closed once the first admin exists', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByLabel('Name')).toHaveCount(0);
    await expect(page.getByText(/create one/i)).toHaveCount(0);
  });

  test('a protected page redirects to login without a session', async ({ page }) => {
    await page.goto('/admin/pages');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByLabel('Password').fill('not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('signs in, keeps the session across reloads and deep links', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByLabel('Password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page.goto('/admin/pages/showcase');
    await expect(page.getByRole('heading', { name: 'Page Editor' })).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/admin\/pages\/showcase$/);
    await expect(page.getByRole('heading', { name: 'Page Editor' })).toBeVisible();
  });

  test('the API refuses anonymous writes', async ({ request }) => {
    const res = await request.patch('/api/reverso/content/page/showcase', {
      data: { data: { 'showcase.text.heading': 'anonymous' } },
    });
    expect(res.status()).toBe(401);
  });
});
