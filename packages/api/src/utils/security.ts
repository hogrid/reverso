/**
 * Security utilities for the API.
 */

import crypto from 'node:crypto';

/**
 * Private IP ranges that should be blocked for SSRF protection.
 */
const PRIVATE_IP_RANGES = [
  /^127\./,                    // 127.0.0.0/8 (loopback)
  /^10\./,                     // 10.0.0.0/8 (private)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 (private)
  /^192\.168\./,               // 192.168.0.0/16 (private)
  /^169\.254\./,               // 169.254.0.0/16 (link-local)
  /^0\./,                      // 0.0.0.0/8 (current network)
  /^224\./,                    // 224.0.0.0/4 (multicast)
  /^240\./,                    // 240.0.0.0/4 (reserved)
  /^255\.255\.255\.255$/,      // broadcast
  /^localhost$/i,              // localhost hostname
  /^::1$/,                     // IPv6 loopback
  /^fe80:/i,                   // IPv6 link-local
  /^fc00:/i,                   // IPv6 private
  /^fd00:/i,                   // IPv6 private
];

/**
 * Blocked hostnames for SSRF protection.
 */
const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.google.com',
  '169.254.169.254', // AWS/GCP metadata
  'metadata',
];

/**
 * Check if a URL is safe for server-side requests (SSRF protection).
 * Blocks private IPs, localhost, and cloud metadata endpoints.
 */
export function isUrlSafeForSSRF(urlString: string): { safe: boolean; reason?: string } {
  try {
    const url = new URL(urlString);

    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { safe: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
    }

    // Check blocked hostnames
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return { safe: false, reason: 'Blocked hostname' };
    }

    // Check private IP ranges
    for (const pattern of PRIVATE_IP_RANGES) {
      if (pattern.test(hostname)) {
        return { safe: false, reason: 'Private IP addresses are not allowed' };
      }
    }

    // Block URLs with credentials
    if (url.username || url.password) {
      return { safe: false, reason: 'URLs with credentials are not allowed' };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
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
