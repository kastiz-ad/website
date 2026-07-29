export const PROVIDER_MARKETPLACE_SDK_VERSION = "20260730-provider-marketplace-sdk-v1";

export const PROVIDER_CATEGORIES = Object.freeze([
  "flights",
  "hotels",
  "restaurants",
  "events",
  "transportation",
  "shopping",
  "government",
  "healthcare",
  "education",
  "finance",
  "insurance",
  "logistics",
  "entertainment"
]);

export const PROVIDER_CAPABILITIES = Object.freeze([
  "authentication",
  "search",
  "availability",
  "pricing",
  "booking",
  "cancellation",
  "modification",
  "healthCheck",
  "rateLimiting",
  "normalization"
]);

export const PROVIDER_LIFECYCLE_STATES = Object.freeze({
  INSTALLED: "installed",
  CONFIGURED: "configured",
  ENABLED: "enabled",
  DISABLED: "disabled",
  UPDATE_AVAILABLE: "update_available",
  REMOVED: "removed"
});

export const PROVIDER_DASHBOARD_STATUSES = Object.freeze({
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  AUTHENTICATION_FAILED: "authentication_failed",
  QUOTA_EXCEEDED: "quota_exceeded",
  SETUP_REQUIRED: "setup_required",
  DISABLED: "disabled",
  REMOVED: "removed"
});

const SEMVER = /^\d+\.\d+\.\d+$/;
const PROVIDER_ID = /^[a-z0-9][a-z0-9-]{2,80}$/;
const unique = (items = []) => [...new Set(items.filter(Boolean))];
const nowIso = () => new Date().toISOString();
const cloneFreeze = (value) => Object.freeze(Array.isArray(value) ? value.map((item) => Object.freeze({ ...item })) : { ...value });

export function createProviderManifest({
  providerId,
  displayName,
  version = "1.0.0",
  categories = [],
  capabilities = [],
  auth = { type: "none", requiredEnv: [] },
  sdkVersion = PROVIDER_MARKETPLACE_SDK_VERSION,
  compatibility = { minSdkVersion: PROVIDER_MARKETPLACE_SDK_VERSION },
  endpoints = {},
  dataHandling = { storesPersonalData: false, storesPaymentData: false, storesHealthData: false },
  rateLimits = null
} = {}) {
  return Object.freeze({
    providerId,
    displayName,
    version,
    sdkVersion,
    categories: Object.freeze(unique(categories)),
    capabilities: Object.freeze(unique(capabilities)),
    auth: Object.freeze({ type: auth?.type || "none", requiredEnv: Object.freeze(auth?.requiredEnv || []) }),
    compatibility: Object.freeze({ minSdkVersion: compatibility?.minSdkVersion || PROVIDER_MARKETPLACE_SDK_VERSION }),
    endpoints: Object.freeze({ ...endpoints }),
    dataHandling: Object.freeze({
      storesPersonalData: Boolean(dataHandling?.storesPersonalData),
      storesPaymentData: Boolean(dataHandling?.storesPaymentData),
      storesHealthData: Boolean(dataHandling?.storesHealthData)
    }),
    rateLimits: rateLimits ? Object.freeze({ ...rateLimits }) : null
  });
}

export function validateProviderManifest(manifest = {}) {
  const errors = [];
  const warnings = [];
  if (!PROVIDER_ID.test(String(manifest.providerId || ""))) errors.push("providerId must be kebab-case, 3-81 chars.");
  if (!String(manifest.displayName || "").trim()) errors.push("displayName is required.");
  if (!SEMVER.test(String(manifest.version || ""))) errors.push("version must be semver.");
  if (!Array.isArray(manifest.categories) || manifest.categories.length === 0) errors.push("at least one provider category is required.");
  for (const category of manifest.categories || []) if (!PROVIDER_CATEGORIES.includes(category)) errors.push(`unsupported category: ${category}`);
  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) errors.push("at least one capability is required.");
  for (const capability of manifest.capabilities || []) if (!PROVIDER_CAPABILITIES.includes(capability)) errors.push(`unsupported capability: ${capability}`);
  if (manifest.capabilities?.includes("booking") && !manifest.capabilities.includes("authentication")) warnings.push("booking providers usually require authentication capability.");
  if (manifest.dataHandling?.storesPaymentData) errors.push("providers must not store raw payment credentials inside ONE.");
  if (manifest.dataHandling?.storesHealthData && !manifest.categories?.includes("healthcare")) warnings.push("health data flag should only be used by healthcare providers with strict review.");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), warnings: Object.freeze(warnings) });
}

export class ProviderSDKAdapter {
  constructor({ manifest, implementation = {} } = {}) {
    const validation = validateProviderManifest(manifest);
    if (!validation.valid) throw new TypeError(`Invalid provider manifest: ${validation.errors.join("; ")}`);
    this.manifest = manifest;
    this.implementation = implementation;
  }

  supports(capability) {
    return this.manifest.capabilities.includes(capability);
  }

