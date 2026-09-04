# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| < 0.3   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: security@reverso.dev

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Preferred Languages

We prefer all communications to be in English.

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported versions
4. Release new security fix versions

## Security Best Practices

When using Reverso in production:

- Keep authentication on (the default). `REVERSO_AUTH_ENABLED=false` is for
  local experiments only.
- Set `REVERSO_COOKIE_SECRET` and, if you sync from CI or scripts, a strong
  `REVERSO_API_KEY` (`openssl rand -hex 24`).
- Set `REVERSO_TRUST_PROXY=true` behind a reverse proxy so rate limiting and
  login lockout see real client IPs.
- Keep Reverso and all dependencies up to date
- Use strong, unique passwords for admin accounts
- Enable HTTPS in production
- Configure proper CORS settings
- Use environment variables for sensitive data
- Regular backup your database and uploads
