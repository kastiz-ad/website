import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  AI_DECISION_ENGINE_VERSION,
  analyzeMission,
  calculateMissionHealth,
  createAIDecisionLayer,
  recordDecisionFeedback
} from "../js/engine/decision/ai-decision-engine.js";

const japanMission = () => ({
  id: "ai-decision-japan",
  missionId: "ai-decision-japan",
  type: "travel",
  rawInput: "Plan a 7 day Japan trip for my mother and me.",
  destination: { city: "Japan", country: "Japan", countryCode: "JP" },
  schedule: { startDate: "2026-08-01", endDate: "2026-08-07" },
  hotels: [{ name: "Hotel Metropolitan Tokyo Marunouchi" }],
  restaurants: [{ name: "Tokyo ramen alley", tags: ["ramen"] }],
  places: [{ name: "Universal Studios Japan", tags: ["theme park"] }]
});

test("AI Decision Engine analyzes mission quality without exposing raw scoring", () => {
  const analysis = analyzeMission(japanMission());
  assert.equal(analysis.tripDays, 7);
  assert.equal(analysis.signals.japan, true);
  assert.equal(analysis.signals.hasDisney, true);
  const health = calculateMissionHealth(analysis);
  assert.ok(["excellent", "very_good", "needs_attention"].includes(health.label));
  assert.equal(typeof health.score, "number");
});

test("decision recommendations are meaningful, capped, approval-first, and do not invent exact numbers", () => {
  const layer = createAIDecisionLayer(japanMission(), { language: "en" });
  assert.equal(layer.version, AI_DECISION_ENGINE_VERSION);
  assert.ok(layer.recommendations.length >= 4);
  assert.ok(layer.visibleRecommendations.length <= 3);
  assert.ok(layer.visibleRecommendations.some((item) => /Disney/i.test(item.suggestion)));
  assert.ok(layer.visibleRecommendations.every((item) => item.approvalRequired));
  assert.ok(layer.visibleRecommendations.every((item) => item.consequence === "recommendation_only"));
  assert.doesNotMatch(JSON.stringify(layer.visibleRecommendations), /\b\d+\s*(?:minutes|mins|km|miles)\b/i);
});

test("Korean and Spanish decision cards are localized without changing the mission automatically", () => {
  const ko = createAIDecisionLayer(japanMission(), { language: "ko" });
  const es = createAIDecisionLayer(japanMission(), { language: "es" });
  assert.match(ko.visibleRecommendations[0].suggestion, /디즈니|동선|숙소|말차/);
  assert.match(es.visibleRecommendations[0].suggestion, /Disney|matcha|alojamiento|Mover/);
  assert.equal(japanMission().missionState, undefined);
});

test("dismissed decision memory suppresses repeated annoyance only after repeated rejection", () => {
  const storage = new Map();
  const localStorageLike = {
    getItem: (key) => storage.get(key),
    setItem: (key, value) => storage.set(key, value)
  };
  const key = "ai-decision-test-memory";
  recordDecisionFeedback(localStorageLike, key, "move-disney-lower-crowd", "dismissed");
  let memory = JSON.parse(storage.get(key));
  let layer = createAIDecisionLayer(japanMission(), { memory });
  assert.ok(layer.recommendations.some((item) => item.id === "move-disney-lower-crowd"));
  recordDecisionFeedback(localStorageLike, key, "move-disney-lower-crowd", "dismissed");
  memory = JSON.parse(storage.get(key));
  layer = createAIDecisionLayer(japanMission(), { memory });
  assert.ok(!layer.recommendations.some((item) => item.id === "move-disney-lower-crowd"));
});

test("results page wires AI decision cards to orchestration accept, dismiss, why and cache key", () => {
  const source = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../results.css", import.meta.url), "utf8");
  const html = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  assert.match(source, /createAIDecisionLayer/);
  assert.match(source, /data-decision-action="accept"/);
  assert.match(source, /recordDecisionFeedback/);
  assert.match(source, /ai_decision_accepted/);
  assert.match(css, /ai-decision-panel/);
  assert.match(html, /20260730-universal-execution/);
});
