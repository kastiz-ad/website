# Kastiz ONE Founder Operating System

## Purpose

The Founder Operating System (FOS) is the private control plane for running Kastiz from Day 1. It is deliberately separate from the public product. The design target is Apple Settings: calm hierarchy, one clear purpose per screen, safe defaults, reversible actions, and no infrastructure jargon.

The committed frontend is a **local design prototype with sample data only**. It is not an admin system and cannot access customer data or change production. Public and Cloudflare preview requests to its path are denied by server middleware.

## Product principles

1. One daily overview before ten specialist modules.
2. Exceptions before totals: show what needs attention first.
3. Read-only by default; consequential actions require reason, review, confirmation, and audit.
4. Every metric states its source and freshness.
5. Empty and unavailable data is honest; never invent operational numbers.
6. No raw mission text, sensitive profile data, payment information, documents, or secrets in analytics.
7. Founder authorization is server-side. URL secrecy, JavaScript guards, `noindex`, and local storage are not authentication.

## Modules

| Module | Day-1 view | Controlled actions | Production dependency |
|---|---|---|---|
| User Management | Total, new, returning, Early Access, verified/pending providers | Deactivate, restore, export; deletion queued for future backend | Identity service, account store, export/deletion jobs |
| Mission Control | ID, category, lifecycle status, timestamps, language, device, duration | Filter, inspect safe metadata, cancel future execution | Mission database, state machine, role-scoped API |
| Provider Control | Provider mode, health, latency, failure/retry state | Disable/restore with reason and confirmation | Provider registry, encrypted credentials, circuit breaker |
| Early Access | Applicant date, country, language, interest, status | Contact/invite/accept | Consent-aware CRM or database |
| Feedback Center | Bugs, suggestions, praise, requests | Classify, severity, status, merge duplicates | Feedback ingestion and moderation |
| Analytics Summary | Daily/weekly/monthly visitors, funnel, retention, abandonment | Filter and export aggregated data | Server-side GA4/Cloudflare aggregation |
| Content Management | Tagline, examples, footer, announcements, pricing, FAQ, support email | Draft, preview, approve, publish, rollback | Versioned CMS and approval workflow |
| Feature Flags | Memory, analytics, Early Access, provider, demo, maintenance, authentication | Staged change with expiry and rollback | Server-side flag service |
| System Health | API, storage, auth, analytics, deployment | Acknowledge incidents; link to runbook | Health probes and alerting |
| Audit Log | Time, actor, action, object, result | None; export only | Append-only signed audit store |

## Founder daily flow

1. Open Overview and review red/yellow exceptions.
2. Check mission abandonment and approvals waiting too long.
3. Review provider failures and fallback usage.
4. Process Early Access and high-severity feedback.
5. Confirm deployment/authentication/analytics health.
6. Review all consequential changes in the immutable audit log.

## Action safety model

Every mutation uses: **Choose → Explain reason → Preview impact → Confirm → Execute server-side → Record audit event → Show result**. Destructive operations require recent re-authentication. Provider disable, maintenance mode, account deactivation, and content publishing require a rollback path. Account deletion remains unavailable until retention, legal review, and verified deletion jobs exist.

## Prototype access

Local visual review only:

`tools/founder-os/index.html?founder-preview=1`

The screen renders only when loaded from `file:`, `localhost`, or `127.0.0.1` with the explicit query parameter. The data is hard-coded demonstration data. On Cloudflare and other public hosts, `functions/_middleware.js` returns `404` for FOS and legacy founder dashboard paths.

## Production gate

FOS must not be deployed as an operational admin system until all Critical items in `ADMIN_ROADMAP.md` are complete. The public site must remain independent if FOS is unavailable.
