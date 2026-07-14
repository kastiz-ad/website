# Founder Dashboard

Routes: `founder-analytics.html` and `founder-weekly-report.html`. They are unlinked, noindex, no-store and, critically, denied on public hosts. URL secrecy is not treated as authorization.

Because there is no secure admin backend, access is limited to a localhost development session explicitly unlocked in that session. The dashboard reads only session-debug events and labels them non-production. It supports ranges and category/language/device/demo/source/visitor filters, conversion, mission, UX, provider, retention/error and truthful investor summaries, CSV export and print.

Production requires authenticated founder roles and a server-side analytics export/aggregation service.
