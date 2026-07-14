# Analytics Test Plan

Test fresh and returning visits, consent accept/reject/withdrawal, language/theme changes, travel and non-travel missions, all follow-up paths, loading provider success/failure/fallback, results/customization, approval review/confirmation, simulated completion, Return Home, profile controls and early-access forms.

Assert GA is absent before consent, no events after rejection, no duplicate events, no forbidden keys or raw mission text, no PII in URLs/titles/events, dashboard denial on public hosts, session-only debug storage, protected exports, responsive dashboard, no console errors and no regression in approval protection.

GA4 DebugView and Cloudflare production page-view validation require the deployed consent build and founder access to vendor dashboards.
