# Founder Operating System Architecture

## Boundary

```text
Founder device
  → Identity provider (MFA/passkey)
  → Admin gateway (server-side authorization, CSRF, rate limit)
  → Read models / command API
      → User service
      → Mission service
      → Provider registry + health
      → Early Access / feedback
      → Analytics aggregator
      → Versioned content service
      → Feature flag service
      → Append-only audit store
```

The public Kastiz frontend never calls admin APIs. FOS is served from a separate protected origin (recommended: `founder.kastiz.com`) with no public discovery, but security comes from server authentication and authorization—not the hostname.

## Modular contracts

Each module owns a read model and allowlisted commands:

```text
module/
  schema        safe fields and retention class
  query         filtered, paginated, role-scoped reads
  command       validated, idempotent mutations
  policy        role + re-authentication requirements
  audit         append-only event mapping
  view          calm presentation; no business logic
```

## Data rules

- Use internal pseudonymous IDs in lists.
- Fetch sensitive details only on justified, audited drill-down.
- Never store passport, health, child, payment, uploaded-file, or raw mission content in analytics.
- Encrypt data at rest and in transit; separate encryption keys by environment.
- Paginate and filter server-side.
- Exports are asynchronous, time-limited, watermarked, and audited.
- Audit events contain actor, action, object ID, result, request ID, time, and reason—never secrets or raw content.

## Authentication and authorization

- Managed OIDC identity provider with passkeys/MFA.
- Secure/HttpOnly/SameSite session cookies; no tokens in local storage.
- Server-side role/permission checks on every endpoint.
- Recent authentication for delete, export, provider disable, maintenance, flag, and publish operations.
- CSRF protection, strict CSP, frame denial, no-store, and restricted CORS.
- Separate development, preview, and production identities and data.

## Reliability

- Read models can lag without blocking the public product.
- Commands use idempotency keys and optimistic concurrency.
- Provider disable and flags have automatic expiry and rollback.
- Health signals report freshness; unknown is yellow, never green.
- Admin outage cannot affect homepage, mission preparation, or approval protection.

## Production engineering layer

Cloudflare Pages Functions share a small production-hardening layer:

- `runtimeConfig()` centralizes environment, release, log level, and upstream timeout values.
- `createLogger()` emits structured, redacted logs with request id, environment, service, status, and latency.
- `fetchWithTimeout()` gives backend upstream calls bounded failure behavior.
- CI runs static quality checks, syntax checks, the security scan, and automated tests.

Provider code must fail closed. Adapter code alone is not a live connection; a provider is connected only when credentials authenticate, a provider response is received, normalized, and truthfully displayed.

## Current static implementation

The current branch includes only a sample-data local prototype and Cloudflare Pages middleware that returns `404` for founder paths. Legacy analytics pages remain local-development tools. This is an architectural foundation, not production authentication.
