# FOUNDER ACTIONS REQUIRED

This is the practical activation checklist. Do not paste API keys into Codex chat. Do not commit secrets. Put credentials only into ignored local env files or encrypted deployment environment variables.

## 1. Google Maps

1. Provider name: Google Maps JavaScript API
2. Current status: Code ready — credentials required
3. What Codex completed: browser-safe provider registry, environment-variable names, status checks, setup-required behavior
4. Founder must complete manually: create restricted browser key and optional map ID
5. Console/account area: Google Cloud Console → APIs & Services → Credentials; Google Maps Platform → Map Management
6. Required API/service: Maps JavaScript API
7. Billing required: yes
8. Provider approval/contract required: Google Cloud terms and billing acceptance required
9. Required credential names: browser API key, optional map ID
10. Environment variables: `GOOGLE_MAPS_BROWSER_KEY`, `GOOGLE_MAPS_MAP_ID`
11. Browser-safe/server-only: `GOOGLE_MAPS_BROWSER_KEY` is browser-safe only after HTTP referrer restrictions; `GOOGLE_MAPS_MAP_ID` is browser-safe
12. Local development location: ignored `.env.local` or framework-equivalent local secret file
13. Deployed location: Cloudflare Pages protected environment variables
14. Restrictions: allow only localhost/dev origin, Cloudflare preview host, and `kastiz.com`; restrict key to Maps JavaScript API
15. Verification: open `/api/v1/providers/status`, then load a page with map rendering
16. Expected success: map provider shows configured and map renders without exposing server keys
17. Common setup errors: missing preview domain, unrestricted key, wrong API restriction
18. Security warnings: rotate if exposed; use separate preview/production keys
19. Environment: production-capable after Founder setup; currently not verified
20. Estimated API-cost exposure: map loads are billable; current pattern lazy-loads maps only when needed

## 2. Google Geocoding

1. Provider name: Google Geocoding API
2. Current status: Code ready — credentials required
3. What Codex completed: server-side geocoding route, normalization, setup-required and provider-error handling
4. Founder must complete manually: create restricted server key
5. Console/account area: Google Cloud Console → APIs & Services → Credentials
6. Required API/service: Geocoding API
7. Billing required: yes
8. Provider approval/contract required: Google Cloud terms and billing acceptance required
9. Required credential names: server API key
10. Environment variables: `GOOGLE_MAPS_SERVER_KEY`
11. Browser-safe/server-only: server-only
12. Local development location: ignored `.env.local`
13. Deployed location: Cloudflare Pages protected environment variable
14. Restrictions: restrict to Geocoding API; restrict server environment where possible
15. Verification: geocode `서울`, `Lima Peru`, and `New York USA` through backend endpoint/test flow
16. Expected success: normalized destination includes place ID, address, coordinates, location type, provider, retrieval timestamp
17. Common setup errors: using browser referrer restrictions on server key, not enabling API, missing billing
18. Security warnings: never expose this key to frontend
19. Environment: production-capable after Founder setup; currently not verified
20. Estimated API-cost exposure: one request per destination resolution; cache/dedupe guards reduce repeat calls

## 3. Google Places

1. Provider name: Google Places API
2. Current status: Code ready — credentials required
3. What Codex completed: server-side Text Search adapter, field masks, normalized places, setup-required behavior
4. Founder must complete manually: create restricted Places key
5. Console/account area: Google Cloud Console → APIs & Services → Credentials
6. Required API/service: Places API
7. Billing required: yes
8. Provider approval/contract required: Google Cloud terms and billing acceptance required
9. Required credential names: Places API key
10. Environment variables: `GOOGLE_PLACES_API_KEY`
11. Browser-safe/server-only: server-only
12. Local development location: ignored `.env.local`
13. Deployed location: Cloudflare Pages protected environment variable
14. Restrictions: restrict to Places API; set quotas
15. Verification: search `matcha ice cream near Kyoto`, restaurant queries, attractions, cafes, shopping
16. Expected success: real place names appear only with provider evidence and retrieval timestamp
17. Common setup errors: treating place existence as reservation availability, requesting too many fields
18. Security warnings: field masks only; do not log raw responses with user data
19. Environment: production-capable after Founder setup; currently not verified
20. Estimated API-cost exposure: Text Search calls are billable; current implementation caps result count and field masks

## 4. Google Routes

1. Provider name: Google Routes API
2. Current status: Code ready — credentials required
3. What Codex completed: server-side route adapter, normalized route object, field masks, failure categories
4. Founder must complete manually: create restricted Routes key
5. Console/account area: Google Cloud Console → APIs & Services → Credentials
6. Required API/service: Routes API
7. Billing required: yes
8. Provider approval/contract required: Google Cloud terms and billing acceptance required
9. Required credential names: Routes API key
10. Environment variables: `GOOGLE_ROUTES_API_KEY`
11. Browser-safe/server-only: server-only
12. Local development location: ignored `.env.local`
13. Deployed location: Cloudflare Pages protected environment variable
14. Restrictions: restrict to Routes API; set quotas/timeouts
15. Verification: compute walking/driving/transit routes between two known coordinates
16. Expected success: distance, duration, polyline, and returned steps appear only when Google returns them
17. Common setup errors: inventing transit line/fare/opening data not returned by provider
18. Security warnings: avoid continuous retry loops; cache and debounce
19. Environment: production-capable after Founder setup; currently not verified
20. Estimated API-cost exposure: one route request per route calculation; field masks reduce payload/cost risk

