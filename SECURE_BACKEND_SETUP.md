# Kastiz ONE Secure Backend V1 setup

Status: locally implemented, not provisioned or deployed. This design uses Supabase Auth/PostgreSQL with RLS and Cloudflare Pages Functions because the existing site already runs on Cloudflare Pages and has no server framework.

## Staging setup

1. Create a Supabase staging project in the founder-owned account.
2. Install Supabase CLI, link the staging project, and run `supabase db push` from this repository.
3. In Supabase Auth, require email verification and configure `APP_ORIGIN` as an allowed redirect URL. Configure Google, Apple, or Kakao only after obtaining their real credentials.
4. Add every variable from `.env.example` to the Cloudflare Pages **Preview** environment. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; this V1 API does not require it for normal user operations.
5. Add a Cloudflare rate-limit binding named `RATE_LIMITER` before public staging.
6. Deploy the branch preview, then run two-user isolation tests before production approval.

Local commands:

```text
npm install
npm run check
npm test
npm run security:scan
npx wrangler pages dev .
```

Migration rollback: restore the database backup or create a forward migration that drops policies/tables in dependency order. Never rewrite or delete an applied production migration.

Backup: enable Supabase point-in-time recovery appropriate to the paid production plan, document restore drills, and test a restore in a separate project before launch.

No founder password is committed. Create the founder through Supabase Auth after staging exists, enable MFA, and assign any future founder role through a server-controlled claim—not a browser field.
