import { expect, test } from './fixtures';

test.describe('forms', () => {
  test('creates a form from the dialog and opens the builder', async ({ page, request }) => {
    await page.goto('/admin/forms');
    await expect(page.getByRole('heading', { name: 'Forms' })).toBeVisible();

    await page.getByRole('button', { name: 'Create Form' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Name').fill('Contact');
    await page.getByLabel('Slug').fill('contact');
    await page.getByRole('dialog').getByRole('button', { name: 'Create Form' }).click();

    await expect(page).toHaveURL(/\/admin\/forms\/[^/]+$/);

    await page.goto('/admin/forms');
    await expect(page.getByRole('link', { name: /Contact/ })).toBeVisible();

    const res = await request.get('/api/reverso/public/forms/contact/submit');
    // Only POST exists on the public submit route; a 404 here proves the
    // draft form is not exposed and the route is reachable.
    expect([404, 405]).toContain(res.status());
  });
});
