import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ALPHA09_FOUNDER_PREVIEW_SCENARIOS,
  ALPHA09_PROVIDER_TRUST_NETWORK_VERSION,
  TRUST_BADGES,
  buildProviderTrustBrief,
  evaluateProviderTrust,
  rankProvidersByTrust,
  validateProviderTrustBrief
} from "../js/engine/trust/provider-trust-network-alpha09.js";

test("ALPHA-09 evaluates trust from multiple signals and plain-language badges", () => {
  const trust = evaluateProviderTrust({
    id: "hotel-central",
    name: "Central Verified Hotel",
    providerType: "hotel",
    sourceState: "verified_live",
    trustSignals: {
      reliability: 0.92,
      safetyRecord: 0.9,
      responseQuality: 0.86,
      missionSuitability: 0.88,
      verifiedPublicReputation: 0.84
    }
  }, { language: "en", missionType: "travel", priority: "business" });
  assert.equal(trust.version, ALPHA09_PROVIDER_TRUST_NETWORK_VERSION);
  assert.equal(trust.badge, TRUST_BADGES.HIGHLY_TRUSTED);
  assert.doesNotMatch(trust.badgeLabel, /%|star/i);
  assert.ok(trust.reasons.length >= 2);
});

test("sponsored providers never receive ranking influence from sponsorship", () => {
  const providers = [
    {
      id: "sponsored",
      name: "Sponsored Weak Provider",
      providerType: "hotel",
      sponsored: true,
      sourceState: "cached_public",
      trustSignals: { reliability: 0.45, safetyRecord: 0.45, missionSuitability: 0.5 }
    },
    {
      id: "trusted",
      name: "Trusted Independent Provider",
      providerType: "hotel",
      sourceState: "cached_public",
      trustSignals: { reliability: 0.78, safetyRecord: 0.76, missionSuitability: 0.75, responseQuality: 0.74 }
    }
  ];
  const ranked = rankProvidersByTrust(providers, { language: "en", missionType: "travel" });
  assert.equal(ranked[0].id, "trusted");
  assert.equal(ranked.find((provider) => provider.id === "sponsored").trust.sponsoredIgnored, true);
});

test("mission-specific trust changes the ranking contextually", () => {
  const providers = [
    { id: "romantic", name: "Romantic River View", providerType: "restaurant", cuisine: "romantic view", sourceState: "cached_public", trustSignals: { reliability: 0.68, safetyRecord: 0.66, missionSuitability: 0.7 } },
    { id: "business", name: "Central Business Grill", providerType: "restaurant", cuisine: "business central", sourceState: "cached_public", trustSignals: { reliability: 0.68, safetyRecord: 0.66, missionSuitability: 0.7 } }
  ];
  const dateRank = rankProvidersByTrust(providers, { language: "en", missionType: "date", relationship: "girlfriend" });
  const businessRank = rankProvidersByTrust(providers, { language: "en", missionType: "business dinner", priority: "business" });
  assert.equal(dateRank[0].id, "romantic");
  assert.equal(businessRank[0].id, "business");
});

test("memory preferences improve fit but cannot override low trust", () => {
  const providers = [
    { id: "preferred-risky", name: "Station Budget Stay", providerType: "hotel", sourceState: "estimated", trustSignals: { reliability: 0.28, safetyRecord: 0.3, missionSuitability: 0.88 } },
    { id: "safe", name: "Reliable Central Stay", providerType: "hotel", sourceState: "cached_public", trustSignals: { reliability: 0.76, safetyRecord: 0.77, missionSuitability: 0.68 } }
  ];
  const ranked = rankProvidersByTrust(providers, {
    language: "en",
    missionType: "travel",
    personalMissionMemory: { preferences: ["station"] }
  });
  assert.equal(ranked[0].id, "safe");
  assert.ok(ranked.find((provider) => provider.id === "preferred-risky").trust.score <= 0.58);
});

test("limited evidence falls back honestly instead of inventing confidence", () => {
  const trust = evaluateProviderTrust({
    id: "unknown",
    name: "Unknown Future Provider",
    providerType: "transport",
    sourceState: "unavailable"
  }, { language: "en", missionType: "travel" });
  assert.equal(trust.badge, TRUST_BADGES.LIVE_VERIFICATION_RECOMMENDED);
  assert.match(trust.warnings.join(" "), /Limited information|verifying/i);
});

test("world intelligence warnings create visible trust warnings", () => {
  const trust = evaluateProviderTrust({
    id: "flight-a",
    name: "Flight A",
    providerType: "flight",
    sourceState: "cached_public"
  }, {
    language: "en",
    missionType: "travel",
    worldIntelligence: { failures: [{ providerType: "flight", message: "Service disruption reported by adapter" }] }
  });
  assert.equal(trust.badge, TRUST_BADGES.RECENTLY_CHANGED);
  assert.match(trust.warnings.join(" "), /verification/i);
});

test("brief deduplicates providers and validates architecture boundaries", () => {
  const result = {
    type: "travel",
    flights: [
      { id: "korean-air", provider: "Korean Air", sourceState: "cached_public" },
      { id: "korean-air-copy", provider: "Korean Air", sourceState: "cached_public" }
    ],
    hotels: [{ id: "hotel-a", name: "Hotel A", sourceState: "estimated" }],
    restaurants: [{ id: "restaurant-a", venueName: "Restaurant A", sourceState: "cached_public" }],
    worldIntelligence: { failures: [] }
  };
  const brief = buildProviderTrustBrief({ result, language: "en", missionDirector: { status: "ready" } });
  assert.equal(brief.providerCount, 3);
  assert.equal(brief.missionDirectorUsed, true);
  assert.equal(validateProviderTrustBrief(brief).ok, true);
  assert.equal(brief.commercialSeparation, "sponsored_status_never_boosts_trust_rank");
});

test("founder preview scenarios cover required ALPHA-09 surfaces", () => {
  const ids = ALPHA09_FOUNDER_PREVIEW_SCENARIOS.map((scenario) => scenario.id);
  for (const id of ["travel-hotel-comparison", "restaurant-selection", "hospital-recommendation", "insurance-comparison", "business-banking"]) {
    assert.ok(ids.includes(id));
  }
});

test("results page integrates ALPHA-09 without exposing agent clutter", () => {
  const resultsPage = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const resultsHtml = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  const resultsEntry = readFileSync(new URL("../results.js", import.meta.url), "utf8");
  assert.match(resultsPage, /buildProviderTrustBrief/);
  assert.match(resultsPage, /alpha09ProviderTrust/);
  assert.match(resultsPage, /provider-trust-network/);
  assert.match(resultsHtml, /20260729-alpha11-autonomous-mission-monitoring/);
  assert.match(resultsEntry, /20260729-alpha11-autonomous-mission-monitoring/);
});
