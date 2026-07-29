# KASTIZ ONE — Provider Marketplace SDK

Version: `20260730-provider-marketplace-sdk-v1`

## Summary

Built a universal Provider SDK foundation so future providers can be installed like plugins without modifying the Mission Engine.

The SDK standardizes provider manifests, categories, capabilities, lifecycle management, dashboard status, validation, testing expectations, and developer documentation.

## Architecture

New modules:

- `js/engine/providers/marketplace/provider-sdk.js`
- `js/engine/providers/marketplace/provider-marketplace.js`
- `js/engine/providers/marketplace/provider-template.js`

Mission Engine decoupling:

- Mission logic can use provider category + capability catalog.
- Provider-specific adapters stay in the provider layer.
- New providers can be installed/configured/enabled through the marketplace registry.
- Provider code existing is not treated as connected.

## Provider SDK

Standard manifest fields:

- `providerId`
- `displayName`
- `version`
- `sdkVersion`
- `categories`
- `capabilities`
- `auth`
- `compatibility`
- `endpoints`
- `dataHandling`
- `rateLimits`

Standard capabilities:

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

## Provider categories

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

## Provider lifecycle

Supported lifecycle operations:

- Install
- Configure
- Enable
- Disable
- Update
- Remove

Implemented in:

- `ProviderMarketplaceRegistry.install`
- `configure`
- `enable`
- `disable`
- `update`
- `remove`
- `verify`

## Provider dashboard

Dashboard rows expose:

- Status
- Connected
- Disconnected
- Authentication Failed
- Quota Exceeded
- Setup Required
- Disabled
- Removed

Dashboard output is intentionally plain data so it can feed a future founder/admin UI without redesigning current customer UI.

## Developer SDK documentation

Added:

- `docs/provider-sdk/README.md`

Includes:

- Manifest template
- Standard capabilities
- Lifecycle
- Dashboard statuses
- Approval boundary
- Secrets guidance
- Testing requirements
- Versioning guidance

## Provider templates

Added:

- `createTemplateProvider`
- `createProviderTemplate`

Templates return setup-required states by default and never fake connectivity.

## Quality guarantees

- Invalid manifests are rejected.
- Unsupported categories/capabilities fail validation.
- Booking/cancel/modify actions require explicit approval.
- Providers that lack health-check evidence are not marked connected.
- Mission Engine can consume `missionEngineCatalog()` without vendor coupling.

## Future marketplace roadmap

1. Add signed provider packages.
2. Add provider compatibility checks during install.
3. Add provider sandbox runner.
4. Add founder dashboard UI.
5. Add provider version migration flow.
6. Add provider review/verification program.
7. Add marketplace permissions and scopes.
8. Add provider billing/usage analytics.

## Remaining work

- No visual Provider Dashboard UI was added yet.
- No provider package installer from external ZIP/npm source yet.
- No provider signing/attestation yet.
- No production provider marketplace backend yet.

This milestone establishes the SDK and registry foundation without pretending external providers are live.
