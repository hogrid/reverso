/**
 * `reverso dev` port selection and startup hints.
 *
 * Silently moving to another port when the user asked for one leaves the
 * frontend SDK calling the old port and rendering fallbacks, so an explicit
 * port that is busy must fail loudly; only the default may auto-increment.
 */

import { describe, expect, it } from 'vitest';
import { choosePort, isExplicitPort, noMarkersHint } from '../commands/dev.js';

const busy =
  (...ports: number[]) =>
  async (port: number) =>
    ports.includes(port);

describe('isExplicitPort', () => {
  it('is true for a --port flag, REVERSO_PORT or dev.port in the config', () => {
    expect(isExplicitPort({ port: '4000' }, {}, {})).toBe(true);
    expect(isExplicitPort({}, { REVERSO_PORT: '4000' }, {})).toBe(true);
    expect(isExplicitPort({}, {}, { dev: { port: 4000 } })).toBe(true);
  });

  it('is false when nothing sets the port', () => {
    expect(isExplicitPort({}, {}, {})).toBe(false);
    expect(isExplicitPort({}, { REVERSO_PORT: '  ' }, { dev: {} })).toBe(false);
    // The loaded config is merged with defaults, so dev.port equal to the
    // default (3001) is indistinguishable from "not set".
    expect(isExplicitPort({}, {}, { dev: { port: 3001 } })).toBe(false);
  });
});

describe('choosePort', () => {
  it('uses the requested port when it is free', async () => {
    await expect(choosePort({ port: 3001, explicit: false, isPortInUse: busy() })).resolves.toEqual({
      ok: true,
      port: 3001,
      changed: false,
    });
  });

  it('fails with a clear message when an explicit port is busy', async () => {
    const result = await choosePort({ port: 4000, explicit: true, isPortInUse: busy(4000) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('4000');
      expect(result.message).toMatch(/in use/i);
    }
  });

  it('moves to the next free port when the default is busy', async () => {
    await expect(
      choosePort({ port: 3001, explicit: false, isPortInUse: busy(3001, 3002) })
    ).resolves.toEqual({ ok: true, port: 3003, changed: true });
  });

  it('gives up after maxAttempts busy ports', async () => {
    const result = await choosePort({
      port: 3001,
      explicit: false,
      isPortInUse: async () => true,
      maxAttempts: 5,
    });
    expect(result.ok).toBe(false);
  });
});

describe('noMarkersHint', () => {
  it('names the scanned folder and the include patterns', () => {
    const hint = noMarkersHint('/project/app', ['**/*.tsx', '**/*.jsx']);
    expect(hint).toContain('/project/app');
    expect(hint).toContain('**/*.tsx');
    expect(hint).toContain('srcDir');
    expect(hint).toContain('data-reverso');
  });
});
