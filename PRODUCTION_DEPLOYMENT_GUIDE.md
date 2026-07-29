# KASTIZ ONE Production Deployment Guide

Status: deployment hardening guide. This does not mean the product is production-ready.

## Required checks before production

1. Run `npm run ci`.
2. Confirm Cloudflare Pages has separate preview and production variables.
3. Confirm no provider is labeled live unless credentials authenticate and a real provider response is normalized.
4. Confirm `paymentsEnabled=false`, `REAL_PAYMENTS_ENABLED=false`, and `REAL_BOOKING_ENABLED=false` until legal, refund, payment, and provider operations are approved.
5. Confirm `_headers` is deployed with CSP, frame blocking, content type protection, referrer policy, and permissions policy.
6. Confirm founder-only pages remain blocked or protected by server-side authentication.
7. Confirm rollback path: previous known-good deployment is available in Cloudflare Pages.

## Required environment variables

Copy variables only into Cloudflare Pages environment settings. Never paste secrets into chat and never commit them.

- `APP_ENV`: `preview`, `staging`, or `production`.
- `RELEASE_SHA`: Git commit SHA for local or manually-triggered builds.
- `UPSTREAM_TIMEOUT_MS`: default `8000`.
- Supabase variables listed in `.env.example`.
- Provider variables listed in `.env.example`.

## Verification

Expected successful result:

- Production build completes.
- API responses include no secrets.
- Missing providers show setup-required states.
- Mission generation, approval, and execution-preparation tests pass.
- No fake live, real-time, current-price, confirmed, or bookable claims appear without provider evidence.

## Common mistakes

- Reusing preview credentials in production.
- Marking adapter code as a connected provider before authentication succeeds.
- Adding raw API keys to frontend JavaScript.
- Deploying without running the static quality check.
- Forgetting rollback verification.
