# Authentication setup (inactive)

`js/config/authentication.js` keeps `authenticationEnabled = false`. Do not enable it until a server-side identity system, protected session cookies, account recovery, deletion/export, abuse controls, and security review are ready.

Planned providers:

- Email/password: server-side password hashing, verified email, throttling, MFA-ready recovery.
- Google and Apple: OAuth/OIDC authorization-code flow with PKCE and server-side token exchange.
- Kakao: Kakao Login authorization-code flow with server-side token handling.

Required before activation: production callback URLs, secret storage outside the repository, CSRF/state and nonce validation, secure cookies, consent records, privacy-policy update, account deletion/export, audit logging, and incident response testing.
