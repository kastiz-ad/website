# ONE Pass Travel Profile and Loyalty Wallet Checkpoint

## Status

- Travel Profile foundation: implemented.
- Loyalty Wallet foundation: implemented as saved membership references only.
- Travel option comparison preview: implemented with deterministic non-live logic.
- Mission personalization context: implemented as safe, non-sensitive context.
- Database migration: created, not applied.
- Local Supabase reset/RLS live verification: not run because Docker virtualization is unavailable.
- Browser passkey end-to-end verification: not run; deferred from this checkpoint.
- Production deployment: not touched.

## Scope implemented

This checkpoint extends the existing ONE Pass backend, frontend, database schema, and tests. It does not create a second account system, does not redesign the main site, and does not modify `funding-demo-final`.

## Travel Profile

The profile supports ordinary reusable travel preferences, including:

- preferred name and language;
- home city/region;
- departure and arrival airports;
- preferred and avoided airlines;
- preferred and avoided hotel brands;
- seat, cabin, meal, diet, accessibility, room, bed, smoking, floor and view preferences;
- transportation style and travel pace;
- budget, currencies, direct-flight preference, maximum stopovers, refundability, baggage and trip purpose;
- price-versus-points strategy.

Client-controlled ownership fields such as `user_id` and `userId` are rejected. Writes are scoped server-side to the authenticated user.

## Loyalty Wallet

The wallet supports non-sensitive loyalty references for:

- airlines;
- hotels;
- online travel agencies;
- car rental programs;
- credit-card rewards labels;
- other travel programs.

The API stores an opaque `masked-only:<uuid>` reference and a masked membership display value. Public responses return masked references only. Full membership-number persistence and reveal are intentionally disabled until a production vault/KMS path is configured; reveal attempts fail closed after the existing owner/passkey/resource checks, and legacy/non-vault protected references are never returned.

The wallet does not collect provider passwords, loyalty passwords, card numbers, CVVs, bank credentials, government IDs, OAuth tokens, passport scans, or provider credentials.

## Comparison behavior

`/comparison/evaluate` compares provided options using the saved travel profile and loyalty references. It can identify:

- lowest-price option;
- best points/loyalty option;
- balanced option.

The comparison is deterministic and non-live. It does not claim award-seat availability, real-time pricing, provider status, booking confirmation, or transferable points unless a real future provider integration supplies evidence.

## API surface

Implemented or extended endpoints:

- `GET /travel-profile`
- `POST/PATCH /travel-profile`
- `POST /travel-profile/reset`
- `DELETE /travel-profile`
- `GET /travel-profile/export`
- `GET /loyalty`
- `POST /loyalty`
- `GET /loyalty-catalog`
- `GET /loyalty/:id`
- `PATCH/PUT /loyalty/:id`
- `DELETE /loyalty/:id`
- `GET /loyalty/:id/reveal`
- `GET /mission-context/travel`
- `POST /comparison/evaluate`

## Localization

The ONE Pass page now exposes the travel profile, loyalty wallet, and comparison preview in English, Korean, and Spanish without mojibake. Other site localization work is outside this checkpoint.

## Files changed

- `functions/api/v1/_lib/one-pass-travel.js`
- `functions/api/v1/one-pass/[[path]].js`
- `one-pass.html`
- `one-pass.js`
- `one-pass.css`
- `supabase/migrations/202608020003_one_pass_travel_profile_loyalty.sql`
- `tests/one-pass.test.mjs`
- `tests/one-pass-travel-loyalty.test.mjs`
- `docs/ONE_PASS_LOCAL_SUPABASE_SETUP.md`
- `ONE_PASS_IMPLEMENTATION_MATRIX.md`
- `ONE_PASS_TRAVEL_PROFILE_LOYALTY_REPORT.md`

## Validation run

- Focused ONE Pass tests: `node --test tests/one-pass.test.mjs tests/one-pass-travel-loyalty.test.mjs` Ã¢â‚¬â€ 40 passed, 0 failed.
- Syntax checks: `node --check` for `one-pass-travel.js`, ONE Pass API route, and `one-pass.js` Ã¢â‚¬â€ passed.
- Static quality: `node tools/static-quality-check.mjs` Ã¢â‚¬â€ passed.
- Security scan: `node tools/security-scan.mjs` Ã¢â‚¬â€ passed.
- Package install lock validation: `pnpm install --frozen-lockfile` Ã¢â‚¬â€ passed.
- Project check: `pnpm run check` Ã¢â‚¬â€ passed.
- Full test suite: `node --test tests/*.test.mjs` Ã¢â‚¬â€ 633 passed, 0 failed.

## Known limitations

- Migration is created but not applied to local, staging, or production Supabase.
- Live RLS behavior was tested statically only, not against a running database.
- Browser WebAuthn E2E remains untested.
- Loyalty provider OAuth/API connections are not live.
- Full loyalty membership numbers are not persisted in this checkpoint; only masked references are stored.
- No real booking, payment, reservation, award-seat search, point balance lookup, or provider execution exists in this checkpoint.

## Security posture

- No raw financial credentials are collected or stored.
- No provider passwords are collected or stored.
- No passport/government ID fields are added to this checkpoint.
- Client ownership fields are rejected.
- Travel and loyalty data is scoped to the authenticated user in API logic.
- Sensitive loyalty reveal is routed through passkey-gated confirmation logic, but currently fails closed because full-number storage is disabled.

## Commit/deployment status

No commit, merge, push, publish, deploy, migration application, or production change was performed in this checkpoint.
