import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { EXPERIENCE_INGREDIENTS, SEOUL_EXPERIENCE_CLUSTERS, ingredientCount } from "../js/engine/experience-generator/experience-ingredient-library.js";
import { generateExperience } from "../js/engine/experience-generator/one-experience-generator.js";
import { buildMissionContext } from "../js/engine/context/mission-context-intelligence.js";
import { safeExperienceVaultRecord } from "../js/engine/experience-generator/experience-vault.js";

const context = buildMissionContext("서울에서 여친과 주말 데이트", { language: "ko", currentLocation: "Seoul", durationDays: 2 });

test("experience library stores ingredients rather than predefined plans", () => {
  assert.ok(ingredientCount() >= 80);
  assert.deepEqual(Object.keys(EXPERIENCE_INGREDIENTS), ["locations", "activities", "foods", "moods", "transport", "durations"]);
  assert.equal(Object.values(EXPERIENCE_INGREDIENTS).flat().some((item) => "itinerary" in item || "scenario" in item), false);
});

test("Seoul experience library includes broad fun choices and coherent compatibility groups", () => {
  const activityIds = new Set(EXPERIENCE_INGREDIENTS.activities.map((item) => item.id));
  assert.ok(EXPERIENCE_INGREDIENTS.activities.length >= 50);
  ["han-river-ramen", "lotte-aquarium", "seoul-sky", "hongdae-street-date", "myeongdong-shopping", "gangnam-cafe-date"].forEach((id) => assert.ok(activityIds.has(id), id));
  assert.ok(SEOUL_EXPERIENCE_CLUSTERS.length >= 8);
  SEOUL_EXPERIENCE_CLUSTERS.forEach((cluster) => {
    assert.ok(cluster.activities.length >= 5);
    assert.ok(cluster.foods.length >= 3);
    cluster.activities.forEach((id) => assert.ok(activityIds.has(id), `${cluster.id}:${id}`));
  });
});

test("Seoul date results stay inside one compatible activity group", () => {
  const result = generateExperience({ mission: "Seoul weekend date", context, generationIndex: 4, language: "en" });
  const cluster = SEOUL_EXPERIENCE_CLUSTERS.find((item) => item.id === result.experienceCluster);
  assert.ok(cluster);
  result.ingredientIds.filter((id) => EXPERIENCE_INGREDIENTS.activities.some((item) => item.id === id)).forEach((id) => assert.ok(cluster.activities.includes(id), id));
  assert.equal(result.alternatives.length, 12);
  assert.equal(result.visibleAlternativeLimit, 12);
  const foodTimes = result.onePick.timeline.filter((item) => item.type === "food").map((item) => item.time);
  assert.deepEqual(foodTimes, ["12:30", "19:00"]);
  assert.doesNotMatch(result.onePick.rainPlan, /^VR(?:\s|$)/i);
});

test("the same request can create ten distinct high-quality compositions", () => {
  const generated = [];
  for (let generationIndex = 0; generationIndex < 10; generationIndex += 1) {
    generated.push(generateExperience({ mission: "서울에서 여친과 주말 데이트", context, generationIndex, completedExperienceSignatures: generated.map((item) => item.signature), preferences: ["sunset", "dessert"], dislikes: ["museum"], season: "summer", transportPreference: "subway" }));
  }
  assert.equal(new Set(generated.map((item) => item.signature)).size, 10);
  generated.forEach((item) => {
    assert.ok(item.onePick.timeline.length >= 5);
    assert.ok(item.onePick.rainPlan);
    assert.ok(item.onePick.reasoning);
    assert.equal(item.approval.required, true);
    assert.equal(item.approval.externalExecution, false);
  });
});

test("OpenAI prompt optimizes for memory without claiming live availability", () => {
  const result = generateExperience({ mission: "weekend date", context, provider: "OPENAI" });
  assert.equal(result.provider, "OPENAI");
  assert.match(result.prompt.system, /remember ten years|memorable/i);
  assert.match(result.prompt.system, /Never claim live availability/i);
  assert.ok(result.combinatorialLibrarySize > 1_000_000);
});

test("vault records contain no raw mission, preference or personal text", () => {
  const result = generateExperience({ mission: "private raw mission", context });
  const record = safeExperienceVaultRecord({ ...result, completedAt: "2026-07-20T00:00:00Z", outcome: "completed" });
  assert.deepEqual(Object.keys(record), ["signature", "ingredientIds", "completedAt", "outcome"]);
  assert.doesNotMatch(JSON.stringify(record), /private raw mission|girlfriend|여친/i);
});

test("dating and outing missions render the generated experience before revision and approval", async () => {
  const source = await readFile(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  assert.match(source, /isExperienceMission/);
  assert.match(source, /renderGeneratedExperienceMission/);
  assert.match(source, /generated-timeline/);
  assert.match(source, /generated-food/);
  assert.match(source, /generated-rain-plan/);
  assert.match(source, /insertBefore\(pathwayOpportunityPanel/);
  assert.match(source, /buildExperienceExecutionSummary/);
  assert.match(source, /Approved experience summary/);
  assert.match(source, /p: 2/);
  assert.match(source, /prototype-reference-qr/);
  assert.match(source, /experienceMission && experience/);
  assert.match(source, /Prototype · personalized experience plan · no booking made/);
});
