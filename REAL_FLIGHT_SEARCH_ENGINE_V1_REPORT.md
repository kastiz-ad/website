# KASTIZ ONE — Real Flight Search Engine V1

Status: implemented as provider-ready code. Not live on demo/production until Amadeus credentials are configured and verified.

## Provider connected

- Provider selected: Amadeus Flight Offers Search.
- Live provider path implemented:
  - OAuth client credentials token request.
  - Flight Offers Search.
  - Flight Offers Price / detailed fare rules preparation.
  - Provider health check.
- Booking, ticketing, seat reservation, payment, and airline contact are not enabled.

## Credentials required

Server-only variables:

- `FLIGHT_PROVIDER_ENABLED=true`
- `FLIGHT_PROVIDER_NAME=amadeus`
- `FLIGHT_PROVIDER_ENV=test` or `production`
- `AMADEUS_ENV=test` or `production`
- `AMADEUS_CLIENT_ID`
- `AMADEUS_CLIENT_SECRET`
- `FLIGHT_PROVIDER_TIMEOUT_MS`

Never place `AMADEUS_CLIENT_SECRET` in browser JavaScript, Git, screenshots, or chat.

## Files modified

- `functions/api/v1/_lib/providers/amadeus-flights.js`
- `functions/api/v1/[[path]].js`
- `functions/api/v1/_lib/providers/provider-contracts.js`
- `js/engine/providers/live/flight-provider.js`
- `js/engine/providers/live/provider-registry.js`
- `js/engine/providers/live/provider-orchestration.js`
- `.env.example`
- `FOUNDER_ACTIONS_REQUIRED.md`
- `tests/real-flight-search-engine.test.mjs`
- `tests/real-api-foundation.test.mjs`

## What the engine returns

Normalized flight offers include:

- provider
- providerFlightId
- airline
- flightNumber
- origin
- destination
- departureTime
- arrivalTime
- duration
- stops
- fareFamily
- cabin
- price
- currency
- baggage
- changePolicy
- refundPolicy
- retrievedAt
- providerEvidence

Every provider-backed item carries retrieval evidence and a warning that prices may change until booking.

## Search support

Implemented browser/provider methods:

- `searchFlights()`
- `searchRoundTrip()`
- `searchOneWay()`
- `searchMultiCity()`
- `getFareRules()`
- `getFlightDetails()`
- `healthCheck()`
- `normalizeResponse()`

Sorting:

- Best Match
- Lowest Price
- Shortest Duration
- Fewest Stops
- Earliest Departure
- Latest Departure

Filtering:

- Airlines
- Stops
- Cabin
- Departure time window
- Price range

## Error handling

Truthful states supported:

- setup required
- invalid search input
- authentication failed
- quota exceeded
- provider unavailable
- timeout/network error
- no offers

No fallback fabricates flight numbers or prices.

## Tests executed

Focused checks passed:

- `node --check functions/api/v1/[[path]].js`
- `node --check functions/api/v1/_lib/providers/amadeus-flights.js`
- `node --check js/engine/providers/live/flight-provider.js`
- `node --test tests/real-flight-search-engine.test.mjs tests/real-api-foundation.test.mjs`

Result: 18 tests passed, 0 failed.

## Known limitations

- The demo cannot show live Amadeus fares until credentials are configured in the server environment.
- Amadeus test environment may return sandbox/test inventory; UI must not present it as guaranteed or ticketed.
- Multi-city support is routed through the provider interface, but production-grade multi-city request shaping should be validated against the final Amadeus account capabilities.
- Flight details require a selected provider offer; ONE does not invent details.

## Remaining work before booking

1. Founder creates/approves Amadeus account and configures server-only credentials.
2. Verify health endpoint and ICN → HND / NRT / KIX / FUK searches.
3. Add UI binding for live flight refresh on budget, airport, dates, passengers, cabin, and accessibility changes.
4. Add booking provider only as a separate approval-gated milestone.
5. Complete legal/provider review before any ticketing or payment.

ONE can search and normalize provider-backed offers after setup. ONE cannot issue tickets, reserve seats, or guarantee fares in this milestone.
