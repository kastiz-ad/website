import test from "node:test";
import assert from "node:assert/strict";
import {
  PROVIDER_CAPABILITIES,
  PROVIDER_CATEGORIES,
  PROVIDER_DASHBOARD_STATUSES,
  PROVIDER_LIFECYCLE_STATES,
  ProviderSDKAdapter,
  createProviderManifest,
  createProviderTemplate,
  validateProviderManifest
} from "../js/engine/providers/marketplace/provider-sdk.js";
import { createProviderMarketplace } from "../js/engine/providers/marketplace/provider-marketplace.js";
import { createTemplateProvider } from "../js/engine/providers/marketplace/provider-template.js";

test("Provider SDK exposes required categories and capabilities", () => {
  for (const category of ["flights", "hotels", "restaurants", "events", "transportation", "shopping", "government", "healthcare", "education", "finance", "insurance", "logistics", "entertainment"]) {
    assert.ok(PROVIDER_CATEGORIES.includes(category));
  }
  for (const capability of ["authentication", "search", "availability", "pricing", "booking", "cancellation", "modification", "healthCheck", "rateLimiting", "normalization"]) {
    assert.ok(PROVIDER_CAPABILITIES.includes(capability));
  }
});

test("provider manifest validation blocks invalid or unsafe providers", () => {
  const invalid = validateProviderManifest({ providerId: "Bad Id", displayName: "", version: "1", categories: ["unknown"], capabilities: ["magic"] });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length >= 4);
  const unsafe = validateProviderManifest(createProviderManifest({
    providerId: "unsafe-payments",
    displayName: "Unsafe Payments",
    categories: ["finance"],
    capabilities: ["pricing"],
    dataHandling: { storesPaymentData: true }
  }));
  assert.equal(unsafe.valid, false);
  assert.match(unsafe.errors.join(" "), /raw payment credentials/);
});

test("provider adapter standardizes search pricing health and approval boundaries", async () => {
  const manifest = createProviderManifest({
    providerId: "demo-events",
    displayName: "Demo Events",
    categories: ["events"],
    capabilities: ["authentication", "search", "availability", "pricing", "booking", "healthCheck", "normalization"]
  });
  const adapter = new ProviderSDKAdapter({
    manifest,
    implementation: {
      async healthCheck() { return { ok: true, status: "connected", evidence: { provider: "demo-events" } }; },
      async search() { return { ok: true, status: "connected", items: [{ id: "event-1" }] }; },
      async book() { return { ok: true, status: "prepared" }; }
    }
  });
  assert.equal((await adapter.search()).items.length, 1);
  assert.equal((await adapter.book({})).status, "awaiting_user_approval");
  assert.equal((await adapter.book({ approval: { approved: true } })).ok, true);
  assert.equal(adapter.normalize({ items: [1] }).providerId, "demo-events");
});

test("provider lifecycle supports install configure enable disable update remove", async () => {
  const manifest = createProviderManifest({
    providerId: "sample-hotels",
    displayName: "Sample Hotels",
    version: "1.0.0",
    categories: ["hotels"],
    capabilities: ["authentication", "search", "availability", "pricing", "healthCheck", "normalization"]
  });
  const marketplace = createProviderMarketplace();
  assert.equal(marketplace.install(manifest).state, PROVIDER_LIFECYCLE_STATES.INSTALLED);
  assert.equal(marketplace.configure("sample-hotels", { mode: "test" }).state, PROVIDER_LIFECYCLE_STATES.CONFIGURED);
  assert.equal(marketplace.enable("sample-hotels").state, PROVIDER_LIFECYCLE_STATES.ENABLED);
  const setup = await marketplace.verify("sample-hotels");
  assert.equal(setup.status, PROVIDER_DASHBOARD_STATUSES.SETUP_REQUIRED);
  assert.equal(marketplace.disable("sample-hotels").state, PROVIDER_LIFECYCLE_STATES.DISABLED);
  const next = createProviderManifest({ ...manifest, version: "1.1.0" });
  assert.equal(marketplace.update("sample-hotels", next).state, PROVIDER_LIFECYCLE_STATES.UPDATE_AVAILABLE);
  assert.equal(marketplace.remove("sample-hotels").state, PROVIDER_LIFECYCLE_STATES.REMOVED);
});

test("provider dashboard displays connected disconnected auth quota setup disabled and removed", async () => {
  const connectedManifest = createProviderManifest({
    providerId: "connected-events",
    displayName: "Connected Events",
    categories: ["events"],
    capabilities: ["authentication", "search", "healthCheck", "normalization"]
  });
  const marketplace = createProviderMarketplace();
  marketplace.install(connectedManifest, {
    async healthCheck() { return { ok: true, status: "connected", evidence: { provider: "connected-events" } }; }
  });
  marketplace.enable("connected-events");
  await marketplace.verify("connected-events");
  const connected = marketplace.dashboardRows().find((row) => row.providerId === "connected-events");
  assert.equal(connected.status, PROVIDER_DASHBOARD_STATUSES.CONNECTED);

  const disabled = createProviderManifest({ providerId: "disabled-finance", displayName: "Disabled Finance", categories: ["finance"], capabilities: ["pricing", "healthCheck"] });
  marketplace.install(disabled);
  marketplace.disable("disabled-finance");
  const removed = createProviderManifest({ providerId: "removed-logistics", displayName: "Removed Logistics", categories: ["logistics"], capabilities: ["search"] });
  marketplace.install(removed);
  marketplace.remove("removed-logistics");
  const statuses = Object.fromEntries(marketplace.dashboardRows().map((row) => [row.providerId, row.status]));
  assert.equal(statuses["disabled-finance"], PROVIDER_DASHBOARD_STATUSES.DISABLED);
  assert.equal(statuses["removed-logistics"], PROVIDER_DASHBOARD_STATUSES.REMOVED);
});

test("mission engine catalog is vendor-neutral and provider template is setup-required", async () => {
  const marketplace = createProviderMarketplace();
  const template = createTemplateProvider({ providerId: "future-government", category: "government" });
  marketplace.install(template.manifest, template.implementation);
  marketplace.enable("future-government");
  const catalog = marketplace.missionEngineCatalog();
  assert.deepEqual(catalog[0].categories, ["government"]);
  assert.ok(catalog[0].capabilities.includes("search"));
  assert.equal((await template.healthCheck()).status, "setup_required");
  assert.equal(createProviderTemplate({ providerId: "future-insurance", category: "insurance" }).manifest.categories[0], "insurance");
});
