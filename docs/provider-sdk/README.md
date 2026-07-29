# KASTIZ ONE Provider SDK

Version: `20260730-provider-marketplace-sdk-v1`

The Provider SDK lets new providers plug into ONE without changing the Mission Engine.

Mission Engines should depend on provider categories and capabilities, not vendor-specific code.

## Supported categories

- Flights
- Hotels
- Restaurants
- Events
- Transportation
- Shopping
- Government
- Healthcare
- Education
- Finance
- Insurance
- Logistics
- Entertainment

## Required provider manifest

Each provider must publish a manifest:

```js
import { createProviderManifest } from "../../js/engine/providers/marketplace/provider-sdk.js";

export const manifest = createProviderManifest({
  providerId: "sample-events-provider",
  displayName: "Sample Events Provider",
  version: "1.0.0",
  categories: ["events"],
  capabilities: ["authentication", "search", "availability", "pricing", "healthCheck", "normalization"],
  auth: {
    type: "api_key",
    requiredEnv: ["SAMPLE_EVENTS_PROVIDER_API_KEY"]
  }
});
```

## Standard capabilities

- Authentication
- Search
- Availability
- Pricing
- Booking
- Cancellation
- Modification
- Health checks
- Rate limiting
- Normalization

## Lifecycle

1. Install
2. Configure
3. Enable
4. Disable
5. Update
6. Remove

Providers are not considered connected just because code exists. A provider is connected only when health checks succeed and provider-backed evidence is available.

## Dashboard statuses

- Connected
- Disconnected
- Authentication Failed
- Quota Exceeded
- Setup Required
- Disabled
- Removed

## Approval boundary

Provider SDK adapters must never book, purchase, submit, pay, cancel, or modify anything unless the request includes explicit approval.

## Secrets

Never hardcode provider credentials.

Never expose server-only credentials in browser JavaScript.

Use environment variables and provider-specific secure storage.

## Testing requirements

Every provider should include tests for:

- Manifest validation
- Missing credentials
- Authentication failure
- Quota exceeded
- Successful health check
- Search normalization
- Availability normalization
- Pricing normalization
- Approval-required booking
- Cancellation/modification approval boundaries

## Versioning

Provider versions must use semver.

Breaking changes require a new major version and compatibility review against the SDK version.
