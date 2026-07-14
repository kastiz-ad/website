# GA4 Setup

Measurement ID is configured in `js/config/analytics.js`. GA4 is not loaded until Analytics consent is granted. Google Signals and ad personalization remain disabled; the app sends custom events without raw mission text or PII.

Verify in GA4 Realtime/DebugView after accepting analytics consent and using `?analytics_debug=1`. Recommended conversions: `early_access_submitted`, `mission_started`, `results_viewed`, `make_it_reality_clicked`, `approval_confirmed`, and `simulated_execution_completed`.

Recommended reports: acquisition, mission-category funnel, language/device split, provider source status, errors and retention. GA4 aggregates are not currently imported into the founder dashboard.
