# Analytics Events

The allowlisted events are: `page_visit`, `language_selection`, `theme_selection`, `mission_started`, `mission_category`, `schedule_confirmed`, `loading_complete`, `results_generated`, `results_viewed`, `customize_used`, `approval_requested`, `approval_confirmed`, `simulated_execution_completed`, `return_home`, `error_fallback`, `early_access_request`, `contact_submission`, `partner_inquiry`, and `provider_inquiry` (plus legacy UI events during migration).

Allowed parameters are limited to mission type, language, page, option category, schedule-used flag, status, and provider status. Never send raw mission text, contact-form fields, uploaded filenames, precise location, passport/visa data, payment data, or persistent user identifiers by default.

Google Analytics is currently loaded with Google Signals and advertising personalization disabled. Cloudflare Web Analytics is preferred for privacy-conscious aggregate traffic measurement. Consent and Korean legal review are launch requirements.
