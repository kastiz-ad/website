# Analytics Retention

Local debug events are session-only and capped at 500 events. Consent and anonymous visitor identifiers remain until browser storage is cleared or a future privacy control removes them.

GA4 and Cloudflare retention must be configured to the shortest useful period and reviewed under Korean privacy law. A future backend should retain raw pseudonymous events briefly, aggregate them, delete expired rows, document legal holds and support consent withdrawal and deletion workflows.

Production analytics must not rely on localStorage as its source of truth.
