import test from "node:test";
import assert from "node:assert/strict";
import { buildContextObject } from "../js/engine/context/context-intelligence-engine-v14.js";
import { generateFutureMissionSuggestions, PREDICTION_ENGINE_VERSION, shouldShowPrediction } from "../js/engine/prediction/prediction-engine-v15.js";
import { createLifeMemory, updateLifeMemory } from "../js/profile/life-memory-engine.js";
import { buildUniversalMission } from "../js/engine/universal-mission-engine-v4.js";

function memoryWith(fields) {
  let memory = createLifeMemory({ consent: { enabled: true } });
  for (const field of fields) memory = updateLifeMemory(memory, { ...field, consent: true }).memory;
  return memory;
}

test("V15 analyzes memory, context, calendar and missions to prepare future suggestions", () => {
  const lifeMemory = memoryWith([
    { domain: "government", field: "renewalMonth", value: "October" },
    { domain: "healthcare", field: "preferredArea", value: "Gangnam" },
    { domain: "education", field: "level", value: "Middle school" },
    { domain: "travel", field: "departureAirport", value: "ICN" }
  ]);
  const contextObject = buildContextObject({
    mission: "NYC trip",
    currentLocation: "Seoul",
    language: "en",
    lifeMemory,
    calendarEvents: ["Mom birthday"],
    previousMissions: [{ category: "travel" }],
    vehicle: { inspectionDue: "2026-09" },
    business: { renewalDue: "2026-10", taxDeadline: "2026-11" },
    home: { maintenanceDue: "boiler check" }
  });

  const result = generateFutureMissionSuggestions({ contextObject, lifeMemory, language: "en" });
  const types = result.suggestions.map((item) => item.type);

  assert.equal(result.version, PREDICTION_ENGINE_VERSION);
  for (const type of ["passport-renewal", "birthday", "health-screening", "vehicle-inspection", "business-renewal", "travel-preparation", "school-registration", "government-deadline"]) {
    assert.ok(types.includes(type), type);
  }
  assert.ok(result.suggestions.every((item) => item.why && item.sourceSignals.length));
});

test("V15 never executes and only prepares suggestions", () => {
  const result = generateFutureMissionSuggestions({
    mission: "business renewal",
    business: { renewalDue: "2026-10" }
  });

  assert.equal(result.approvalRequired, true);
  assert.equal(result.executionEnabled, false);
  assert.equal(result.externalCallsEnabled, false);
  assert.ok(result.suggestions.every((item) => item.executionEnabled === false && item.status === "suggestion_prepared"));
});

test("V15 suggestions explain why they appeared", () => {
  const result = generateFutureMissionSuggestions({
    language: "ko",
    calendarEvents: ["아빠 생일"],
    vehicle: { inspectionDue: "2026-09" }
  });

  assert.ok(result.suggestions.length >= 2);
  assert.ok(result.suggestions.every((item) => /나타난 이유:/.test(item.why)));
});

test("V15 show gate rejects unsafe or unexplained suggestions", () => {
  const result = generateFutureMissionSuggestions({ business: { renewalDue: "2026-10" } });
  assert.equal(shouldShowPrediction(result.suggestions[0]), true);
  assert.equal(shouldShowPrediction({ ...result.suggestions[0], executionEnabled: true }), false);
  assert.equal(shouldShowPrediction({ ...result.suggestions[0], why: "" }), false);
  assert.equal(shouldShowPrediction({ ...result.suggestions[0], confidence: 0.2 }), false);
});

test("V15 is consumed by Universal Mission Engine without changing approval architecture", () => {
  const mission = buildUniversalMission({
    mission: "Trip to Tokyo",
    language: "en",
    currentLocation: "Seoul",
    calendarEvents: ["School registration"],
    vehicle: { inspectionDue: "2026-09" }
  });

  assert.equal(mission.futureMissionSuggestions.version, "V15");
  assert.ok(mission.futureMissionSuggestions.suggestions.some((item) => item.type === "school-registration"));
  assert.ok(mission.futureMissionSuggestions.suggestions.some((item) => item.type === "vehicle-inspection"));
  assert.equal(mission.futureMissionSuggestions.executionEnabled, false);
  assert.equal(mission.preparation.executionEnabled, false);
});

test("V15 supports Spanish copy", () => {
  const result = generateFutureMissionSuggestions({
    language: "es",
    calendarEvents: ["cumpleaños de mamá"],
    business: { renewalDue: "2026-10" }
  });

  assert.ok(result.suggestions.some((item) => /Por qué apareció:/.test(item.why)));
  assert.ok(result.suggestions.some((item) => /Preparar/.test(item.title)));
});
