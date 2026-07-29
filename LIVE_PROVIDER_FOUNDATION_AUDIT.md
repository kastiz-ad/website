# KASTIZ ONE — Live Provider Foundation V1 Audit

Date: 2026-07-29
Branch: v10-world-intelligence-engine

## Project stack

- Frontend: static HTML, CSS, and browser ES modules.
- Backend: Cloudflare Pages Functions under `functions/api/v1`.
- Runtime/tests: Node.js native test runner with `"type": "module"`.
- Deployment target: Cloudflare Pages preview branch `funding-demo-final`.

## Existing APIs and public-data sources found

- Open-Meteo weather and geocoding.
- Frankfurter and ExchangeRate public currency endpoints.
- CountriesNow country/city lookup.
- Nominatim and Overpass for open map/location lookups.
- Wikipedia public summary/content lookups.
- Public official/government link generation for advisory-style information.

These are useful public-data sources, but they are not the same as connected Google Maps, Google Places, Google Routes, airline, hotel, payment, or booking provider integrations.

## Existing provider layer

- `js/engine/providers.js` contains the current general provider capability registry.
- `js/pages/loading-page.js` prepares provider request objects and public-data fetches.
- `functions/api/v1/one-pass/[[path]].js` contains backend-side provider/catalog style structures for protected flows.
- No central `ProviderManager`, `MapProvider`, `PlacesProvider`, or `RouteProvider` interface existed before this milestone.

## Environment variables and API keys

- `.env.example` existed for Supabase, OpenAI, Gemini, and ONE Pass-style protected flags.
- No Google Maps / Places / Routes keys were present before this milestone.
- No Google provider should be treated as live until the required keys are configured and verified.

## Placeholder / estimated / mock data locations

The following files currently contain estimated, fallback, hardcoded, or prototype data that must not be described as live provider data:

- `js/pages/results-page.js`
  - Estimated flight, hotel, restaurant, transport, budget, schedule, map-pin, and approval-summary rendering.
  - Destination-aware fallback cards and mock/estimated evidence labels.
- `js/pages/loading-page.js`
  - Prototype provider requests, fallback coordinates, Nominatim/Overpass public-data lookup, and graceful fallback content.
- `js/ui/mission-followup.js`
  - Destination and date UX helpers with embedded destination data and coordinates.
- `js/engine/world/world-intelligence-engine.js`
  - Local world-place knowledge, multilingual aliases, and coordinates used for destination resolution.
- `js/engine/world-intelligence/world-intelligence-foundation-v24.js`
  - World Intelligence fixture/fallback provider evidence and scenario data.
- `js/engine/experience-generator/experience-library.js`
  - Experience ingredients and fallback suggestions.
- `js/engine/providers.js`
  - Capability metadata for future provider routing; not proof of live external integrations.

## Google integration status after this milestone

Implemented:

- Provider interfaces:
  - `ProviderManager`
  - `MapProvider`
  - `PlacesProvider`
  - `RouteProvider`
- Google-ready adapters:
  - Google Geocoding through Maps key.
  - Google Places Text Search with field masks.
  - Google Routes compute route with field masks.
- Cost protection scaffolding:
  - In-memory caching.
  - Request deduplication.
  - Daily quota guard.
  - Lazy execution only when called.
- Missing-key behavior:
  - Fails closed.
  - Returns developer instructions.
  - Does not claim live provider results.

Not completed as live production data:

- Google Maps rendering in the visible result card.
- Live place photos in UI.
- Marker/card synchronization in the visible map.
- Real route durations displayed in UI.

Reason: Google Cloud keys, billing, API enablement, and key restrictions are not configured in the project yet.

## Rule going forward

ONE may use fallback or public data, but every result must retain a source state such as:

- `verified_live`
- `cached_public`
- `estimated`
- `fallback`
- `mock`
- `missing_api_key`
- `unavailable`

Never display unsupported information as live provider data.

