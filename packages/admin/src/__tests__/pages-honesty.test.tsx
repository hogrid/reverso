/**
 * The dashboard, pages list and login page must only show what is true:
 * no fabricated trends, no hard-coded "Published" badge, and an explanation
 * when the first admin cannot be created from this browser.
 */

import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { PagesListPage } from '../pages/PagesListPage';
import { useAuthStore } from '../stores/auth';
import { createTestQueryClient, render, waitFor, withQueryClient } from './render-helpers';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const PAGES = [
  { slug: 'home', name: 'Home', sectionCount: 2, fieldCount: 5, sections: [], updatedAt: null },
];
const STATS = {
  pages: { total: 1, withContent: 1 },
  fields: { total: 5, byType: { text: 5 } },
  media: { total: 0, totalSize: 0, byType: {} },
  recentActivity: [],
};

let setupStatus: { needsSetup: boolean; canRegister: boolean } = {
  needsSetup: false,
  canRegister: false,
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const path = new URL(input, 'http://localhost').pathname;
      if (path.endsWith('/stats')) return json({ success: true, data: STATS });
      if (path.endsWith('/pages')) return json({ success: true, data: PAGES });
      if (path === '/auth/setup-status') return json(setupStatus);
      if (path === '/auth/me') return json({ message: 'no session' }, 401);
      return json({ success: true, data: [] });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

async function renderAt(element: React.ReactNode, path = '/') {
  const router = createMemoryRouter([{ path: '*', element }], { initialEntries: [path] });
  return render(withQueryClient(createTestQueryClient())(<RouterProvider router={router} />));
}

describe('DashboardPage', () => {
  it('shows real totals without fabricated trend percentages', async () => {
    await renderAt(<DashboardPage />);
    await waitFor(() => document.body.textContent?.includes('TOTAL PAGES') ?? false);
    const text = document.body.textContent ?? '';
    for (const fake of ['+12%', '+8%', '+24%', '-2%']) {
      expect(text).not.toContain(fake);
    }
  });
});

describe('PagesListPage', () => {
  it('does not claim pages are "Published"', async () => {
    await renderAt(<PagesListPage />, '/pages');
    await waitFor(() => document.body.textContent?.includes('/home') ?? false);
    expect(document.body.textContent).not.toContain('Published');
  });
});

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState(), true);
  });

  it('does not assume registration is open before the setup check returns', () => {
    expect(useAuthStore.getInitialState().canRegister).toBe(false);
  });

  it('explains how to create the first admin when registration is closed on a fresh install', async () => {
    setupStatus = { needsSetup: true, canRegister: false };
    await renderAt(<LoginPage />, '/login');
    await waitFor(() => useAuthStore.getState().needsSetup === true);
    const notice = document.querySelector('[data-testid="bootstrap-notice"]');
    expect(notice).not.toBeNull();
    expect(notice?.textContent).toContain('REVERSO_ALLOW_BOOTSTRAP=true');
    expect(document.body.textContent).not.toContain("Don't have an account? Create one");
  });

  it('opens in create-account mode when the first admin can register here', async () => {
    setupStatus = { needsSetup: true, canRegister: true };
    await renderAt(<LoginPage />, '/login');
    await waitFor(() => document.body.textContent?.includes('Create your account') ?? false);
    expect(document.querySelector('[data-testid="bootstrap-notice"]')).toBeNull();
  });

  it('shows the plain sign-in form for an installed site', async () => {
    setupStatus = { needsSetup: false, canRegister: false };
    await renderAt(<LoginPage />, '/login');
    await waitFor(() => useAuthStore.getState().needsSetup === false);
    expect(document.body.textContent).toContain('Sign in to your account');
    expect(document.querySelector('[data-testid="bootstrap-notice"]')).toBeNull();
  });
});
