export const LIVE_PROVIDER_FOUNDATION_VERSION = "20260729-live-provider-foundation-v1";

export const PROVIDER_SOURCE_STATES = Object.freeze({
  LIVE: "verified_live",
  CACHED: "cached_public",
  MOCK: "mock",
  FALLBACK: "fallback",
  MISSING_KEY: "missing_api_key",
  UNAVAILABLE: "unavailable",
  ERROR: "error"
});

export const createProviderEvidence = ({
  provider = "unknown",
  sourceState = PROVIDER_SOURCE_STATES.UNAVAILABLE,
  retrievedAt = null,
  placeId = null,
  endpoint = null,
  fieldMask = [],
  limitations = [],
  raw = null
} = {}) => ({
  provider,
  sourceState,
  retrievedAt: retrievedAt || new Date().toISOString(),
  placeId,
  endpoint,
  fieldMask: Array.isArray(fieldMask) ? fieldMask : [],
  limitations: Array.isArray(limitations) ? limitations : [],
  raw
});

export const createProviderResult = ({
  ok = false,
  provider = "unknown",
  sourceState = PROVIDER_SOURCE_STATES.UNAVAILABLE,
  data = null,
  evidence = null,
  developerInstructions = [],
  error = null
} = {}) => ({
  ok: Boolean(ok),
  provider,
  sourceState,
  data,
  evidence: evidence || createProviderEvidence({ provider, sourceState }),
  developerInstructions: Array.isArray(developerInstructions) ? developerInstructions : [],
  error: error ? {
    code: error.code || "provider_error",
    message: error.message || String(error)
  } : null
});

export const missingApiKeyResult = (provider, requiredEnv = []) => createProviderResult({
  ok: false,
  provider,
  sourceState: PROVIDER_SOURCE_STATES.MISSING_KEY,
  developerInstructions: [
    "Google provider is not live yet because API keys are not configured.",
    ...requiredEnv.map((key) => `Set ${key} in .env.local / Cloudflare Pages environment variables.`),
    "Restrict each key by domain and API before enabling it for a public preview."
  ],
  error: {
    code: "missing_api_key",
    message: `${provider} needs ${requiredEnv.join(", ")}.`
  }
});

export const unavailableProviderResult = (provider, action) => createProviderResult({
  ok: false,
  provider,
  sourceState: PROVIDER_SOURCE_STATES.UNAVAILABLE,
  error: {
    code: "provider_not_configured",
    message: `${provider} cannot run ${action} until a provider adapter is registered.`
  }
});

