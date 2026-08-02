# ONE Pass Local Supabase Setup

Status in this Codex workspace: local Supabase configuration now exists for development, but the local database was not started or reset in this checkpoint because Docker virtualization was not available. The migration set has not been applied to any live, staging, or production database by this task.

Migrations to verify locally or in staging only:

```bash
supabase/migrations/202608020001_one_pass_privacy_actions.sql
supabase/migrations/202608020002_one_pass_webauthn_metadata.sql
supabase/migrations/202608020003_one_pass_travel_profile_loyalty.sql
```

## Safe setup steps

1. Install the Supabase CLI locally.
2. From the source-of-truth repository, initialize local Supabase only if the project owner approves:

```bash
supabase init
```

3. Start local Supabase:

```bash
supabase start
```

4. Apply migrations to the local database only:

```bash
supabase db reset
```

5. Verify the ONE Pass privacy-action objects:

```sql
select to_regclass('public.one_pass_deletion_requests');
select column_name from information_schema.columns where table_schema='public' and table_name='passkey_challenges' and column_name='completed_action_at';
select relrowsecurity from pg_class where oid = 'public.one_pass_deletion_requests'::regclass;
select policyname from pg_policies where schemaname='public' and tablename='one_pass_deletion_requests';
```

Expected result:

- `public.one_pass_deletion_requests` exists.
- `public.passkey_challenges.completed_action_at` exists.
- RLS is enabled for `one_pass_deletion_requests`.
- Owner select policy exists.
- Anonymous users have no access.
- Authenticated users cannot insert/update/delete directly.
- One user cannot read another user's deletion requests.

## Do not do this in Codex chat

- Do not paste Supabase service keys.
- Do not paste JWTs or refresh tokens.
- Do not apply migrations to production from this checkpoint.
- Do not disable RLS for convenience.

## Current blocker

This workspace has `supabase/migrations` and `supabase/config.toml`, but Docker virtualization was not available for this checkpoint. Therefore this task can validate migration contents statically, but cannot truthfully claim a local or staging database migration was applied.

## Real WebAuthn local configuration

Safe local example values:

```bash
ONE_PASS_ENABLED=true
PASSKEY_REAUTH_ENABLED=true
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME="Kastiz ONE Local"
WEBAUTHN_EXPECTED_ORIGINS=http://localhost:8770,http://127.0.0.1:8770
WEBAUTHN_CHALLENGE_TTL_SECONDS=300
CBOR_NATIVE_ACCELERATION_DISABLED=true
```

Install dependencies before running passkey verifier tests:

```bash
pnpm install
```

Start only local Supabase when Docker and Supabase CLI are available:

```bash
supabase start
supabase db reset
```

Create fictional users only. Never import production users into local Supabase.

This checkpoint added `supabase/config.toml`, but Docker virtualization was unavailable. Therefore local migration reset, live RLS checks, and two-user database isolation checks were not executed here.

## Browser E2E blocker

Browser E2E requires an E2E runner such as Playwright plus a local backend, local Supabase, and virtual authenticator support. This repository currently has no browser E2E script or Playwright dependency, so browser E2E was not executed in this checkpoint.

## Travel Profile and Loyalty Wallet local verification

After Docker virtualization and Supabase CLI are available, verify the ONE Pass travel and loyalty foundation locally:

```bash
pnpm install
supabase start
supabase db reset
pnpm test
```

Recommended SQL spot checks:

```sql
select column_name from information_schema.columns where table_schema='public' and table_name='travel_preferences' order by column_name;
select column_name from information_schema.columns where table_schema='public' and table_name='loyalty_accounts' order by column_name;
select relrowsecurity from pg_class where oid = 'public.travel_preferences'::regclass;
select relrowsecurity from pg_class where oid = 'public.loyalty_accounts'::regclass;
select grantee, privilege_type from information_schema.role_table_grants where table_schema='public' and table_name='loyalty_accounts';
```

Expected result:

- Travel profile columns include ordinary travel preferences such as preferred airports, airlines, hotels, currencies, cabin, meal, pace, budget and accessibility values.
- Loyalty wallet columns include program category, opaque `masked-only` or future `vault` membership reference, masked membership reference, preferred usage, verification status and soft-delete metadata.
- RLS remains enabled on both user-owned tables.
- Direct authenticated writes to loyalty references are revoked; API routes must use trusted server-owned writes scoped to the authenticated user.
- No passport numbers, government IDs, payment cards, CVVs, bank credentials, provider passwords, OAuth tokens, or full loyalty membership numbers are stored by these travel profile and loyalty wallet flows.

## Payment Hub checkpoint migration

A new migration was created but not applied:

- `supabase/migrations/202608020004_one_pass_payment_hub.sql`

It extends safe payment references and creates provider-neutral payment transaction, event, and idempotency tables. It must be reviewed before application. Do not paste payment provider secrets into chat, source files, migrations, or ordinary database rows. Real provider credentials belong only in secure environment variables or provider-managed vaults.

Until provider credentials, webhook verification, RLS verification, and browser passkey E2E are completed, Payment Hub remains a safe reference/demo foundation only and is not production payment functionality.
## Provider Connections checkpoint

Migration file: `supabase/migrations/202608030001_one_pass_provider_connections.sql`

This migration creates or extends provider connection tables for safe OAuth/OIDC state, secure handoff intents, connection events, and protected token references. It must be applied only in a controlled local/staging Supabase environment first.

Do not paste provider OAuth secrets, payment credentials, or partner API keys into Codex chat. Configure them only as secure environment variables or provider dashboards. Until real credentials, redirect allowlists, provider confirmation, and token vault/KMS are configured, ONE Pass must show setup-required or handoff-only states.