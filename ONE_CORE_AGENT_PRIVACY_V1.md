# ONE Core Agent Privacy V1

Only the request and mission-relevant, consent-approved context may be sent to OpenAI: language, coarse permitted region, applicable preferences, minimized mission summaries, integration states and current approval/entitlement state. Full history is not sent.

Passport/visa numbers, national identifiers, payment data, health records, child names, passwords and secrets are removed from agent context. Full sensitive prompts are not logged by default. Mission state logs redact the original request; tool audit stores sanitized metadata. Workspace membership is enforced before processing.

The API key remains server-side. No organization data-sharing opt-in is performed. Founder approval, account retention configuration and independent privacy/security review are required before production. Users retain controls to view, correct, remove, pause or disable supporting memory.
