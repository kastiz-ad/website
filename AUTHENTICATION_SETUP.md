# Authentication setup (inactive)

`js/config/authentication.js` keeps `authenticationEnabled = false`. Do not enable it until a server-side identity system, protected session cookies, account recovery, deletion/export, abuse controls, and security review are ready.

Planned providers:

- Email/password: server-side password hashing, verified email, throttling, MFA-ready recovery.
- Google and Apple: OAuth/OIDC authorization-code flow with PKCE and server-side token exchange.
- Kakao: Kakao Login authorization-code flow with server-side token handling.

Required before activation: production callback URLs, secret storage outside the repository, CSRF/state and nonce validation, secure cookies, consent records, privacy-policy update, account deletion/export, audit logging, and incident response testing.
# Secure Backend V1 update

Authentication is implemented through Supabase Auth behind Cloudflare Pages Functions. Passwords are sent directly from the secure API function to Supabase Auth and are never stored in application tables, logs, localStorage, or source control. Sessions use HttpOnly cookies; authenticated state changes require CSRF verification. Email verification must be required in the Supabase staging project.

There is intentionally no hardcoded `CEO/Kook` exception. Create the founder account after staging provisioning, use a strong unique password and MFA, and grant future founder authorization through trusted server-controlled claims.

See `SECURE_BACKEND_SETUP.md` for exact configuration.
