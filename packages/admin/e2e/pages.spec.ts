import { expect, publicPage, test } from './fixtures';

test.describe('pages and the editor', () => {
  test('lists the page detected from the showcase markers', async ({ page }) => {
    await page.goto('/admin/pages');
    await expect(page.getByRole('heading', { name: 'Pages' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Showcase/ })).toBeVisible();
  });

  test('renders every section as a tab with its fields', async ({ page }) => {
    await page.goto('/admin/pages/showcase');
    await expect(page.getByRole('heading', { name: 'Page Editor' })).toBeVisible();
    for (const tab of ['Choice', 'Date', 'Faq', 'Link', 'Map', 'Media', 'Rich', 'Team', 'Text']) {
      await expect(page.getByRole('tab', { name: new RegExp(`^${tab}`) })).toBeVisible();
    }
    // Select/radio options come through from the markers.
    await expect(page.getByRole('radio', { name: 'pro' })).toBeVisible();
  });

  test('edits a text field, saves, and the public API serves the new value', async ({ page, request }) => {
    await page.goto('/admin/pages/showcase');
    await page.getByRole('tab', { name: /^Text/ }).click();

    const heading = page.getByLabel(/^Heading/);
    await heading.fill('Heading edited in E2E');
    await expect(page.getByText('Unsaved changes')).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(/^Saved/)).toBeVisible();

    const content = await publicPage(request);
    expect(content['showcase.text.heading']).toBe('Heading edited in E2E');

    await page.reload();
    await page.getByRole('tab', { name: /^Text/ }).click();
    await expect(page.getByLabel(/^Heading/)).toHaveValue('Heading edited in E2E');
  });

  test('adds a repeater item, saves, and the public API serves the item list', async ({ page, request }) => {
    await page.goto('/admin/pages/showcase');
    await page.getByRole('tab', { name: /^Team/ }).click();

    await page.getByRole('button', { name: /add/i }).first().click();
    await page.getByLabel(/^Name/).first().fill('Grace Hopper');
    await page.getByLabel(/^Role/).first().fill('Rear Admiral');

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(/^Saved/)).toBeVisible();

    const content = await publicPage(request);
    const team = content['showcase.team.$'] as Array<Record<string, unknown>>;
    expect(Array.isArray(team)).toBe(true);
    expect(team).toHaveLength(1);
    expect(team[0]).toMatchObject({ name: 'Grace Hopper', role: 'Rear Admiral' });
  });

  test('warns before leaving with unsaved changes', async ({ page }) => {
    await page.goto('/admin/pages/showcase');
    await page.getByRole('tab', { name: /^Text/ }).click();
    await page.getByLabel(/^Heading/).fill('Not saved');
    await page.getByRole('link', { name: 'Back to Pages' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/admin\/pages\/showcase$/);
  });
});
