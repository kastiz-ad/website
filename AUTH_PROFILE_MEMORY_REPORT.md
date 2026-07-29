# KASTIZ ONE Authentication, User Profile & Memory Report

Status: implemented as production-ready architecture, but not production-activated until Supabase Auth, OAuth providers, email templates, rate limiting, and deployment secrets are configured by the Founder.

## Authentication architecture

- Provider: Supabase Auth behind Cloudflare Pages Functions.
- Browser never receives the Supabase service-role key.
- Email/password uses Supabase Auth; passwords are never stored by ONE in plaintext.
- Google and Apple Sign-In are supported through backend-generated Supabase OAuth redirect URLs when explicitly enabled.
- Kakao remains unsupported in this milestone and is not faked.
- Sessions use secure HTTP-only cookies for access and refresh tokens plus a CSRF cookie/header pair.
- Refresh-token handling is implemented through `/api/v1/auth/refresh`.
- Logout calls the provider logout endpoint when possible and clears account cookies.
- Password reset uses Supabase recovery flow.
- Email verification is exposed through the Supabase sign-up response and profile/session status.

## Profile schema

The profile table now supports:

- preferred name
- language: English, Korean, Spanish
- country
- city
- preferred airport
- preferred airlines
- preferred hotel types
- seat preference
- travel style
- dietary preferences
- accessibility preferences
- favorite cuisines
- disliked foods
- budget preference
- time format
- currency preference
- optional emergency contact reference
- memory enabled / paused state

## Memory schema

Memory is separated into:

- Permanent profile: reusable profile preferences explicitly saved by the user.
- Mission-specific preferences: useful for one mission or expiring mission context.
- Temporary conversational context: remains in runtime/session logic and is not permanently persisted by this milestone.

Permanent profile memory requires `user_confirmed=true`. Sensitive memory keys are rejected.

The new `user_memories` table stores:

- domain
- memory key
- safe JSON value
- memory type
- optional source mission
- explanation
- explicit confirmation
- expiration
- disabled timestamp

## Privacy boundaries

ONE does not store:

- plaintext passwords
- passport scans
- payment card numbers
- government IDs
- authentication tokens
- provider passwords
- raw biometric data
- medical records
- sensitive documents

Only safe references or user-entered optional emergency contact labels are allowed where appropriate.

## Mission personalization

Existing mission prefill now reads expanded local profile fields:

- preferred departure airport
- airline preferences
- hotel type
- seat preference
- travel style
- budget preference
- dietary preferences
- accessibility preferences

Explicit mission instructions still override memory.

## Security review

Implemented:

- server-side auth endpoints
- email/password validation
- password strength validation
- CSRF enforcement for changing requests
- origin enforcement
- rate-limit hooks
- secure cookies in production
- profile and memory RLS migration
- no service-role key in browser code
- sensitive-key rejection for profile memory
- redacted backend logs from the production-readiness milestone

Remaining before production:

- configure Supabase email confirmation templates
- configure Google OAuth client and Apple Services ID
- configure Cloudflare environment variables
- bind Cloudflare rate limiter
- test OAuth callbacks on preview and production domains
- add WebAuthn/passkey reauthentication for high-risk account deletion/export later
- complete legal/privacy review for account retention and deletion

## Known limitations

- Real account creation works only after Supabase Auth is configured in the deployment environment.
- OAuth buttons truthfully show setup-required until Google/Apple are enabled.
- Profile sync is best-effort from the existing profile page; offline/device memory continues to work.
- Account deletion currently records a deletion request; it does not instantly erase records that may require legal/provider retention workflows.

## Files changed

- `functions/api/v1/_lib/auth.js`
- `functions/api/v1/_lib/config.js`
- `functions/api/v1/_lib/schemas.js`
- `functions/api/v1/[[path]].js`
- `js/auth/account-client.js`
- `js/config/authentication.js`
- `js/pages/profile-page.js`
- `js/profile/profile-memory-engine.js`
- `login.js`
- `profile.html`
- `.env.example`
- `supabase/migrations/202607300001_auth_profile_memory.sql`
- `tests/auth-profile-memory.test.mjs`

