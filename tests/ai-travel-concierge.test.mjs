import assert from "node:assert/strict";
import { test } from "node:test";

import {
  AI_TRAVEL_CONCIERGE_VERSION,
  CONCIERGE_ACTIONS,
  applyConciergeRecommendation,
  conciergeStorageKey,
  createAITravelConcierge,
  createConciergeRecommendation,
  createConciergeState,
  scoreMissionForConcierge,
  shouldSuggestMemoryFromConcierge
} from "../js/engine/concierge/ai-travel-concierge.js";

const baseTravelMission = {
  id: "ONE-DEMO-CONCIERGE",
  type: "travel",
  rawInput: "일본 여행",
  destination: { city: "Tokyo", cityKo: "도쿄", country: "Japan", countryKo: "일본", countryCode: "JP" },
  schedule: { startDate: "2026-09-01", endDate: "2026-09-07" },
  hotels: [],
  restaurants: []
};

test("AI Travel Concierge creates explainable weather recommendation from explicit evidence", () => {
  const concierge = createAITravelConcierge({
    result: {
      ...baseTravelMission,
      conciergeSignals: {
        weather: {
          issue: "rain",
          source: "Open-Meteo",
          sourceState: "verified_live",
          retrievedAt: "2026-08-31T10:00:00.000Z",
          reason: "Rain expected Tuesday afternoon.",
          comfortImproved: 12
        }
      }
    },
    language: "en"
  });

  assert.equal(concierge.version, AI_TRAVEL_CONCIERGE_VERSION);
  assert.equal(concierge.status, "ready");
  assert.equal(concierge.userControl.neverExecutesAutomatically, true);
  const weather = concierge.recommendations.find((item) => item.category === "weather");
  assert.ok(weather);
  assert.equal(weather.requiresApproval, true);
  assert.equal(weather.sourceState, "verified_live");
  assert.match(weather.reason, /Rain expected/);
  assert.ok(weather.affectedComponents.includes("schedule"));
});

test("Concierge supports restaurant, transport and hotel improvement categories with measurable benefits", () => {
  const concierge = createAITravelConcierge({
    result: {
      ...baseTravelMission,
      conciergeSignals: {
        restaurant: { closed: true, name: "Sushi A", source: "Google Places", sourceState: "cached_public" },
        transport: { timeSavedMinutes: 38, source: "Google Routes", sourceState: "verified_live" },
        hotel: { walkingReducedKm: 2, source: "Amadeus Hotel Search", sourceState: "verified_live" }
      }
    },
    language: "ko"
  });

  const categories = concierge.recommendations.map((item) => item.category);
  assert.ok(categories.includes("restaurants"));
  assert.ok(categories.includes("transportation"));
  assert.ok(categories.includes("hotels"));
  assert.equal(concierge.recommendations.find((item) => item.category === "transportation").benefit.timeSavedMinutes, 38);
  assert.equal(concierge.recommendations.find((item) => item.category === "hotels").benefit.walkingReducedKm, 2);
});

test("Concierge ranks critical and high priority recommendations before low setup notes", () => {
  const critical = createConciergeRecommendation({ id: "airport", category: "safety", priority: "critical", title: "Airport disruption", reason: "Airport disruption evidence.", expectedBenefit: "Avoid missed flight.", sourceState: "verified_live" });
  const low = createConciergeRecommendation({ id: "setup", category: "transportation", priority: "low", title: "Setup routes", reason: "Provider setup required.", expectedBenefit: "Useful later.", sourceState: "setup_required" });
  const score = scoreMissionForConcierge({ result: baseTravelMission, recommendations: [critical, low] });

  assert.ok(critical.rankingScore > low.rankingScore);
  assert.ok(score < 72);
});

test("Concierge does not fabricate recommendations when supporting data is unavailable", () => {
  const concierge = createAITravelConcierge({ result: baseTravelMission, language: "es" });

  assert.equal(concierge.status, "ready");
  assert.ok(concierge.recommendations.every((item) => item.sourceState !== "verified_live"));
  assert.ok(concierge.recommendations.every((item) => !item.reason.includes("38")));
});

