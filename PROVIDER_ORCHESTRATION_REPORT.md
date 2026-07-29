# KASTIZ ONE — Provider Orchestration V1

## Providers connected

- Google Places foundation: existing adapter, live only when server-side configuration is available.
- Google Routes foundation: existing adapter, live only when server-side configuration is available.
- Flight Provider interface: prepared, unavailable by default until a real flight API adapter is registered.
- Accommodation Provider interface: prepared, unavailable by default until a real accommodation API adapter is registered.
- Restaurant Provider interface: prepared as a future adapter and can fall back to Places search.
- Experience Provider interface: prepared as a future adapter and can fall back to Places search.

No booking, payment, reservation, ticketing, or provider contact was added.

## Normalized models

ONE now normalizes provider responses before comparison:

- Flight offer: provider, airline, flight number, airports, times, duration, stops, cabin, baggage, fare rules, currency, price, live status, retrieved time, evidence.
- Accommodation offer: provider, property, area, rating, price, cancellation, accessibility, distance to itinerary, images, live status, retrieved time, evidence.
- Transport journey: provider, origin, destination, readable steps, estimated duration, estimated cost, live status, retrieved time, evidence.

The UI should depend on these ONE-owned models, not provider-specific JSON.

## Provider comparison

ONE compares normalized options by:

- Flight: route simplicity, stops, duration, price signal, and trade-off.
- Accommodation: location/quality signal, price signal, and accessibility fit.
- Transport: readable route steps and provider evidence.

## Known limitations

- Flight and accommodation live providers are not connected yet.
- Google provider calls still require production-safe server-side environment configuration.
- Exact live availability, live fare, live cancellation, and live route cost must be verified by the provider before approval.

## Estimated API costs

- Google Places / Routes may incur usage-based API costs once enabled.
- Flight and accommodation costs depend on the selected commercial provider.
- Current preview behavior avoids unnecessary calls through cache, deduplication, and quota guard hooks.

## Developer configuration steps

1. Register real flight and accommodation adapters server-side.
2. Store API keys only in protected environment variables.
3. Restrict keys by API and domain/server context.
4. Enable provider flags only after adapter tests pass.
5. Keep provider status visible: waiting, searching, success, unavailable, rate limited, retry, expired.