  async authenticate(context = {}) {
    if (!this.supports("authentication")) return { ok: true, status: "not_required" };
    if (typeof this.implementation.authenticate !== "function") return { ok: false, status: "setup_required", message: "Authentication handler is not implemented." };
    return this.implementation.authenticate(context);
  }

  async search(request = {}) {
    if (!this.supports("search")) return { ok: false, status: "unsupported_capability", items: [] };
    if (typeof this.implementation.search !== "function") return { ok: false, status: "setup_required", items: [] };
    return this.implementation.search(request);
  }

  async checkAvailability(request = {}) {
    if (!this.supports("availability")) return { ok: false, status: "unsupported_capability", items: [] };
    if (typeof this.implementation.checkAvailability !== "function") return { ok: false, status: "setup_required", items: [] };
    return this.implementation.checkAvailability(request);
  }

  async getPricing(request = {}) {
    if (!this.supports("pricing")) return { ok: false, status: "unsupported_capability", items: [] };
    if (typeof this.implementation.getPricing !== "function") return { ok: false, status: "setup_required", items: [] };
    return this.implementation.getPricing(request);
  }

  async book(request = {}) {
    if (!this.supports("booking")) return { ok: false, status: "unsupported_capability" };
    if (!request.approval?.approved) return { ok: false, status: "awaiting_user_approval" };
    if (typeof this.implementation.book !== "function") return { ok: false, status: "setup_required" };
    return this.implementation.book(request);
  }

  async cancel(request = {}) {
    if (!this.supports("cancellation")) return { ok: false, status: "unsupported_capability" };
    if (!request.approval?.approved) return { ok: false, status: "awaiting_user_approval" };
    if (typeof this.implementation.cancel !== "function") return { ok: false, status: "setup_required" };
    return this.implementation.cancel(request);
  }

  async modify(request = {}) {
    if (!this.supports("modification")) return { ok: false, status: "unsupported_capability" };
    if (!request.approval?.approved) return { ok: false, status: "awaiting_user_approval" };
    if (typeof this.implementation.modify !== "function") return { ok: false, status: "setup_required" };
    return this.implementation.modify(request);
  }

  async healthCheck() {
    if (!this.supports("healthCheck")) return { ok: false, status: "unsupported_capability" };
    if (typeof this.implementation.healthCheck !== "function") return { ok: false, status: "setup_required" };
    return this.implementation.healthCheck();
  }

  normalize(result = {}) {
    if (typeof this.implementation.normalize === "function") return this.implementation.normalize(result);
    return { providerId: this.manifest.providerId, status: result.status || "unavailable", items: Array.isArray(result.items) ? result.items : [], evidence: result.evidence || null };
  }
}

export function createDashboardRow({ manifest, lifecycleState = PROVIDER_LIFECYCLE_STATES.INSTALLED, verification = null, updatedAt = nowIso() } = {}) {
  let status = PROVIDER_DASHBOARD_STATUSES.SETUP_REQUIRED;
  if (lifecycleState === PROVIDER_LIFECYCLE_STATES.REMOVED) status = PROVIDER_DASHBOARD_STATUSES.REMOVED;
  else if (lifecycleState === PROVIDER_LIFECYCLE_STATES.DISABLED) status = PROVIDER_DASHBOARD_STATUSES.DISABLED;
  else if (verification?.status === "authentication_failed") status = PROVIDER_DASHBOARD_STATUSES.AUTHENTICATION_FAILED;
  else if (verification?.status === "quota_exceeded") status = PROVIDER_DASHBOARD_STATUSES.QUOTA_EXCEEDED;
  else if (verification?.ok && verification?.evidence) status = PROVIDER_DASHBOARD_STATUSES.CONNECTED;
  else if (lifecycleState === PROVIDER_LIFECYCLE_STATES.ENABLED) status = PROVIDER_DASHBOARD_STATUSES.DISCONNECTED;
  return Object.freeze({
    providerId: manifest?.providerId,
    displayName: manifest?.displayName,
    categories: Object.freeze(manifest?.categories || []),
    capabilities: Object.freeze(manifest?.capabilities || []),
    lifecycleState,
    status,
    connected: status === PROVIDER_DASHBOARD_STATUSES.CONNECTED,
    lastCheckedAt: verification?.checkedAt || null,
    lastError: verification?.error || null,
    updatedAt
  });
}

export function createProviderTemplate({ providerId = "sample-provider", category = "events" } = {}) {
  const manifest = createProviderManifest({
    providerId,
    displayName: "Sample Provider",
    categories: [category],
    capabilities: ["authentication", "search", "availability", "pricing", "healthCheck", "normalization"],
    auth: { type: "api_key", requiredEnv: [`${providerId.replaceAll("-", "_").toUpperCase()}_API_KEY`] }
  });
  return Object.freeze({
    manifest,
    adapterSkeleton: `export default new ProviderSDKAdapter({ manifest, implementation: { async healthCheck(){ return { ok:false, status:"setup_required" }; } } });`
  });
}

export const freezeProviderRegistry = (providers = []) => Object.freeze(providers.map((provider) => cloneFreeze(provider)));
