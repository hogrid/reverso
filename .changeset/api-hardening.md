---
"@reverso/api": minor
"@reverso/db": patch
---

Security hardening.

- **Role checks on every mutating route.** Forms, redirects and the sitemap invalidation now enforce roles like content and media do: viewers read, editors write, admins delete. Previously any signed-in role (a `viewer` included) could create or delete forms, submissions and redirects.
- **Uploaded files are sandboxed.** Everything under `/uploads/` is served with `Content-Security-Policy: sandbox; script-src 'none'` and `nosniff`, so an SVG with an embedded `<script>` can no longer run on the admin origin.
- **Admin CSP.** `script-src` no longer allows `'unsafe-inline'` (the admin build has no inline scripts); `img-src` allows `https:` so image fields can preview external URLs; `connect-src` allows the OpenStreetMap geocoder used by the map field.
- **Login and first admin.** Emails are matched case-insensitively and stored lowercase; the first admin is created in one atomic transaction so concurrent registrations on an empty database can no longer create several admins; login errors no longer return internal messages in production.
- **Errors.** 5xx responses never include the internal error message in production; an explicit `cookieSecret` passed to `createServer` no longer requires `REVERSO_COOKIE_SECRET`.
- **SSRF.** Webhook URLs reject bracketed IPv6 loopback/link-local/unique-local, IPv4-mapped IPv6, carrier-grade NAT and other reserved ranges, and the hostname is resolved right before the request and refused if it points at a private address.
- **Proxy trust.** `REVERSO_TRUST_PROXY` accepts a hop count (`1` for one proxy) or a list of proxy addresses/CIDRs; `true` still trusts every hop.
