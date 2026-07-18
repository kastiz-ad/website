# Subscription Platform and Mission Economy V1

## Mission Coin philosophy

Kastiz ONE sells prepared, completed missions—not searches or AI messages. Searching, planning, editing, refining, retrying, and changing providers, destinations, dates or budgets are free. `consumeCompletedMission` can deduct exactly one Mission Coin only when the mission status is `completed`, a completion reference exists, a balance exists, and the mission has not already consumed a coin.

## Wallet architecture

`MissionWallet` supports personal, family, group, business and enterprise ownership. Balances are separated into monthly, purchased, bonus and promotional sources with explicit expiration rules and append-only history. Monthly allocations and bonuses are idempotent. Future gifting and transfers are modeled in the database ledger but are not enabled.

## Subscription architecture

The centralized catalog contains Free, ONE+, ONE Family, ONE Groups, ONE Business, ONE Enterprise and ONE Max. Allocation values are configuration, never embedded in charging logic. `configureSubscriptionCatalog` can override allocations and feature lists without a new frontend. Every entitlement uses feature flags.

Free defaults to five monthly Mission Coins. Other allocations intentionally remain configurable until commercial, operational and legal decisions are complete. Billing execution remains false.

## Family model

ONE Family uses a shared wallet while preserving individual schedules, preferences and transportation. The Family Coordination Engine prepares shared calendar state, meeting-point status, arrival synchronization and Safe Return Home status. It cannot contact or reserve with providers.

## Group model

ONE Groups prepares attendance, shared itineraries, transportation and role coordination for communities. Group reservations remain preparation-only.

## Business model

ONE Business uses business workspaces, shared wallets and Owner, Manager, Employee and Guest roles. Approval, expense and administration capabilities are permissions, not duplicated pages.

## Enterprise model

ONE Enterprise supports an organization workspace, department hierarchy, corporate wallet architecture, SSO-ready metadata, audit-log architecture and future approval chains/integrations. No SSO, enterprise API or billing provider is connected in this sprint.

## ONE Max

ONE Max is the highest configurable personal tier. It exposes feature-flag architecture for priority generation, private memory, family coordination, future concierge/human assistance and onboarding. None of those future human or phone services are activated here.

## Roles

Supported roles are Owner, Administrator, Parent, Adult Member, Child, Employee, Manager, Guest and Viewer. Permissions are configurable. Default roles follow least privilege and are checked through one `can` function.

## Upgrade and downgrade

Planning is never blocked. An empty wallet still permits review and displays a calm upgrade message only when continued mission preparation requires coins. Downgrades preserve mission history and Mission Memory; premium features become inactive rather than deleted.

## Future billing

Stripe, Apple, Google, KakaoPay, Naver Pay, PayPal and regional names exist only as inert adapter interfaces. Quote returns unavailable; checkout and subscription return blocked. `BILLING_EXECUTION_ENABLED` and the existing `paymentsEnabled` remain false. No payment identifiers or card fields are stored.

## Mission analytics

Aggregates cover completions, categories, planning time, coin usage, success, satisfaction and family/business coordination frequency. The aggregator returns no raw mission text or personal data.

## Marketplace compatibility

The wallet consumes a universal completion event after the existing Universal Mission Engine and approval boundaries. Provider type does not change coin behavior. Marketplace/provider integrations cannot deduct a coin directly.

