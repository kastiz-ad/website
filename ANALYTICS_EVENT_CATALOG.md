# Analytics Event Catalog

The central manager supports acquisition, homepage, follow-up, loading/provider, results/customization, approval, simulated execution, profile and error events listed in the funding analytics specification.

Core connected journey: `page_view` → `search_focused` → `mission_started` → `followup_opened`/steps → `followup_completed` → `loading_started`/provider status → `results_viewed` → `customize_completed` or option changes → `make_it_reality_clicked` → `approval_review_opened` → `approval_information_reviewed` → `approval_confirmed` → `simulated_execution_completed` → `return_home_clicked`.

Every event contains only safe context such as page, language, theme, device group, referrer category, mission category, demo status, profile-memory status, provider source status, success and error code. Raw mission text and PII fields are forbidden.
