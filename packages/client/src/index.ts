/**
 * @reverso/client — lightweight SDK for reading Reverso CMS content.
 *
 * Reads PUBLISHED content from the public Reverso API endpoints and exposes
 * it through a small, framework-agnostic helper. Designed for React Server
 * Components, but works in any JavaScript runtime with `fetch`.
 *
 * If the Reverso API is unreachable, all helpers fall back to the provided
 * default values so the frontend keeps rendering its hardcoded content.
 *
 * Value contract
 * --------------
 * Simple fields (text, textarea, number, boolean, select, date, color, ...)
 * are stored as primitives. Rich fields are stored as objects:
 *
 * | Field type            | Stored shape                                   |
 * |-----------------------|------------------------------------------------|
 * | image                 | { url, alt?, width?, height? }                 |
 * | file / video / audio  | { url, filename?, size?, mimeType? }           |
 * | gallery               | Array<{ url, alt? }>                           |
 * | map                   | { lat, lng, zoom?, address? }                  |
 * | code                  | { code, language? }                            |
 * | multiselect/checkbox  | string[]                                       |
 * | repeater (`a.b.$`)    | Array<Record<subField, value>>                 |
 *
 * `page.get(path, fallback)` always returns a value of the same kind as the
 * fallback: with a string fallback an image becomes its URL, a map becomes
 * "lat,lng", a code block becomes its source. Use the typed accessors
 * (`image`, `file`, `map`, `code`, `list`, `items`) when you need the full
 * object.
 */

/** A single repeater item: sub-field name → value. */
export type ReversoRepeaterItem = Record<string, unknown>;

/** Image field value. */
export interface ReversoImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

/** File, video or audio field value. */
export interface ReversoFile {
  url: string;
  filename?: string;
  size?: number;
  mimeType?: string;
}

/** Map field value. */
export interface ReversoMap {
  lat: number;
  lng: number;
  zoom?: number;
  address?: string;
}

/** Code field value. */
export interface ReversoCode {
  code: string;
  language?: string;
}

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
   * Returns `fallback` when the field has no published content, and coerces
   * the stored value to the kind of the fallback (see the value contract).
   */
  get<T = string>(path: string, fallback: T): T;
  /** Image field as an object, or `fallback` when unset. */
  image(path: string, fallback?: ReversoImage | null): ReversoImage | null;
  /** File/video/audio field as an object, or `fallback` when unset. */
  file(path: string, fallback?: ReversoFile | null): ReversoFile | null;
  /** Gallery field as an image list (empty when unset). */
  images(path: string, fallback?: ReversoImage[]): ReversoImage[];
  /** Map field as `{ lat, lng }`, or `fallback` when unset. */
  map(path: string, fallback?: ReversoMap | null): ReversoMap | null;
  /** Code field as `{ code, language }`, or `fallback` when unset. */
  code(path: string, fallback?: ReversoCode | null): ReversoCode | null;
  /** Multi-value field (multiselect, checkboxgroup, tags) as a string list. */
  list(path: string, fallback?: string[]): string[];
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/**
 * URL of a media value (image, file, video, gallery item), or `fallback`.
 * Accepts the stored object shape as well as a plain URL string, so it also
 * works on repeater item values: `mediaUrl(member.avatar, '/placeholder.jpg')`.
 */
export function mediaUrl(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value !== '') return value;
  if (isRecord(value) && typeof value.url === 'string' && value.url !== '') return value.url;
  return fallback;
}

/** Image object from a stored value (object or URL string), or `null`. */
export function toImage(value: unknown): ReversoImage | null {
  if (typeof value === 'string' && value !== '') return { url: value };
  if (isRecord(value) && typeof value.url === 'string' && value.url !== '') {
    return {
      url: value.url,
      alt: typeof value.alt === 'string' ? value.alt : undefined,
      width: typeof value.width === 'number' ? value.width : undefined,
      height: typeof value.height === 'number' ? value.height : undefined,
    };
  }
  return null;
}

