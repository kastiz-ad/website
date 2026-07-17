# ONE Pass external setup checklist

Nothing below is provisioned by this commit.

1. Supabase staging project: apply both migrations, require verified email, verify RLS with two separate test users, enable backups, and configure founder MFA.
2. WebAuthn: configure `WEBAUTHN_RP_ID`, exact HTTPS `WEBAUTHN_ORIGIN`, and a server-side verifier binding supporting registration, authentication, counters, revocation, recovery, and action-bound reauthentication.
3. Identity Vault: contract an approved managed KMS/HSM or vault and identity-verification provider. Configure only a secret-manager key reference; never paste a key into frontend settings.
4. Providers: obtain approved booking/flight/lodging credentials or use explicit handoff. Never collect provider passwords.
5. Payments: complete business/merchant approval with Toss Payments, Kakao Pay, Apple Pay or another regulated provider; implement signed webhook verification and refund operations.
6. Korean mobile ID: obtain official documentation, permission and credentials before enabling the adapter.
7. Complete independent penetration testing, Korean privacy/legal review, processor/overseas-transfer disclosures, monitoring, alerts, backup restore test, and incident drill.

Only after these checks may individual flags be reviewed. `PASSPORT_PERSISTENCE_ENABLED`, `REAL_BOOKING_ENABLED`, and `REAL_PAYMENTS_ENABLED` must remain false meanwhile.
