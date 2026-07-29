# KASTIZ ONE — Approval Engine V1 Report

## Summary

Approval Engine V1 adds a protected workflow between planning, live provider search, and future execution. It does not connect payments, create bookings, contact providers, or submit anything externally.

## Files modified

- `js/engine/approval/approval-engine-v1.js`
- `js/engine/providers/live/provider-orchestration.js`
- `js/pages/results-page.js`
- `index.html`
- `results.html`
- `script.js`
- `results.js`
- `tests/approval-engine-v1.test.mjs`
- Cache-key regression tests updated to `20260730-approval-engine`

## Approval architecture

Approval is modeled as a workflow, not a single button.

- Mission lifecycle is explicit.
- Approval records are scoped and versioned.
- Provider search can be blocked unless the required search scope is approved.
- Future booking/payment/contact scopes remain separate and disabled.
- Approval records expire and become invalid after significant mission changes.
- Every approval-related change creates an internal-only audit event.

## Mission state machine

Supported states:

- Draft
- Planning
- Needs Clarification
- Ready For Approval
- Approved For Search
- Searching
- Results Ready
- Selection Pending
- Ready To Execute
- Executing
- Completed
- Cancelled
- Failed

Provider actions are only allowed when the mission state and scoped approval allow them.

## Approval records

Each approval contains:

- `approvalId`
- `missionId`
- `missionVersion`
- `timestamp`
- `approvedScope`
- `approvedBy`
- `status`
- `expiresAt`
- `version`

Approvals are not reused after the mission changes.

## Supported approval scopes

Current search scopes:

- Search Flights
- Search Hotels
- Search Restaurants
- Search Experiences
- Search Transportation

Future execution scopes:

- Book Flight
- Reserve Hotel
- Purchase Tickets
- Provider Contact

Future scopes are defined but do not execute real actions.

## Execution checklist

Before a provider action can proceed, ONE checks:

- Mission complete
- Required fields present
- Provider available
- Selections valid
- Prices not expired
- No conflicts
- Approval current

## Price expiration

Provider result metadata includes `retrievedAt` and `expiresAt`.

ONE can display:

- “Retrieved 4 minutes ago.”
- “Refresh recommended.”

Expired results are not silently reused.

## Conflict detection

Detected conflicts include:

- Provider unavailable
- Provider timeout / retry required
- Price expired
- Selection unavailable
- Budget exceeded
- Overlapping itinerary

Each conflict includes recovery actions such as retry, alternative provider, retry later, or continue planning.

## User confidence language

Technical labels are translated into simple user-facing language:

> ONE is ready to search live providers. Nothing will be booked without another confirmation.

## Security improvements

- No booking enabled.
- No payment enabled.
- No provider contact enabled.
- Approval scopes remain independent.
- Internal audit logs are not exposed as user-facing logs.
- Provider orchestration still normalizes data and does not expose provider JSON.

## Tests performed

Targeted:

- `node --check js/engine/approval/approval-engine-v1.js`
- `node --check js/engine/providers/live/provider-orchestration.js`
- `node --check js/pages/results-page.js`
- `node --test tests/approval-engine-v1.test.mjs tests/provider-orchestration-v1.test.mjs`

Full regression suite should be run before publishing.

## Known limitations

- Approval records are currently browser/demo in-memory objects, not a backend database.
- Audit logs are internal structures, not persisted to a secure production audit store.
- Live provider search still depends on configured server-side provider adapters and API keys.
- No real booking, payment, reservation, submission, or provider contact exists.

## Remaining work before real booking

- Secure backend persistence for approvals and audit logs.
- Authenticated user identity.
- Server-side provider adapters for booking-capable partners.
- External provider authentication/payment redirects.
- Legal, privacy, refund, cancellation, and compliance review.
- Production monitoring and duplicate execution prevention with backend idempotency.
