import { createReversoClient } from '@reverso/client';

/**
 * Shared Reverso content client.
 * Reads published content from the Reverso API started by `reverso dev`.
 *
 * `REVERSO_URL` is read at runtime by server components, so the same build
 * can point at a different API per environment. `NEXT_PUBLIC_REVERSO_URL`
 * is inlined by Next.js at build time and only kept as a fallback.
 */
export const reverso = createReversoClient({
  url: process.env.REVERSO_URL ?? process.env.NEXT_PUBLIC_REVERSO_URL ?? 'http://localhost:3001',
});
