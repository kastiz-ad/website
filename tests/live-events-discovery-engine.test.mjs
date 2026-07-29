import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EVENT_ACTIONS,
  EVENT_PROVIDER_STATUS,
  EventsProvider,
  applyEventDiscoveryAction,
  createEventProviderResult,
  createLiveEventsDiscoveryEngine,
  detectEventTimeConflict,
  eventMatchesMissionSchedule,
  normalizeEvent,
  scoreEventForMission
} from "../js/engine/events/live-events-discovery-engine.js";

const mission = {
  id: "mission-events",
  type: "travel",
  rawInput: "Tokyo family trip",
  schedule: { startDate: "2026-09-01", endDate: "2026-09-05" },
  budget: { activities: { max: 90000 } },
  itinerary: [{ id: "museum", title: "Museum visit", startTime: "2026-09-02T19:00:00", endTime: "2026-09-02T21:00:00" }]
};

test("events provider defaults to setup_required and never invents events", async () => {
  const provider = new EventsProvider();
  const result = await provider.searchEvents({ destination: "Tokyo" });
  const engine = createLiveEventsDiscoveryEngine({ result: mission, providerResult: result, language: "en" });

  assert.equal(result.ok, false);
  assert.equal(engine.status, "unavailable");
  assert.match(engine.message, /Live event data unavailable/);
  assert.deepEqual(engine.recommendations, []);
});

test("events are normalized and matched to mission schedule", () => {
  const event = normalizeEvent({ id: "fireworks", title: "Summer Fireworks", category: "fireworks", startTime: "2026-09-03T20:00:00", priceMin: 0, priceMax: 0 });

  assert.equal(event.category, "fireworks");
  assert.equal(eventMatchesMissionSchedule(event, mission), true);
  assert.equal(eventMatchesMissionSchedule({ ...event, startTime: "2026-10-03T20:00:00" }, mission), false);
});

test("events engine scores interest, budget, distance and conflict", () => {
  const event = normalizeEvent({ id: "market", title: "Night Market Food Festival", category: "market", startTime: "2026-09-02T18:00:00", endTime: "2026-09-02T20:00:00", priceMax: 30000, distanceKm: 2, sourceState: "verified_live", tags: ["food", "family"] });
  const score = scoreEventForMission(event, { result: mission, interests: ["food"], budget: mission.budget.activities, itinerary: mission.itinerary });
  const noConflictScore = scoreEventForMission({ ...event, startTime: "2026-09-03T18:00:00", endTime: "2026-09-03T20:00:00" }, { result: mission, interests: ["food"], budget: mission.budget.activities, itinerary: mission.itinerary });
  const conflict = detectEventTimeConflict(event, mission.itinerary);

  assert.equal(conflict.hasConflict, true);
  assert.ok(score.score < noConflictScore.score);
  assert.ok(score.reasons.some((reason) => /Conflicts/.test(reason)));
});

test("events engine returns ranked provider-backed recommendations", () => {
  const providerResult = createEventProviderResult({
    ok: true,
    provider: "ticketmaster-or-partner",
    status: EVENT_PROVIDER_STATUS.VERIFIED_LIVE,
    items: [
      { id: "concert", title: "Tokyo Jazz Concert", category: "concert", startTime: "2026-09-04T20:00:00", priceMax: 65000, distanceKm: 3, sourceState: "verified_live", tags: ["music"] },
      { id: "outside", title: "Outside dates", category: "festival", startTime: "2026-10-04T20:00:00", sourceState: "verified_live" }
    ]
  });
  const engine = createLiveEventsDiscoveryEngine({ result: mission, providerResult, interests: ["music"] });

  assert.equal(engine.status, "ready");
  assert.equal(engine.recommendations.length, 1);
  assert.equal(engine.recommendations[0].event.title, "Tokyo Jazz Concert");
  assert.equal(engine.recommendations[0].requiresApproval, true);
  assert.ok(engine.recommendations[0].affectedComponents.includes("budget"));
});

test("events controls support accept, dismiss and remind later", () => {
  const recommendation = { id: "event-concert" };
  let state = applyEventDiscoveryAction({}, recommendation, EVENT_ACTIONS.ACCEPT);
  assert.deepEqual(state.accepted, ["event-concert"]);
  state = applyEventDiscoveryAction(state, recommendation, EVENT_ACTIONS.REMIND_LATER);
  assert.deepEqual(state.remindLater, ["event-concert"]);
  assert.deepEqual(state.accepted, []);
  state = applyEventDiscoveryAction(state, recommendation, EVENT_ACTIONS.DISMISS);
  assert.deepEqual(state.dismissed, ["event-concert"]);
  assert.deepEqual(state.remindLater, []);
});
