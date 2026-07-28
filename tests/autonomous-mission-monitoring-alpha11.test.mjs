import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ALPHA11_AUTONOMOUS_MISSION_MONITORING_VERSION,
  EVENT_PRIORITIES,
  WATCHER_LIFECYCLE,
  createMissionWatcherLayer,
  deleteMissionWatcher,
  detectMissionWatcherEvents,
  disableMissionWatcher,
  groupMissionEvents,
  pauseMissionMonitoring,
  resumeMissionMonitoring,
  splitMissionNotifications,
  validateMissionEvent,
  validateMissionWatcherLayer
} from "../js/engine/monitoring/mission-watchers-alpha11.js";

const baseTravel = {
  id: "mission-japan",
  type: "travel",
  rawInput: "Japan trip",
  destination: { city: "Tokyo", country: "Japan" },
  flights: [{ provider: "Korean Air", estimatedPrice: { currency: "KRW", min: 900000, max: 1200000 } }],
  hotels: [{ name: "Tokyo Hotel" }],
  weather: [{ summary: "clear" }],
  exchangeRate: { rate: 0.11 },
  restaurants: [{ venueName: "Sushi A" }],
  airportTransfer: { recommended: "Airport rail" },
  alpha06PredictiveIntelligence: { visible: [] },
  alpha07PersonalMissionMemory: { preferences: ["direct flights"] },
  alpha09ProviderTrust: { providerCount: 2, warnings: [] },
  worldIntelligence: { failures: [] },
  budget: { flights: { currency: "KRW", min: 900000, max: 1200000 } }
};

test("ALPHA-11 creates mission watchers without autonomous execution", () => {
  const layer = createMissionWatcherLayer({ result: baseTravel, language: "en" });
  assert.equal(layer.version, ALPHA11_AUTONOMOUS_MISSION_MONITORING_VERSION);
  assert.ok(layer.watchers.some((watcher) => watcher.type === "flight"));
  assert.ok(layer.watchers.some((watcher) => watcher.type === "hotel"));
  assert.equal(layer.infrastructure.noAutomaticExecution, true);
  assert.equal(validateMissionWatcherLayer(layer).ok, true);
});

test("flight price drops create one high-priority notification with evidence", () => {
  const result = {
    ...baseTravel,
    budget: { flights: { currency: "KRW", min: 700000, max: 900000 } }
  };
  const events = detectMissionWatcherEvents({
    result,
    state: { previousSnapshots: { flightAverage: 1200000 } },
    now: new Date("2026-07-29T00:00:00Z"),
    language: "en"
  });
  assert.equal(events.length, 1);
  assert.equal(events[0].priority, EVENT_PRIORITIES.HIGH);
  assert.match(events[0].evidence, /previous=/);
  assert.equal(validateMissionEvent(events[0]).ok, true);
});

test("duplicate notification fatigue is prevented by grouping related events", () => {
  const events = [
    ...detectMissionWatcherEvents({
      result: { ...baseTravel, budget: { flights: { currency: "KRW", min: 700000, max: 900000 } } },
      state: { previousSnapshots: { flightAverage: 1200000 } },
      now: new Date("2026-07-29T00:00:00Z")
    }),
    ...detectMissionWatcherEvents({
      result: { ...baseTravel, budget: { flights: { currency: "KRW", min: 680000, max: 880000 } } },
      state: { previousSnapshots: { flightAverage: 1200000 } },
      now: new Date("2026-07-29T01:00:00Z")
    })
  ];
  const grouped = groupMissionEvents(events);
  assert.equal(events.length, 2);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].relatedEventCount, 2);
});

test("priority filtering only sends critical and high proactive notifications", () => {
  const events = detectMissionWatcherEvents({
    result: {
      ...baseTravel,
      weather: [{ summary: "heavy rain" }],
      events: [{ title: "Summer festival", confirmed: true }]
    },
    state: {},
    now: new Date("2026-07-29T00:00:00Z")
  });
  const split = splitMissionNotifications(groupMissionEvents(events));
  assert.ok(split.proactive.every((event) => [EVENT_PRIORITIES.CRITICAL, EVENT_PRIORITIES.HIGH].includes(event.priority)));
  assert.ok(split.historyOnly.every((event) => event.priority === EVENT_PRIORITIES.NORMAL));
});

test("mission history records what changed, why, source and status", () => {
  const layer = createMissionWatcherLayer({
    result: { ...baseTravel, alpha09ProviderTrust: { providerCount: 2, warnings: ["Official verification recommended"] } },
    state: {},
    now: new Date("2026-07-29T00:00:00Z")
  });
  assert.ok(layer.missionHistory.length >= 1);
  assert.ok(layer.missionHistory[0].evidence);
  assert.ok(layer.missionHistory[0].source);
  assert.equal(layer.missionHistory[0].lifecycle, WATCHER_LIFECYCLE.DISPLAYED);
  assert.ok(layer.digest.updates[0].nextRecommendedAction);
});

test("pause, resume, disable and delete watcher controls are state-only", () => {
  const paused = pauseMissionMonitoring({});
  assert.equal(paused.paused, true);
  const resumed = resumeMissionMonitoring(paused);
  assert.equal(resumed.paused, false);
  const disabled = disableMissionWatcher(resumed, "flight");
  assert.deepEqual(disabled.disabledWatchers, ["flight"]);
  const deleted = deleteMissionWatcher(disabled, "hotel");
  assert.ok(deleted.deletedWatchers.includes("hotel"));
  const layer = createMissionWatcherLayer({ result: baseTravel, state: pauseMissionMonitoring({}) });
  assert.equal(layer.paused, true);
  assert.equal(layer.events.length, 0);
});

test("watchers stop after mission completion", () => {
  const layer = createMissionWatcherLayer({
    result: { ...baseTravel, missionProgress: { currentState: "completed_verified" } }
  });
  assert.equal(layer.stoppedAfterCompletion, true);
  assert.ok(layer.watchers.every((watcher) => watcher.status === "stopped_after_completion"));
  assert.equal(layer.events.length, 0);
});

test("world intelligence and provider trust events stay distinct from predictions", () => {
  const layer = createMissionWatcherLayer({
    result: {
      ...baseTravel,
      alpha06PredictiveIntelligence: { visible: [{ title: "Passport renewal may be needed" }] },
      worldIntelligence: { failures: [{ providerType: "visa", message: "government advisory changed" }] },
      alpha09ProviderTrust: { providerCount: 3, warnings: ["Recommended hotel has recent reliability concerns"] }
    }
  });
  assert.equal(layer.sourceReuse.predictiveIntelligenceDistinct, true);
  assert.ok(layer.events.some((event) => event.eventType === "government_advisory_update"));
  assert.ok(layer.events.some((event) => event.eventType === "provider_trust_warning"));
});

test("result page and cache entries wire ALPHA-11 monitoring dashboard", () => {
  const page = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  const entry = readFileSync(new URL("../results.js", import.meta.url), "utf8");
  assert.match(page, /createMissionWatcherLayer/);
  assert.match(page, /autonomous-mission-monitoring/);
  assert.match(page, /alpha11MissionMonitoring/);
  assert.match(html, /20260729-alpha15-travel-duration-party/);
  assert.match(entry, /20260729-alpha15-travel-duration-party/);
});
