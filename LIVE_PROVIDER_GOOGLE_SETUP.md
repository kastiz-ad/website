# KASTIZ ONE — Google Live Provider Setup Guide

This guide is for turning the Live Provider Foundation from “ready for keys” into real Google-backed map, places, and route data.

## 1. Open Google Cloud Console

Go to Google Cloud Console and create or select the Kastiz ONE project.

## 2. Enable required APIs

Enable these APIs:

- Maps JavaScript API
- Places API
- Geocoding API
- Routes API

## 3. Enable billing

Google requires billing for these APIs. Set a budget alert before enabling public preview traffic.

Recommended starting guard:

- Daily quota: low while testing.
- Billing alert: 50%, 80%, 100%.
- Domain-restricted browser key for maps.
- Server-restricted key for server/provider calls when a backend proxy is added.

## 4. Create API keys

Create separate keys where possible:

- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `GOOGLE_ROUTES_API_KEY`

## 5. Restrict domains

For preview testing, allow only:

- `http://127.0.0.1:*`
- `http://localhost:*`
- `https://funding-demo-final.website-42u.pages.dev/*`

For production later, add:

- `https://kastiz.com/*`

Do not enable unrestricted keys.

## 6. Restrict APIs

Restrict each key to the minimum APIs:

- Maps key: Maps JavaScript API and Geocoding API if browser geocoding is allowed.
- Places key: Places API only.
- Routes key: Routes API only.

## 7. Where keys go

Local development:

```text
.env.local
GOOGLE_PROVIDER_ENABLED=true
GOOGLE_MAPS_API_KEY=...
GOOGLE_PLACES_API_KEY=...
GOOGLE_ROUTES_API_KEY=...
GOOGLE_MAP_ID=...
GOOGLE_PROVIDER_DAILY_QUOTA_LIMIT=250
GOOGLE_PROVIDER_CACHE_TTL_MS=900000
```

Cloudflare Pages preview:

Set the same variables in the Cloudflare Pages project environment variables for the preview branch only.

## 8. How to run locally

Use the existing local static server workflow, then open:

```text
http://127.0.0.1:8770/
```

The provider foundation modules are browser-safe ES modules and do not hardcode secrets.

## 9. How to verify integration

Test these before telling users data is live:

1. Search a destination.
2. Confirm geocoding returns real coordinates with provider evidence.
3. Search restaurants and attractions near the resolved destination.
4. Confirm every place has a Google Place ID where returned.
5. Confirm map markers use real coordinates.
6. Confirm route distances/durations come from Google Routes, not fallback text.
7. Confirm missing/quota/network errors show a graceful message.
8. Confirm source state is `verified_live` only for real Google responses.

## Estimated monthly cost

This cannot be finalized without expected traffic and Google’s current pricing. Keep quotas low during demos and review Google Cloud billing before investor tests.

## Remaining work

- Add a backend proxy before production if secrets must be protected from browser exposure.
- Wire the visible result map to `ProviderManager`.
- Replace fallback route durations with Google Routes output.
- Replace estimated local recommendations with Google Places results where available.
- Add marker/card synchronization after live map rendering is enabled.

