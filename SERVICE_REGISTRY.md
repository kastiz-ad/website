# Service Registry

The executable registry is in `js/engine/service-registry.js`. Every category defines user intent, required information, safe assumptions, live/prototype/restricted providers, editable steps, approval-required actions, result cards, risks, disclaimers, completion status, and next actions.

Categories: Travel, Shopping, Housing, Legal, Healthcare, Finance, Career, Moving, Business, Lifestyle, Education, Tutoring, Childcare, Language Exchange, Government Services, and General Missions.

Mission classification must choose the matching registry. Travel cards must never be shown merely because a mission is unknown. Unknown missions use `general_missions`.

All committed-action integrations are restricted until authorization, contract, security review, cancellation/refund handling, and approval logging are complete.
