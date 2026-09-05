/**
 * Environment-derived server defaults must survive callers that forward
 * options they did not resolve (`trustProxy: options.trustProxy` → undefined).
 */

import { afterEach, describe, expect, it } from 'vitest';
import { createServer } from '../server.js';

async function observedClient(options: { trustProxy?: boolean }) {
  const server = await createServer({ ...options, logger: false });
  server.get('/__client', async (request) => ({ ip: request.ip, protocol: request.protocol }));
  try {
    const res = await server.inject({
      method: 'GET',
      url: '/__client',
      remoteAddress: '10.0.0.1',
      headers: { 'x-forwarded-for': '203.0.113.9', 'x-forwarded-proto': 'https' },
    });
    return res.json() as { ip: string; protocol: string };
  } finally {
    await server.close();
  }
}

describe('createServer defaults', () => {
  const original = process.env.REVERSO_TRUST_PROXY;

  afterEach(() => {
    if (original === undefined) delete process.env.REVERSO_TRUST_PROXY;
    else process.env.REVERSO_TRUST_PROXY = original;
  });

  it('keeps REVERSO_TRUST_PROXY when trustProxy is passed as undefined', async () => {
    process.env.REVERSO_TRUST_PROXY = 'true';
    const seen = await observedClient({ trustProxy: undefined });
    expect(seen.ip).toBe('203.0.113.9');
    expect(seen.protocol).toBe('https');
  });

  it('ignores forwarded headers when the proxy is not trusted', async () => {
    delete process.env.REVERSO_TRUST_PROXY;
    const seen = await observedClient({});
    expect(seen.ip).toBe('10.0.0.1');
    expect(seen.protocol).toBe('http');
  });

  it('lets an explicit option override the environment', async () => {
    process.env.REVERSO_TRUST_PROXY = 'true';
    const seen = await observedClient({ trustProxy: false });
    expect(seen.ip).toBe('10.0.0.1');
  });
});
