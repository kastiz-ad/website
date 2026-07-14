# Analytics Architecture

All product events pass through `js/analytics/analytics-manager.js`. Components never call vendors directly. The manager enforces an event allowlist, a safe metadata allowlist, forbidden-key screening, context normalization, short-window duplicate suppression and consent gating.

GA4 is configured but loaded only after analytics consent. Cloudflare’s code adapter is present but disabled because no explicit beacon token is configured. Local debug events are session-only and available exclusively on localhost or explicit analytics debug sessions; they are not production storage.

Future backend ingestion must be append-only, authenticated, rate-limited, schema validated, retention limited and aggregated before founder display.
