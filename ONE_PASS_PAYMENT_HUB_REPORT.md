# ONE Pass Payment Hub and Secure Provider References Report

Checkpoint date: 2026-08-02
Branch: feature/one-pass
Base HEAD before work: cda7721

## Scope

Implemented a safe Payment Hub foundation for ONE Pass. This checkpoint does not process real money, does not connect real merchant accounts, does not apply migrations, and does not enable production payment execution.

## Reused components

- Existing ONE Pass authentication and ownership enforcement via currentUser.
- Existing passkey-gated sensitive action model for exact approval flows.
- Existing approval_packages table for payment approval summaries.
- Existing audit_events helper for privacy-safe activity records.
- Existing payment_method_references table, extended by a new migration.
- Existing ONE Pass UI shell, language switcher, and safe text rendering pattern.

## New architecture

### Payment references

Payment methods are stored only as safe references:

- masked display label
- provider name
- method category
- capability status
- connection status
- supported currencies/countries
- safe provider metadata allowlist

The backend rejects client-supplied user IDs and raw credential-shaped fields such as full card number, CVV/CVC, PIN, passwords, OTPs, OAuth tokens, bank account numbers, and provider secrets.

If no real provider token exists, the system stores `not-connected:<uuid>` or demo-only references. These are not authorization to purchase.

### Provider adapters

Added provider SDK-style demo adapters:

- MockTossProvider
- MockKakaoPayProvider
- MockApplePayCapabilityProvider
- MockCarrierBillingProvider

All are visibly demo-only, never contact a network, never move money, and fail closed in production.

### Exact payment approval package

The payment approval package binds:

- authenticated user
- mission
- merchant
- product
- provider
- amount
- currency
- taxes and fees
- ONE fee
- total
- selected payment method reference
- conditions
- expiry
- idempotency key
- payload hash

Any changed amount, currency, method, product, provider, condition, or mission produces a different hash and requires renewed approval.

### Payment state machine

Added deterministic payment states from DRAFT through COMPLETED plus rejected/failed/refund/void/manual-review states. Provider-success states are server-controlled; the browser cannot declare authorization, capture, completion, void, or refund.

### Webhook/idempotency foundation

Added migration tables for payment transactions, payment events, and payment idempotency records. Webhook processing requires a verified signature in this checkpoint's mock verifier and stores only safe metadata, never raw provider payloads.

## UI

Added a Payment Hub section to ONE Pass with English, Korean, and Spanish labels. The UI supports:

- viewing payment references
- saving masked/setup-required references
- setting a default reference
- revoking a reference
- viewing demo/provider capability statuses

No card number, CVV, PIN, password, OTP, or provider credential fields exist.

## Files changed

- functions/api/v1/_lib/one-pass-payments.js
- functions/api/v1/one-pass/[[path]].js
- one-pass.html
- one-pass.js
- one-pass.css
- supabase/migrations/202608020004_one_pass_payment_hub.sql
- tests/one-pass-payment-hub.test.mjs
- ONE_PASS_PAYMENT_HUB_REPORT.md
- ONE_PASS_IMPLEMENTATION_MATRIX.md
- docs/ONE_PASS_LOCAL_SUPABASE_SETUP.md

## Accurate status

- Payment Hub safe reference foundation: implemented
- Demo provider adapters: implemented
- Exact payment approval package builder: implemented
- Server-controlled payment state machine: implemented
- Webhook/idempotency database foundation: migration created, not applied
- Real Toss/KakaoPay/Apple Pay/carrier billing: not connected
- Real merchant accounts: not created
- Real payment execution: disabled
- Production payment functionality: not ready
- Browser WebAuthn E2E: not tested in this checkpoint
- Live RLS: not tested
- Production untouched

## Remaining work before production payments

1. Founder must create merchant/provider accounts and accept provider contracts.
2. Provider credentials must be configured as environment variables only.
3. Real webhook signature verification must be implemented per provider.
4. Migrations must be reviewed and applied by an authorized operator.
5. Browser passkey and payment approval E2E must be tested against a configured backend.
6. Legal/compliance review is required before any regulated payment flow.

## Validation executed

- `git diff --check`: passed. Line-ending warnings only; no whitespace errors.
- Syntax checks with bundled Node: passed for Payment Hub helper, ONE Pass API, ONE Pass UI script, top-level API, and middleware.
- `node tools/static-quality-check.mjs`: passed.
- `node tools/security-scan.mjs`: passed.
- `pnpm install --frozen-lockfile`: passed; pnpm-lock.yaml remains the project lockfile.
- `pnpm audit --audit-level high`: passed; no known high/critical vulnerabilities reported.
- Focused Payment Hub security-review tests: 17 passed / 0 failed.
- Full Node test suite: 653 passed / 0 failed.

Note: `pnpm run check` could not be used directly in this Windows Codex shell because the script invokes `node` from PATH and this desktop shell does not expose bundled Node as `node`. The exact underlying check commands were run directly with the bundled Node executable and passed.
## Final targeted security review additions

Findings fixed during review:

1. A compatibility edit had accidentally altered Travel Profile and Loyalty POST bodies while adding Payment Hub API compatibility. Restored both routes to persist their original validated data and added a regression test.
2. Payment Hub now includes request-level screening for prohibited financial field names in query parameters and non-standard headers, while preserving normal authorization, cookie, CSRF, origin and content headers.
3. Payment approval hashes now bind traveler/recipient and cancellation/refund conditions in addition to mission, merchant, provider, item, amount, currency, fees, total, method reference, conditions, expiry and idempotency.
4. Added helper coverage for idempotency replay mismatch and duplicate webhook event detection.
5. Webhook verification now rejects stale mock timestamps and unknown event types, and remains unavailable in production without a real verifier.

Security evidence:

- Ordinary payment API select lists exclude protected provider references.
- Public payment method serialization excludes `provider_reference` and marks revoked/expired references unavailable.
- The UI uses textContent/createElement rendering and contains no raw card, CVV, PIN, password, bank credential, OTP or token form fields.
- Demo providers are labeled demo/setup-required and fail closed in production.
- Payment-intent simulation is unavailable in production and returns `simulated:true` / `realMoney:false`.
- Database migration includes RLS, owner-select policies, authenticated write restrictions, unique idempotency constraints, provider-event uniqueness, safe reference constraints and no SECURITY DEFINER.