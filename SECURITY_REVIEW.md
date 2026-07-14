# Security review (engineering review, not a professional audit)

Date: 2026-07-15

## Reviewed

- Repository text scan for API keys, tokens, passwords, service-role credentials, private endpoints and personal email exposure.
- Client-side approval and execution guards, upload metadata handling, external links, HTML rendering and redirects.
- Authentication and payment feature flags.

## Changes

- Added a restrictive static-host CSP, MIME sniffing protection, referrer policy, permissions policy, frame protection and cache policy in `_headers`.
- Removed the personal Gmail address from public privacy content.
- Added `authenticationEnabled=false`; retained `paymentsEnabled=false`.
- Provider requests use explicit timeouts and stable fallback results.

## Known limitations / blockers

- Frontend-only approval is not sufficient authorization for commercial execution. A server must independently enforce approval, identity, idempotency, pricing and provider scopes.
- Forms currently save locally and are not transmitted. A future backend needs validation, rate limiting, CSRF protection, abuse detection, audit logs and honest delivery status.
- File selection stores metadata only. Any future upload must use type/size/content validation, malware scanning, private object storage and expiring access URLs.
- CSP includes `'unsafe-inline'` because the current static pages use inline theme/bootstrap code; replace with nonces or hashed scripts before higher-risk production use.
- No secrets should ever be placed in this client repository.
