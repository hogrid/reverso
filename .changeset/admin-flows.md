---
"@reverso/admin": patch
"@reverso/api": patch
---

Fix broken admin flows and make failures visible.

- API client only sends `Content-Type: application/json` when there is a body, so form Publish/Unpublish and redirect Enable/Disable no longer fail with 400. Uploads get a size-based timeout (30s + 1s per MB, max 10 min) instead of a flat 10s.
- Submissions "Export CSV" now POSTs the export route and downloads the file (it previously opened a GET URL that 404'd).
- Bulk media delete uses the new `POST /media/bulk-delete` endpoint (`{ ids }`, 1 to 100, admin only), which deletes rows and files and returns `{ deleted, missing }`.
- Mutation failures and successes on the redirects, forms, form builder, submissions and media pages are shown as accessible toasts with the API error message instead of only `console.error`.
- Route-level error boundary with a reload button; `SelectField` ignores options with an empty value instead of crashing the editor.
- Media library page and picker load more items with a "Load more" button until the whole library is listed, and the search box no longer loses focus while results reload.
- Form builder settings dialog opens with the form's real values (it used to open empty and overwrite settings with defaults). Webhook and redirect URLs can be cleared, and empty notification emails are dropped. `PUT /forms/:id` accepts `webhookUrl: null` to remove a webhook.
- Dashboard no longer shows made-up trend percentages, and the pages list no longer labels every page "Published".
- Login explains how to create the first admin when registration is closed on a fresh install (only from the server's machine or with `REVERSO_ALLOW_BOOTSTRAP=true`), and the "create an account" toggle no longer flickers in before the setup check returns.
