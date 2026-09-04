/**
 * Integration tests for the modules that had no coverage: forms (builder,
 * public submission, submissions, export), redirects (CRUD, lookup, import,
 * export), media (real multipart upload) and the sitemap.
 *
 * Auth is disabled here so the tests focus on module behaviour; auth.test.ts
 * covers the access rules.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HOME_SCHEMA, TINY_GIF, createTestServer, json, multipartFile, type TestServer } from './helpers.js';

describe('forms', () => {
  let t: TestServer;

  beforeEach(async () => {
    t = await createTestServer({ name: 'forms' });
  });

  afterEach(async () => {
    await t.close();
  });

  async function createForm(slug = 'contact'): Promise<string> {
    const res = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/forms',
      payload: { name: 'Contact', slug, description: 'Contact us' },
    });
    expect(res.statusCode).toBe(200);
    return json(res).data.id as string;
  }

  it('lists, creates, reads, updates and deletes forms', async () => {
    expect(json(await t.server.inject({ method: 'GET', url: '/api/reverso/forms' })).data).toEqual([]);

    const id = await createForm();

    const list = json(await t.server.inject({ method: 'GET', url: '/api/reverso/forms' }));
    expect(list.data).toHaveLength(1);
    expect(list.data[0]).toMatchObject({ id, slug: 'contact', status: 'draft' });

    const detail = json(await t.server.inject({ method: 'GET', url: `/api/reverso/forms/${id}` }));
    expect(detail.data).toMatchObject({ id, name: 'Contact', fields: [] });

    const updated = await t.server.inject({
      method: 'PUT',
      url: `/api/reverso/forms/${id}`,
      payload: { name: 'Contact Us', honeypotEnabled: false },
    });
    expect(updated.statusCode).toBe(200);
    expect(json(await t.server.inject({ method: 'GET', url: `/api/reverso/forms/${id}` })).data.name).toBe(
      'Contact Us'
    );

    const deleted = await t.server.inject({ method: 'DELETE', url: `/api/reverso/forms/${id}` });
    expect(deleted.statusCode).toBe(200);
    expect((await t.server.inject({ method: 'GET', url: `/api/reverso/forms/${id}` })).statusCode).toBe(404);
  });

  it('rejects duplicate slugs and invalid payloads', async () => {
    await createForm();
    const dup = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/forms',
      payload: { name: 'Again', slug: 'contact' },
    });
    expect(dup.statusCode).toBe(400);

    const bad = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/forms',
      payload: { name: '', slug: 'Not A Slug' },
    });
    expect(bad.statusCode).toBe(400);
  });

  it('refuses webhook URLs that point at private networks', async () => {
    const res = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/forms',
      payload: { name: 'Hook', slug: 'hook', webhookUrl: 'http://127.0.0.1:8080/hook' },
    });
    expect(res.statusCode).toBe(400);
    expect(json(res).message).toMatch(/webhook/i);
  });

  it('manages fields and reorders them', async () => {
    const id = await createForm();

    const email = await t.server.inject({
      method: 'POST',
      url: `/api/reverso/forms/${id}/fields`,
      payload: { name: 'email', type: 'email', label: 'Email', required: true },
    });
    expect(email.statusCode).toBe(200);
    const message = await t.server.inject({
      method: 'POST',
      url: `/api/reverso/forms/${id}/fields`,
      payload: { name: 'message', type: 'textarea', label: 'Message' },
    });
    expect(message.statusCode).toBe(200);

    const emailId = json(email).data.id as string;
    const messageId = json(message).data.id as string;

    const renamed = await t.server.inject({
      method: 'PUT',
      url: `/api/reverso/forms/${id}/fields/${emailId}`,
      payload: { label: 'Your email' },
    });
    expect(renamed.statusCode).toBe(200);

    const reordered = await t.server.inject({
      method: 'PUT',
      url: `/api/reverso/forms/${id}/fields/reorder`,
      payload: { fieldIds: [messageId, emailId] },
    });
    expect(reordered.statusCode).toBe(200);

    const detail = json(await t.server.inject({ method: 'GET', url: `/api/reverso/forms/${id}` }));
    expect(detail.data.fields.map((f: { name: string }) => f.name)).toEqual(['message', 'email']);
    expect(detail.data.fields[1].label).toBe('Your email');

    const removed = await t.server.inject({
      method: 'DELETE',
      url: `/api/reverso/forms/${id}/fields/${messageId}`,
    });
    expect(removed.statusCode).toBe(200);
    expect(
      json(await t.server.inject({ method: 'GET', url: `/api/reverso/forms/${id}` })).data.fields
    ).toHaveLength(1);
  });

  it('accepts public submissions only for published forms, lists and exports them', async () => {
    const id = await createForm();
    await t.server.inject({
      method: 'POST',
      url: `/api/reverso/forms/${id}/fields`,
      payload: { name: 'email', type: 'email', label: 'Email', required: true },
    });

    const beforePublish = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/public/forms/contact/submit',
      payload: { data: { email: 'a@b.co' } },
    });
    expect(beforePublish.statusCode).toBe(404);

    expect(
      (await t.server.inject({ method: 'PUT', url: `/api/reverso/forms/${id}/publish` })).statusCode
    ).toBe(200);

    const submit = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/public/forms/contact/submit',
      payload: { data: { email: 'a@b.co' } },
    });
    expect(submit.statusCode).toBe(200);
    const submissionId = json(submit).data.id as string;

    // Honeypot filled in: accepted but flagged as spam.
    const bot = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/public/forms/contact/submit',
      payload: { data: { email: 'bot@spam.io' }, honeypot: 'gotcha' },
    });
    expect(bot.statusCode).toBe(200);

    const list = json(
      await t.server.inject({ method: 'GET', url: `/api/reverso/forms/${id}/submissions` })
    );
    expect(list.data).toHaveLength(2);
    const statuses = list.data.map((s: { status: string }) => s.status).sort();
    expect(statuses).toEqual(['new', 'spam']);

    const one = json(
      await t.server.inject({
        method: 'GET',
        url: `/api/reverso/forms/${id}/submissions/${submissionId}`,
      })
    );
    expect(one.data.data.email).toBe('a@b.co');

    const read = await t.server.inject({
      method: 'PUT',
      url: `/api/reverso/forms/${id}/submissions/${submissionId}/status`,
      payload: { status: 'read' },
    });
    expect(read.statusCode).toBe(200);

    const csv = await t.server.inject({
      method: 'POST',
      url: `/api/reverso/forms/${id}/submissions/export`,
      payload: {},
    });
    expect(csv.statusCode).toBe(200);
    expect(csv.headers['content-type']).toMatch(/text\/csv/);
    expect(csv.payload.split('\n')[0]).toContain('Email');
    expect(csv.payload).toContain('a@b.co');

    const removed = await t.server.inject({
      method: 'DELETE',
      url: `/api/reverso/forms/${id}/submissions/${submissionId}`,
    });
    expect(removed.statusCode).toBe(200);

    expect(
      (await t.server.inject({ method: 'PUT', url: `/api/reverso/forms/${id}/unpublish` })).statusCode
    ).toBe(200);
    const afterUnpublish = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/public/forms/contact/submit',
      payload: { data: { email: 'late@b.co' } },
    });
    expect(afterUnpublish.statusCode).toBe(404);
  });

  it('duplicates a form with its fields under a new slug', async () => {
    const id = await createForm();
    await t.server.inject({
      method: 'POST',
      url: `/api/reverso/forms/${id}/fields`,
      payload: { name: 'email', type: 'email' },
    });
    const dup = await t.server.inject({
      method: 'POST',
      url: `/api/reverso/forms/${id}/duplicate`,
      payload: { slug: 'contact-copy' },
    });
    expect(dup.statusCode).toBe(200);
    const copy = json(
      await t.server.inject({ method: 'GET', url: `/api/reverso/forms/${json(dup).data.id}` })
    );
    expect(copy.data.slug).toBe('contact-copy');
    expect(copy.data.fields).toHaveLength(1);
  });
});

describe('redirects', () => {
  let t: TestServer;

  beforeEach(async () => {
    t = await createTestServer({ name: 'redirects' });
  });

  afterEach(async () => {
    await t.close();
  });

  it('creates, resolves, toggles, updates and deletes a redirect', async () => {
    const created = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/redirects',
      payload: { fromPath: '/old-page', toPath: '/new-page', statusCode: 301 },
    });
    expect(created.statusCode).toBe(200);
    const id = json(created).data.id as string;

    const list = json(await t.server.inject({ method: 'GET', url: '/api/reverso/redirects' }));
    expect(list.data).toHaveLength(1);
    expect(list.meta).toMatchObject({ total: 1, enabled: 1, disabled: 0 });

    const lookup = await t.server.inject({
      method: 'GET',
      url: '/api/reverso/redirect?path=/old-page',
    });
    expect(lookup.statusCode).toBe(200);
    expect(json(lookup).data).toEqual({ toPath: '/new-page', statusCode: 301 });

    const hit = json(await t.server.inject({ method: 'GET', url: `/api/reverso/redirects/${id}` }));
    expect(hit.data.hitCount).toBe(1);

    expect(
      (await t.server.inject({ method: 'PUT', url: `/api/reverso/redirects/${id}/disable` })).statusCode
    ).toBe(200);
    expect(
      (await t.server.inject({ method: 'GET', url: '/api/reverso/redirect?path=/old-page' })).statusCode
    ).toBe(404);
    expect(
      (await t.server.inject({ method: 'PUT', url: `/api/reverso/redirects/${id}/enable` })).statusCode
    ).toBe(200);

    const updated = await t.server.inject({
      method: 'PUT',
      url: `/api/reverso/redirects/${id}`,
      payload: { toPath: '/newer-page', statusCode: 302 },
    });
    expect(updated.statusCode).toBe(200);
    expect(json(await t.server.inject({ method: 'GET', url: '/api/reverso/redirect?path=/old-page' })).data).toEqual({
      toPath: '/newer-page',
      statusCode: 302,
    });

    expect((await t.server.inject({ method: 'DELETE', url: `/api/reverso/redirects/${id}` })).statusCode).toBe(200);
    expect(json(await t.server.inject({ method: 'GET', url: '/api/reverso/redirects' })).data).toEqual([]);
  });

  it('validates input', async () => {
    const noSlash = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/redirects',
      payload: { fromPath: 'old', toPath: '/new' },
    });
    expect(noSlash.statusCode).toBe(400);

    const missing = await t.server.inject({ method: 'GET', url: '/api/reverso/redirect' });
    expect(missing.statusCode).toBe(400);
  });

  it('bulk imports and exports', async () => {
    const imported = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/redirects/bulk-import',
      payload: {
        redirects: [
          { fromPath: '/a', toPath: '/b' },
          { fromPath: '/c', toPath: '/d', statusCode: 302 },
        ],
      },
    });
    expect(imported.statusCode).toBe(200);

    const list = json(await t.server.inject({ method: 'GET', url: '/api/reverso/redirects' }));
    expect(list.data).toHaveLength(2);

    const exported = await t.server.inject({ method: 'GET', url: '/api/reverso/redirects/export' });
    expect(exported.statusCode).toBe(200);
    expect(exported.payload).toContain('/a');
    expect(exported.payload).toContain('/d');
  });
});

describe('media', () => {
  let t: TestServer;

  beforeEach(async () => {
    t = await createTestServer({ name: 'media' });
  });

  afterEach(async () => {
    await t.close();
  });

  it('uploads a file to the uploads directory, lists, reads, updates and deletes it', async () => {
    const upload = multipartFile('avatar.gif', 'image/gif', TINY_GIF);
    const res = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/media',
      headers: upload.headers,
      payload: upload.payload,
    });
    expect(res.statusCode).toBe(200);
    const media = json(res).data;
    expect(media.mimeType).toBe('image/gif');
    expect(media.size).toBe(TINY_GIF.length);
    expect(media.url).toMatch(/^\/uploads\/.+\.gif$/);
    // Dimensions are read from the file header so image values carry them.
    expect(media.width).toBe(1);
    expect(media.height).toBe(1);
    expect(existsSync(join(t.uploadsDir, media.filename))).toBe(true);

    const list = json(await t.server.inject({ method: 'GET', url: '/api/reverso/media' }));
    expect(list.data).toHaveLength(1);
    expect(list.meta.total).toBe(1);

    const searched = json(
      await t.server.inject({ method: 'GET', url: '/api/reverso/media?search=avat' })
    );
    expect(searched.data).toHaveLength(1);
    const missed = json(
      await t.server.inject({ method: 'GET', url: '/api/reverso/media?search=nothing-here' })
    );
    expect(missed.data).toHaveLength(0);
    expect(missed.meta.total).toBe(0);

    const images = json(await t.server.inject({ method: 'GET', url: '/api/reverso/media/images' }));
    expect(images.data).toHaveLength(1);

    // Browser `accept` syntax from the media picker must match too.
    const wildcard = json(await t.server.inject({ method: 'GET', url: '/api/reverso/media?type=image/*' }));
    expect(wildcard.data).toHaveLength(1);
    const videos = json(await t.server.inject({ method: 'GET', url: '/api/reverso/media?type=video/*' }));
    expect(videos.data).toHaveLength(0);

    const patched = await t.server.inject({
      method: 'PATCH',
      url: `/api/reverso/media/${media.id}`,
      payload: { alt: 'An avatar' },
    });
    expect(patched.statusCode).toBe(200);
    expect(json(await t.server.inject({ method: 'GET', url: `/api/reverso/media/${media.id}` })).data.alt).toBe(
      'An avatar'
    );

    const served = await t.server.inject({ method: 'GET', url: media.url });
    expect(served.statusCode).toBe(200);

    const deleted = await t.server.inject({ method: 'DELETE', url: `/api/reverso/media/${media.id}` });
    expect(deleted.statusCode).toBe(200);
    expect(existsSync(join(t.uploadsDir, media.filename))).toBe(false);
  });

  it('rejects disallowed types and mismatched extensions', async () => {
    const exe = multipartFile('virus.exe', 'application/x-msdownload', Buffer.from('MZ'));
    const rejected = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/media',
      headers: exe.headers,
      payload: exe.payload,
    });
    expect(rejected.statusCode).toBe(400);

    const mismatch = multipartFile('script.html', 'image/gif', TINY_GIF);
    const rejected2 = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/media',
      headers: mismatch.headers,
      payload: mismatch.payload,
    });
    expect(rejected2.statusCode).toBe(400);
  });
});

describe('sitemap and stats', () => {
  let t: TestServer;

  beforeEach(async () => {
    t = await createTestServer({ name: 'sitemap' });
  });

  afterEach(async () => {
    await t.close();
  });

  it('lists pages and published forms in the sitemap', async () => {
    await t.server.inject({
      method: 'POST',
      url: '/api/reverso/schema/sync',
      payload: { schema: HOME_SCHEMA },
    });
    const form = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/forms',
      payload: { name: 'Contact', slug: 'contact' },
    });
    await t.server.inject({ method: 'PUT', url: `/api/reverso/forms/${json(form).data.id}/publish` });
    await t.server.inject({ method: 'POST', url: '/api/reverso/sitemap/invalidate' });

    const res = await t.server.inject({ method: 'GET', url: '/api/reverso/sitemap.xml' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    expect(res.payload).toContain('<urlset');
    expect(res.payload).toContain('/forms/contact');
  });

  it('exposes dashboard stats', async () => {
    await t.server.inject({
      method: 'POST',
      url: '/api/reverso/schema/sync',
      payload: { schema: HOME_SCHEMA },
    });
    const res = await t.server.inject({ method: 'GET', url: '/api/reverso/stats' });
    expect(res.statusCode).toBe(200);
    expect(json(res).data.pages.total).toBe(1);
    expect(json(res).data.fields.total).toBe(2);
  });

  it('public page read: 404 for unknown pages, cache header and published-only content', async () => {
    const missing = await t.server.inject({ method: 'GET', url: '/api/reverso/public/content/page/nope' });
    expect(missing.statusCode).toBe(404);

    await t.server.inject({
      method: 'POST',
      url: '/api/reverso/schema/sync',
      payload: { schema: HOME_SCHEMA },
    });
    await t.server.inject({
      method: 'PATCH',
      url: '/api/reverso/content/page/home',
      payload: { data: { 'home.hero.title': 'Public title' } },
    });
    const res = await t.server.inject({ method: 'GET', url: '/api/reverso/public/content/page/home' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toMatch(/s-maxage/);
    expect(json(res).data.content['home.hero.title']).toBe('Public title');

    // A "homepage" page must not leak into "home" (prefix is path-segment aware).
    const other = { ...HOME_SCHEMA, pages: [{ ...HOME_SCHEMA.pages[0]!, slug: 'homepage', name: 'Homepage',
      sections: [{ ...HOME_SCHEMA.pages[0]!.sections[0]!, fields: [{ ...HOME_SCHEMA.pages[0]!.sections[0]!.fields[0]!, path: 'homepage.hero.title' }] }] }] };
    await t.server.inject({ method: 'POST', url: '/api/reverso/schema/sync', payload: { schema: other, deleteRemoved: false } });
    await t.server.inject({ method: 'PATCH', url: '/api/reverso/content/page/homepage', payload: { data: { 'homepage.hero.title': 'Other' } } });
    const home = json(await t.server.inject({ method: 'GET', url: '/api/reverso/public/content/page/home' }));
    expect(Object.keys(home.data.content)).toEqual(['home.hero.title']);

    const locale = await t.server.inject({ method: 'GET', url: '/api/reverso/public/content/page/home?locale=pt-br' });
    expect(locale.statusCode).toBe(200);
  });

  it('returns field options and config to the editor', async () => {
    await t.server.inject({
      method: 'POST',
      url: '/api/reverso/schema/sync',
      payload: { schema: HOME_SCHEMA },
    });
    const page = json(await t.server.inject({ method: 'GET', url: '/api/reverso/pages/home' }));
    const plan = page.data.sections[0].fields.find((f: { path: string }) => f.path === 'home.hero.plan');
    expect(plan.type).toBe('radio');
    expect(JSON.parse(plan.options)).toEqual([
      { label: 'free', value: 'free' },
      { label: 'pro', value: 'pro' },
    ]);
  });
});
