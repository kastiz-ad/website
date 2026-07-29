import { ProviderSDKAdapter, createProviderManifest } from "./provider-sdk.js";

export const TEMPLATE_PROVIDER_VERSION = "1.0.0";

export function createTemplateProvider({ providerId = "template-provider", displayName = "Template Provider", category = "events" } = {}) {
  const manifest = createProviderManifest({
    providerId,
    displayName,
    version: TEMPLATE_PROVIDER_VERSION,
    categories: [category],
    capabilities: ["authentication", "search", "availability", "pricing", "healthCheck", "rateLimiting", "normalization"],
    auth: {
      type: "api_key",
      requiredEnv: [`${providerId.replaceAll("-", "_").toUpperCase()}_API_KEY`]
    },
    dataHandling: {
      storesPersonalData: false,
      storesPaymentData: false,
      storesHealthData: false
    },
    rateLimits: {
      requestsPerMinute: 60,
      burst: 10
    }
  });

  const implementation = {
    async authenticate() {
      return { ok: false, status: "setup_required", message: "Configure provider credentials before authentication." };
    },
    async search() {
      return { ok: false, status: "setup_required", items: [], message: "Provider search is not connected yet." };
    },
    async checkAvailability() {
      return { ok: false, status: "setup_required", items: [] };
    },
    async getPricing() {
      return { ok: false, status: "setup_required", items: [] };
    },
    async healthCheck() {
      return { ok: false, status: "setup_required", evidence: null };
    },
    normalize(result = {}) {
      return {
        providerId,
        status: result.status || "setup_required",
        items: Array.isArray(result.items) ? result.items : [],
        evidence: result.evidence || null
      };
    }
  };

  return new ProviderSDKAdapter({ manifest, implementation });
}
