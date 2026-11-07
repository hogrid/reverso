/**
 * API Client for Reverso CMS Admin
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}

// TD-012: cap every request so a hung/slow backend can't block forever.
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Parse a response body as JSON, tolerating empty or non-JSON payloads
 * (e.g. an HTML 502/504 error page) instead of throwing a SyntaxError.
 */
async function parseJsonSafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return {};
  }
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * Name of the DOM event dispatched when the API answers 401. The auth store
 * listens for it and sends the user back to the login page.
 */
export const UNAUTHORIZED_EVENT = 'reverso:unauthorized';

function notifyUnauthorized(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
}

/** Upload timeout: 30s base + 1s per MB, capped at 10 minutes. */
const UPLOAD_BASE_TIMEOUT_MS = 30_000;
const UPLOAD_MAX_TIMEOUT_MS = 10 * 60_000;

export function uploadTimeoutMs(bytes: number): number {
  const perMb = Math.ceil(Math.max(0, bytes) / (1024 * 1024)) * 1000;
  return Math.min(UPLOAD_BASE_TIMEOUT_MS + perMb, UPLOAD_MAX_TIMEOUT_MS);
}

function formDataSize(formData: FormData): number {
  let total = 0;
  for (const [, value] of formData.entries()) {
    total += typeof value === 'string' ? value.length : value.size;
  }
  return total;
}

export interface DownloadedFile {
  blob: Blob;
  filename: string;
}

/** Extract the filename from a Content-Disposition header, if any. */
function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''));
    } catch {
      // fall through to the plain filename parameter
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1]?.trim() || null;
}

async function toApiError(response: Response): Promise<ApiError> {
  if (response.status === 401) notifyUnauthorized();
  const errBody = ((await parseJsonSafe(response)) ?? {}) as Partial<ApiError>;
  return {
    success: false,
    error: errBody.error || 'Unknown error',
    message: errBody.message,
    statusCode: response.status,
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    url: string,
    options: RequestInit & { json?: unknown } = {}
  ): Promise<ApiResponse<T>> {
    const { json, headers, ...init } = options;
    const hasBody = json !== undefined;
    const response = await fetch(`${this.baseUrl}${url}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      // Always send the httpOnly session cookie (also through the Vite proxy).
      credentials: 'include',
      ...init,
      // Only declare a JSON body when there is one: Fastify answers 400 to a
      // request that says application/json but carries an empty body.
      ...(hasBody ? { body: JSON.stringify(json) } : {}),
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    return (await parseJsonSafe(response)) as ApiResponse<T>;
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', json: body });
  }

  async put<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', json: body });
  }

  async patch<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', json: body });
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' });
  }

  /**
   * Fetch a non-JSON payload (e.g. a CSV export) as a Blob, keeping the
   * session cookie. The filename comes from Content-Disposition when present.
   */
  async download(
    url: string,
    options: { method?: 'GET' | 'POST'; body?: unknown; fallbackFilename?: string } = {}
  ): Promise<DownloadedFile> {
    const hasBody = options.body !== undefined;
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS * 6),
      ...(hasBody
        ? { body: JSON.stringify(options.body), headers: { 'Content-Type': 'application/json' } }
        : {}),
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    const blob = await response.blob();
    const filename =
      filenameFromDisposition(response.headers.get('content-disposition')) ??
      options.fallbackFilename ??
      'download';
    return { blob, filename };
  }

  async upload<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      // Large files on slow links need far longer than the JSON request cap.
      signal: AbortSignal.timeout(uploadTimeoutMs(formDataSize(formData))),
      // Don't set Content-Type header for FormData
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    return (await parseJsonSafe(response)) as ApiResponse<T>;
  }
}

export const apiClient = new ApiClient();

export default apiClient;
