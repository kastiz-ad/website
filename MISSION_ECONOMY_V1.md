# Mission Economy V1

Status: **PROTOTYPE · NOT LIVE**. Billing, purchases, transfers, booking, payment, provider contact and external execution are disabled.

## Business rule

Kastiz ONE sells successfully prepared missions, coordination, saved time and reduced mental load—not searches or revisions. Searching, classification, provider discovery, editing, changes to dates, locations, budgets, providers, participants or transportation, and itinerary rebuilding cost zero Mission Coins.

One eligible, user-confirmed completed mission consumes exactly one Mission Coin. A coordinated family, group or business mission also consumes one coin total, never one coin per participant. The internal Mission Value Score records complexity for analysis only and never changes the V1 price.

## Completion lifecycle

`MISSION_CREATED → CLASSIFYING → PLANNING → EDITING → PREPARING → ONE_READY → WAITING_FOR_APPROVAL → APPROVED_FOR_DEMO → READY_FOR_COMPLETION → USER_CONFIRMED_COMPLETE → MISSION_COMPLETED`

`READY_FOR_COMPLETION` requires sufficient context, ONE Pick and alternatives, domain preparation, and an approval-ready result. The user must choose **Mark Mission Complete** before the state can advance. Only `MISSION_COMPLETED` can emit `MISSION_COMPLETION_DEBIT`.

Paused, cancelled, failed, archived and merely prepared missions consume no coin. A reopened completed mission retains the same version-history idempotency key and cannot charge again. A materially new mission gets a new version history and may consume one coin only after completing independently.

## Renewal and spending

Renewal, rollover caps and expiration remain configuration. Prototype spending order is: expiring promotional coins, monthly allocation, bonus coins, then purchased coins. Purchased coins are architected as non-expiring, but purchasing is disabled. Bonus and promotional expiration are configurable.

## Upgrade and downgrade

Planning is never interrupted. If an eligible mission reaches completion with no balance, it stays saved and reviewable and a calm upgrade state appears. No countdowns, fake scarcity or hidden work are used. Downgrades preserve mission history, receipts, Mission Memory and workspace data; premium actions become inactive at the configured effective date and over-limit workspaces are marked for adjustment rather than deleted.

## Security boundary

Browser balances are demo display only. Production balances, completion authorization, entitlement resolution and ledger writes must be server-authoritative, transactional and locked. Duplicate completion, replay, role escalation, wallet tampering and cross-workspace leakage must be rejected on the server.

