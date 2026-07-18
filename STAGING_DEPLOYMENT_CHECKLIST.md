# Staging Deployment Checklist

1. Create a separate Supabase staging project; enable email verification and MFA for the founder.
2. Apply migrations in timestamp order and run two-user RLS tests before adding any data.
3. Configure Cloudflare Preview only: Supabase URL/anon/service credentials in server variables, session encryption secret, strict allowed preview origins, secure cookie name/domain, CSRF and rate-limit bindings.
4. Keep every ONE Pass, passport, payment and real provider flag false.
5. Create founder and ordinary test users through verified email; never seed passwords in source.
6. Verify audit logs contain IDs and safe metadata only. Confirm analytics/logs exclude raw mission text and PII.
7. Configure backups and perform a restore rehearsal.
8. Test desktop/mobile, English/Korean, session expiration, offline errors, failure recovery, export and deletion.
9. Roll back by reverting the preview deployment and restoring the staging database backup. Never point production DNS at this build.
