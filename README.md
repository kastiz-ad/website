# Kastiz ONE

Kastiz ONE is an early-access AI Mission Operating System and mission-orchestration prototype operated from Seoul, Republic of Korea.

> Google searches. AI answers. Kastiz ONE completes missions.

ONE prepares and explains mission options. It never books, buys, pays, reserves, signs, submits, shares personal data with a provider, or creates a legal obligation without explicit user approval. Current committed-action flows are simulations unless an authorized provider integration is explicitly identified.

## Secure Backend V1

The repository now includes a staging-ready Supabase Auth/PostgreSQL design, RLS migration, and Cloudflare Pages Functions API under `/api/v1`. It remains disabled until the environment variables are configured. No real provider execution is enabled, and no founder password is stored in source. See `SECURE_BACKEND_SETUP.md` and `SECURE_BACKEND_API.md`.

## Run locally

Run `npm install`, then `npx wrangler pages dev .`. A plain static server still supports the prototype UI, but secure account APIs require Pages Functions and configured Supabase staging credentials.

## Product routes

- `index.html` → `loading.html` → `results.html`
- `login.html`: honest early-access account placeholder; no fake account creation
- `pricing.html`, `early-access.html`, `help.html`
- Business and policy pages are static HTML shells rendered by `js/pages/content-page.js`.

## Data providers

Live, keyless public-data adapters: Open-Meteo, Frankfurter, REST Countries, OpenStreetMap Nominatim, and Wikipedia. Flight, hotel, restaurant, transport, provider, booking, payment, identity, license, background-check, and regulated-service adapters are prototypes or restricted until real authorization exists.

## Privacy and security

Do not add secrets or payment-card data to frontend code. Analytics has an event allowlist and does not send raw mission text. Local prototype request forms store only a request type and timestamp in the browser; they clearly state that no external submission occurs.

See `LAUNCH_CHECKLIST.md`, `KNOWN_LIMITATIONS.md`, `SERVICE_REGISTRY.md`, and policy pages before launch. Legal policies are drafts requiring qualified Korean legal review.
