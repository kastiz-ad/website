# ONE Pass architecture

ONE Pass extends Secure Backend V1 on Supabase PostgreSQL/Auth and Cloudflare Pages Functions. Ordinary travel preferences are separated from the Identity Vault. Sensitive tables deny direct authenticated writes; trusted server functions use the service role only after session ownership, action, challenge, approval, and feature-flag checks.

Identity Vault uses an interface with two implementations. The development provider uses environment-supplied AES-256-GCM test keys, fresh 96-bit nonces, and user/record/key-version associated data; it throws in production. The production provider fails closed until a managed KMS/HSM adapter exists. Passport images, NFC data, and biometric templates are outside the MVP.

Passkeys use short-lived, single-use, purpose-bound server challenges. A production WebAuthn verifier binding must validate signature, origin, RP ID, credential, counter/risk, and challenge. Kastiz receives a cryptographic result—not Face ID or fingerprint data.

Booking/payment providers are interfaces. Unconfigured providers return secure handoff or `provider_not_configured`; mock adapters are visibly `demo` and never contact real services. The transaction coordinator requires exact approval, device confirmation, and idempotency, then still refuses execution while real provider flags are false.
