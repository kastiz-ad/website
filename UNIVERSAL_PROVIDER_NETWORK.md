# Universal Provider Network

## Principle

ONE routes outcomes to capabilities. Mission code never selects Booking.com, Coupang, Catchtable, or another brand. It requests `flight.search`, `accommodation.search`, `product.compare`, `tutor.search`, and similar capabilities. The registry selects an eligible connector by country, availability, access, and user priority.

```text
User outcome → Mission classification → Mission pack → Capability requests
→ Capability router → Connector registry → Live connector / authorized partner / safe fallback
→ normalized result → explanation → approval boundary
```

## Implemented components

- `connector-contract.js`: shared actions, statuses, access levels, normalized result.
- `base-connector.js`: identical `search`, `compare`, `availability`, `estimate`, `reserve`, `purchase`, `cancel`, `status`, `health`, `capabilities` interface.
- `provider-registry.js`: connector discovery and enable/disable boundary.
- `capability-router.js`: strategy ordering, provider attempts, fallback, and approval guard.
- `mission-router.js`: mission type to mission pack; emits capabilities only.
- `public-connectors.js`: live public API handlers.
- `placeholder-connector.js`: truthful key/partnership/enterprise/simulated status without external calls.
- `countries.js`: data-driven country expansion.

## Safety

`reserve`, `purchase`, and `cancel` cannot execute without explicit approval. Even after approval they return `EXECUTION_DISABLED` in this prototype. Commercial placeholders never contact providers, scrape sites, or expose credentials. Provider failure returns a normalized result and cannot crash the mission.

## Strategy

Supported priorities are Balanced, Best Value, Cheapest, Fastest, and Highest Rated. Today they rank connector access/fallback safety; production ranking will combine normalized total cost, availability freshness, rating confidence, duration, cancellation terms, and provider health. Every recommendation must retain its reason vector.

## Scale path

At production scale the browser connectors move behind a server provider gateway with credential isolation, caching, rate limits, circuit breakers, bulkheads, regional queues, idempotency, provider-specific compliance, and observability. The frontend contract remains unchanged.
