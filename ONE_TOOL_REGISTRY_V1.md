# ONE Tool Registry V1

The registry includes capability-specific Kakao/Naver place and route adapters, walking/transit/ETA/traffic placeholders, navigation/taxi handoff preparation, and disabled payment confirmation/cancellation adapters. Every provider response identifies provider, source, status, checked time, freshness, confidence, authentication, approval, and execution state. Route access never implies taxi dispatch; payment preparation never implies authorization or capture.

Completeness and revision are internal cognitive tools. They do not contact providers. A revised activity, price, date, route, ticket, reservation, or participant state re-enters verification and approval before any future execution adapter may run.

Every registered tool declares an ID, description, input/output schema, permission level, approval/authentication requirement, integration/freshness status, risk class and failure behavior. Statuses are `LIVE`, `SANDBOX`, `DEMO`, `ESTIMATED`, `INTERFACE_ONLY`, `UNAVAILABLE`, `PARTNER_REQUIRED`, `AUTHENTICATION_REQUIRED`, and `APPROVAL_REQUIRED`.

V1 includes mission memory, drafts, calendar/email interfaces, maps, travel, dining, weather, documents, programming, tutor/provider and checkout interfaces. Live booking, payment, sending and provider contact are unavailable or partner-required. Unknown tools fail honestly.

Life Pathway V1 registers education, application, document, insurance, housing, flight, banking, job, calendar and reminder contracts. Preparation-only contracts may produce drafts; submission, purchase, booking and contact contracts remain `UNAVAILABLE`.
