# Subscription Platform V1

Status: **architecture preview only**. Public prices are not finalized. Every plan displays “Pricing coming soon.”

## Personal plans

- **ONE Free** — one user, 5 Mission Coins monthly, basic Mission Memory, ONE Pick, preparation, Live Intelligence states and history.
- **ONE+** — regular individuals, 30 Mission Coins monthly (“up to one completed mission per day”), advanced memory, explanations, Live Intelligence, calendar-ready architecture and priority planning.
- **ONE Family** — one owner, invited household members, a shared wallet, individual schedules/preferences and consent-controlled shared memory.
- **ONE Groups** — churches, meetups, clubs, teams, volunteer, university, wedding and tour groups use one reusable group workspace architecture.
- **ONE Max** — highest personal plan, highest configurable personal allowance and generous configurable fair-use access. Concierge, human assistance, phone help and white-glove routing are future capabilities, not current claims.

## Business plans

- **ONE Business** — employees, managers, departments, shared business missions, approvals, expense preparation and workspace administration.
- **ONE Enterprise** — highest organization plan, multiple workspaces, hierarchy, department wallets, policy controls, audit architecture and support routing. SSO, SCIM and APIs are interface placeholders only.

## Centralized entitlements

The Entitlement Engine is the only plan decision path. Entitlements can be enabled, disabled or limited and can carry a configurable quantity, trial state, feature flag, promotional override and administrative override. Components must not contain tier-name conditionals.

## Context switching

One account can belong to personal, family, group, business and enterprise contexts. The visible current context determines wallet, permissions, shared memory, available members, approval rules, entitlements and ownership. A business wallet cannot be silently used for a personal mission.

## Billing abstraction

One inert provider interface models customer creation, subscription lifecycle, coin purchase, refunds, invoices and webhooks for future Stripe, App Store, Google Play, KakaoPay, Naver Pay, PayPal and regional adapters. Every adapter currently returns blocked/unavailable and performs no external call.

## Support architecture

Support metadata supports `STANDARD`, `PRIORITY`, `MAX_CONCIERGE`, `BUSINESS_PRIORITY` and `ENTERPRISE_DEDICATED`, with future case routing. No assigned human or available concierge is claimed in V1.

## Payment integration blockers

Business registration, tax, consumer law, renewals, refunds, payment security, reconciliation, fraud controls, operational support and independent legal/security review must be complete before billing can be enabled.
