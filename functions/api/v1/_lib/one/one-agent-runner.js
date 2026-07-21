import { ONE_AGENT_INSTRUCTIONS } from "./one-agent-instructions.js";
import { agentConfig } from "./one-agent-config.js";
import { validateAgentOutput } from "./one-agent-validator.js";
import { resolveModel } from "./one-model-policy.js";
import { pricingMetadata, estimateAiCost, assertCostPermission } from "./one-cost-governance.js";

function responseText(response) {
  if (typeof response.output_text === "string") return response.output_text;
  return (response.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("");
}

async function createResponse({ cfg, route, context, draft }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${cfg.apiKey}`,
  };
  if (cfg.projectId) headers["OpenAI-Project"] = cfg.projectId;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: route.model,
        instructions: ONE_AGENT_INSTRUCTIONS,
        input: JSON.stringify({ context, draft }),
        reasoning: { effort: route.reasoningEffort },
        max_output_tokens: cfg.maxOutputTokens,
        text: { format: { type: "json_object" } },
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message || `OpenAI request failed (${response.status})`);
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runOpenAIAgent({ env, context, draft, requestKey }) {
  const cfg = agentConfig(env);
  if (!cfg.enabled || !cfg.apiKey) {
    return { mode: "DEMO", mission: draft, reason: "OpenAI agent is disabled or not configured." };
  }

  const route = resolveModel({
    task: draft.userRequest,
    tasks: draft.tasks?.length,
    providers: draft.toolsRequired?.length,
    highRisk: draft.risk?.level === "HIGH",
  }, env);
  const pricing = pricingMetadata(env, route.model);
  const estimatedInput = Math.ceil(JSON.stringify({ context, draft }).length / 4);
  const estimatedOutput = cfg.maxOutputTokens;
  const estimatedUsd = estimateAiCost({ inputTokens: estimatedInput, outputTokens: estimatedOutput, pricing });
  const cost = assertCostPermission({
    accountId: context.accountId,
    workspaceId: context.workspaceId,
    requestKey,
    estimatedUsd,
    env,
  });

  const response = await createResponse({ cfg, route, context, draft });
  const output = responseText(response);
  if (!output) throw new Error("OpenAI response did not contain output text.");
  const parsed = JSON.parse(output);

  return {
    mode: "LIVE",
    mission: validateAgentOutput(parsed),
    responseId: response.id,
    modelTier: route.tier,
    cost: { ...cost, pricingStatus: pricing.status },
  };
}
