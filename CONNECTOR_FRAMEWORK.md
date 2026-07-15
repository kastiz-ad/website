# Connector Framework

## Contract

Every connector exposes:

`search()` · `compare()` · `availability()` · `estimate()` · `reserve()` · `purchase()` · `cancel()` · `status()` · `health()` · `capabilities()`

Unsupported operations return `UNSUPPORTED`. Other normalized statuses: `OK`, `UNAVAILABLE`, `REQUIRES_KEY`, `REQUIRES_PARTNERSHIP`, `APPROVAL_REQUIRED`, `EXECUTION_DISABLED`, `FALLBACK`, and `ERROR`.

## Normalized result

```js
{
  connectorId, action, status, data, live, simulated,
  message, metadata, retrievedAt
}
```

`metadata` may include capability, strategy, attribution, and attempted connectors. It must never include credentials, raw mission text, or sensitive user data.

## Connector types

- **PublicApiConnector**: performs allowlisted HTTP requests and transforms responses.
- **PlaceholderConnector**: maintains identical interface but makes no external request.
- Future **PartnerConnector**: server-only credentials, consent review, idempotency, and provider policy.

## Adding a connector

1. Add an immutable definition with capabilities, actions, access level, countries, and attribution.
2. Implement only official API handlers.
3. Add response normalization and deterministic tests.
4. Add rate limits, caching, retry policy, circuit breaker, and terms review.
5. Register server-side credentials; never commit keys.
6. Test unsupported, failure, fallback, and approval cases.
7. Update the provider priority matrix and operational runbook.

## Current live handlers

Open-Meteo, OpenStreetMap Nominatim, Frankfurter, REST Countries, and Wikipedia. Free endpoints are prototype/evaluation dependencies, not production SLAs. Nominatim must remain user-triggered, cached, attributed, and below one request per second; Open-Meteo free access is non-commercial/evaluation only.
