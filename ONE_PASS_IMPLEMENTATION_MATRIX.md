# ONE Pass Implementation Matrix

Current branch: `feature/one-pass`  
Baseline commit inspected: `a950c9e`  
Scope: continuation of the approved ONE Pass secure identity, travel, loyalty, payment-reference, and approval foundation. This report is evidence-based from the current repository state and does not claim live provider activation.

| Requirement | Already implemented | Partially implemented | Missing | Relevant files | Tests | Next action |
|---|---|---|---|---|---|---|
| User authentication | Server derives user from Supabase session cookie via shared auth helper; browser `user_id` is not trusted. | OAuth/password flows depend on environment configuration. | Production identity-provider setup and email template verification. | `functions/api/v1/_lib/auth.js`, `functions/api/v1/one-pass/[[path]].js` | `tests/secure-backend.test.mjs`, `tests/one-pass.test.mjs` | Configure Supabase/Auth providers outside Codex. |
| Database persistence | ONE Pass tables, travel preferences, identity records, loyalty references, payment references, passkeys, approvals, bookings, confirmations, itinerary items, vault events. | Privacy action requests added for exports/deletions. | Apply migrations in target Supabase project. | `supabase/migrations/202607180001_one_pass.sql`, `supabase/migrations/202608020001_one_pass_privacy_actions.sql` | Migration static tests | Run migrations in staging/production. |
| Row-Level Security | RLS enabled on ONE Pass tables; owner read policies; sensitive direct writes revoked. | New privacy action table is owner-readable, server-writable. | Live Supabase policy verification against staged project. | Supabase migrations | `ONE Pass migration enables RLS...`, privacy-action migration test | Run integration tests against staging Supabase. |
| ONE Pass ownership | All API reads/writes filter by authenticated `user.id`; trusted writes also scope by `user_id`. | Provider connection revocation is best-effort to tolerate older schemas. | Organization/shared ownership model. | `functions/api/v1/one-pass/[[path]].js` | Static API tests | Add enterprise ownership after org model is finalized. |
| Passkey/WebAuthn registration | Challenge issuance and verification routes exist; credentials stored server-side; production flags fail closed. | Frontend button remains disabled in preview until verifier/env is configured. | Real WebAuthn verifier binding in production. | `_lib/passkeys.js`, ONE Pass API route, `one-pass.html` | Passkey challenge tests | Configure `WEBAUTHN_VERIFIER`, RP ID/origin. |
| Sensitive-action reauthentication | New reusable `assertRecentSensitiveConfirmation`; export, Identity Pass deletion, and ONE Pass deletion require consumed recent challenge matching exact action hash. | Browser reauth UI is not wired in the prototype. | Full client WebAuthn ceremony for privacy buttons. | `_lib/one-pass-approval.js`, ONE Pass API route | Recent confirmation/API tests | Wire enabled client flow after verifier is configured. |
| Identity Vault | Development vault encrypts with user-bound associated data; production vault fails closed without managed KMS. | Real passport persistence intentionally disabled without approved vault/provider. | Production KMS adapter and verified identity provider. | `_lib/identity-vault.js`, ONE Pass API route | Vault encryption/fail-closed tests | Add managed KMS and provider credentials externally. |
| Encryption and key versioning | Envelopes and protected references exist; production disallows dev vault. | Current tests verify encryption boundary, not full rotation workflow. | Production key rotation and KMS version audit. | `_lib/identity-vault.js`, migrations | Vault tests | Implement KMS-backed key version lifecycle. |
| Identity-verification provider interface | Provider handoff principle is present; no raw documents collected by UI. | Adapter is not live. | Real identity verification provider integration. | `one-pass.html`, `one-pass.js`, API route | Frontend no-sensitive-collection test | Select/contract identity provider. |
| Passport OCR/NFC provider interface | Raw passport image/NFC persistence is blocked. | No live OCR/NFC adapter. | Provider-specific OCR/NFC SDK and consent flow. | UI/API route | Security tests | Add only after legal/provider approval. |
| Just-in-time identity release | `releaseIdentityJustInTime` minimizes fields and clears sensitive object values after provider call. | Not connected to a live provider. | Provider-specific execution integration. | `_lib/one-pass-approval.js`, `_lib/identity-vault.js` | JIT release test | Attach to trusted provider adapter when available. |
| Travel Profile backend | GET and POST/PATCH support whitelisted fields only. | Field set is travel-focused. | User-facing full editor polish and backend integration tests. | ONE Pass API route, `one-pass.js` | Existing UI/static tests | Add end-to-end authenticated API tests. |
| Loyalty Wallet backend | Read/revoke references; rejects raw secure-provider data. | Create/connect requires provider handoff. | Live loyalty provider OAuth/API. | ONE Pass API route | Provider/password static tests | Add provider connection flow. |
| Payment-reference backend | Read/revoke masked provider references; rejects raw card data. | Payments disabled unless regulated provider configured. | Payment provider merchant setup. | ONE Pass API route | No raw sensitive collection tests | Configure payment provider externally. |
| Provider Connections | Provider catalog shown; connection creation requires secure handoff. | Revocation during full deletion is best-effort. | Real OAuth/provider-token storage boundary. | `_lib/one-pass-providers.js`, API route | Static tests | Add first provider adapter after credentials exist. |
| Exact approval packages | Approval payload hash binds exact provider/items/dates/price/identity/payment details. | Live execution still disabled without real providers. | Production transaction coordinator setup. | `_lib/one-pass-approval.js`, API route | Exact approval tests | Configure provider-backed execution. |
| Booking/payment transaction coordinator | Coordinator refuses fake execution with mock providers. | Execution route exists but returns provider-not-configured. | Live booking/payment adapters. | `_lib/transaction-coordinator.js`, API route | Mock provider/coordinator test | Add real adapters only with credentials. |
| Vault activity logging | Identity deletion writes `vault_access_events`; audit helper records owner actions. | JIT release logging should be added when live release route exists. | Live provider release event ingestion. | ONE Pass API route, migrations | API static test | Log every future reveal/release. |
| Data export | Export returns non-plaintext profile/references/activity and excludes identity vault plaintext. Now requires recent device confirmation and logs request. | Frontend link remains disabled-like/static until passkey flow is wired. | Client-side reauth ceremony and downloadable file UX. | ONE Pass API route, `one-pass.html` | API/static tests | Enable client after passkey verifier setup. |
| Identity Pass deletion | Revokes identity record, scrubs ciphertext/nonce, logs audit and vault access event. Now requires recent device confirmation. | Requires JSON body with challenge/actionHash; UI not wired yet. | Client confirmation flow. | ONE Pass API route | API/static tests | Wire button to sensitive action flow. |
| ONE Pass deletion | New DELETE `/api/v1/one-pass` request revokes/scrubs pass, identity, loyalty/payment references, and provider connections where schema supports it. Requires recent confirmation. | Actual permanent account deletion remains separate from ONE Pass deletion. | Production retention/completion workflow. | ONE Pass API route, new migration | API/static tests | Add admin/privacy operations runbook. |
| English/Korean/Spanish integration | UI copy supports English, Korean, Spanish without mojibake; unsupported language does not collect sensitive data. | Backend errors are mostly English. | Full localized backend error catalog. | `one-pass.html`, `one-pass.js` | Localization UI test | Add i18n error mapping. |
| Security tests | Static security checks, no raw credential collection, RLS/revoke checks, passkey exactness tests. | No live Supabase/API integration test in this environment. | Staging end-to-end security suite. | `tests/one-pass.test.mjs`, `tests/secure-backend.test.mjs` | Focused and full suite | Add staging credentials in CI secrets. |
| Production feature flags | ONE Pass config fails closed for unsafe production vault/booking/payment/passkey combinations. | Requires real env validation in deployment. | Production env/secrets setup. | `_lib/one-pass-config.js` | Production flag tests | Add deployment verification checklist. |

