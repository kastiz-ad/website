# ONE Agentic Execution Architecture V1

Pipeline: request → outcome → roles → decomposition → tools → research/preparation → ONE Pick → approval → simulated execution queue → monitoring → recovery → completion verification.

The loop is server-side, schema-validated, rate-limited and bounded by request, token, tool-call, iteration, timeout and retry controls. State can be interrupted, resumed or cancelled. Material changes invalidate approval. Successful prior steps are preserved during recovery.

The protected endpoint is `POST /api/v1/one-agent/missions`. It requires an authenticated account, CSRF protection, origin enforcement and workspace membership. Browser code never calls OpenAI directly.
