import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ALPHA06_PREDICTIVE_INTELLIGENCE_VERSION,
  MAX_ALPHA06_PROACTIVE_CARDS,
  applyPredictionFeedback,
  createPredictiveIntelligenceLayer,
  splitVisiblePredictions,
  validatePredictiveIntelligence
} from "../js/engine/workspace/predictive-intelligence-alpha06.js";
import { createExecutionOrchestrator } from "../js/engine/workspace/execution-orchestrator-alpha05.js";

const travelMission = Object.freeze({
  id: "alpha06-sapporo",
  type: "travel",
  rawInput: "Sapporo winter trip",
  destination: { city: "Sapporo", country: "Japan", continent: "Asia" },
  countryProfile: { name: "Japan", currency: "JPY", continent: "Asia" },
  schedule: { startDate: "2026-08-05", endDate: "2026-08-10" },
  worldIntelligence: {
    models: {
      hotels: [{ sourceState: "estimated" }],
      flights: [{ sourceState: "unavailable" }],
      weather: [{ sourceState: "cached_public" }],
      currency: [{ sourceState: "cached_public" }]
    }
  }
});

test("ALPHA-06 creates evidence-backed future predictions without execution", () => {
  const orchestrator = createExecutionOrchestrator(travelMission, { language: "en" });
  const layer = createPredictiveIntelligenceLayer({
    result: travelMission,
    context: { currentLocation: "Seoul" },
    orchestrator,
    language: "en",
    now: "2026-07-29T00:00:00.000Z"
  });

  assert.equal(layer.version, ALPHA06_PREDICTIVE_INTELLIGENCE_VERSION);
  assert.equal(layer.safety.noExecution, true);
  assert.equal(layer.safety.noExternalProviderCalls, true);
  assert.equal(layer.missionWorkspaceIntegration.usesAlpha05ActionGraph, true);
  assert.ok(layer.predictions.length >= 3);
  assert.ok(layer.predictions.every((prediction) => prediction.reason && prediction.sourceSignals.length));
  assert.ok(layer.predictions.every((prediction) => prediction.executionEnabled === false));
  assert.equal(validatePredictiveIntelligence(layer).ok, true);
});

test("ALPHA-06 shows at most three proactive Critical or Important predictions", () => {
  const layer = createPredictiveIntelligenceLayer({
    result: travelMission,
    context: {
      currentLocation: "Seoul",
      business: { renewalDue: "2026-08-15" },
      vehicle: { inspectionDue: "2026-08" },
      calendarEvents: ["Mom birthday"]
    },
    language: "en",
    now: "2026-07-29T00:00:00.000Z"
  });

  assert.ok(layer.visible.length <= MAX_ALPHA06_PROACTIVE_CARDS);
  assert.ok(layer.visible.every((prediction) => ["Critical", "Important"].includes(prediction.priority)));
  assert.ok(layer.collapsed.length >= 1);
});

test("ALPHA-06 filters low confidence and expired predictions", () => {
  const predictions = [
    {
      id: "low",
      title: "Low",
      reason: "Weak",
      sourceSignals: ["test"],
      priority: "Important",
      confidence: 0.2,
      executionEnabled: false,
      externalCallsEnabled: false
    },
    {
      id: "expired",
      title: "Expired",
      reason: "Past",
      sourceSignals: ["test"],
      priority: "Critical",
      confidence: 0.9,
      expiry: "2026-01-01",
      executionEnabled: false,
      externalCallsEnabled: false
    }
  ];
  const split = splitVisiblePredictions(predictions, {}, { now: "2026-07-29T00:00:00.000Z" });
  assert.equal(split.visible.length, 0);
  assert.deepEqual([...split.hiddenLowConfidence].sort(), ["expired", "low"]);
});

test("ALPHA-06 dismissal and preference learning suppress repeated predictions", () => {
  const initial = createPredictiveIntelligenceLayer({
    result: travelMission,
    context: { currentLocation: "Seoul" },
    language: "en",
    now: "2026-07-29T00:00:00.000Z"
  });
  const first = initial.visible[0];
  const dismissed = applyPredictionFeedback({}, first, "not_relevant");
  const next = createPredictiveIntelligenceLayer({
    result: travelMission,
    context: { currentLocation: "Seoul" },
    language: "en",
    state: dismissed,
    now: "2026-07-29T00:00:00.000Z"
  });

  assert.ok(!next.visible.some((prediction) => prediction.id === first.id));
  assert.ok(dismissed.preferenceMemory[first.type].notRelevant >= 1);
});

test("ALPHA-06 regenerates affected predictions when mission dates change", () => {
  const soon = createPredictiveIntelligenceLayer({
    result: { ...travelMission, schedule: { startDate: "2026-08-05", endDate: "2026-08-10" } },
    context: { currentLocation: "Seoul" },
    language: "en",
    now: "2026-07-29T00:00:00.000Z"
  });
  const later = createPredictiveIntelligenceLayer({
    result: { ...travelMission, schedule: { startDate: "2026-12-05", endDate: "2026-12-10" } },
    context: { currentLocation: "Seoul" },
    language: "en",
    now: "2026-07-29T00:00:00.000Z"
  });

  assert.ok(soon.predictions.some((prediction) => prediction.type === "date-sensitive-check"));
  assert.ok(!later.predictions.some((prediction) => prediction.type === "date-sensitive-check"));
});

test("ALPHA-06 supports healthcare education career business finance and Spanish UI copy", () => {
  const healthcare = createPredictiveIntelligenceLayer({ result: { type: "healthcare", rawInput: "Find a dentist today" }, language: "en" });
  const education = createPredictiveIntelligenceLayer({ result: { resolutionPlan: { domain: "education", userProblem: "Find math academy" } }, language: "en" });
  const career = createPredictiveIntelligenceLayer({ result: { resolutionPlan: { domain: "career", userProblem: "job application" } }, language: "en" });
  const business = createPredictiveIntelligenceLayer({ result: { resolutionPlan: { domain: "business", userProblem: "register company" } }, language: "en" });
  const finance = createPredictiveIntelligenceLayer({ result: { type: "finance", rawInput: "pay provider" }, language: "es" });

  assert.ok(healthcare.predictions.some((prediction) => prediction.domain === "healthcare"));
  assert.ok(education.predictions.some((prediction) => prediction.domain === "education"));
  assert.ok(career.predictions.some((prediction) => prediction.domain === "career"));
  assert.ok(business.predictions.some((prediction) => prediction.domain === "business"));
  assert.ok(finance.predictions.some((prediction) => /externos|confiable/i.test(`${prediction.title} ${prediction.explanation}`)));
});

test("ALPHA-06 result page, CSS and cache-busted demo entry are integrated", () => {
  const resultsPageSource = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const resultsCss = readFileSync(new URL("../results.css", import.meta.url), "utf8");
  const resultsHtml = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  const resultsEntry = readFileSync(new URL("../results.js", import.meta.url), "utf8");

  assert.match(resultsPageSource, /createPredictiveIntelligenceCard/);
  assert.match(resultsPageSource, /predictionStorageKey/);
  assert.match(resultsCss, /\.alpha06-predictive-card/);
  assert.match(resultsCss, /\.alpha06-prediction-actions/);
  assert.match(resultsHtml, /20260729-live-provider-foundation/);
  assert.match(resultsEntry, /20260729-live-provider-foundation/);
});
