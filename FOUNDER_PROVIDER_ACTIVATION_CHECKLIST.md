# Founder Provider Activation Checklist

Codex can implement integration code. Codex cannot activate external services that require legal, billing, account, domain, merchant, or provider approval by the Founder.

Never paste API keys into Codex chat. Copy secrets only into secure environment variables such as Cloudflare Pages project variables or the provider's approved dashboard.

## Step 1 — Google Cloud project and billing

- Purpose: enable Google Maps Platform APIs legally and with billing controls.
- Website: https://console.cloud.google.com/
- Required account: Founder-owned Google account or company Google Workspace account.
- Required permissions: Project Owner or Billing Administrator.
- Estimated completion time: 20–45 minutes.
- Variables to copy: none yet.
- Where variables belong: not applicable yet.
- Verification steps:
  1. Create or select the Kastiz Google Cloud project.
  2. Attach billing.
  3. Confirm Maps Platform appears enabled in the project.
- Expected successful result: project is ready to create restricted Maps keys.
- Common mistakes: using a personal test project, leaving billing alerts off, using one unrestricted key for every API.
- Security recommendations: enable billing alerts, API restrictions, referrer restrictions for browser keys, and IP/service restrictions where possible.

## Step 2 — Google Maps browser key

- Purpose: render Google Maps safely in the browser.
- Website: https://console.cloud.google.com/google/maps-apis/credentials
- Required account: same Google Cloud project from Step 1.
- Required permissions: Project Owner or Editor.
- Estimated completion time: 10–20 minutes.
- Variables to copy: `GOOGLE_MAPS_BROWSER_KEY`, optional `GOOGLE_MAPS_MAP_ID`.
- Exactly where each variable belongs:
  - Cloudflare Pages → project → Settings → Environment variables → Preview and Production as needed.
  - Local `.env` only if testing locally. Never commit `.env`.
- Verification steps:
  1. Restrict key by website referrer.
  2. Allow preview domain and production domain separately.
  3. Restrict key to Maps JavaScript API.
  4. Load `/api/v1/providers/status`.
- Expected successful result: `google-maps` shows configured/enabled, but server providers may still show setup required.
- Common mistakes: forgetting Cloudflare preview domain, enabling all APIs, using a server key in frontend.
- Security recommendations: rotate leaked keys immediately, use separate preview and production keys.

## Step 3 — Google Geocoding server key

- Purpose: verify destination names, addresses, place IDs, coordinates, and ambiguity without exposing the key to users.
- Website: https://console.cloud.google.com/google/maps-apis/credentials
- Required account: same Google Cloud project.
- Required permissions: Project Owner or Editor.
- Estimated completion time: 10–20 minutes.
- Variables to copy: `GOOGLE_MAPS_SERVER_KEY`.
- Exactly where each variable belongs:
  - Cloudflare Pages environment variable only.
  - Do not place in HTML, JS, screenshots, analytics, Git, or Codex chat.
- Verification steps:
  1. Restrict key to Geocoding API.
  2. Add it to Cloudflare Pages.
  3. Call the provider geocode endpoint from an approved test flow.
- Expected successful result: geocoding returns provider-backed normalized destination results with `verified_live` only after an actual Google response.
- Common mistakes: using browser referrer restrictions on a server key, forgetting to enable Geocoding API.
- Security recommendations: use a separate key from browser maps and set quota ceilings.

## Step 4 — Google Places API key

- Purpose: search real restaurants, cafes, attractions, parks, shopping, stations, airports, and hotel locations as places.
- Website: https://console.cloud.google.com/google/maps-apis/credentials
- Required account: same Google Cloud project.
- Required permissions: Project Owner or Editor.
- Estimated completion time: 10–25 minutes.
- Variables to copy: `GOOGLE_PLACES_API_KEY`.
- Exactly where each variable belongs:
  - Cloudflare Pages environment variable only.
- Verification steps:
  1. Restrict key to Places API.
  2. Confirm field-mask requests return display name, address, coordinates, rating if available, opening status if available, and photos metadata if available.
  3. Test “matcha ice cream near Kyoto route” after a mission edit.
- Expected successful result: place cards can show real provider-backed names. Missing fields remain blank or “check required.”
- Common mistakes: claiming hotels are bookable from Places data; claiming open now when `openNow` is absent.
- Security recommendations: use field masks, cache carefully, set per-day quotas, do not request expensive fields by default.

## Step 5 — Google Routes API key

- Purpose: compute route distance, duration, steps, and polylines from provider evidence.
- Website: https://console.cloud.google.com/google/maps-apis/credentials
- Required account: same Google Cloud project.
- Required permissions: Project Owner or Editor.
- Estimated completion time: 10–25 minutes.
- Variables to copy: `GOOGLE_ROUTES_API_KEY`.
- Exactly where each variable belongs:
  - Cloudflare Pages environment variable only.
