# KASTIZ ONE Real API Setup Guide

Status: integration code ready, credentials not included.

Founder activation details live in `FOUNDER_PROVIDER_ACTIVATION_CHECKLIST.md`.

Provider adapter code alone does not mean a provider is connected. A provider is connected only after valid credentials are configured, authentication succeeds, a provider response is received, the response is normalized, and the UI displays truthful provider-backed information.

## Google Maps Platform

Create restricted keys in Google Cloud. Do not reuse one unrestricted key everywhere.

Required environment variables:

```env
GOOGLE_PROVIDER_ENABLED=true
GOOGLE_MAPS_BROWSER_KEY=
GOOGLE_MAPS_SERVER_KEY=
GOOGLE_MAPS_MAP_ID=
GOOGLE_PLACES_API_KEY=
GOOGLE_ROUTES_API_KEY=
GOOGLE_PROVIDER_DAILY_QUOTA_LIMIT=250
GOOGLE_PROVIDER_CACHE_TTL_MS=900000
GOOGLE_PROVIDER_TIMEOUT_MS=8000
```

Use `GOOGLE_MAPS_BROWSER_KEY` only for the browser map SDK. Restrict it by domain.

Use `GOOGLE_MAPS_SERVER_KEY`, `GOOGLE_PLACES_API_KEY`, and `GOOGLE_ROUTES_API_KEY` only in Cloudflare Pages environment variables. Restrict them by API and deployment environment. Never place them in HTML, JavaScript, analytics, logs, or commits.

## Toss Payments test mode

Required environment variables:

```env
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
TOSS_MODE=test
TOSS_PROVIDER_TIMEOUT_MS=10000
```

`TOSS_CLIENT_KEY` may be exposed to the payment UI in test mode. `TOSS_SECRET_KEY` is server-only. ONE rejects raw card numbers, CVV, passwords, OTP codes, resident-registration numbers, and bank credentials.

## Flights, accommodation, reservations

These remain setup-required until official provider access exists.

ONE must not claim:

- live flight availability;
- live accommodation inventory;
- confirmed reservation;
- paid booking;
- provider contact;
- open-now status;
- guaranteed price.

Google Places hotel results may describe hotel locations only. They are not room inventory or availability.

## Verification checklist

- `/api/v1/providers/status` returns only configured/missing state, no secrets.
- Google geocoding returns `verified_live` only after `GOOGLE_MAPS_SERVER_KEY` is set.
- Google Places returns `verified_live` only after `GOOGLE_PLACES_API_KEY` is set.
- Google Routes returns `verified_live` only after `GOOGLE_ROUTES_API_KEY` is set.
- Toss confirmation runs only in test mode with the server secret.
- Missing credentials return `setup_required`, not blank pages or fake data.
