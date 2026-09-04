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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      // Always send the httpOnly session cookie (also through the Vite proxy).
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      if (response.status === 401) notifyUnauthorized();
      const errBody = (data ?? {}) as Partial<ApiError>;
      throw {
        success: false,
        error: errBody.error || 'Unknown error',
        message: errBody.message,
        statusCode: response.status,
      } as ApiError;
    }

    return data as ApiResponse<T>;
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' });
  }

  async upload<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      // Don't set Content-Type header for FormData
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      if (response.status === 401) notifyUnauthorized();
      const errBody = (data ?? {}) as Partial<ApiError>;
      throw {
        success: false,
        error: errBody.error || 'Unknown error',
        message: errBody.message,
        statusCode: response.status,
      } as ApiError;
    }

    return data as ApiResponse<T>;
  }
}

export const apiClient = new ApiClient();

export default apiClient;