## Implementation in this continuation

- Added reusable recent sensitive-action confirmation helper.
- Required recent, consumed, exact-hash passkey/device confirmation for:
  - ONE Pass export
  - Identity Pass deletion
  - ONE Pass deletion request
- Added server-side privacy-action request table and RLS policy.
- Added audit/vault events for sensitive privacy actions.
- Preserved existing UI and localization; no homepage or funding demo branch changes.

## Mocked, disabled, or setup-required areas

- Passport persistence remains disabled until a production vault and approved verification provider exist.
- Payment and booking execution remain disabled unless regulated providers are configured.
- Provider connections are handoff-only; no provider password collection.
- Frontend passkey ceremony remains disabled in preview because a real WebAuthn verifier is not configured.

## Security behavior

Sensitive actions are no longer protected by session alone. They require:

1. signed-in owner session;
2. CSRF/origin protection for changing methods;
3. a recently consumed passkey challenge;
4. exact `actionHash` match;
5. user-owned row filters on every sensitive update.

No raw financial credentials, provider passwords, passport scans, NFC data, biometric data, or plaintext identity vault data are collected or exported.

## Final targeted security review addendum

Additional fixes made during the final pre-commit review:

- Sensitive-action confirmations are now single-use for the action itself. The backend verifies the consumed passkey challenge, then immediately claims it by setting `passkey_challenges.completed_action_at` before export/delete work proceeds.
- The confirmation record is bound to `user_id`, `purpose`, `action_hash`, `challenge`, expiration, consumed state, and unused `completed_action_at` state.
- ONE Pass deletion now checks for an existing open deletion request and returns that status instead of creating unsafe duplicate open requests.
- Production passkey reauthentication now fails closed unless RP ID, RP origin, and `WEBAUTHN_VERIFIER` are configured.
- Identity Pass deletion now writes `vault_access_events` with the existing schema columns: `vault_record_id`, `purpose`, `provider`, `fields_used`, `result`, and `correlation_id`.

Status language for this checkpoint:

- Server-side privacy-action enforcement: implemented.
- Production passkey/WebAuthn ceremony: not yet configured.
- User-facing sensitive actions: intentionally disabled until configuration.
- Live database migration: not applied unless actually verified in Supabase.
