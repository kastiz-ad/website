# Cloudflare Email Routing for kastiz.com

Planned addresses (do not present them as active until tested): `hello@`, `support@`, `privacy@`, `legal@`, `security@`, `partners@`, `careers@`, `press@`, and `billing@kastiz.com`.

1. In Cloudflare, open **Email → Email Routing** for `kastiz.com`.
2. Verify destination `ckookik@gmail.com` from the email Cloudflare sends.
3. Let Cloudflare add the required MX and SPF DNS records; remove conflicting mail-provider MX records only after confirming they are unused.
4. Create each custom address and forward it to the verified Gmail destination.
5. Send a test from an unrelated mailbox to every address and confirm receipt and spam handling.
6. Email Routing is inbound forwarding only. Configure a separate authenticated outbound provider before sending *from* these addresses. Add DKIM/DMARC when outbound mail is enabled.
7. Replace temporary public contact `ckookik@gmail.com` only after delivery and reply behavior are tested.
