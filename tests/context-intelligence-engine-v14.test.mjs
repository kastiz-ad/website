import test from "node:test";
import assert from "node:assert/strict";
import { buildContextObject, CONTEXT_ENGINE_VERSION, summarizeContextObject } from "../js/engine/context/context-intelligence-engine-v14.js";
import { updateLifeMemory, createLifeMemory } from "../js/profile/life-memory-engine.js";
import { buildUniversalMission } from "../js/engine/universal-mission-engine-v4.js";

test("V14 creates one Context Object from all required context sources", () => {
  const lifeMemory = updateLifeMemory(createLifeMemory({ consent: { enabled: true } }), {
    domain: "travel",
    field: "hotelStyle",
    value: "quiet 4-star",
    consent: true
  }).memory;
  const context = buildContextObject({
    mission: "NYC 5 day trip",
    language: "en",
    currentLocation: "Seoul",
    now: "2026-07-26T10:00:00.000Z",
    timezone: "Asia/Seoul",
    weather: { status: "rain", temperature: "26C", source: "provided" },
    calendarEvents: ["Mom birthday dinner"],
    lifeMemory,
    previousMissions: [{ id: "m1", category: "travel", outcome: "completed" }],
    travelState: { departureDate: "2026-08-01", returnDate: "2026-08-06" },
    family: { householdSize: "3" },
    vehicle: { inspectionDue: "2026-09" },
    home: { maintenanceDue: "air-conditioner" },
    business: { renewalDue: "2026-12" }
  });

  assert.equal(context.version, CONTEXT_ENGINE_VERSION);
  assert.equal(context.time.date, "2026-07-26");
  assert.equal(context.location.current, "Seoul");
  assert.equal(context.location.destination.city, "New York City");
  assert.equal(context.weather.status, "rain");
  assert.equal(context.calendar.events.length, 1);
  assert.equal(context.memory.entriesUsed.length, 1);
  assert.equal(context.previousMissions.count, 1);
  assert.equal(context.currentMission.text, "NYC 5 day trip");
  assert.equal(context.travelState.requiresInternationalTravel, true);
  assert.equal(context.familyContext.householdSize, "3");
  assert.equal(context.vehicle.inspectionDue, "2026-09");
  assert.equal(context.home.maintenanceDue, "air-conditioner");
  assert.equal(context.business.renewalDue, "2026-12");
});

test("V14 never executes and only improves understanding", () => {
  const context = buildContextObject({ mission: "passport renewal", language: "en" });

  assert.equal(context.approvalRequired, true);
  assert.equal(context.executionEnabled, false);
  assert.equal(context.externalCallsEnabled, false);
  assert.equal(context.improvesUnderstandingOnly, true);
});

test("V14 respects explicit instructions over memory through the Context Object", () => {
  const lifeMemory = updateLifeMemory(createLifeMemory({ consent: { enabled: true } }), {
    domain: "travel",
    field: "airlinePreference",
    value: "Korean Air",
    consent: true
  }).memory;
  const context = buildContextObject({
    mission: "Trip to Tokyo but do not use my saved airline preference",
    language: "en",
    lifeMemory,
    missionType: "travel"
  });

  assert.equal(context.memory.explicitInstructionsOverrideMemory, true);
  assert.equal(context.memory.entriesUsed.length, 0);
  assert.equal(context.memory.entriesAvailable.length, 1);
});

test("V14 is consumed by every Universal Mission Engine result", () => {
  const mission = buildUniversalMission({
    mission: "오늘 밤 문 연 약국 찾아줘",
    language: "ko",
    currentLocation: "Seoul",
    calendarEvents: ["저녁 약속"],
    weather: { status: "rain" }
  });

  assert.equal(mission.contextObject.version, "V14");
  assert.equal(mission.contextObject.currentMission.type, "healthcare");
  assert.equal(mission.contextObject.calendar.events.length, 1);
  assert.equal(mission.contextObject.weather.status, "rain");
  assert.equal(mission.contextObject.executionEnabled, false);
});

test("V14 summary is compact and safe for Mission Engines", () => {
  const context = buildContextObject({
    mission: "Business renewal deadline",
    business: { renewalDue: "2026-10", taxDeadline: "2026-11" },
    previousMissions: ["government", "business"]
  });
  const summary = summarizeContextObject(context);

  assert.equal(summary.version, "V14");
  assert.equal(summary.previousMissionCount, 2);
  assert.ok(summary.signals.length >= 1);
  assert.equal(summary.approvalRequired, true);
  assert.equal(summary.executionEnabled, false);
});
