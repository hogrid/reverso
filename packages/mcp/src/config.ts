/**
 * Configuration of the MCP server: where the Reverso API is and which key to
 * use. Both come from the environment (or CLI flags), never from a database
 * path: the MCP server is a client of the API.
 */

export const DEFAULT_API_URL = 'http://localhost:3001';

/** Same lower bound the API applies to tokens it is willing to compare. */
export const MIN_API_KEY_LENGTH = 16;

export interface ResolvedMcpConfig {
  apiUrl: string;
  apiKey: string;
}

export interface McpConfigOverrides {
  apiUrl?: string;
  apiKey?: string;
}

/**
 * Validate an API key, returning a clear message when it cannot be used.
 */
export function validateApiKey(apiKey: string | undefined): string {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      'REVERSO_API_KEY is required. Set it to the admin API key of your Reverso CMS (the same value the API runs with) or pass --api-key.'
    );
  }
  if (apiKey.length < MIN_API_KEY_LENGTH) {
    throw new Error(
      `REVERSO_API_KEY is too short: it must be at least ${MIN_API_KEY_LENGTH} characters (the API refuses shorter keys).`
    );
  }
  return apiKey;
}

/**
 * Resolve the configuration from explicit overrides (CLI flags) and the
 * environment. Throws with an actionable message when the key is missing or
 * unusable, so the server refuses to start instead of failing on the first
 * tool call.
 */
export function resolveMcpConfig(
  env: Record<string, string | undefined> = process.env,
  overrides: McpConfigOverrides = {}
): ResolvedMcpConfig {
  const apiKey = validateApiKey(overrides.apiKey ?? env.REVERSO_API_KEY);
  const rawUrl = overrides.apiUrl ?? env.REVERSO_API_URL ?? DEFAULT_API_URL;
  const apiUrl = rawUrl.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//.test(apiUrl)) {
    throw new Error(`REVERSO_API_URL must be an http(s) URL, got "${rawUrl}".`);
  }
  return { apiUrl, apiKey };
}
