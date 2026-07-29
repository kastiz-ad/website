import {
  PROVIDER_DASHBOARD_STATUSES,
  PROVIDER_LIFECYCLE_STATES,
  ProviderSDKAdapter,
  createDashboardRow,
  validateProviderManifest
} from "./provider-sdk.js";

export const PROVIDER_MARKETPLACE_VERSION = "20260730-provider-marketplace-v1";

const nowIso = () => new Date().toISOString();
const safeClone = (value) => JSON.parse(JSON.stringify(value));

export class ProviderMarketplaceRegistry {
  constructor({ providers = [], states = {}, verifications = {} } = {}) {
    this.providers = new Map();
    this.states = new Map(Object.entries(states));
    this.verifications = new Map(Object.entries(verifications));
    for (const provider of providers) this.install(provider.manifest || provider, provider.implementation || null, { initial: true });
  }

  install(manifest, implementation = null, { initial = false } = {}) {
    const validation = validateProviderManifest(manifest);
    if (!validation.valid) return Object.freeze({ ok: false, status: "invalid_manifest", errors: validation.errors });
    const adapter = implementation ? new ProviderSDKAdapter({ manifest, implementation }) : null;
    this.providers.set(manifest.providerId, { manifest, adapter, installedAt: nowIso(), updatedAt: nowIso() });
    this.states.set(manifest.providerId, initial ? this.states.get(manifest.providerId) || PROVIDER_LIFECYCLE_STATES.INSTALLED : PROVIDER_LIFECYCLE_STATES.INSTALLED);
    return Object.freeze({ ok: true, providerId: manifest.providerId, state: this.states.get(manifest.providerId), warnings: validation.warnings });
  }

  configure(providerId, config = {}) {
    const record = this.providers.get(providerId);
    if (!record) return Object.freeze({ ok: false, status: "not_installed" });
    record.config = safeClone(config);
    record.updatedAt = nowIso();
    this.states.set(providerId, PROVIDER_LIFECYCLE_STATES.CONFIGURED);
    return Object.freeze({ ok: true, providerId, state: PROVIDER_LIFECYCLE_STATES.CONFIGURED });
  }

  enable(providerId) {
    if (!this.providers.has(providerId)) return Object.freeze({ ok: false, status: "not_installed" });
    this.states.set(providerId, PROVIDER_LIFECYCLE_STATES.ENABLED);
    return Object.freeze({ ok: true, providerId, state: PROVIDER_LIFECYCLE_STATES.ENABLED });
  }

  disable(providerId) {
    if (!this.providers.has(providerId)) return Object.freeze({ ok: false, status: "not_installed" });
    this.states.set(providerId, PROVIDER_LIFECYCLE_STATES.DISABLED);
    return Object.freeze({ ok: true, providerId, state: PROVIDER_LIFECYCLE_STATES.DISABLED });
  }

  update(providerId, nextManifest, implementation = null) {
    const record = this.providers.get(providerId);
    if (!record) return Object.freeze({ ok: false, status: "not_installed" });
    const validation = validateProviderManifest(nextManifest);
    if (!validation.valid) return Object.freeze({ ok: false, status: "invalid_manifest", errors: validation.errors });
    this.providers.set(providerId, {
      ...record,
      manifest: nextManifest,
      adapter: implementation ? new ProviderSDKAdapter({ manifest: nextManifest, implementation }) : record.adapter,
      updatedAt: nowIso()
    });
    this.states.set(providerId, PROVIDER_LIFECYCLE_STATES.UPDATE_AVAILABLE);
    return Object.freeze({ ok: true, providerId, state: PROVIDER_LIFECYCLE_STATES.UPDATE_AVAILABLE, warnings: validation.warnings });
  }

  remove(providerId) {
    if (!this.providers.has(providerId)) return Object.freeze({ ok: false, status: "not_installed" });
    this.states.set(providerId, PROVIDER_LIFECYCLE_STATES.REMOVED);
    return Object.freeze({ ok: true, providerId, state: PROVIDER_LIFECYCLE_STATES.REMOVED });
  }

  async verify(providerId) {
    const record = this.providers.get(providerId);
    if (!record) return Object.freeze({ ok: false, status: "not_installed" });
    const lifecycle = this.states.get(providerId);
    if (lifecycle !== PROVIDER_LIFECYCLE_STATES.ENABLED) {
      const result = { ok: false, status: lifecycle === PROVIDER_LIFECYCLE_STATES.DISABLED ? PROVIDER_DASHBOARD_STATUSES.DISABLED : PROVIDER_DASHBOARD_STATUSES.SETUP_REQUIRED, checkedAt: nowIso() };
      this.verifications.set(providerId, result);
      return Object.freeze(result);
    }
    if (!record.adapter) {
      const result = { ok: false, status: PROVIDER_DASHBOARD_STATUSES.SETUP_REQUIRED, checkedAt: nowIso(), error: "adapter_not_configured" };
      this.verifications.set(providerId, result);
      return Object.freeze(result);
    }
    const result = await record.adapter.healthCheck().catch((error) => ({ ok: false, status: "provider_unavailable", error: error?.message || "health_check_failed" }));
    const verification = { ...result, checkedAt: nowIso() };
    this.verifications.set(providerId, verification);
    return Object.freeze(verification);
  }

  get(providerId) {
    return this.providers.get(providerId) || null;
  }

  list({ category = null, capability = null, includeRemoved = false } = {}) {
    return Object.freeze([...this.providers.values()].filter((record) => {
      const state = this.states.get(record.manifest.providerId);
      if (!includeRemoved && state === PROVIDER_LIFECYCLE_STATES.REMOVED) return false;
      if (category && !record.manifest.categories.includes(category)) return false;
      if (capability && !record.manifest.capabilities.includes(capability)) return false;
      return true;
    }).map((record) => Object.freeze({
      manifest: record.manifest,
      lifecycleState: this.states.get(record.manifest.providerId),
      verification: this.verifications.get(record.manifest.providerId) || null
    })));
  }

  dashboardRows() {
    return Object.freeze(this.list({ includeRemoved: true }).map((record) => createDashboardRow(record)));
  }

  missionEngineCatalog() {
    return Object.freeze(this.list().map((record) => ({
      providerId: record.manifest.providerId,
      categories: record.manifest.categories,
      capabilities: record.manifest.capabilities,
      lifecycleState: record.lifecycleState,
      status: createDashboardRow(record).status
    })));
  }
}

export function createProviderMarketplace(input = {}) {
  return new ProviderMarketplaceRegistry(input);
}
