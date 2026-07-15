# Free API Roadmap

## Immediately usable for prototype/evaluation

| API | Current use | Production caveat |
|---|---|---|
| Open-Meteo | Global forecast | Free endpoint is non-commercial, under 10,000 calls/day, no SLA; commercial licence needed for production |
| OpenStreetMap Nominatim | User-triggered geocoding | Maximum 1 request/second, attribution/caching/identifying request required; self-host or commercial provider at scale |
| Frankfurter | Exchange rates | Validate licence/SLA and use server caching for production |
| REST Countries | Country metadata | Cache and validate availability/licence before production dependency |
| Wikipedia REST | Destination summaries | Attribution/licence, content quality, caching, and language handling required |

## Requires a free developer key

- Naver Shopping Search: app registration plus client ID/secret; secret must be server-side.
- Google Places is key-and-billing based, not classified as free despite possible no-cost usage tiers.

## Next steps

1. Move all HTTP calls to a server gateway before commercial beta.
2. Add attribution UI/data lineage without redesigning decision flow.
3. Add per-provider caching, quotas, health, circuit breakers, and budget alerts.
4. Replace public Nominatim with self-hosted or contracted geocoding before meaningful scale.
5. Purchase Open-Meteo commercial access or self-host before paid/commercial use.
6. Add contract tests against recorded official sandbox responses.

Official references: Open-Meteo docs/pricing/terms, OSMF Nominatim policy, Naver Shopping Search API documentation, REST Countries, Frankfurter, and Wikimedia REST documentation.
