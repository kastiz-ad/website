# Commercial API Roadmap

## Access categories

### Requires API key and billing/registration

- Google Places: key plus billing; field masks and quota controls.
- Naver Shopping Search: developer application and server-side client secret.
- Skyscanner: partner key for Flights Live Prices.

### Requires partnership or contract

- Booking.com Demand API: Managed Affiliate Partner contract, API token, affiliate ID.
- Agoda: partner/account-manager onboarding, availability/precheck/book integration.
- Hotels.com inventory through Expedia Rapid: partner application, credentials, launch/site review.
- Catchtable, Interpark, YES24, Melon Ticket, CGV, Lotte Cinema, Megabox, Soomgo: no generally available official developer API verified; business-development integration required.
- Coupang: available Open API is seller operations and requires seller/business credentials; consumer product search/purchase requires a different authorized relationship.

### Enterprise/invite-only

- Google Flights: partner integration for airlines/OTAs; documentation identifies invite-only onboarding, not a public consumer search API.

## Implementation sequence

1. **Naver Shopping Search (1–2 weeks):** key management, backend proxy, search normalization, quotas, attribution/terms review.
2. **Skyscanner (3–6 weeks after access):** create/poll workflow, airport IDs, live-price freshness, redirect/terms compliance.
3. **One lodging partner (6–10 weeks after contract):** Booking.com or Expedia Rapid first; search, availability, total-price rules, cancellation, idempotency, sandbox certification.
4. **Google Places (2–4 weeks):** server proxy, field masks, billing quotas, place attribution.
5. **Korean restaurant/ticket/service partnerships (8–16+ weeks each):** commercial agreement, inventory/availability, identity, cancellation/refund, customer support, certification.
6. **Execution (separate gated program):** business registration, payments, refunds, provider data sharing, legal review, authentication, audit log, incident response.

## Non-negotiable gates

No scraping. No secrets in frontend. No partnership label without contract. No live/available label without fresh response. No booking, reservation, purchase, cancellation, payment, submission, provider contact, or data sharing without explicit user approval and enabled production execution controls.