test("Concierge returns limited state for non-international mission without measurable provider data", () => {
  const concierge = createAITravelConcierge({
    result: { id: "local-date", type: "travel", rawInput: "여친 주말 데이트", destination: { city: "Seoul", countryCode: "KR" } },
    language: "ko"
  });

  assert.equal(concierge.status, "limited");
  assert.ok(concierge.limitations.length >= 1);
});

test("Founder demo demonstrates all required recommendation types without claiming live provider status", () => {
  const concierge = createAITravelConcierge({ result: baseTravelMission, language: "en", scenario: "founder-demo" });
  const categories = new Set(concierge.recommendations.map((item) => item.category));

  assert.ok(categories.has("weather"));
  assert.ok(categories.has("restaurants"));
  assert.ok(categories.has("transportation"));
  assert.ok(categories.has("hotels"));
  assert.ok(concierge.recommendations.some((item) => item.benefit.timeSavedMinutes === 38));
  assert.ok(concierge.recommendations.every((item) => item.sourceState !== "verified_live"));
});

test("Concierge controls support accept, dismiss, remind later, never ask again and undo", () => {
  const recommendation = createConciergeRecommendation({ id: "transport-time-saver", category: "transportation", title: "Faster route", reason: "Route evidence.", expectedBenefit: "Save time.", sourceState: "verified_live", benefit: { timeSavedMinutes: 20 } });
  let state = createConciergeState();

  state = applyConciergeRecommendation(state, recommendation, CONCIERGE_ACTIONS.ACCEPT);
  assert.deepEqual(state.accepted, ["transport-time-saver"]);
  assert.equal(state.undoStack.length, 1);

  state = applyConciergeRecommendation(state, recommendation, CONCIERGE_ACTIONS.UNDO);
  assert.deepEqual(state.accepted, []);

  state = applyConciergeRecommendation(state, recommendation, CONCIERGE_ACTIONS.REMIND_LATER);
  assert.deepEqual(state.remindLater, ["transport-time-saver"]);

  state = applyConciergeRecommendation(state, recommendation, CONCIERGE_ACTIONS.DISMISS);
  assert.deepEqual(state.dismissed, ["transport-time-saver"]);
  assert.deepEqual(state.remindLater, []);

  state = applyConciergeRecommendation(state, recommendation, CONCIERGE_ACTIONS.NEVER_ASK_AGAIN);
  assert.deepEqual(state.neverAskAgain, ["transport-time-saver"]);
  assert.deepEqual(state.dismissed, []);
});

test("Accepted and rejected recommendations affect later Concierge output", () => {
  const first = createAITravelConcierge({
    result: { ...baseTravelMission, conciergeSignals: { transport: { timeSavedMinutes: 38, sourceState: "verified_live", source: "Google Routes" } } },
    language: "en"
  });
  const recommendation = first.recommendations.find((item) => item.category === "transportation");
  const state = applyConciergeRecommendation(createConciergeState(), recommendation, CONCIERGE_ACTIONS.DISMISS);
  const second = createAITravelConcierge({
    result: { ...baseTravelMission, conciergeSignals: { transport: { timeSavedMinutes: 38, sourceState: "verified_live", source: "Google Routes" } } },
    language: "en",
    state
  });

  assert.equal(second.recommendations.some((item) => item.id === recommendation.id), false);
});

test("Concierge memory suggestions require repeated acceptance and explicit confirmation", () => {
  const recommendation = createConciergeRecommendation({ id: "hotels-closer", category: "hotels", title: "Closer hotel", reason: "Less walking.", expectedBenefit: "Less fatigue.", sourceState: "verified_live" });
  const noSuggestion = shouldSuggestMemoryFromConcierge(createConciergeState({ accepted: ["hotels-closer"] }), recommendation);
  const suggestion = shouldSuggestMemoryFromConcierge(createConciergeState({ accepted: ["hotels-closer", "hotels-closer"] }), recommendation);

  assert.equal(noSuggestion.shouldAsk, false);
  assert.equal(suggestion.shouldAsk, true);
  assert.equal(suggestion.requiresExplicitConfirmation, true);
});

test("Concierge storage key is stable and scoped by mission", () => {
  assert.equal(conciergeStorageKey({ id: "A B C" }), "kastiz-one-ai-concierge:A_B_C");
});
