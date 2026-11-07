/**
 * Security utilities for the API.
 */

import crypto from 'node:crypto';
import { lookup as dnsLookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * Blocked hostnames for SSRF protection.
 */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'metadata.google.internal',
  'metadata.google.com',
]);

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

const PRIVATE_V4_CIDRS: Array<[string, number]> = [
  ['0.0.0.0', 8], // current network
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, cloud metadata
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved + broadcast
];

function isPrivateIPv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  return PRIVATE_V4_CIDRS.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (value & mask) === (ipv4ToInt(base) & mask);
  });
}

/** IPv4 embedded in an IPv4-mapped/compatible IPv6 address, if any. */
function embeddedIPv4(ip: string): string | null {
  const lower = ip.toLowerCase();
  const dotted = lower.match(/^(?:::ffff:|::)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted?.[1]) return dotted[1];
  const hex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex?.[1] && hex[2]) {
    const hi = Number.parseInt(hex[1], 16);
    const lo = Number.parseInt(hex[2], 16);
    return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  return null;
}

/**
 * Is this literal IP address private, loopback, link-local or otherwise not
 * a public internet host?
 */
export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) {
    const mapped = embeddedIPv4(ip);
    if (mapped) return isPrivateIPv4(mapped);
    const lower = ip.toLowerCase();
    return (
      lower === '::' ||
      lower === '::1' ||
      /^f[cd]/.test(lower) || // fc00::/7 unique local
      /^fe[89ab]/.test(lower) || // fe80::/10 link-local
      /^ff/.test(lower) // multicast
    );
  }
  return false;
}

/**
 * Check if a URL is safe for server-side requests (SSRF protection).
 * Blocks private IPs (IPv4, IPv6, mapped forms), localhost, cloud metadata
 * endpoints and URLs with credentials. Hostnames are checked again against
 * DNS right before connecting, see {@link assertPublicHost}.
 */
export function isUrlSafeForSSRF(urlString: string): { safe: boolean; reason?: string } {
  try {
    const url = new URL(urlString);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return { safe: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
    }
    if (url.username || url.password) {
      return { safe: false, reason: 'URLs with credentials are not allowed' };
    }

    // WHATWG URL already normalises 0x7f000001, 2130706433, 127.1 to dotted
    // IPv4; IPv6 literals keep their brackets.
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
    if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost')) {
      return { safe: false, reason: 'Blocked hostname' };
    }
    if (isPrivateAddress(hostname)) {
      return { safe: false, reason: 'Private IP addresses are not allowed' };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }
}

type Lookup = (hostname: string) => Promise<Array<{ address: string; family: number }>>;

const defaultLookup: Lookup = (hostname) => dnsLookup(hostname, { all: true, verbatim: true });

/**
 * Resolve the URL's hostname and reject it when any address is private.
 * Call this right before a server-side request: a public-looking name can
 * point at 127.0.0.1 or the cloud metadata service.
 */
export async function assertPublicHost(urlString: string, lookup: Lookup = defaultLookup): Promise<void> {
  const check = isUrlSafeForSSRF(urlString);
  if (!check.safe) throw new Error(check.reason ?? 'Unsafe URL');
  const hostname = new URL(urlString).hostname.replace(/^\[|\]$/g, '');
  if (isIP(hostname)) return;
  const addresses = await lookup(hostname);
  if (addresses.length === 0) throw new Error(`Could not resolve ${hostname}`);
  for (const { address } of addresses) {
    if (isPrivateAddress(address)) {
      throw new Error(`${hostname} resolves to a private address (${address})`);
    }
  }
}

/**
 * Allowed redirect domains (empty means only relative URLs allowed).
 * Configure via REVERSO_ALLOWED_REDIRECT_DOMAINS environment variable.
 */
function getAllowedRedirectDomains(): string[] {
  const envDomains = process.env.REVERSO_ALLOWED_REDIRECT_DOMAINS;
  if (envDomains) {
    return envDomains.split(',').map((d) => d.trim().toLowerCase());
  }
  return [];
}

/**
 * Check if a redirect URL is safe (prevents open redirect attacks).
 * Only allows relative URLs or URLs to whitelisted domains.
 */
