import type { Locator, Page } from '@playwright/test';
import { expect, publicPage, test } from './fixtures';

/**
 * Every field family the showcase declares, driven through the editor the way
 * an editor would, then read back from the public API the way a site would.
 */

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

async function openTab(page: Page, name: string) {
  await page.goto('/admin/pages/showcase');
  await page.getByRole('tab', { name: new RegExp(`^${name}`) }).click();
}

async function save(page: Page) {
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(/^Saved/)).toBeVisible();
}

/** Upload through the shared media modal and pick the uploaded item. */
async function uploadViaModal(
  page: Page,
  opener: Locator,
  file: { name: string; mimeType: string; buffer: Buffer }
) {
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('tab', { name: 'Upload New' }).click();
  await dialog.getByLabel('Upload files').setInputFiles(file);
  // The uploader switches back to the library once the file is stored.
  await expect(dialog.getByRole('tab', { name: 'Browse Library' })).toHaveAttribute('data-state', 'active');
  const img = dialog.locator(`img[alt="${file.name}"]`);
  const card = (await img.count()) > 0 ? img.first() : dialog.locator('[class*="cursor-pointer"]').first();
  await card.click();
  await dialog.getByRole('button', { name: /^Select/ }).click();
  await expect(dialog).toBeHidden();
}

test.describe('field types round trip', () => {
  test('rich text keeps the typed order and the code snippet is stored as an object', async ({
    page,
    request,
  }) => {
    await openTab(page, 'Rich');
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Ordered text 123');
    await page.locator('textarea').last().fill('console.log("hi")');
    await save(page);

    const content = await publicPage(request);
    expect(content['showcase.rich.article']).toContain('Ordered text 123');
    expect(content['showcase.rich.snippet']).toMatchObject({ code: 'console.log("hi")' });
  });

  test('select, radio and switch', async ({ page, request }) => {
    await openTab(page, 'Choice');
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'tutorial' }).click();
    await page.getByRole('radio', { name: 'pro' }).check();
    await page.getByRole('switch').first().click();
    await save(page);

    const content = await publicPage(request);
    expect(content['showcase.choice.category']).toBe('tutorial');
    expect(content['showcase.choice.plan']).toBe('pro');
    expect(typeof content['showcase.choice.featured']).toBe('boolean');
  });

  test('date, datetime and time', async ({ page, request }) => {
    await openTab(page, 'Date');
    await page.locator('input[type="date"]').first().fill('2026-09-04');
    await page.locator('input[type="datetime-local"]').first().fill('2026-09-04T18:30');
    await page.locator('input[type="time"]').first().fill('09:00');
    await save(page);

    const content = await publicPage(request);
    expect(content['showcase.date.publishedAt']).toBe('2026-09-04');
    expect(content['showcase.date.eventStart']).toBe('2026-09-04T18:30');
    expect(content['showcase.date.openingTime']).toBe('09:00');
  });

  test('color', async ({ page, request }) => {
    await openTab(page, 'Media');
    await page.getByPlaceholder('#000000').fill('#ff8800');
    await save(page);
    const content = await publicPage(request);
    expect(String(content['showcase.media.brandColor']).toLowerCase()).toBe('#ff8800');
  });

  test('image upload through the media modal is stored with its dimensions and served', async ({
    page,
    request,
  }) => {
    await openTab(page, 'Media');
    await uploadViaModal(page, page.getByRole('button', { name: /^Browse$/ }).first(), {
      name: 'cover.png',
      mimeType: 'image/png',
      buffer: PNG,
    });
    await expect(page.locator('img[src*="/uploads/"]').first()).toBeVisible();
    await save(page);

    const content = await publicPage(request);
    const cover = content['showcase.media.cover'] as { url: string; width?: number; height?: number };
    expect(cover.url).toMatch(/^\/uploads\/.+\.png$/);
    expect(cover.width).toBe(1);
    expect(cover.height).toBe(1);
    expect((await request.get(cover.url)).status()).toBe(200);
  });

  test('a rejected upload shows the reason instead of failing silently', async ({ page }) => {
    await openTab(page, 'Media');
    await page.getByRole('button', { name: /^Browse Library$/ }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: 'Upload New' }).click();
    await dialog
      .getByLabel('Upload files')
      .setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
    await expect(dialog.getByRole('alert')).toContainText('text/plain');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
  });

  test('file upload keeps the original filename', async ({ page, request }) => {
    await openTab(page, 'Media');
    await uploadViaModal(page, page.getByRole('button', { name: /^Browse Library$/ }).first(), {
      name: 'brochure.pdf',
      mimeType: 'application/pdf',
      buffer: PDF,
    });
    await save(page);

    const content = await publicPage(request);
    expect(content['showcase.media.attachment']).toMatchObject({
      filename: 'brochure.pdf',
      mimeType: 'application/pdf',
    });
  });

  test('link, map and repeater items', async ({ page, request }) => {
    await openTab(page, 'Link');
    await page.getByLabel(/^Call to action/).first().fill('https://reverso.dev/docs');
    await save(page);

    await openTab(page, 'Map');
    await page.getByLabel(/^Latitude/).fill('-23.55');
    await page.getByLabel(/^Longitude/).fill('-46.63');
    await page.getByLabel(/^Address/).fill('São Paulo');
    await save(page);

    await openTab(page, 'Faq');
    await page.getByRole('button', { name: /^Add/ }).first().click();
    await page.getByLabel(/^Question/).first().fill('Does it work?');
    await page.getByLabel(/^Answer/).first().fill('Yes.');
    await save(page);

    const content = await publicPage(request);
    expect(content['showcase.link.cta']).toBe('https://reverso.dev/docs');
    expect(content['showcase.map.location']).toMatchObject({ lat: -23.55, lng: -46.63, address: 'São Paulo' });
    expect(content['showcase.faq.$']).toEqual([expect.objectContaining({ question: 'Does it work?', answer: 'Yes.' })]);
  });

  test('saved values come back after a reload', async ({ page }) => {
    await openTab(page, 'Map');
    await expect(page.getByLabel(/^Latitude/)).toHaveValue('-23.55');
    await page.getByRole('tab', { name: /^Media/ }).click();
    await expect(page.locator('img[src*="/uploads/"]').first()).toBeVisible();
  });
});
