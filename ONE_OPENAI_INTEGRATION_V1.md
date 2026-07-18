# ONE OpenAI Integration V1

The protected runner uses the official server-side OpenAI SDK and Responses API. The default is `gpt-5.6-terra`, the balanced intelligence/cost option in current official model guidance; configuration can route more complex missions separately. The consumer ChatGPT website/subscription is unrelated. Required server variables are listed in `.env.example`; never place a key in HTML, browser JavaScript, localStorage or sessionStorage.

## Local DEMO mode

1. Leave `OPENAI_AGENT_ENABLED=false` and `OPENAI_API_KEY` empty.
2. From the worktree run `npm install`, then `npm test`.
3. Start the Cloudflare Pages development server used by the repository.
4. Sign in to a development account and submit `여친 데이트`, `Japan next month with my family`, `Prepare my presentation`, or the supplier-email request.

## Protected local API mode

Set the following only in the server environment: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`, `OPENAI_AGENT_ENABLED=true`, `OPENAI_STREAMING_ENABLED`, `OPENAI_REQUEST_TIMEOUT_MS`, `OPENAI_MAX_OUTPUT_TOKENS`, `OPENAI_MAX_TOOL_ITERATIONS`, `OPENAI_MAX_RETRIES`, and optional `OPENAI_PROJECT_ID`. Restart the server. Never commit the populated environment file.

Test failed tools by requesting an unavailable booking/payment/contact action: the result must remain blocked. Test approval by preparing an action, changing a material term, and confirming the prior approval is invalidated.
