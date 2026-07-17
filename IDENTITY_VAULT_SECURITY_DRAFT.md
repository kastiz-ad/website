# Identity Vault Security Overview — Draft

Production passport persistence is disabled. The proposed production boundary requires managed KMS/HSM keys, authenticated encryption, per-record nonce, associated ownership data, key versioning, recent passkey reauthentication, immutable exact approval, just-in-time field selection, no general plaintext API, privacy-safe access events, use-once deletion, retention automation, monitoring and independent testing. Development encryption is test-only and cannot substitute for this boundary.
