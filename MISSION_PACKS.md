# Mission Packs

Mission packs are capability bundles, not provider lists.

| Pack | Capabilities |
|---|---|
| Travel | Flights, accommodation, restaurants, transport/place search, weather, currency, country/destination information, checklist |
| Entertainment | Events, movies, accommodation, restaurants, transport, calendar |
| Shopping | Product search/comparison/availability, delivery estimate, warranty information |
| Services | Service search/comparison/availability/estimate |
| Learning | Tutor search/comparison/availability, courses, language exchange |
| Relocation | Visa information, housing, flights, insurance, utilities, country information |

## Routing rules

1. Mission classification selects a pack.
2. The pack emits capability requests.
3. The router applies country and user priority.
4. Live public data is preferred where legally usable.
5. Key/partner connectors are attempted only when configured server-side.
6. Missing capabilities return safe fallback status, never a crash.
7. Consequential actions remain behind approval and execution feature flags.

Adding a pack requires only a new capability list and classification mapping. Adding a provider does not require changing mission packs.
