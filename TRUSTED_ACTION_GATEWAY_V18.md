# KASTIZ ONE V18 — Trusted Action Gateway

V18 adds the Trusted Action Gateway after the V17 `ResolutionPlan`.

It prepares provider-safe action requests. It does not execute live provider actions.

## Core principle

```text
ONE prepares the action
↓
User approves
↓
Trusted external provider authenticates
↓
Provider performs regulated or sensitive transaction
↓
ONE receives minimum result metadata only
```

## Supported prepared action types

- reserve
- book
- purchase
- pay
- contact
- requestQuote
- apply
- submit
- upload
- schedule
- cancel
- reschedule
- sign
- authenticate
- connectProvider

## Security boundary

ONE must never persist:

- full card numbers
- CVV
- bank usernames or passwords
- brokerage credentials
- provider passwords
- OTP codes
- raw identity-document images by default
- resident-registration numbers
- unrestricted authentication tokens

Trusted providers handle payment authentication, identity authentication, provider OAuth, official authentication, and regulated transactions.

## What ONE may receive

Only minimum result data:

- success/failure
- transaction reference
- appointment reference
- masked payment method
- provider name
- timestamp
- cancellation policy
- status
- minimum receipt metadata

## Integration truth

Current V18 adapters are mock/future-safe unless a real integration is connected later.

The gateway labels:

- `dataState="mock"`
- `liveIntegration=false`
- `fakeConnectedProvider=false`

## Approval and idempotency

Every action request has:

- explicit approval status
- expiration
- idempotency key
- retry policy
- fallback providers
- audit events
- visible execution status

Duplicate execution is blocked by idempotency.
