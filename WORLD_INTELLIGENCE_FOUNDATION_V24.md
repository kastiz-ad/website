# Kastiz ONE V24 — World Intelligence Foundation

V24 adds a provider-safe data foundation under the existing Mission Engine. It does not redesign the UI and does not create a second mission architecture.

## Flow

```text
External Sources
  → Provider Adapter
  → Normalizer
  → Unified ONE Model
  → Mission Engine
  → ResolutionPlan
  → UI
```

## Core rule

ONE must distinguish data state before showing recommendations:

- `verified_live`
- `cached_public`
- `estimated`
- `placeholder`
- `unavailable`

No provider result is treated as live unless the adapter marks it `verified_live`.

## Unified models

The shared model layer currently defines:

- Hotel
- Flight
- Restaurant
- Clinic
- Academy
- Business
- GovernmentResource

Every object carries `sourceMetadata`, including provider, source state, freshness, confidence, fixture mode, and evidence.

## Provider adapters

Adapters expose capabilities separately from mission logic:

- `supportsSearch`
- `supportsComparison`
- `supportsAvailability`
- `supportsBooking`
- `supportsReviews`
- `supportsPhotos`
- `supportsPricing`
- `supportsMaps`
- `supportsRealtime`
- `supportsAuthentication`

Travel uses public local-place, weather, and currency adapters when existing provider results are available. Flight, clinic, academy, and government adapters remain future/mock-unavailable unless a real provider is connected.

## Travel-first integration

The existing V23 experience-first travel UI is preserved. V24 adds a source-status card so founder testing can see whether a result is verified, cached, estimated, search-ready, or unavailable.

## Founder diagnostics

`world-intelligence-diagnostics.html` is an internal diagnostics preview. It is gated by localhost or `?founder=1` and includes `noindex`.

## Manual preview scenarios

Use these query parameters with the local results page:

- `v24WorldScenario=fully-verified`
- `v24WorldScenario=mixed-source`
- `v24WorldScenario=estimated-only`
- `v24WorldScenario=search-required`
- `v24WorldScenario=provider-unavailable`
- `v24WorldScenario=multiple-providers-merged`

Fixture mode is only for founder/developer previews. Normal user flow must not present fixture data as live provider data.
