# ONE Free production configuration checklist

This checklist is a deployment gate for the existing ONE Free public beta. It does not enable autonomous booking, payments, or unfinished paid-tier functionality.

## Cloudflare Pages

- [ ] Production branch is explicitly set to the intended release branch after approval.
- [ ] Build command and output directory match `package.json` and the Pages project configuration.
- [ ] Custom domains `kastiz.com` and `www.kastiz.com` resolve to the same approved release.
- [ ] `APP_ENV=production` is set in the production environment only.
- [ ] `CF_PAGES_BRANCH` is available at runtime and production deployments identify the expected branch.
- [ ] The `RATE_LIMITER` binding is configured in production. Missing it is a launch blocker and API requests fail closed with HTTP 503.
- [ ] Preview deployments use separate non-production environment values.
- [ ] Cache rules do not retain stale HTML after a release; asset version query strings remain consistent.
- [ ] Cloudflare Function logs are available and contain no secrets or raw credentials.

## Supabase and authentication

- [ ] Public account entry points remain hidden/disabled for ONE Free beta until the full production auth matrix passes.
- [ ] If auth is enabled later, production Supabase URL and anon key are configured as secrets/environment values, never committed.
- [ ] Site URL and redirect allowlist contain only approved `https://kastiz.com` callback URLs.
- [ ] Email verification, password reset, logout, session expiry, and account recovery are verified in production-like testing before exposing Login.
- [ ] Service-role credentials are never sent to the browser.
- [ ] Current device-only trip saving is labeled honestly; no cross-device sync is claimed.

## OpenAI

- [ ] Server-side OpenAI key is configured only if an existing launch path requires it.
- [ ] No OpenAI secret is present in client bundles, HTML, source maps, logs, or analytics.
- [ ] Model and request limits are explicit and compatible with the deployed API.
- [ ] Timeout, unavailable-provider, and rate-limit responses produce honest customer-visible fallback states.

## Google and maps

- [ ] Any enabled browser key is restricted by HTTPS referrer to approved Kastiz domains.
- [ ] Any server key is restricted by API and runtime environment.
- [ ] OpenStreetMap attribution remains visible wherever OSM data is rendered.
- [ ] Missing maps/geocoding lowers the ONE Trust Index and never substitutes another destination.
- [ ] External Google Flights, Hotels, and Maps handoff links preserve destination, dates, travelers, and selected options where supported.

## Amadeus and travel providers

- [ ] Amadeus credentials are server-side only and environment-specific.
- [ ] Provider status accurately distinguishes live, estimated, fallback, limited, and unavailable data.
- [ ] Disabled or unconfigured adapters remain disabled; no test-only provider is enabled for launch.
- [ ] A failed provider request shows an honest manual/unavailable state and never claims a booking.

## Security, CORS, CSP, and operational gates

- [ ] Production allowed origins contain only approved HTTPS Kastiz origins.
- [ ] CORS rejects unapproved origins and state-changing requests require CSRF protection.
- [ ] CSP is reviewed against the exact production assets and required third-party origins.
- [ ] `RATE_LIMITER` is bound and exercised before launch; absence is a hard deployment blocker.
- [ ] Error responses do not expose stack traces, secrets, provider payloads, or personal data.
- [ ] `pnpm run check`, `pnpm run security:scan`, `pnpm test`, and `git diff --check` all pass on the exact candidate.
- [ ] iPhone, Android, tablet, and desktop launch paths are checked on the exact private candidate in English, Korean, and Spanish.
- [ ] No production deployment occurs until every unchecked launch blocker above is resolved and explicitly approved.
