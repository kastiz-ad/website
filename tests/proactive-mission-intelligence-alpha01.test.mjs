import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import {
  generateMissionInsights,
  insightStorageKey,
  MAX_VISIBLE_INSIGHTS,
  splitVisibleMissionInsights
} from "../js/engine/insights/mission-insights-alpha01.js";

const winterTravel = {
  id: "alpha01-sapporo",
  type: "travel",
  rawInput: "Sapporo winter trip with parents",
  destination: { city: "Sapporo", country: "Japan", continent: "Asia" },
  schedule: { startDate: "2026-02-05", endDate: "2026-02-10" },
  worldIntelligence: {
    models: {
      hotels: [{ sourceState: "cached_public" }],
      flights: [{ sourceState: "unavailable" }],
      weather: [{ sourceState: "cached_public" }]
    }
  }
};

test("ALPHA-01 generates mission-specific travel insights without generic filler", () => {
  const insights = generateMissionInsights({ result: winterTravel, context: { relationship: { value: "parents" } }, language: "en" });
  assert.ok(insights.length >= 3);
  assert.ok(insights.some((insight) => /winter|Sapporo/i.test(`${insight.title} ${insight.why}`)));
  assert.ok(insights.some((insight) => insight.id === "travel-live-flight-required"));
  for (const insight of insights) {
    assert.ok(insight.title);
    assert.ok(insight.explanation);
    assert.ok(insight.why);
    assert.equal(insight.blocksMission, false);
    assert.equal(insight.optional, true);
    assert.match(insight.sourceState, /verified_live|cached_public|estimated|placeholder|unavailable/);
    assert.doesNotMatch(`${insight.title} ${insight.explanation}`, /you must|danger|panic/i);
  }
});

test("ALPHA-01 preserves V24 source states and caps visible insights to three", () => {
  const insights = generateMissionInsights({ result: winterTravel, context: {}, language: "en" });
  const split = splitVisibleMissionInsights(insights, {});
  assert.equal(split.visible.length, Math.min(MAX_VISIBLE_INSIGHTS, insights.length));
  assert.ok(split.visible.length <= 3);
  assert.ok(insights.some((insight) => insight.sourceState === "unavailable"));
});

test("ALPHA-01 dismissal removes matching insights without blocking mission flow", () => {
  const insights = generateMissionInsights({ result: winterTravel, context: {}, language: "en" });
  const first = insights[0];
  const split = splitVisibleMissionInsights(insights, { [first.id]: "dismissed" });
  assert.ok(!split.visible.some((insight) => insight.id === first.id));
  assert.ok(split.visible.every((insight) => insight.blocksMission === false));
});

test("ALPHA-01 supports healthcare, business and career preview domains", () => {
  const healthcare = generateMissionInsights({ result: { type: "healthcare", rawInput: "오늘 갈 수 있는 치과 찾아줘" }, language: "ko" });
  const business = generateMissionInsights({ result: { resolutionPlan: { domain: "business", missionType: "registration", userProblem: "start a company in Korea" } }, language: "en" });
  const career = generateMissionInsights({ result: { resolutionPlan: { domain: "career", missionType: "job_application", userProblem: "job application" } }, language: "es" });
  assert.ok(healthcare.some((insight) => insight.category === "healthcare"));
  assert.ok(business.some((insight) => insight.category === "business"));
  assert.ok(career.some((insight) => insight.category === "career"));
});

test("ALPHA-01 result UI is integrated and accessible", () => {
  const source = fs.readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../results.css", import.meta.url), "utf8");
  assert.match(source, /createMissionInsightsCard/);
  assert.match(source, /data-insight-action="dismiss"/);
  assert.match(source, /aria-hidden/);
  assert.match(css, /alpha-insights-card/);
  assert.match(css, /@media \(max-width: 720px\)/);
});

test("ALPHA-01 insight storage key is mission-scoped and safe", () => {
  const key = insightStorageKey({ id: "ONE-DEMO-ABC 123!" });
  assert.match(key, /^kastiz-one-alpha01-insights:/);
  assert.doesNotMatch(key, /\s|!/);
});
