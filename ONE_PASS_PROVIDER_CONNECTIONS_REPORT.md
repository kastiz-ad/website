# ONE Pass Provider Connections and Secure Handoff Report

Checkpoint: Provider Connections and Secure Handoff Foundation  
Branch: `feature/one-pass`  
Baseline HEAD: `8d1a20a`  
Status: implemented locally, not committed, not pushed, not deployed, migrations not applied.

## What was reused

- Existing ONE Pass API router: `functions/api/v1/one-pass/[[path]].js`
- Existing authenticated user derivation and CSRF/origin/rate-limit enforcement
- Existing Supabase REST helpers and trusted server writes
- Existing audit helper and privacy-safe activity model
- Existing passkey, approval, travel profile, loyalty wallet, and payment hub foundations
- Existing ONE Pass UI and English/Korean/Spanish localization pattern

## Provider catalog

Added a maintainable catalog in `functions/api/v1/_lib/one-pass-providers.js` for identity/login, payment, travel inventory/booking, and consumer handoff providers. Entries expose safe public fields only: provider id, display name, category, supported method, OAuth/handoff capability, partner requirements, scopes, localization, domain allowlist, and truthful production status.

No catalog entry is marked live or verified. Providers are labeled as setup required, partner application required, handoff only, configured for first-party email session, or development adapter.

## Connection model

The connection foundation supports safe public records with:

- authenticated `user_id` ownership only;
- provider id/category/type;
- safe display name;
- allowlisted scopes;
- server-controlled status;
- authorization, verification, expiration, and revocation timestamps;
- protected token references only.

The client cannot provide `user_id` and cannot mark a connection `CONNECTED`.

## Token vault behavior

Added `ProviderTokenVault` interface:

- `storeTokenSet()`
- `retrieveForProviderCall()`
- `rotateToken()`
- `revokeToken()`
- `deleteTokenSet()`
- `getSafeMetadata()`
- `recordAccess()`

Production fails closed without a real vault/KMS. Development accepts only fictional/safe inputs and returns `demo-only:<uuid>` references. Real token persistence is intentionally disabled in this checkpoint.

## OAuth/OIDC foundation

Implemented reusable foundation for providers with confirmed OAuth/OIDC support:

- Authorization Code + PKCE shape
- cryptographic state and nonce
- server-side state record payload
- redirect origin allowlist
- HTTPS requirement in production
- scope allowlist
- expiration
- single-use callback handling
- provider/user binding
- production token exchange disabled until credentials/vault are configured

Callback receipt is not treated as a verified connection.

## Secure handoff behavior

Implemented provider handoff intent foundation:

- provider/domain allowlist;
- mission and selected option binding;
- safe return URL;
- random nonce;
- expiration;
- single-use return;
- no sensitive URL parameters;
- return navigation does not equal confirmation;
- manual confirmation/reference import validates a safe reference.

## State machines

Connection states are server-controlled:

`NOT_CONNECTED → AUTHORIZATION_PREPARED → AUTHORIZATION_PENDING → CALLBACK_RECEIVED → TOKEN_VERIFICATION_REQUIRED → CONNECTED`

with failure/expiry/revoke states. Illegal transitions fail.

Handoff states are server-controlled:

`DRAFT → PREPARED → OPENED → RETURNED → AWAITING_CONFIRMATION → CONFIRMED`

with failure/expiry/cancel states. Illegal transitions fail.

## Revocation behavior

Disconnect/revoke is owner-only, deletes local protected references, records audit metadata, and clearly returns local disconnect status. It does not falsely claim provider-side revocation succeeded.

## Connections UI

Extended the existing ONE Pass page with a Connections panel in English/Korean/Spanish. The UI displays provider paths, status labels, setup/partner/handoff labels, and safe actions. It has no password/token inputs and no local/session storage for provider secrets.

## Mission integration

Added `/mission-context/providers` to provide derived provider signals only. It excludes access tokens, refresh tokens, authorization codes, provider secrets, session cookies, passport data, payment tokens, OAuth state/nonce, and full loyalty numbers.

## API routes created/modified

- `GET /api/v1/one-pass/provider-catalog`
- `GET /api/v1/one-pass/provider-catalog/:providerId`
- `GET /api/v1/one-pass/connections`
- `GET /api/v1/one-pass/connections/:connectionId`
- `POST /api/v1/one-pass/connections/:providerId/authorize`
- `POST /api/v1/one-pass/connections/:providerId/callback`
- `POST /api/v1/one-pass/connections/:providerId/verify` — fails closed until live provider verification exists
- `POST /api/v1/one-pass/connections/:connectionId/disconnect`
- `POST /api/v1/one-pass/connections/:connectionId/revoke`
- `GET /api/v1/one-pass/handoffs`
- `POST /api/v1/one-pass/handoffs`
- `GET /api/v1/one-pass/handoffs/:handoffId`
- `POST /api/v1/one-pass/handoffs/:handoffId/opened`
- `POST /api/v1/one-pass/handoffs/:handoffId/return`
- `POST /api/v1/one-pass/handoffs/:handoffId/confirm`
- `POST /api/v1/one-pass/handoffs/:handoffId/cancel`
- `GET /api/v1/one-pass/mission-context/providers`

## Migration

Created `supabase/migrations/202608030001_one_pass_provider_connections.sql` for provider connections, authorization states, handoff intents, connection events, and token references. It includes RLS, owner-select policies, restricted direct writes, uniqueness, idempotency/state uniqueness, expiration indexes, and safe-reference checks.

Migration created only. It was not applied. Live RLS was not tested.

## Demo/mock behavior

Development/demo paths are labeled as demo or setup-required. Mock provider adapters are disabled in production. No fake OAuth connection, fake account verification, booking, payment, or provider execution is performed.

## Production-disabled behavior

Production OAuth token exchange, provider verification, real token storage/retrieval, live provider revocation, live bookings, and live payments remain disabled until real provider accounts, credentials, partner approvals, redirect URIs, and vault/KMS configuration exist.

## Deferred blockers

- Docker/local Supabase checks remain deferred.
- Browser WebAuthn E2E remains deferred.
- Migrations are created but not applied.
- Live provider credentials and partner approvals are external Founder actions.
- Production token vault/KMS is not configured.

## Security status language

- Provider catalog foundation: implemented.
- Secure connection model: implemented.
- OAuth/OIDC security foundation: implemented.
- Secure handoff foundation: implemented.
- Token vault interface: implemented, production fails closed.
- Real provider token storage: disabled.
- Real provider verification: not connected.
- Live provider integrations: not connected.
- Migration: created but not applied.
- Production provider functionality: not ready.