export function isRedirectUrlSafe(urlString: string | undefined | null): { safe: boolean; reason?: string } {
  if (!urlString) {
    return { safe: true }; // No redirect is safe
  }

  // Allow relative URLs (must start with /)
  if (urlString.startsWith('/') && !urlString.startsWith('//')) {
    return { safe: true };
  }

  try {
    const url = new URL(urlString);

    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { safe: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
    }

    // Check against allowed domains
    const allowedDomains = getAllowedRedirectDomains();
    const hostname = url.hostname.toLowerCase();

    if (allowedDomains.length === 0) {
      return { safe: false, reason: 'External redirects are not allowed. Use relative URLs or configure REVERSO_ALLOWED_REDIRECT_DOMAINS' };
    }

    const isAllowed = allowedDomains.some((domain) => {
      // Exact match or subdomain match
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });

    if (!isAllowed) {
      return { safe: false, reason: `Domain "${hostname}" is not in the allowed list` };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }
}

/**
 * Generate HMAC-SHA256 signature for webhook payloads.
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Verify HMAC-SHA256 signature for webhook payloads.
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = generateWebhookSignature(payload, secret);
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Validate token format and length.
 */
export function isValidTokenFormat(token: string): boolean {
  // Session tokens are 64 hex characters (32 bytes)
  // API keys can vary but should be reasonable length
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Max reasonable length for a token
  if (token.length > 256) {
    return false;
  }

  // Min length for security
  if (token.length < 16) {
    return false;
  }

  return true;
}


/**
 * Whether cookies should carry the `Secure` flag for this request.
 *
 * REVERSO_COOKIE_SECURE:
 *   - "auto" (default): Secure when the request arrived over HTTPS (behind a
 *     proxy this needs REVERSO_TRUST_PROXY=true so X-Forwarded-Proto counts).
 *     Plain-HTTP deployments (internal networks, first boot before TLS) keep
 *     working instead of silently dropping the login cookie.
 *   - "true": always Secure (recommended once TLS is in place).
 *   - "false": never Secure.
 */
export function cookieSecure(request: { protocol: string }): boolean {
  const setting = (process.env.REVERSO_COOKIE_SECURE ?? 'auto').toLowerCase();
  if (setting === 'true') return true;
  if (setting === 'false') return false;
  return request.protocol === 'https';
}

/**
 * CORS origin setting from REVERSO_CORS_ORIGIN: `*`, a single origin or a
 * comma-separated list. Undefined when the variable is not set.
 */
export function corsOriginFromEnv(): string | string[] | boolean | undefined {
  const raw = process.env.REVERSO_CORS_ORIGIN?.trim();
  if (!raw) return undefined;
  if (raw === '*' || raw === 'true') return true;
  const list = raw.split(',').map((o) => o.trim()).filter(Boolean);
  return list.length === 1 ? list[0] : list;
}

/**
 * The effective CORS origin: an explicit setting wins, then
 * REVERSO_CORS_ORIGIN, then any origin in development and none in
 * production.
 *
 * The CORS plugin and the auth plugin's cross-site check both resolve
 * through this function, so a deployment can never end up allowing an
 * origin for reads while rejecting its writes (or the reverse).
 */
export function resolveCorsOrigin(
  configured?: string | string[] | boolean
): string | string[] | boolean {
  if (configured !== undefined) return configured;
  const fromEnv = corsOriginFromEnv();
  if (fromEnv !== undefined) return fromEnv;
  return process.env.NODE_ENV !== 'production';
}

/**
 * Origins allowed to send cookie-authenticated *writes*, on top of the
 * server's own host: `true` for any, otherwise a list. Entries may be a full
 * origin ("https://cms.example.com", with or without a trailing slash) or a
 * bare host ("cms.example.com").
 *
 * Only a deliberate setting counts here. `resolveCorsOrigin` falls back to
 * "any origin" in development so a frontend on another port can read the
 * API, and reading is not writing: inheriting that default would silently
 * turn every development server into a CSRF target.
 */
export function trustedOriginsFrom(
  configured?: string | string[] | boolean
): true | string[] {
  const value = configured ?? corsOriginFromEnv();
  if (value === undefined || value === false) return [];
  if (value === true) return true;
  return (Array.isArray(value) ? value : [value])
    .map((entry) => entry.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}
