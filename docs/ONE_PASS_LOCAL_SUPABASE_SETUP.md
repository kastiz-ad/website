# ONE Pass Local Supabase Setup

Status in this Codex workspace: local Supabase is not configured because `supabase/config.toml` is absent. The migration below has not been applied to any live, staging, or production database by this task.

Migration to verify locally or in staging only:

```bash
supabase/migrations/202608020001_one_pass_privacy_actions.sql
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

This workspace has `supabase/migrations`, but no local Supabase project configuration file. Therefore this task can validate migration contents statically, but cannot truthfully claim a local or staging database migration was applied.

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

This checkpoint added `supabase/config.toml`, but this Codex environment does not have Docker or Supabase CLI installed. Therefore local migration reset, live RLS checks, and two-user database isolation checks were not executed here.

## Browser E2E blocker

Browser E2E requires an E2E runner such as Playwright plus a local backend, local Supabase, and virtual authenticator support. This repository currently has no browser E2E script or Playwright dependency, so browser E2E was not executed in this checkpoint.