## 5. Toss Payments

1. Provider name: Toss Payments
2. Current status: Test environment only
3. What Codex completed: test-mode order preparation, server confirmation helper, idempotency guard, raw credential rejection
4. Founder must complete manually: create/approve Toss merchant account and add test keys; later complete production merchant activation
5. Console/account area: Toss Payments Developer Center / merchant dashboard
6. Required API/service: Payments test environment; production payments later
7. Billing required: merchant/payment terms apply; production requires approval
8. Provider approval/contract required: yes for production merchant processing
9. Required credential names: Toss client key, Toss secret key
10. Environment variables: `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, `TOSS_MODE=test`
11. Browser-safe/server-only: `TOSS_CLIENT_KEY` browser-safe for test UI; `TOSS_SECRET_KEY` server-only
12. Local development location: ignored `.env.local`
13. Deployed location: Cloudflare Pages protected environment variables
14. Restrictions: callback/redirect URLs must match deployed preview/production domains; keep test and production separate
15. Verification: complete a Toss test flow and confirm backend receives only minimum receipt metadata
16. Expected success: payment test status updates; no flight/hotel/reservation is marked confirmed from payment alone
17. Common setup errors: using live keys in demo, exposing secret key, marking booking complete after payment test
18. Security warnings: never collect raw card/CVV/OTP/password in ONE
19. Environment: test only
20. Estimated API-cost exposure: test mode has no real charge; production fees apply only after merchant activation

## 6. Flight provider

1. Provider name: future flight search provider
2. Current status: Provider approval or contract required
3. What Codex completed: provider contract and setup-required state
4. Founder must complete manually: select provider, create account, accept terms, obtain approved credentials
5. Console/account area: Amadeus, Duffel, airline, GDS, or approved travel inventory provider portal
6. Required API/service: flight search; booking only if separately approved
7. Billing required: usually yes or contract-based
8. Provider approval/contract required: yes
9. Required credential names: provider-specific client ID/key/secret/webhook secret
10. Environment variables: future provider-specific server-only variables
11. Browser-safe/server-only: server-only
12. Local development location: ignored `.env.local`
13. Deployed location: Cloudflare Pages protected environment variables
14. Restrictions: provider-approved redirect/webhook domains if applicable
15. Verification: authenticated flight search returns real itinerary/fare response and normalizes successfully
16. Expected success: current prices/schedules appear only from provider evidence
17. Common setup errors: showing sandbox/sample fares as real
18. Security warnings: separate search, booking, payment permissions
19. Environment: not implemented beyond contract
20. Estimated API-cost exposure: unknown until provider selected

## 7. Accommodation provider

1. Provider name: future accommodation inventory provider
2. Current status: Provider approval or contract required
3. What Codex completed: provider contract and setup-required state
4. Founder must complete manually: select provider, create account, accept terms, obtain inventory/search credentials
5. Console/account area: Booking, Agoda, Expedia, hotel partner, affiliate, or approved inventory portal
6. Required API/service: accommodation search/inventory; booking only if separately approved
7. Billing required: usually contract/affiliate/commercial terms
8. Provider approval/contract required: yes
9. Required credential names: provider-specific key/client ID/secret
10. Environment variables: future provider-specific server-only variables
11. Browser-safe/server-only: server-only
12. Local development location: ignored `.env.local`
13. Deployed location: Cloudflare Pages protected environment variables
14. Restrictions: provider-approved domains/webhooks if applicable
15. Verification: authenticated room search returns availability/pricing/cancellation evidence and normalizes successfully
16. Expected success: availability appears only from inventory provider, not Google Places
17. Common setup errors: treating Google Places hotel location as room availability
18. Security warnings: avoid logging guest/payment details
19. Environment: not implemented beyond contract
20. Estimated API-cost exposure: unknown until provider selected

## 8. Reservation provider

1. Provider name: future reservation/execution provider
2. Current status: Provider approval or contract required
3. What Codex completed: reservation provider contract and fail-closed behavior
4. Founder must complete manually: select provider, complete account/legal approval, configure callbacks/webhooks
5. Console/account area: provider-specific reservation platform
6. Required API/service: reservation/action API
7. Billing required: provider-dependent
8. Provider approval/contract required: yes
9. Required credential names: provider-specific credentials/webhook secrets/OAuth IDs
10. Environment variables: future provider-specific server-only variables
11. Browser-safe/server-only: server-only except provider-approved OAuth public IDs
12. Local development location: ignored `.env.local`
13. Deployed location: Cloudflare Pages protected environment variables
14. Restrictions: callback/redirect/webhook URLs must match provider dashboard
15. Verification: approval → external provider auth → provider response → normalized confirmation reference
16. Expected success: reservation status changes only with real provider confirmation evidence
17. Common setup errors: calling a prepared request a reservation
18. Security warnings: webhook signature validation and idempotency required
19. Environment: not implemented beyond contract
20. Estimated API-cost exposure: unknown until provider selected

## EXACT NEXT STEP

Configure `GOOGLE_MAPS_SERVER_KEY` for Google Geocoding in Cloudflare Pages Preview environment, then verify one real destination resolution in `/api/v1/providers/status` and the backend geocode flow.
