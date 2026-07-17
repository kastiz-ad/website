# Secure API v1

Base: `/api/v1`. JSON only. Authenticated sessions use Secure, HttpOnly, SameSite=Lax cookies. State-changing authenticated requests require the `kastiz_csrf` cookie value in `X-CSRF-Token`.

- `GET health`, `GET readiness`
- `POST auth/register`, `POST auth/login`, `POST auth/logout`, `POST auth/password-reset`, `GET auth/session`
- `GET me`, `GET/PATCH me/profile`, `GET me/export`, `POST me/deletion-request`
- `GET/POST preferences`, `DELETE preferences/:id`
- `GET/POST missions`, `GET/DELETE missions/:id`
- `GET approvals`, `POST approvals/:id/decision`, `POST approvals/:id/execute`
- `GET/POST consents`
- `DELETE provider-connections/:id`

Execution intentionally returns `provider_not_configured` until a real server-only adapter exists. It never fabricates a booking or payment.

## ONE Pass

Protected endpoints are under `/api/v1/one-pass`: status/create, Travel Profile, masked Identity Pass, loyalty references, payment references, provider connections, credentials/passkey challenges, privacy-safe activity, and export. Passport persistence, passkey verification, booking and payment remain disabled until their explicit server configuration is complete.
