import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  ALPHA12_LIFE_TIMELINE_VERSION,
  LIFE_STAGES,
  MISSION_RELATIONSHIPS,
  buildGoalSystem,
  buildMissionRelationships,
  createLifeTimelineLayer,
  deleteLifeTimeline,
  disableLifeMissionSuggestions,
  exportLifeTimeline,
  hideLifeTimeline,
  inferLifeStage,
  pauseLifeTimeline,
  validateLifeTimelineLayer
} from "../js/engine/timeline/life-timeline-alpha12.js";

const travelResult = {
  missionId: "mission-travel-alpha12",
  rawInput: "Plan my Seoul to Tokyo trip",
  type: "travel",
  destination: { city: "Tokyo", country: "Japan" },
  alpha07PersonalMissionMemory: { preferences: ["direct flights", "quiet hotels"] },
  alpha06PredictiveIntelligence: {
    predictions: [
      { id: "passport", title: "Passport validity check", why: "International travel can depend on passport readiness." },
      { id: "packing", title: "Packing checklist", why: "Departure date is getting closer." }
    ]
  },
  alpha11MissionMonitoring: {
    notifications: [
      {
        eventId: "price-change",
        nextRecommendedAction: "Recheck flight price before approval",
        evidence: "A material travel price can require renewed approval."
      }
    ]
  }
};

test("ALPHA-12 creates travel relationships across the larger journey", () => {
  const layer = createLifeTimelineLayer({
    result: travelResult,
    context: { missionType: "travel" },
    memory: travelResult.alpha07PersonalMissionMemory,
    predictions: travelResult.alpha06PredictiveIntelligence,
    monitoring: travelResult.alpha11MissionMonitoring,
    language: "en"
  });

  assert.equal(layer.version, ALPHA12_LIFE_TIMELINE_VERSION);
  assert.equal(layer.mode, "life_journey_not_calendar_todo_or_crm");
  assert.equal(layer.userControlled, true);
  const titles = layer.relationships.map((mission) => mission.canonicalTitle || mission.title);
  assert.ok(titles.includes("Passport readiness"));
  assert.ok(titles.includes("Travel insurance"));
  assert.ok(titles.includes("Airport transfer"));
  assert.ok(titles.includes("Currency exchange"));
  assert.ok(titles.includes("Restaurant shortlist"));
  assert.ok(titles.includes("Travel photo organization"));
  assert.ok(titles.includes("Expense summary"));
  assert.ok(validateLifeTimelineLayer(layer).ok);
});

test("ALPHA-12 builds business chains without duplicating mission architecture", () => {
  const relationships = buildMissionRelationships({
    result: { missionId: "business-start", rawInput: "Start a company in Korea", type: "business_registration" },
    context: { missionType: "business" },
    language: "en"
  });
  const titles = relationships.map((mission) => mission.canonicalTitle || mission.title);
  assert.ok(titles.includes("Business bank account"));
  assert.ok(titles.includes("Accounting setup"));
  assert.ok(titles.includes("Payroll preparation"));
  assert.ok(titles.includes("Business insurance"));
  assert.ok(titles.includes("Hiring preparation"));
});

test("ALPHA-12 never assumes life stage without evidence", () => {
  assert.equal(inferLifeStage({ missionText: "Need help deciding dinner" }), LIFE_STAGES.UNKNOWN);
  assert.equal(inferLifeStage({ missionText: "student visa and university housing" }), LIFE_STAGES.STUDENT);
  assert.equal(inferLifeStage({ missionText: "business registration and accounting" }), LIFE_STAGES.BUSINESS_FOUNDER);
});

test("ALPHA-12 goal tracking uses meaningful steps, not arbitrary percentages", () => {
  const goals = buildGoalSystem({
    result: { rawInput: "Travel Europe", type: "travel" },
    goals: [{ title: "Travel Europe", completed: ["passport"], remaining: ["insurance", "hotels"] }],
    language: "en"
  });
  assert.equal(goals[0].completed.length, 1);
  assert.equal(goals[0].remaining.length, 2);
  assert.doesNotMatch(goals[0].progressNarrative, /\d+%/);
});

test("ALPHA-12 future suggestions reuse predictions and monitoring without duplicates", () => {
  const layer = createLifeTimelineLayer({
    result: travelResult,
    context: { missionType: "travel" },
    predictions: travelResult.alpha06PredictiveIntelligence,
    monitoring: travelResult.alpha11MissionMonitoring,
    language: "en"
  });
  const titles = layer.futureMissions.map((mission) => mission.title);
  assert.ok(titles.includes("Recheck flight price before approval"));
  assert.ok(titles.includes("Passport validity check"));
  assert.equal(titles.length, new Set(titles).size);
});

test("ALPHA-12 timeline updates with previous completed missions", () => {
  const layer = createLifeTimelineLayer({
    result: travelResult,
    previousMissions: [
      { missionId: "old-passport", title: "Passport renewal", status: "completed", domain: "government" }
    ],
    language: "en"
  });
  assert.ok(layer.missionMap.completed.some((mission) => mission.title === "Passport renewal"));
});

test("ALPHA-12 privacy controls are user-owned", () => {
  assert.deepEqual(pauseLifeTimeline({}), { paused: true });
  assert.deepEqual(hideLifeTimeline({}), { hidden: true });
  assert.deepEqual(disableLifeMissionSuggestions({}), { suggestionsDisabled: true });
  assert.deepEqual(deleteLifeTimeline(), { deleted: true, hidden: true, suggestionsDisabled: true });
  const exported = exportLifeTimeline(createLifeTimelineLayer({ result: travelResult, language: "en" }));
  assert.equal(exported.version, ALPHA12_LIFE_TIMELINE_VERSION);
  assert.ok(Array.isArray(exported.relationships));
});

test("ALPHA-12 is wired into the results page and cache key", () => {
  const page = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  const entry = readFileSync(new URL("../results.js", import.meta.url), "utf8");

  assert.match(page, /createLifeTimelineLayer/);
  assert.match(page, /attachLifeTimelineLayer\(currentResult\)/);
  assert.match(page, /data-card-id="life-timeline"/);
  assert.match(html, /20260729-results-sophisticated/);
  assert.match(entry, /20260729-results-sophisticated/);
});

test("ALPHA-12 validation catches broken layers", () => {
  const validation = validateLifeTimelineLayer({
    version: "wrong",
    mode: "calendar",
    userControlled: false,
    goals: [{ progressNarrative: "50% complete" }]
  });
  assert.equal(validation.ok, false);
  assert.ok(validation.failures.includes("wrong_version"));
  assert.ok(validation.failures.includes("wrong_mode"));
  assert.ok(validation.failures.includes("user_control_missing"));
  assert.ok(validation.failures.includes("arbitrary_percentage_progress"));
});

