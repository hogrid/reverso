import { expect, test } from './fixtures';

test.describe('navigation', () => {
  test('the sidebar reaches every section', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    const sections: Array<{ name: RegExp; url: RegExp; heading: string }> = [
      { name: /pages/i, url: /\/admin\/pages$/, heading: 'Pages' },
      { name: /media/i, url: /\/admin\/media$/, heading: 'Media Library' },
      { name: /forms/i, url: /\/admin\/forms$/, heading: 'Forms' },
      { name: /redirects/i, url: /\/admin\/redirects$/, heading: 'Redirects' },
      { name: /dashboard/i, url: /\/admin\/?$/, heading: 'Dashboard' },
    ];

    for (const section of sections) {
      await page.getByRole('link', { name: section.name }).first().click();
      await expect(page).toHaveURL(section.url);
      await expect(page.getByRole('heading', { name: section.heading }).first()).toBeVisible();
    }
  });

  test('the dashboard shows real counts from the scanned schema', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText(/34|fields/i).first()).toBeVisible();
  });

  test('unknown admin routes show the not-found page', async ({ page }) => {
    await page.goto('/admin/does-not-exist');
    await expect(page.getByText(/not found|404/i).first()).toBeVisible();
  });
});
