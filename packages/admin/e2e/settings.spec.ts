import { ADMIN, STORAGE_STATE, expect, test } from './fixtures';

test.describe('account', () => {
  test('the settings page shows the signed-in account and instance counts', async ({ page }) => {
    await page.goto('/admin');
    await page.locator('[data-testid="account-menu"]').click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/admin\/settings$/);
    await expect(page.getByText(ADMIN.email)).toBeVisible();
    await expect(page.getByText('This instance')).toBeVisible();
  });

  test('sign out ends the session and signing back in restores it', async ({ page }) => {
    await page.goto('/admin');
    await page.locator('[data-testid="account-menu"]').click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);

    // The old cookie must be dead on the server too, not just cleared locally.
    await page.goto('/admin/pages');
    await expect(page).toHaveURL(/\/admin\/login$/);

    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByLabel('Password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    // Login returns to the page that was requested before the redirect.
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // Later specs load the stored state: keep it valid.
    await page.context().storageState({ path: STORAGE_STATE });
  });
});
