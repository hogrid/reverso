import { expect, test } from './fixtures';

test.describe('redirects', () => {
  test('creates a redirect and the public lookup resolves it', async ({ page, request }) => {
    await page.goto('/admin/redirects');
    await expect(page.getByRole('heading', { name: 'Redirects' })).toBeVisible();

    await page.getByRole('button', { name: 'Add Redirect' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder('/old-page').fill('/legacy-url');
    await dialog.getByPlaceholder(/\/new-page/).fill('/fresh-url');
    await dialog.getByRole('button', { name: /create|save|add/i }).last().click();

    await expect(page.getByText('/legacy-url')).toBeVisible();

    const res = await request.get('/api/reverso/redirect?path=/legacy-url');
    expect(res.status()).toBe(200);
    expect((await res.json()).data).toEqual({ toPath: '/fresh-url', statusCode: 301 });
  });
});
