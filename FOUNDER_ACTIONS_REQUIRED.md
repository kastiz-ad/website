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

1. Provider name: Amadeus Flight Offers Search
2. Current status: Code ready — credentials required
3. What Codex completed: server-side Amadeus OAuth, Flight Offers Search adapter, fare-rules adapter, health check, normalized result schema, setup-required state
4. Founder must complete manually: create/approve an Amadeus for Developers account, accept provider terms, create an app, obtain approved credentials, and configure environment variables
5. Console/account area: https://developers.amadeus.com/
6. Required API/service: Self-Service Flight Offers Search; Flight Offers Price / detailed fare rules for fare-rule inspection; booking/ticketing is not enabled
7. Billing required: Amadeus terms/quota apply; production access may require additional approval
8. Provider approval/contract required: required for production access and any booking/ticketing capability
9. Required credential names: AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET
10. Environment variables: FLIGHT_PROVIDER_ENABLED=true, FLIGHT_PROVIDER_NAME=amadeus, FLIGHT_PROVIDER_ENV=test or production, AMADEUS_ENV=test or production, AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET, FLIGHT_PROVIDER_TIMEOUT_MS
11. Browser-safe/server-only: server-only
12. Local development location: ignored `.env.local`
13. Deployed location: Cloudflare Pages protected environment variables
14. Restrictions: provider-approved redirect/webhook domains if applicable
15. Verification: call `/api/v1/providers/flights/health`, then `/api/v1/providers/flights/search` with ICN → HND and confirm Amadeus-backed normalized offers include provider evidence and retrieval timestamp
16. Expected success: current prices/schedules appear only from Amadeus provider evidence; UI still says prices may change until booking
17. Common setup errors: using production mode with test credentials, enabling FLIGHT_PROVIDER_ENABLED before credentials are valid, treating sandbox/test fares as guaranteed, exposing AMADEUS_CLIENT_SECRET to browser code
18. Security warnings: never paste Amadeus secrets into Codex chat; keep credentials server-only; do not log OAuth tokens or raw provider payloads
19. Environment: server-side adapter implemented; demo remains setup-required until credentials are configured
20. Estimated API-cost exposure: depends on Amadeus quota/plan and must be reviewed in the Amadeus console

## 7. Accommodation provider

1. Provider name: Amadeus Hotel List + Hotel Search V3
2. Current status: Code ready — credentials required
3. What Codex completed: server-side Amadeus hotel list, live hotel offers, offer detail/cancellation inspection, health check, normalized hotel schema, mission scoring, setup-required state
4. Founder must complete manually: create/approve an Amadeus for Developers account, accept hotel API terms, create an app, obtain credentials, and configure environment variables
5. Console/account area: https://developers.amadeus.com/
6. Required API/service: Hotel List API and Hotel Search V3; booking is not enabled
7. Billing required: Amadeus terms/quota apply; production access may require additional approval
8. Provider approval/contract required: required for production access and any booking/reservation capability
9. Required credential names: AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET
10. Environment variables: ACCOMMODATION_PROVIDER_ENABLED=true, ACCOMMODATION_PROVIDER_NAME=amadeus, HOTEL_PROVIDER_ENV=test or production, AMADEUS_ENV=test or production, AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET, HOTEL_PROVIDER_TIMEOUT_MS
11. Browser-safe/server-only: server-only
12. Local development location: ignored `.env.local`
13. Deployed location: Cloudflare Pages protected environment variables
14. Restrictions: provider-approved domains/webhooks if applicable
15. Verification: call `/api/v1/providers/hotels/health`, then `/api/v1/providers/hotels/search` with city code, dates, guests, and rooms; confirm normalized offers include provider evidence, total price, taxes/fees when returned, cancellation policy when returned, and retrieval timestamp
16. Expected success: availability/prices appear only from Amadeus Hotel Search V3 evidence, not Google Places or static hotel names
17. Common setup errors: using Hotel List results as availability, using production mode with test credentials, showing test inventory as guaranteed, exposing AMADEUS_CLIENT_SECRET to browser code
18. Security warnings: never paste Amadeus secrets into Codex chat; keep credentials server-only; do not log OAuth tokens, guest data, or raw provider payloads
19. Environment: server-side adapter implemented; demo remains setup-required until credentials are configured
20. Estimated API-cost exposure: depends on Amadeus quota/plan and must be reviewed in the Amadeus console

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
