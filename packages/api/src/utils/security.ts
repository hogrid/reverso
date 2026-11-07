/**
 * Security utilities for the API.
 */

import crypto from 'node:crypto';
import { lookup as dnsLookupCb } from 'node:dns';
import { lookup as dnsLookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
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

/** Expand an IPv6 address to its eight 16-bit groups (null if invalid). */
function ipv6Groups(ip: string): number[] | null {
  let addr = ip.toLowerCase().split('%')[0] ?? '';
  // Trailing dotted IPv4 (::ffff:1.2.3.4, ::1.2.3.4) becomes two groups.
  const v4 = addr.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4?.[1]) {
    if (isIP(v4[1]) !== 4) return null;
    const n = ipv4ToInt(v4[1]);
    addr = `${addr.slice(0, -v4[1].length)}${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const halves = addr.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 1) return null;
  const parts = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  const groups = parts.map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? Number.parseInt(g, 16) : Number.NaN));
  return groups.some(Number.isNaN) ? null : groups;
}

const groupsToV4 = (hi: number, lo: number): string => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;

function isPrivateIPv6(ip: string): boolean {
  const g = ipv6Groups(ip);
  if (!g) return true; // unparseable: never trust it
  const [a, b, c, d, e, f, h, i] = g as [number, number, number, number, number, number, number, number];
  const zeroPrefix = (n: number) => g.slice(0, n).every((x) => x === 0);
  // ::/128 and ::1
  if (zeroPrefix(7) && (i === 0 || i === 1)) return true;
  // Forms that carry an IPv4 address: check the embedded address.
  if (zeroPrefix(6)) return isPrivateIPv4(groupsToV4(h, i)); // ::/96 IPv4-compatible
  if (zeroPrefix(5) && f === 0xffff) return isPrivateIPv4(groupsToV4(h, i)); // ::ffff:0:0/96 mapped
  if (zeroPrefix(4) && e === 0xffff && f === 0) return isPrivateIPv4(groupsToV4(h, i)); // ::ffff:0:0:0/96 SIIT
  if (a === 0x64 && b === 0xff9b && c === 0 && d === 0 && e === 0 && f === 0) {
    return isPrivateIPv4(groupsToV4(h, i)); // 64:ff9b::/96 NAT64
  }
  if (a === 0x64 && b === 0xff9b && c === 1) return true; // 64:ff9b:1::/48 local-use NAT64
  if (a === 0x2002) return isPrivateIPv4(groupsToV4(b, c)); // 2002::/16 6to4
  if (a === 0x2001 && b === 0) return true; // 2001::/32 Teredo
  if (a === 0x2001 && b === 0xdb8) return true; // documentation
  if ((a & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((a & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((a & 0xff00) === 0xff00) return true; // multicast
  // Only global unicast (2000::/3) is a public internet address.
  return (a & 0xe000) !== 0x2000;
}

/**
 * Is this literal IP address private, loopback, link-local or otherwise not
 * a public internet host? IPv6 forms that embed an IPv4 address (mapped,
 * compatible, NAT64, 6to4) are judged by that address.
 */
export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
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

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string, family: number) => void;
type LookupFn = (hostname: string, options: unknown, callback: LookupCallback) => void;

export interface PostOptions {
  timeoutMs?: number;
  /** DNS lookup used for the connection (tests). */
  lookup?: LookupFn;
  /** Decide whether a resolved address may be connected to (tests). */
  allowAddress?: (address: string) => boolean;
}

/**
 * POST to a public URL, resolving and validating the address in the same
 * step that opens the socket. The address that is checked is the address
 * that is connected to, so a DNS answer that changes between a check and the
 * request (DNS rebinding) cannot reach a private host. Redirects are not
 * followed. Resolves with the HTTP status.
 */
export function postToPublicUrl(
  urlString: string,
  body: string,
  headers: Record<string, string>,
  options: PostOptions = {}
): Promise<number> {
  const check = isUrlSafeForSSRF(urlString);
  if (!check.safe) return Promise.reject(new Error(check.reason ?? 'Unsafe URL'));
  const url = new URL(urlString);
  const baseLookup: LookupFn = options.lookup ?? (dnsLookupCb as unknown as LookupFn);
  const allow = options.allowAddress ?? ((address: string) => !isPrivateAddress(address));
  const pinnedLookup: LookupFn = (hostname, lookupOptions, callback) => {
    baseLookup(hostname, { ...(lookupOptions as object), all: false }, (err, address, family) => {
      if (err) return callback(err, address, family);
      if (!allow(address)) {
        return callback(
          Object.assign(new Error(`${hostname} resolves to a private address (${address})`), { code: 'EPRIVATE' }),
          address,
          family
        );
      }
      // net.connect asks for `all: true` (happy eyeballs) on recent Node.
      if ((lookupOptions as { all?: boolean } | undefined)?.all) {
        (callback as unknown as (e: null, list: Array<{ address: string; family: number }>) => void)(null, [
          { address, family },
        ]);
        return;
      }
      callback(null, address, family);
    });
  };
  const send = url.protocol === 'https:' ? httpsRequest : httpRequest;
  return new Promise((resolvePost, rejectPost) => {
    const req = send(
      url,
      {
        method: 'POST',
        headers: { ...headers, 'Content-Length': Buffer.byteLength(body).toString() },
        lookup: pinnedLookup as never,
        timeout: options.timeoutMs ?? 10_000,
      },
      (res) => {
        res.resume();
        res.on('end', () => resolvePost(res.statusCode ?? 0));
      }
    );
    req.on('timeout', () => req.destroy(new Error('Webhook request timed out')));
    req.on('error', rejectPost);
    req.end(body);
  });
}
