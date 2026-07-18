# Mission Receipt Specification

A receipt is created only after a demo provider returns a valid confirmation. It contains mission title/ID, date, provider, travelers, dates, selected options, estimated total, price status, cancellation terms, approved shared fields, approval time, execution status, reference, confidence and warnings.

Shared/downloaded receipts exclude raw requests, full addresses, documents, payment data, authentication data and unrelated preferences. Prototype receipts must say: “Demonstration only — no reservation or payment was made.” Timeline entries are user-safe lifecycle events and never expose database IDs, stack traces or security internals.
