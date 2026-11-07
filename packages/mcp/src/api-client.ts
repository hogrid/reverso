/**
 * Thin HTTP client for the Reverso REST API.
 *
 * The MCP server never opens the database itself: every tool and resource
 * goes through the API with the configured key, so the API's validation,
 * role checks, publish semantics and webhooks apply to AI-driven edits
 * exactly as they do to the admin editor.
 */

export interface ReversoApiClientOptions {
  /** Base URL of the Reverso API, e.g. `http://localhost:3001`. */
  baseUrl: string;
  /** Admin API key sent as `X-API-Key`. */
  apiKey: string;
  /** API route prefix (default `/api/reverso`). */
  prefix?: string;
  /** Fetch implementation (default: global `fetch`); injectable for tests. */
  fetch?: typeof fetch;
}

/** Envelope every Reverso API route answers with. */
interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: string;
  message?: string;
}

export interface ApiResult<T> {
  data: T;
  meta?: Record<string, unknown>;
}

type QueryValue = string | number | boolean | undefined | null;

/**
 * Error raised when the API answers with a non-2xx status (or cannot be
 * reached). `status` is the HTTP status (0 when the request never got an
 * answer) and `message` is a sentence an AI client can show as-is.
 */
export class ReversoApiError extends Error {
  readonly status: number;
  readonly method: string;
  readonly path: string;
  readonly apiError?: string;

  constructor(options: { status: number; method: string; path: string; message: string; apiError?: string }) {
    super(options.message);
    this.name = 'ReversoApiError';
    this.status = options.status;
    this.method = options.method;
    this.path = options.path;
    this.apiError = options.apiError;
  }

  /** Plain object for tool results (`{ error: true, status, message }`). */
  toJSON(): { error: true; status: number; message: string; method: string; path: string } {
    return { error: true, status: this.status, message: this.message, method: this.method, path: this.path };
  }
}

/** Human-readable explanation per status, prefixed to the API's own message. */
function describeStatus(status: number, method: string, path: string, apiMessage: string | undefined): string {
  const detail = apiMessage ? `: ${apiMessage}` : '';
  switch (status) {
    case 400:
      return `Invalid request (400) for ${method} ${path}${detail}`;
    case 401:
      return `Unauthorized (401): the Reverso API rejected the configured REVERSO_API_KEY${detail}`;
    case 403:
      return `Forbidden (403): the configured API key is not allowed to ${method} ${path}${detail}`;
    case 404:
      return `Not found (404)${detail || `: ${method} ${path}`}`;
    case 429:
      return `Rate limited (429) by the Reverso API${detail}`;
    default:
      return `Reverso API error (${status}) for ${method} ${path}${detail}`;
  }
}

export class ReversoApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly prefix: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ReversoApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.apiKey = options.apiKey;
    this.prefix = options.prefix ?? '/api/reverso';
    this.fetchImpl = options.fetch ?? globalThis.fetch;
  }

  /** Absolute URL for an API path (`/pages`, `/content/home.hero.title`, ...). */
  url(path: string, query?: Record<string, QueryValue>): string {
    const url = new URL(`${this.baseUrl}${this.prefix}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === '') continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  get<T>(path: string, query?: Record<string, QueryValue>): Promise<ApiResult<T>> {
    return this.request<T>('GET', path, { query });
  }

  post<T>(path: string, body?: unknown, query?: Record<string, QueryValue>): Promise<ApiResult<T>> {
    return this.request<T>('POST', path, { body, query });
  }

  put<T>(path: string, body?: unknown, query?: Record<string, QueryValue>): Promise<ApiResult<T>> {
    return this.request<T>('PUT', path, { body, query });
  }

  patch<T>(path: string, body?: unknown, query?: Record<string, QueryValue>): Promise<ApiResult<T>> {
    return this.request<T>('PATCH', path, { body, query });
  }

  delete<T>(path: string, query?: Record<string, QueryValue>): Promise<ApiResult<T>> {
    return this.request<T>('DELETE', path, { query });
  }

  private async request<T>(
    method: string,
    path: string,
    options: { body?: unknown; query?: Record<string, QueryValue> }
  ): Promise<ApiResult<T>> {
    const url = this.url(path, options.query);
    const headers: Record<string, string> = {
      accept: 'application/json',
      'x-api-key': this.apiKey,
    };
    let body: string | undefined;
    if (options.body !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await this.fetchImpl(url, { method, headers, body });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new ReversoApiError({
        status: 0,
        method,
        path,
        message: `Could not reach the Reverso API at ${this.baseUrl} (${reason}). Is the CMS running? Check REVERSO_API_URL.`,
      });
    }

    const text = await response.text();
    let envelope: ApiEnvelope<T> | undefined;
    if (text) {
      try {
        envelope = JSON.parse(text) as ApiEnvelope<T>;
      } catch {
        envelope = undefined;
      }
    }

    if (!response.ok || (envelope && envelope.success === false)) {
      throw new ReversoApiError({
        status: response.status,
        method,
        path,
        apiError: envelope?.error,
        message: describeStatus(response.status, method, path, envelope?.message ?? envelope?.error),
      });
    }

    if (!envelope) {
      throw new ReversoApiError({
        status: response.status,
        method,
        path,
        message: `The Reverso API returned a non-JSON response for ${method} ${path}`,
      });
    }

    return { data: envelope.data as T, meta: envelope.meta };
  }
}
