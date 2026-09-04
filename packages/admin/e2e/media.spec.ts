import { expect, test } from './fixtures';

const TINY_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

test.describe('media library', () => {
  test('uploads an image through the file chooser and lists it', async ({ page, request }) => {
    await page.goto('/admin/media');
    await expect(page.getByRole('heading', { name: 'Media Library' })).toBeVisible();

    // The toolbar "Upload" button and the drop zone both open the same picker.
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload', exact: true }).click();
    await chooserPromise;

    await page
      .getByLabel('Upload files')
      .setInputFiles({ name: 'pixel.gif', mimeType: 'image/gif', buffer: TINY_GIF });

    await expect(page.getByText(/no media files/i)).toHaveCount(0);

    const res = await request.get('/api/reverso/media');
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { data: Array<{ mimeType: string; url: string; originalName?: string }> };
    // Other specs upload too; look for this file rather than assuming an empty library.
    const gif = body.data.find((m) => m.mimeType === 'image/gif');
    expect(gif).toBeDefined();
    expect(gif?.originalName).toBe('pixel.gif');

    const file = await request.get(gif?.url ?? '');
    expect(file.status()).toBe(200);
  });
});
