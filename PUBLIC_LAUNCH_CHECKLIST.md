# ONE Free public launch checklist

## Before traffic

- [ ] Pre-deployment checklist is complete and release commit is approved.
- [ ] `RATE_LIMITER` production binding is verified and monitored.
- [ ] Custom domains serve the approved commit over HTTPS.
- [ ] Payments, booking, provider execution, Plus, and Pro remain non-operational and honestly labeled.
- [ ] Public auth remains hidden; device saves say “Saved on this device.”
- [ ] Privacy, terms, support contact, CSP, CORS, and production error pages are reachable.
- [ ] Rollback owner, previous deployment, and incident channel are ready.

## Launch smoke test

- [ ] Home → mission → loading → results completes on a clean session.
- [ ] Flights, hotels, restaurants, places, itinerary, budget, and Trust Index match the destination.
- [ ] Approval leads only to manual external handoff; no booking/payment is claimed.
- [ ] Provider links preserve destination, dates, travelers, and selection where supported.
- [ ] Save trip restores after reload and does not imply cloud sync.
- [ ] `/investor` remains isolated from the public home flow.
- [ ] Korean, English, and Spanish have no launch-path language leakage.
- [ ] iPhone, Android, tablet, and desktop show no blocking overflow or inaccessible primary action.

## First-hour monitoring

- [ ] Function error rate, 429/503 rate, provider failures, and client errors are watched.
- [ ] No secrets, personal mission text, or provider payloads appear in logs.
- [ ] Cache/version and custom-domain behavior are correct.
- [ ] GO decision and exact production deployment identifier are recorded.