/** File object from a stored value (object or URL string), or `null`. */
export function toFile(value: unknown): ReversoFile | null {
  if (typeof value === 'string' && value !== '') return { url: value };
  if (isRecord(value) && typeof value.url === 'string' && value.url !== '') {
    return {
      url: value.url,
      filename: typeof value.filename === 'string' ? value.filename : undefined,
      size: typeof value.size === 'number' ? value.size : undefined,
      mimeType: typeof value.mimeType === 'string' ? value.mimeType : undefined,
    };
  }
  return null;
}

/** Map object from a stored value (object or "lat,lng" string), or `null`. */
export function toMap(value: unknown): ReversoMap | null {
  if (isRecord(value) && typeof value.lat === 'number' && typeof value.lng === 'number') {
    return {
      lat: value.lat,
      lng: value.lng,
      zoom: typeof value.zoom === 'number' ? value.zoom : undefined,
      address: typeof value.address === 'string' ? value.address : undefined,
    };
  }
  if (typeof value === 'string') {
    const [lat, lng] = value.split(',').map((p) => Number.parseFloat(p.trim()));
    if (lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

/** Code object from a stored value (object or source string), or `null`. */
export function toCode(value: unknown): ReversoCode | null {
  if (typeof value === 'string' && value !== '') return { code: value };
  if (isRecord(value) && typeof value.code === 'string') {
    return {
      code: value.code,
      language: typeof value.language === 'string' ? value.language : undefined,
    };
  }
  return null;
}

/** String list from a stored value (array, JSON array string or CSV). */
export function toList(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === 'string' && value !== '') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) return parsed.map((v) => String(v));
      } catch {
        // fall through to CSV
      }
    }
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return null;
}

/**
 * Coerce a stored value to the kind of `fallback`, so `page.get()` never hands
 * an object to an `src`, a string to a boolean check, and so on.
 */
export function coerceLike<T>(value: unknown, fallback: T): T {
  if (isEmpty(value)) return fallback;

  switch (typeof fallback) {
    case 'string': {
      if (typeof value === 'string') return value as T;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value) as T;
      if (isRecord(value)) {
        if (typeof value.url === 'string') return value.url as T; // image, file, link
        if (typeof value.code === 'string') return value.code as T; // code
        if (typeof value.lat === 'number' && typeof value.lng === 'number') {
          return `${value.lat},${value.lng}` as T; // map
        }
        if (typeof value.html === 'string') return value.html as T; // blocks, oembed
        return fallback;
      }
      if (Array.isArray(value)) return value.map((v) => coerceLike(v, '')).join(', ') as T;
      return fallback;
    }
    case 'number': {
      if (typeof value === 'number') return value as T;
      const n = typeof value === 'string' ? Number(value) : Number.NaN;
      return Number.isFinite(n) ? (n as T) : fallback;
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value as T;
      if (value === 'true' || value === 1 || value === '1') return true as T;
      if (value === 'false' || value === 0 || value === '0') return false as T;
      return fallback;
    }
    default: {
      if (Array.isArray(fallback)) {
        const list = Array.isArray(value) ? value : toList(value);
        return (list ?? fallback) as T;
      }
      return value as T;
    }
  }
}

function buildPage(slug: string, content: Record<string, unknown>): ReversoPage {
  const raw = (path: string): unknown => content[path];
  return {
    slug,
    content,
    get<T>(path: string, fallback: T): T {
      return coerceLike(raw(path), fallback);
    },
    image(path, fallback = null) {
      return toImage(raw(path)) ?? fallback;
    },
    file(path, fallback = null) {
      return toFile(raw(path)) ?? fallback;
    },
    images(path, fallback = []) {
      const value = raw(path);
      if (!Array.isArray(value) || value.length === 0) return fallback;
      const images = value.map(toImage).filter((img): img is ReversoImage => img !== null);
      return images.length > 0 ? images : fallback;
    },
    map(path, fallback = null) {
      return toMap(raw(path)) ?? fallback;
    },
    code(path, fallback = null) {
      return toCode(raw(path)) ?? fallback;
    },
    list(path, fallback = []) {
      const list = toList(raw(path));
      return list && list.length > 0 ? list : fallback;
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
 * const hero = home.image('home.hero.image');   // { url, alt } | null
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
      return coerceLike(value, fallback);
    },
  };
}
