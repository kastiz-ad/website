# KASTIZ ONE — Live Hotel Intelligence Engine V1

Status: implemented as provider-ready code. Not live on demo/production until Amadeus credentials are configured and verified.

## Provider status

- Provider selected: Amadeus Hotel List + Hotel Search V3.
- Implemented provider path:
  - OAuth client credentials token request.
  - Hotel List by city, geocode, or hotel IDs.
  - Hotel Search V3 for room availability and rates.
  - Offer detail lookup for refreshed room/cancellation details.
  - Provider health check.
- Booking/reservation is not enabled.

## Files modified

- `functions/api/v1/_lib/providers/amadeus-hotels.js`
- `functions/api/v1/[[path]].js`
- `functions/api/v1/_lib/providers/provider-contracts.js`
- `js/engine/providers/live/accommodation-provider.js`
- `js/engine/providers/live/provider-normalization.js`
- `js/engine/providers/live/provider-orchestration.js`
- `js/engine/providers/live/provider-registry.js`
- `.env.example`
- `FOUNDER_ACTIONS_REQUIRED.md`
- `tests/live-hotel-intelligence-engine.test.mjs`

## Hotel scoring

Hotel ranking now considers mission fit rather than price alone:

- destination and city code
- itinerary coordinates
- average distance to itinerary
- estimated daily walking impact
- station/airport/late-arrival signals
- early-departure fit
- accessibility signals
- budget fit
- cancellation evidence
- room type fit for solo, couple, or family missions
- provider-backed availability state when present

Every scored hotel receives:

- `missionScore`
- `missionImpact`
- `scoreReasons`
- `whySelected`

The engine avoids words like “best,” “perfect,” “cheapest,” or “available” unless provider evidence supports the specific claim.

## Mission integration

The provider interfaces are ready for mission-driven refresh:

- `AccommodationProvider`
- `HotelProvider`
- `AvailabilityProvider`
- `RateProvider`
- `CancellationProvider`

Supported actions:

- `listHotels()`
- `searchAccommodations()`
- `searchHotels()`
- `searchAvailability()`
- `searchRates()`
- `getCancellationPolicy()`
- `getHotelDetails()`
- `compareHotels()`
- `healthCheck()`

Changing hotels can produce measurable explanations such as walking-distance or total-cost changes only when the relevant provider data exists.

## Normalized hotel fields

The normalized model includes:

- provider
- providerHotelId
- providerOfferId
- property/name
- cityCode
- coordinates
- check-in/check-out dates
- room type
- room description
- availability
- nightly price
- total stay price
- base price
- taxes
- fees
- currency
- cancellation policy
- payment policy
- provider evidence
- retrieval timestamp

## Known limitations

- The demo remains setup-required until Amadeus credentials are configured server-side.
- Amadeus Hotel List returns bookable hotel IDs, but it is not itself availability.
- Hotel Search V3 provides availability/rates for returned offers, but those can change before booking.
- Some amenities, photos, breakfast, pool, gym, Wi-Fi, accessibility, smoking/non-smoking, and detailed policies depend on provider response completeness.
- Map highlighting, route recalculation, and timeline updates are represented by mission-impact objects and provider interfaces; full visual synchronization requires UI binding work.

## Future booking requirements

Before hotel reservations can exist:

1. Founder configures and verifies Amadeus hotel credentials.
2. Legal/provider review confirms allowed use of test vs production hotel data.
3. A separate booking milestone implements approval-gated reservation creation.
4. User identity, payment, cancellation policy, and provider terms are shown before any booking approval.
5. ONE receives only minimum confirmation metadata and never stores raw payment credentials.

## Tests executed

Focused checks passed:

- `node --check functions/api/v1/[[path]].js`
- `node --check functions/api/v1/_lib/providers/amadeus-hotels.js`
- `node --check js/engine/providers/live/accommodation-provider.js`
- `node --test tests/live-hotel-intelligence-engine.test.mjs tests/real-api-foundation.test.mjs tests/provider-orchestration-v1.test.mjs`

Result: 27 tests passed, 0 failed.

No reservations are created. No hotel availability, pricing, or cancellation terms are fabricated.
