# Trust Center Architecture

`trust-center.html` is the user-facing control surface. It shows device-local preferences immediately and attempts authenticated backend discovery through `/api/v1/auth/session`, `/me/profile`, and `/preferences`. Failure is treated as guest mode, never as synchronized state.

Every item must expose value, purpose, source, storage location and edit/delete controls. Connected accounts display truthful states only: not connected, unavailable, partnership required, future, or authorized-provider connected. Provider passwords are never requested.

Account export and deletion remain server-authorized operations. Device deletion clears only the local preference record. Sensitive identity, payment, health, child and document data are excluded from this surface and from browser storage.
