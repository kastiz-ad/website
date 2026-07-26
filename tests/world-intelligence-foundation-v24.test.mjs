import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import {
  buildTravelWorldIntelligence,
  sourceStateUserLabel,
  validateWorldIntelligence
} from "../js/engine/world-intelligence/world-intelligence-foundation-v24.js";
import { createV24AdapterRegistry } from "../js/engine/world-intelligence/provider-adapters-v24.js";

const sampleResult = {
  country: "JP",
  destination: { city: "Sapporo", country: "Japan", continent: "Asia" },
  countryProfile: { code: "JP", name: "Japan", currency: "JPY", continent: "Asia" },
  providerResults: [
    {
      category: "local_places",
      provider: "Open public local places",
      updatedAt: "2026-07-27T00:00:00.000Z",
      items: [
        { kind: "hotel", label: "Sapporo Public Stay", sourceState: "cached_public" },
        { kind: "restaurant", label: "Sapporo Public Ramen", cuisine: "ramen", sourceState: "cached_public" }
      ]
    },
    {
      category: "weather",
      provider: "Open public weather",
      items: [{ label: "2026-08-01", value: "18°C - 25°C", sourceState: "cached_public" }]
    },
    {
      category: "currency",
      provider: "Open public currency",
      items: [{ from: "KRW", to: "JPY", rate: 0.11, sourceState: "cached_public" }]
    }
  ]
};

test("V24 creates source-aware travel foundation without blank groups", () => {
  const foundation = buildTravelWorldIntelligence(sampleResult);
  assert.equal(foundation.version, "V24");
  assert.equal(foundation.domain, "travel");
  assert.ok(foundation.models.hotels.length > 0);
  assert.ok(foundation.models.restaurants.length > 0);
  assert.ok(foundation.models.flights.length > 0);
  assert.equal(foundation.models.hotels[0].sourceMetadata.sourceState, "cached_public");
  assert.equal(validateWorldIntelligence(foundation).ok, true);
});

test("V24 fixture scenarios are explicit and never hidden as normal live integrations", () => {
  const foundation = buildTravelWorldIntelligence({ ...sampleResult, v24WorldScenario: "fully-verified" });
  assert.equal(foundation.fixtureMode, true);
  assert.ok(foundation.sourceBreakdown.verified_live >= 3);
  assert.equal(foundation.models.flights[0].fixture, true);
});

test("V24 unavailable providers remain honest and still return usable mission structure", () => {
  const foundation = buildTravelWorldIntelligence({
    country: "IS",
    destination: { city: "Reykjavik", country: "Iceland", continent: "Europe" },
    countryProfile: { code: "IS", name: "Iceland", currency: "ISK", continent: "Europe" }
  });
  assert.ok(foundation.models.flights.length > 0);
  assert.ok(foundation.models.hotels.length > 0);
  assert.ok(foundation.models.restaurants.length > 0);
  assert.equal(foundation.models.flights[0].sourceState, "unavailable");
  assert.ok(foundation.failures.some((failure) => /flight/i.test(failure.providerType)));
});

test("V24 adapter registry exposes provider capabilities separately from mission logic", () => {
  const registry = createV24AdapterRegistry();
  assert.equal(registry.flights.capabilities.supportsBooking, false);
  assert.equal(registry.hotels.capabilities.supportsMaps, true);
  assert.equal(registry.currency.capabilities.supportsPricing, true);
});

test("V24 result UI and diagnostics files are wired", () => {
  const resultsSource = fs.readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const diagnostics = fs.readFileSync(new URL("../world-intelligence-diagnostics.html", import.meta.url), "utf8");
  assert.match(resultsSource, /buildTravelWorldIntelligence/);
  assert.match(resultsSource, /v24WorldScenario/);
  assert.match(resultsSource, /v24-world-source-card/);
  assert.match(diagnostics, /noindex, nofollow/);
  assert.match(diagnostics, /world-intelligence-diagnostics\.js/);
});

test("V24 source labels support all official site languages", () => {
  assert.equal(sourceStateUserLabel("verified_live", "en"), "Verified");
  assert.equal(sourceStateUserLabel("verified_live", "ko"), "검증됨");
  assert.equal(sourceStateUserLabel("verified_live", "es"), "Verificado");
});
