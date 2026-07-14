# Founder Admin Roadmap

## Phase 0 — Safe design foundation (complete in this branch)

- [x] Ten-module information architecture.
- [x] Local-only sample-data prototype.
- [x] No secrets, customer records, raw missions, or working mutations.
- [x] Public/preview server-side 404 policy for founder routes.
- [x] Architecture, status, and security gates documented.
- [x] Existing public UI unchanged.

## Phase 1 — Identity and authorization (Critical)

- [ ] Choose managed identity with phishing-resistant MFA/passkeys.
- [ ] Server-side sessions in Secure, HttpOnly, SameSite cookies.
- [ ] Founder role and least-privilege support roles.
- [ ] Recent re-authentication for destructive actions.
- [ ] Session revocation, device/session list, recovery, and emergency lockout.
- [ ] Server authorization on every read and write; deny by default.
- [ ] Independent penetration test and threat-model review.

Exit: an unauthorized request receives 404/403 before any admin HTML or data is returned.

## Phase 2 — Read-only operational data (Critical)

- [ ] Minimal user/account projections with pseudonymous identifiers.
- [ ] Mission lifecycle aggregation without raw mission text.
- [ ] Provider health/latency/failure aggregation.
- [ ] Consent-aware Early Access and feedback storage.
- [ ] Server-side analytics aggregation with metric definitions and freshness.
- [ ] System-health probes and incident severity rules.
- [ ] Append-only audit log for every founder access and export.

Exit: read-only modules show source, freshness, missing-data state, and audit access.

## Phase 3 — Controlled operations (High)

- [ ] Account deactivate/restore and privacy-safe export jobs.
- [ ] Provider circuit-breaker disable/restore with rollback.
- [ ] Early Access workflow and contact-consent enforcement.
- [ ] Feedback triage, deduplication, severity, and status.
- [ ] Versioned CMS drafts, two-step publish, and rollback.
- [ ] Server-side feature flags with environment, owner, reason, expiry, and kill switch.
- [ ] Incident acknowledgement and runbook links.

Exit: every action is authorized, idempotent, reversible where possible, and audited.

## Phase 4 — Regulated/destructive operations (Blocked)

- [ ] Account deletion only after Korean/global privacy and retention review.
- [ ] Provider credential rotation through a secrets manager.
- [ ] Production execution controls only after provider contracts and legal review.
- [ ] Payment/refund views only after payment operations and PCI/privacy review.

## Release checklist

- Authentication and authorization tests pass.
- Public and preview hosts reveal no founder route or asset.
- No PII/raw mission text in analytics, logs, URLs, exports, or audit metadata.
- CSRF, XSS, SSRF, injection, rate-limit, replay, and privilege-escalation tests pass.
- Backups, restore drill, incident response, and break-glass access tested.
- Monitoring distinguishes product outage from admin outage.
- Founder action audit is append-only and retention is approved.
- Production secrets exist only in a managed secret store.
