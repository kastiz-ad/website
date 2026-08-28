# ONE Free rollback checklist

## Trigger

Rollback for destination contamination, exposed secrets, broken approval boundaries, false booking/payment claims, unavailable rate limiting, widespread 5xx errors, unusable primary flows, or unsafe cache/config behavior.

## Procedure

1. [ ] Pause new production promotion and record the incident time, owner, and deployed commit.
2. [ ] Select the last verified Cloudflare Pages deployment; do not rebuild an unknown source state.
3. [ ] Restore the previous production deployment in Cloudflare Pages.
4. [ ] Confirm `kastiz.com` and `www.kastiz.com` serve the rollback deployment over HTTPS.
5. [ ] Verify `RATE_LIMITER`, CSP, CORS, `APP_ORIGIN`, and production secrets/bindings remain attached.
6. [ ] Purge only affected HTML/cache entries if needed; do not broadly delete project data.
7. [ ] Smoke-test home → results, Trust Index, approval, manual provider links, and device save/restore.
8. [ ] Confirm booking/payment/autonomous execution remain disabled.
9. [ ] Preserve logs and evidence without recording secrets or personal mission content.
10. [ ] Announce rollback status and open a fix on `launch-one-free-public`; do not patch production directly.

## Data safety

- [ ] Do not roll back Supabase migrations by editing applied migrations.
- [ ] For database incidents, restore a verified backup or use a reviewed forward migration.
- [ ] Do not alter/delete local device saves during deployment rollback.
- [ ] Re-launch only after the full pre-deployment checklist passes on a new candidate.
