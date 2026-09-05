import { type APIRequestContext, expect, test as base } from '@playwright/test';

/** First admin account, created by auth.setup.ts on the fresh database. */
export const ADMIN = {
  name: 'E2E Admin',
  email: 'admin@e2e.test',
  password: 'password123',
};

/** Path where auth.setup.ts stores the logged-in browser state. */
export const STORAGE_STATE = 'e2e/.auth/admin.json';

/** The page every showcase marker belongs to. */
export const SHOWCASE_SLUG = 'showcase';

/**
 * Every test runs with external font/CDN requests blocked: they are not part
 * of the product under test and, in sandboxed CI, they can hang navigation
 * until the connection times out.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
    await use(context);
  },
});
export { expect };

/**
 * Read published content straight from the public API, the way a frontend
 * would, so tests assert on what actually ships and not only on the UI.
 */
export async function publicPage(request: APIRequestContext, slug = SHOWCASE_SLUG) {
  const res = await request.get(`/api/reverso/public/content/page/${slug}`);
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { data: { content: Record<string, unknown> } };
  return body.data.content;
}
