/**
 * Form builder settings: the dialog must open with the form's real values and
 * saving must send exactly what the user sees (including cleared URLs).
 */

import { act } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormDetail } from '../api/hooks/useForms';
import { formToSettings, settingsToUpdate } from '../lib/form-settings';
import { FormBuilderPage } from '../pages/FormBuilderPage';
import { useToastStore } from '../stores/toast';
import { createTestQueryClient, render, waitFor, withQueryClient } from './render-helpers';

const FORM: FormDetail = {
  id: 'form-1',
  name: 'Contact',
  slug: 'contact',
  description: 'Talk to us',
  status: 'draft',
  createdAt: '',
  updatedAt: '',
  settings: {
    submitButtonText: 'Send it',
    successMessage: 'Thanks!',
    redirectUrl: 'https://example.com/thanks',
  },
  notifyEmails: ['a@example.com', 'b@example.com'],
  webhookUrl: 'https://example.com/hook',
  webhookEnabled: true,
  honeypotEnabled: false,
  rateLimitPerMinute: 25,
  fields: [],
  submissionStats: { total: 0, new: 0, read: 0, spam: 0, archived: 0 },
};

describe('formToSettings / settingsToUpdate', () => {
  it('maps the stored form into dialog values', () => {
    expect(formToSettings(FORM)).toEqual({
      name: 'Contact',
      slug: 'contact',
      description: 'Talk to us',
      submitButtonText: 'Send it',
      successMessage: 'Thanks!',
      redirectUrl: 'https://example.com/thanks',
      honeypotEnabled: false,
      rateLimitPerMinute: 25,
      notifyEmails: 'a@example.com, b@example.com',
      webhookUrl: 'https://example.com/hook',
      webhookEnabled: true,
    });
  });

  it('round-trips without losing values', () => {
    const update = settingsToUpdate(formToSettings(FORM));
    expect(update).toMatchObject({
      name: 'Contact',
      settings: {
        submitButtonText: 'Send it',
        successMessage: 'Thanks!',
        redirectUrl: 'https://example.com/thanks',
      },
      notifyEmails: ['a@example.com', 'b@example.com'],
      webhookUrl: 'https://example.com/hook',
      webhookEnabled: true,
      honeypotEnabled: false,
      rateLimitPerMinute: 25,
    });
  });

  it('clears URLs and drops empty notification emails', () => {
    const update = settingsToUpdate({
      ...formToSettings(FORM),
      redirectUrl: '  ',
      webhookUrl: '',
      notifyEmails: ' a@example.com, ,  ,b@example.com,',
    });
    // The settings JSON is replaced wholesale, so omitting redirectUrl clears it.
    expect(update.settings).not.toHaveProperty('redirectUrl');
    expect(update.webhookUrl).toBeNull();
    expect(update.notifyEmails).toEqual(['a@example.com', 'b@example.com']);
  });
});

describe('FormBuilderPage settings dialog', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    fetchMock = vi.fn(async (_input: string, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        return new Response(JSON.stringify({ success: true, data: { id: 'form-1' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, data: FORM }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('opens with the stored values and saves them back unchanged', async () => {
    const router = createMemoryRouter([{ path: '/forms/:id', element: <FormBuilderPage /> }], {
      initialEntries: ['/forms/form-1'],
    });
    await render(withQueryClient(createTestQueryClient())(<RouterProvider router={router} />));
    await waitFor(() => document.body.textContent?.includes('/contact') ?? false);

    const settingsButton = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Settings'
    );
    await act(async () => {
      settingsButton?.click();
    });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    const inputs = Array.from(dialog?.querySelectorAll('input') ?? []).map((i) => i.value);
    expect(inputs).toContain('Contact');
    expect(inputs).toContain('contact');
    expect(inputs).toContain('Send it');
    expect(inputs).toContain('https://example.com/thanks');

    const save = Array.from(dialog?.querySelectorAll('button') ?? []).find(
      (b) => b.textContent === 'Save Settings'
    );
    await act(async () => {
      save?.click();
    });
    await waitFor(() => fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT'));
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT') as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(put[1].body as string);
    expect(body).toMatchObject({
      name: 'Contact',
      settings: { submitButtonText: 'Send it', redirectUrl: 'https://example.com/thanks' },
      notifyEmails: ['a@example.com', 'b@example.com'],
      webhookUrl: 'https://example.com/hook',
      honeypotEnabled: false,
      rateLimitPerMinute: 25,
    });
    await waitFor(() => useToastStore.getState().toasts.length > 0);
    expect(useToastStore.getState().toasts[0]).toMatchObject({ variant: 'success' });
  });
});
