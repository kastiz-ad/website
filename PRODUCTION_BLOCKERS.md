# Production Blockers

## Critical
- No production identity vault, WebAuthn verifier, regulated payment processor or authorized booking providers.
- No live end-to-end RLS/authorization penetration test or independent security review.
- Legal, privacy, refund, incident and deletion operations are not approved for commercial operation.

## High
- Profile import conflict UI and backend mission continuity need staging completion.
- Provider freshness, availability, cancellation and price recheck contracts are not connected to commercial sources.
- Email deliverability, edge rate limiting, backup restoration and monitoring require live verification.

## Medium
- Life Dashboard history is an empty state until backend persistence is connected.
- Korean copy and assistive-technology testing need native-speaker/manual review.
- Receipt download/share actions need complete authenticated backend routes.

## Low
- Additional visual polish and performance measurement on older devices.

Safe for local non-sensitive testing. Not safe for passports, real payments, real bookings or provider execution. Staging is safe only after checklist completion; controlled non-sensitive beta remains blocked on configured authentication, live RLS tests and operational review.