- Verification steps:
  1. Restrict key to Routes API.
  2. Test walking/driving/transit route between two known places.
  3. Confirm the UI does not invent fares, schedules, delays, or accessibility when not returned.
- Expected successful result: route data is normalized and shown as provider-backed only after a successful response.
- Common mistakes: assuming all countries support every transit detail, showing fake line/fare data.
- Security recommendations: debounce route requests and use quota guards.

## Step 6 — Toss Payments test account

- Purpose: prepare test payment flow without production money movement.
- Website: https://developers.tosspayments.com/
- Required account: Founder-owned Toss Payments merchant/developer account.
- Required permissions: merchant/admin access.
- Estimated completion time: 20–60 minutes, depending on account approval.
- Variables to copy: `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, `TOSS_MODE=test`.
- Exactly where each variable belongs:
  - `TOSS_CLIENT_KEY`: Cloudflare Pages variable; can be exposed to the payment UI in test mode.
  - `TOSS_SECRET_KEY`: Cloudflare Pages server variable only.
  - `TOSS_MODE=test`: Cloudflare Pages variable.
- Verification steps:
  1. Create a test order.
  2. Complete Toss external test authentication.
  3. Confirm server-side `/payments/confirm` returns only minimum receipt metadata.
  4. Repeat the same callback and verify duplicate prevention.
- Expected successful result: test payment status updates, no raw card/CVV/password/OTP is stored by ONE.
- Common mistakes: using live keys during demo, putting secret key in frontend, asking user for card details directly.
- Security recommendations: keep production payments disabled until legal, refund, tax, privacy, and support flows are reviewed.

## Step 7 — Flight provider account

- Purpose: obtain live flight search from an authorized flight provider.
- Website: provider-specific, for example Amadeus, Duffel, airline partner portal, or approved travel inventory provider.
- Required account: Founder/company provider developer account.
- Required permissions: API access approval and terms acceptance.
- Estimated completion time: 1 day to several weeks depending on provider approval.
- Variables to copy: provider client ID, API key, secret, environment, webhook secret if applicable.
- Exactly where each variable belongs:
  - Cloudflare Pages server environment variables only.
- Verification steps:
  1. Authenticate successfully.
  2. Search a real route.
  3. Normalize fare, itinerary, baggage/refund/change evidence.
  4. Ensure ONE says “current price” only when provider response supports it.
- Expected successful result: flight provider status becomes connected only after successful authenticated response.
- Common mistakes: using sample sandbox fares as real fares; showing bookable before booking permission exists.
- Security recommendations: separate search credentials from booking/payment credentials.

## Step 8 — Accommodation provider account

- Purpose: retrieve live room inventory and prices from an authorized accommodation provider.
- Website: provider-specific, for example Booking, Agoda, Expedia, hotel PMS, or approved affiliate/partner portal.
- Required account: Founder/company provider account.
- Required permissions: inventory/search API approval and terms acceptance.
- Estimated completion time: days to weeks.
- Variables to copy: provider key/client ID/secret/environment/webhook secret if available.
- Exactly where each variable belongs:
  - Cloudflare Pages server environment variables only.
- Verification steps:
  1. Authenticate successfully.
  2. Search destination, dates, guests, rooms.
  3. Normalize availability, cancellation policy, taxes/fees if returned.
  4. Confirm Google Places hotel locations are not mixed with room inventory.
- Expected successful result: accommodation inventory is provider-backed and clearly labeled.
- Common mistakes: treating Google Places hotel names as availability.
- Security recommendations: log only provider status/reference, never guest identity or payment details unless approved and minimized.

## Step 9 — Reservation provider account

- Purpose: reserve or request provider actions only after explicit user approval.
- Website: provider-specific reservation platform.
- Required account: Founder/company provider account.
- Required permissions: reservation API, OAuth, webhook, or provider agreement.
- Estimated completion time: days to months.
- Variables to copy: provider credentials, OAuth client IDs, webhook secrets, redirect URIs.
- Exactly where each variable belongs:
  - Cloudflare Pages server environment variables.
  - Provider dashboard redirect URL settings.
- Verification steps:
  1. Prepare reservation action.
  2. Require user approval.
  3. Redirect to provider auth if needed.
  4. Receive only minimum returned data.
  5. Update mission status without exposing unnecessary sensitive data.
- Expected successful result: provider action executes only after user approval and external provider authentication.
- Common mistakes: calling a prepared request a confirmed reservation.
- Security recommendations: idempotency keys, audit logs, webhook signature validation, no raw provider passwords.

## Final activation verification

Provider is connected only when all are true:

1. Valid credentials are configured.
2. Authentication succeeds.
3. A successful provider response is received.
4. The response is normalized.
5. UI displays truthful provider-backed information.

If any condition fails, ONE must show setup required, authentication failed, provider unavailable, quota exceeded, network error, or another truthful status.
