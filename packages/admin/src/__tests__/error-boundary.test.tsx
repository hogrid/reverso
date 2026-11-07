/**
 * Route-level error element and SelectField's guard against empty option
 * values (Radix SelectItem throws on value="").
 */

import { act } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouteErrorBoundary } from '../components/common/RouteErrorBoundary';
import { SelectField } from '../components/fields/SelectField';
import { render } from './render-helpers';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function Boom(): never {
  throw new Error('kaboom');
}

describe('RouteErrorBoundary', () => {
  it('renders a friendly card with a reload button when a route throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const router = createMemoryRouter([
      { path: '/', element: <Boom />, errorElement: <RouteErrorBoundary /> },
    ]);
    const { container } = await render(<RouterProvider router={router} />);
    expect(container.textContent).toContain('Something went wrong');
    expect(container.textContent).toContain('kaboom');
    const reload = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Reload')
    );
    expect(reload).toBeDefined();
  });
});

describe('SelectField', () => {
  it('does not crash on options with an empty value', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // jsdom lacks the pointer/scroll APIs Radix Select calls when opening.
    const proto = Element.prototype as unknown as Record<string, unknown>;
    proto.scrollIntoView ??= () => {};
    proto.hasPointerCapture ??= () => false;
    proto.releasePointerCapture ??= () => {};
    const field = {
      path: 'home.hero.align',
      type: 'select',
      options: JSON.stringify([
        { value: '', label: 'None' },
        { value: 'left', label: 'Left' },
      ]),
    } as never;
    const { container } = await render(
      <SelectField field={field} value="left" onChange={() => {}} />
    );
    expect(container.querySelector('#home\\.hero\\.align')).not.toBeNull();
    // Open the dropdown: Radix renders SelectItems only when open, and an
    // item with value="" throws at that point.
    const trigger = container.querySelector<HTMLButtonElement>('button[role="combobox"]');
    await act(async () => {
      trigger?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
      trigger?.click();
    });
    const optionLabels = Array.from(document.querySelectorAll('[role="option"]')).map(
      (o) => o.textContent
    );
    expect(optionLabels).not.toContain('None');
  });
});
