# Profile Data Model

The prototype stores one versioned JSON object in `localStorage` under `kastiz-one-operating-profile`. It contains consent metadata and allowlisted category records with value, source mission reference, user-confirmed status, timestamps and `device-local` storage label.

No secure backend exists. Therefore user ID is null, account sync is unavailable, and sensitive fields are prohibited.

Future server records should use: `user_id`, `category`, `field_key`, encrypted `field_value`, `sensitivity_level`, `source_mission_id`, `confidence`, `user_confirmed`, `created_at`, `updated_at`, `expires_at`, and `deleted_at`, protected by authenticated row-level access controls.
