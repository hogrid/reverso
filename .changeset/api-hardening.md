---
"@reverso/api": minor
"@reverso/db": patch
---

Security hardening.

- **Role checks on every mutating route.** Forms, redirects and the sitemap invalidation now enforce roles like content and media do: viewers read, editors write, admins delete. Previously any signed-in role (a `viewer` included) could create or delete forms, submissions and redirects.
- **Uploaded files are sandboxed.** Files a browser can run as a document (SVG, HTML, XML) are served under `/uploads/` with `Content-Security-Policy: sandbox; script-src 'none'`, so an SVG with an embedded `<script>` can no longer run on the admin origin; PDFs, video and audio stay viewable. Every upload gets `nosniff`.
- **Admin CSP.** `script-src` no longer allows `'unsafe-inline'` (the admin build has no inline scripts); `img-src` allows `https:` so image fields can preview external URLs; `connect-src` allows the OpenStreetMap geocoder used by the map field.
- **Login and first admin.** Emails are matched case-insensitively and stored lowercase; the first admin is created in one atomic transaction so concurrent registrations on an empty database can no longer create several admins; login errors no longer return internal messages in production.
- **Errors.** 5xx responses never include the internal error message in production; an explicit non-empty `cookieSecret` passed to `createServer` no longer requires `REVERSO_COOKIE_SECRET`.
- **SSRF.** Webhook URLs reject private, loopback, link-local, CGNAT and reserved IPv4 ranges and every IPv6 form that can carry one (mapped, compatible, SIIT, NAT64, 6to4, Teredo); only global unicast IPv6 is allowed. Webhooks are sent with the address resolved and validated in the same step that opens the socket, so DNS rebinding between a check and the request cannot reach a private host; failed deliveries are recorded on the submission.
- **Proxy trust.** `REVERSO_TRUST_PROXY` accepts a hop count (`1` for one proxy) or a list of proxy addresses/CIDRs; `true` still trusts every hop.
