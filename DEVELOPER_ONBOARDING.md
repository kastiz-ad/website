# KASTIZ ONE Developer Onboarding

## Local setup

1. Install Node.js 22.
2. Run `npm install`.
3. Run `npm run ci`.
4. For Cloudflare Pages Functions testing, run `npx wrangler pages dev .`.

## Repository shape

- Static product pages live at the repository root.
- Frontend modules live under `js/`.
- Cloudflare Pages Functions live under `functions/`.
- Backend shared utilities live under `functions/api/v1/_lib/`.
- Tests live under `tests/`.
- Engineering and product docs are currently mostly root-level markdown files.

## Engineering rules

- Do not commit secrets.
- Do not hardcode provider credentials.
- Do not claim a provider is live unless credentials authenticate and a provider-backed response is shown.
- Use `runtimeConfig()` for backend environment configuration.
- Use `createLogger()` for backend logs.
- Use `fetchWithTimeout()` for backend upstream calls.
- Keep customer-facing UI changes out of production-readiness work unless a safety issue requires it.

## Quality commands

- `npm run check`: static quality and syntax checks.
- `npm run security:scan`: repository security scan.
- `npm test`: Node test suite.
- `npm run ci`: all required checks.

## Current highest-risk files

- `js/pages/results-page.js`
- `results.css`

Both files are large and should be split into smaller modules with regression tests before a real public launch.
