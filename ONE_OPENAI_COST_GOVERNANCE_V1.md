# ONE OpenAI Cost Governance V1

OpenAI usage is paid and governed server-side. Model pricing is configuration metadata with provider, model, effective date, currency, input/output unit cost, tool costs, verification timestamp, and status. No vendor price is permanent business logic.

Controls include per-request token/tool/iteration/retry/timeout caps, per-user daily and workspace monthly USD budgets, duplicate suppression, usage alerts, rate limiting, and `OPENAI_GLOBAL_DISABLE`. Raw token counts are not shown to users. AI usage does not consume a Mission Coin; one verified coordinated outcome remains one coin. Database records contain fingerprints and cost metadata, never raw prompts.

Risks: stale pricing configuration, cached estimates differing from invoices, model/tool price changes, currency movement, retries, and untracked third-party fees. Production requires verified prices, invoice reconciliation, durable rate limits, alerts, and founder dashboards.
