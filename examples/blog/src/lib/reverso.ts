import { createReversoClient } from '@reverso/client';

/**
 * Shared Reverso content client.
 * Reads published content from the Reverso API started by `reverso dev`.
 */
export const reverso = createReversoClient({
  url: process.env.NEXT_PUBLIC_REVERSO_URL ?? 'http://localhost:3001',
});
