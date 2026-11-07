---
"@reverso/api": patch
---

Webhook deliveries now have one overall deadline (DNS, connect, upload and response) instead of an idle timeout that a server trickling bytes could hold open forever, and they run in the background so a slow endpoint never delays the visitor's form submission response.
