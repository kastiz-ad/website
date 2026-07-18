# Profile Memory Sync

Guest preferences are consented, non-sensitive, device-local records. Logged-in preferences are owner-scoped backend records protected by RLS. The UI labels these states “Saved on this device” and “Synced to your ONE account.”

`profile-sync.js` compares `(category, field)` keys. Conflicting values are returned to the UI and must receive an explicit `local` or `account` decision. No implicit overwrite or automatic import is allowed. After a successful import the user may explicitly clear device data.

Passport, visa, national ID, payment, health, child, password, token and emergency-contact keys are blocked by the local memory engine.
