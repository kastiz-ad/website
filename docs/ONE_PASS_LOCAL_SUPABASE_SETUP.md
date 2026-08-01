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
