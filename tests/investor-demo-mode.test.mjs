import test from "node:test";
import assert from "node:assert/strict";

import {
  INVESTOR_DEMO_SCENARIOS,
  INVESTOR_PRESENTATION_FLOW,
  buildInvestorDemoUrl,
  createInvestorDemoState,
  createInvestorPresentationSnapshot,
  getInvestorDemoScenario,
  isInvestorDemoMode,
  providerEvidenceStatus,
  resetInvestorDemo,
  updateInvestorDemoState,
  writeInvestorDemoState
} from "../js/engine/demo/investor-demo-mode.js";

const createMemoryStorage = () => {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    has: (key) => map.has(key)
  };
};

test("Investor Demo Mode exposes required sample missions", () => {
  assert.deepEqual(Object.keys(INVESTOR_DEMO_SCENARIOS).sort(), [
    "business_trip",
    "family_vacation",
    "medical_appointment",
    "restaurant_reservation",
    "travel"
  ]);
  for (const scenario of Object.values(INVESTOR_DEMO_SCENARIOS)) {
    assert.ok(scenario.mission.length > 20);
    assert.ok(scenario.highlight.includes("Shows"));
  }
});

test("Investor Demo Mode builds one-click results URLs", () => {
  const url = buildInvestorDemoUrl("business_trip", { language: "ko" });
  const parsed = new URL(url, "https://kastiz.com/");
  assert.equal(parsed.pathname, "/results.html");
  assert.equal(parsed.searchParams.get("investorDemo"), "1");
  assert.equal(parsed.searchParams.get("demo"), "1");
  assert.equal(parsed.searchParams.get("demoScenario"), "business_trip");
  assert.equal(parsed.searchParams.get("lang"), "ko");
  assert.match(parsed.searchParams.get("mission"), /business trip/i);
});

test("Investor Demo Mode can be detected from demo query params", () => {
  assert.equal(isInvestorDemoMode("https://kastiz.com/results.html?investorDemo=1"), true);
  assert.equal(isInvestorDemoMode("https://kastiz.com/results.html?demo=1"), true);
  assert.equal(isInvestorDemoMode("https://kastiz.com/results.html"), false);
});

test("provider evidence is truthful and does not pretend demo data is live", () => {
  const demoEvidence = providerEvidenceStatus({ providerResults: [] });
  assert.equal(demoEvidence.status, "demonstration_data");
  assert.match(demoEvidence.disclosure, /Live providers are not connected/);

  const liveEvidence = providerEvidenceStatus({
    providerResults: [
      { provider: "Google Places", category: "restaurant", liveData: true },
      { provider: "Demo Hotels", category: "hotel", status: "demo" }
    ]
  });
  assert.equal(liveEvidence.status, "live_provider_available");
  assert.deepEqual(liveEvidence.providers, ["Google Places"]);
});

test("presentation flow follows the requested investor story", () => {
  assert.deepEqual(INVESTOR_PRESENTATION_FLOW.map(step => step.id), [
    "homepage",
    "mission-understanding",
    "providers",
    "mission-generation",
    "mission-editing",
    "approval",
    "execution-ready"
  ]);
});

test("presentation controls support restart pause resume and fast-forward", () => {
  const start = new Date("2026-07-30T00:00:00.000Z");
  let state = createInvestorDemoState({ scenarioId: "travel" });
  state = updateInvestorDemoState(state, "restart", { now: start });
  assert.equal(state.status, "running");
  assert.equal(state.currentFlowIndex, 0);

  state = updateInvestorDemoState(state, "fast_forward", { now: new Date("2026-07-30T00:00:10.000Z") });
  assert.equal(state.currentFlowIndex, 1);

  state = updateInvestorDemoState(state, "pause", { now: new Date("2026-07-30T00:00:10.000Z") });
  assert.equal(state.status, "paused");
  assert.equal(state.elapsedSeconds, 10);

  state = updateInvestorDemoState(state, "resume", { now: new Date("2026-07-30T00:00:20.000Z") });
  assert.equal(state.status, "running");
});

test("reset clears demo-related mission storage", () => {
  const storage = createMemoryStorage();
  storage.setItem("kastiz-one-results", "{}");
  storage.setItem("kastiz-one-current-mission", "{}");
  storage.setItem("kastiz-one-travel-mission", "{}");
  writeInvestorDemoState({ scenarioId: "travel" }, storage);
  const reset = resetInvestorDemo(storage);
  assert.equal(reset.enabled, true);
  assert.equal(storage.has("kastiz-one-results"), false);
  assert.equal(storage.has("kastiz-one-current-mission"), false);
  assert.equal(storage.has("kastiz-one-travel-mission"), false);
});

test("presentation snapshot includes scenario, controls, notes, flow and truthful source status", () => {
  const state = createInvestorDemoState({ scenarioId: "restaurant_reservation", currentFlowIndex: 2 });
  const snapshot = createInvestorPresentationSnapshot({ providerResults: [] }, state);
  assert.equal(snapshot.scenario.id, getInvestorDemoScenario("restaurant_reservation").id);
  assert.equal(snapshot.currentFlow.id, "providers");
  assert.equal(snapshot.truthfulDemoData, true);
  assert.ok(snapshot.controls.includes("fast_forward"));
  assert.ok(snapshot.notes.providerLayer.body.includes("Demo data stays labeled"));
});


test("Investor Demo Mode routes medical and restaurant samples to the right domains", () => {
  const medical = getInvestorDemoScenario("medical_appointment");
  assert.equal(medical.missionType, "healthcare");
  assert.match(medical.mission, /dentist|clinic|emergency|Do not diagnose/i);
  assert.doesNotMatch(medical.mission, /Han River|Korean BBQ|restaurant reservation/i);

  const restaurant = getInvestorDemoScenario("restaurant_reservation");
  assert.equal(restaurant.missionType, "restaurant");
  assert.match(restaurant.mission, /weekend date|2 day|jjimjilbang|excellent restaurants/i);
  assert.doesNotMatch(restaurant.mission, /dentist|tooth pain|diagnose/i);
});
