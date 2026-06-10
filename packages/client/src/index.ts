/**
 * @reverso/client — lightweight SDK for reading Reverso CMS content.
 *
 * Reads PUBLISHED content from the public Reverso API endpoints and exposes
 * it through a small, framework-agnostic helper. Designed for React Server
 * Components, but works in any JavaScript runtime with `fetch`.
 *
 * If the Reverso API is unreachable, all helpers fall back to the provided
 * default values so the frontend keeps rendering its hardcoded content.
 */

/** A single repeater item: sub-field name → value. */
export type ReversoRepeaterItem = Record<string, unknown>;

/** Subset of the Fetch API `RequestCache` modes (kept local so the SDK builds without DOM lib types). */
export type ReversoCacheMode =
  | 'default'
  | 'force-cache'
  | 'no-cache'
  | 'no-store'
  | 'only-if-cached'
  | 'reload';

/** Options accepted by {@link createReversoClient}. */
export interface ReversoClientOptions {
  /** Base URL of the Reverso API server (e.g. `http://localhost:3001`). */
  url: string;
  /** Content locale (defaults to the API's default locale). */
  locale?: string;
  /** Request timeout in milliseconds (default: 5000). */
  timeoutMs?: number;
  /**
   * Fetch cache mode. Defaults to `no-store` so edits show up immediately.
   * Pass `default` (plus your framework's revalidation) for cached reads.
   */
  cache?: ReversoCacheMode;
  /**
   * Observability hook called whenever a request fails (network error,
   * timeout, non-2xx status). The client still falls back to default
   * content; this only surfaces the failure so it isn't swallowed silently.
   */
  onError?: (error: { path: string; status?: number; cause?: unknown }) => void;
}

/** Content of a single page, with typed accessors. */
export interface ReversoPage {
  /** Page slug this content belongs to. */
  slug: string;
  /** Raw flat map of `page.section.field` → value (published content only). */
  content: Record<string, unknown>;
  /**
   * Get a field value by its full marker path (`page.section.field`).
   * Returns `fallback` when the field has no published content.
   */
  get<T = string>(path: string, fallback: T): T;
  /**
   * Get repeater items for a section (`page.section`). Returns the published
   * item array, or `fallback` (default `[]`) when none exists.
   */
  items(sectionPath: string, fallback?: ReversoRepeaterItem[]): ReversoRepeaterItem[];
}

/** Client returned by {@link createReversoClient}. */
export interface ReversoClient {
  /** Fetch all published content for a page. Never throws; falls back to empty content. */
  getPage(slug: string): Promise<ReversoPage>;
  /** Fetch a single published value by path, or `fallback` when unavailable. */
  getValue<T = string>(path: string, fallback: T): Promise<T>;
}

interface PublicPageResponse {
  success: boolean;
  data?: {
    page: string;
    content?: Record<string, unknown>;
  };
}

interface PublicValueResponse {
  success: boolean;
  data?: {
    value?: unknown;
  };
}

function buildPage(slug: string, content: Record<string, unknown>): ReversoPage {
  return {
    slug,
    content,
    get<T>(path: string, fallback: T): T {
      const value = content[path];
      if (value === undefined || value === null || value === '') {
        return fallback;
      }
      return value as T;
    },
    items(sectionPath: string, fallback: ReversoRepeaterItem[] = []): ReversoRepeaterItem[] {
      const value = content[`${sectionPath}.$`];
      if (!Array.isArray(value) || value.length === 0) {
        return fallback;
      }
      return value as ReversoRepeaterItem[];
    },
  };
}

/**
 * Create a Reverso content client.
 *
 * @example
 * ```ts
 * const reverso = createReversoClient({ url: 'http://localhost:3001' });
 * const home = await reverso.getPage('home');
 * const title = home.get('home.hero.title', 'Welcome');
 * const posts = home.items('home.posts');
 * ```
 */
export function createReversoClient(options: ReversoClientOptions): ReversoClient {
  const baseUrl = options.url.replace(/\/+$/, '');
  const timeoutMs = options.timeoutMs ?? 5000;
  const cache = options.cache ?? 'no-store';

  async function fetchJson<T>(path: string): Promise<T | undefined> {
    const url = new URL(`${baseUrl}${path}`);
    if (options.locale) {
      url.searchParams.set('locale', options.locale);
    }

    try {
      const response = await fetch(url, {
        cache,
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept: 'application/json' },
      });
      if (!response.ok) {
        options.onError?.({ path, status: response.status });
        return undefined;
      }
      return (await response.json()) as T;
    } catch (cause) {
      // API unreachable — callers fall back to their default content.
      // The failure is surfaced via onError so it isn't swallowed silently.
      options.onError?.({ path, cause });
      return undefined;
    }
  }

  return {
    async getPage(slug: string): Promise<ReversoPage> {
      const body = await fetchJson<PublicPageResponse>(
        `/api/reverso/public/content/page/${encodeURIComponent(slug)}`
      );
      const content = body?.success ? (body.data?.content ?? {}) : {};
      return buildPage(slug, content);
    },

    async getValue<T>(path: string, fallback: T): Promise<T> {
      const body = await fetchJson<PublicValueResponse>(
        `/api/reverso/public/content/${encodeURIComponent(path)}`
      );
      const value = body?.success ? body.data?.value : undefined;
      if (value === undefined || value === null || value === '') {
        return fallback;
      }
      return value as T;
    },
  };
}
