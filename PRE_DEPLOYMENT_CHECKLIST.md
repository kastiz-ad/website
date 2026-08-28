# ONE Free pre-deployment checklist

Use this for the exact `launch-one-free-public` candidate. Do not deploy until every hard gate is checked.

## Release integrity

- [ ] Release commit exists on `origin/launch-one-free-public` and its hash is recorded.
- [ ] `pnpm run check`, `pnpm run security:scan`, `pnpm test`, and `git diff --check` pass on that commit.
- [ ] Diff contains no protected PNGs, KoreaCalc files, secrets, screenshots, debug files, or unrelated reports.
- [ ] ONE Plus/Pro execution, autonomous booking, payments, passport persistence, and identity vault remain disabled.

## Cloudflare Pages — hard gates

- [ ] Pages project, production branch, build command, and output directory are explicitly verified.
- [ ] Pages Functions under `functions/` are included in the candidate.
- [ ] `kastiz.com` and `www.kastiz.com` point to the approved candidate.
- [ ] `APP_ENV=production`, `APP_ORIGIN=https://kastiz.com`, and an HTTPS-only `CORS_ALLOWED_ORIGINS` allowlist are set.
- [ ] `RATE_LIMITER` is bound in production and a controlled request proves it works. **Missing binding = NO-GO.**
- [ ] Required environment values are present; secret values are server-only and absent from browser assets/logs.
- [ ] `_headers` CSP/security rules are verified on the deployed preview.
- [ ] HTML revalidation and asset-version behavior prevent stale releases.
- [ ] Function failures return safe customer errors without stack traces, credentials, or false execution claims.

## Services and data

- [ ] Supabase URL/anon configuration is production-scoped; service-role key is server-only.
- [ ] Applied migration list and RLS policies are verified against production Supabase.
- [ ] Public Login/Signup remains hidden for the beta.
- [ ] OpenAI key is server-only; timeouts, request limits, budgets, and honest fallback are configured.
- [ ] Google and Amadeus stay disabled unless production credentials, restrictions, quotas, and health checks are verified.
- [ ] Unavailable providers visibly degrade to estimated/limited/manual handoff states.

## Candidate verification

- [ ] Private candidate passes iPhone, Android, tablet, and desktop smoke tests.
- [ ] English, Korean, and Spanish launch paths are checked.
- [ ] Travel, Presentation, Meeting, and Interview preparation flows are checked.
- [ ] Save/reload, Trust Index, manual provider links, slow network, and provider failure states are checked.
- [ ] Previous known-good Cloudflare deployment and rollback owner are recorded.

