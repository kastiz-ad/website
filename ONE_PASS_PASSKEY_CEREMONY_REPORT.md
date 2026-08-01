# ONE Pass passkey ceremony checkpoint

Status: reviewed and implemented locally on `feature/one-pass`.

## What changed

- Wired ONE Pass privacy actions to browser WebAuthn ceremonies when secure server configuration exists.
- Tightened passkey verifier detection so a string flag such as `WEBAUTHN_VERIFIER=configured` is not treated as cryptographic verification.
- Added server-generated registration and authentication options.
- Bound sensitive confirmation to authenticated user, exact action, exact resource, server challenge, creation time, expiration time, consumed state, and one-time action completion.
- Added frontend passkey setup, export, Identity Pass deletion, and full ONE Pass deletion request flows.
- Changed full ONE Pass deletion from immediate deletion to a request-only privacy workflow. It records `requested` status and does not claim completion.
- Added local Supabase migration verification instructions because this repository has no `supabase/config.toml`; no live or local migration was applied in this checkpoint.

## Security posture

- Server-side privacy-action enforcement: implemented.
- Production passkey/WebAuthn ceremony: wired, but not production-configured in this workspace.
- User-facing sensitive actions: intentionally disabled unless `ONE_PASS_ENABLED`, `PASSKEY_REAUTH_ENABLED`, `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`, and a real `WEBAUTHN_VERIFIER.verify(...)` binding are configured.
- Live database migration: not applied or verified against a running Supabase instance in this workspace.

## Evidence

- Browser-claimed confirmation is insufficient; privacy actions require a consumed server challenge and exact action hash.
- Client-controlled user IDs are ignored; user ownership comes from the authenticated request.
- Action confirmation for `export-one-pass`, `delete-identity-pass:<id>`, and `delete-one-pass` uses different server hashes and cannot authorize a different action.
- Expired, replayed, wrong-purpose, wrong-resource, and missing confirmations fail.
- Production fails closed when passkey reauth is enabled without RP ID, origin, and a real verifier binding.
- Audit/export code is checked to avoid passport number, identity plaintext, passkey assertion, tokens, encryption keys, provider passwords, ciphertext, and nonce leakage.

## Validation run

- `git diff --check`: passed.
- `node --check functions/api/v1/_lib/passkeys.js`: passed.
- `node --check functions/api/v1/_lib/one-pass-config.js`: passed.
- `node --check functions/api/v1/one-pass/[[path]].js`: passed.
- `node --check one-pass.js`: passed.
- `node --check functions/api/v1/[[path]].js`: passed.
- `node --check functions/_middleware.js`: passed.
- `node tools/static-quality-check.mjs`: passed.
- `node tools/security-scan.mjs`: passed.
- `node --test tests/one-pass.test.mjs`: 26 passed, 0 failed.
- `node --test tests/*.test.mjs`: 619 passed, 0 failed.

## Remaining setup blockers

- Configure a real WebAuthn/passkey verifier binding backed by a standards-compliant verification library or service.
- Configure `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` for the deployed domain.
- Apply and verify `supabase/migrations/202608020001_one_pass_privacy_actions.sql` in a local or staging Supabase project before production.
- Perform browser E2E verification only after an authenticated staging session, database, and verifier binding exist.

## Intended commit files

- `functions/api/v1/_lib/passkeys.js`
- `functions/api/v1/_lib/one-pass-config.js`
- `functions/api/v1/one-pass/[[path]].js`
- `one-pass.html`
- `one-pass.js`
- `tests/one-pass.test.mjs`
- `docs/ONE_PASS_LOCAL_SUPABASE_SETUP.md`
- `ONE_PASS_PASSKEY_CEREMONY_REPORT.md`

Not intended for commit:

- `alpha03-preview.png`
- `logo-preview-black.png`
