# Performance report

Date: 2026-07-15 · Scope: static funding-demo build

## Findings

- Main bottlenecks are the large homepage/results modules, Google Fonts, and sequential loading animation plus public API calls.
- Theme bootstrap remains inline in `<head>` to prevent a light-theme flash.
- Provider calls now use timeouts, limited retries and an in-memory TTL cache, preventing repeated slow requests during one session.
- Static assets receive long-lived immutable caching through `_headers`; HTML revalidates.
- The logo uses fixed layout dimensions and reduced-motion styling already present in the product.
- The offline demo has no external dependencies.

## Remaining limitations

- Exact transfer sizes and Core Web Vitals must be measured on the deployed host; this workspace has no browser performance runner or Node runtime.
- `home-page.js` and `results-page.js` remain large and should be split further only after the funding demo to avoid destabilizing established behavior.
- Google Fonts remain a render dependency; a later release should self-host a subset or use a system-font fallback metric match.
