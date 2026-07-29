# Live Events Discovery Engine — Implementation Report

## Status

Implemented as a provider-safe Events Engine.

The engine never invents events. If no event provider is connected, it returns:

`Live event data unavailable.`

## Files changed

- `js/engine/events/live-events-discovery-engine.js`
- `functions/api/v1/_lib/providers/provider-contracts.js`
- `js/engine/providers/live/provider-registry.js`
- `.env.example`
- `tests/live-events-discovery-engine.test.mjs`

## Provider status

Current status: setup required.

No general live event provider is currently connected.

Supported future provider types:

- event ticketing partners;
- tourism APIs;
- cultural event APIs;
- government/municipal event feeds;
- seasonal attraction feeds;
- sports/event marketplace integrations.

Provider IDs currently represented:

- `events-provider` — setup required.

## Architecture

The Events Engine supports:

- concerts;
- festivals;
- sporting events;
- exhibitions;
- seasonal attractions;
- fireworks;
- markets;
- cultural performances;
- family events.

It normalizes provider-backed event data into:

- title;
- provider event ID;
- category;
- venue;
- city/country;
- start/end time;
- price range;
- coordinates;
- distance;
- event URL;
- tags;
- source state;
- retrieved timestamp.

## Recommendation scoring

Events are scored by:

- mission schedule fit;
- time conflict detection;
- user interests;
- budget;
- distance;
- family fit;
- provider evidence.

## Approval behavior

Event recommendations support:

- Accept;
- Dismiss;
- Remind Later.

Accepting an event is only a planning approval. It does not purchase tickets, reserve seats, or contact providers.

Itinerary, map, budget, and travel time updates must be applied only after user approval.

## Tests

Added regression coverage for:

- setup-required provider behavior;
- no fabricated events;
- schedule matching;
- time conflict detection;
- event scoring;
- provider-backed recommendations;
- Accept / Dismiss / Remind Later state.

## Remaining work

- Choose event providers by market.
- Configure server-side credentials.
- Add provider-specific adapters.
- Add map route overlays once route provider evidence is connected.
- Add ticket/reservation handoff through the Universal Reservation Engine.
