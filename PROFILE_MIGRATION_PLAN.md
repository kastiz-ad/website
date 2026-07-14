# Profile Migration Plan

When authenticated backend storage is ready, migrate only after fresh user consent. Read and validate the device-local allowlisted profile, show the exact fields to be uploaded, let the user remove fields, then transmit once over an authenticated encrypted channel.

Server-side validation must repeat the allowlist and sensitivity checks. Store one encrypted record per user/category/field with provenance and deletion timestamps. Return a migration receipt, then let the user choose whether to delete the device copy.

Never silently merge sample profiles, mission text, documents or disabled sensitive data. Account deletion must remove active records and schedule backup expiry under the published retention policy.
