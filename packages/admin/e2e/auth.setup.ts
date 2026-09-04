import { ADMIN, STORAGE_STATE, expect, test as setup } from './fixtures';

/**
 * Fresh database: the login page opens in "create your account" mode for the
 * first admin. Register through the real UI and keep the session for the
 * other specs.
 */
setup('register the first admin account', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByText('Create your account')).toBeVisible();

  await page.getByLabel('Name').fill(ADMIN.name);
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/admin\/?$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
});
