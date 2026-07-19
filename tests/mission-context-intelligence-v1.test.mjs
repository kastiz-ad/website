import test from "node:test";
import assert from "node:assert/strict";
import { buildMissionContext } from "../js/engine/context/mission-context-intelligence.js";
import { buildContextualExperienceIntelligence } from "../js/engine/context/context-experience-intelligence.js";
import { createMission } from "../js/engine/mission-creation.js";

const scenarios = [
  ["서울에서 여친과 주말 데이트", { relationship: "couple", distance: "LOCAL_CITY", purpose: "romance" }],
  ["Seoul weekend date with my girlfriend", { relationship: "couple", distance: "LOCAL_CITY", purpose: "romance" }],
  ["부산 가족 여행", { relationship: "family", distance: "WEEKEND", purpose: "exploration" }],
  ["가평 당일치기 친구 여행", { relationship: "friends", distance: "DAY_TRIP", purpose: "exploration" }],
  ["제주도 가족 여행", { relationship: "family", distance: "WEEKEND", purpose: "exploration" }],
  ["Tokyo trip with friends", { relationship: "friends", distance: "INTERNATIONAL", purpose: "exploration" }],
  ["뉴욕 출장", { relationship: "unspecified", distance: "INTERNATIONAL", purpose: "business" }],
  ["Paris anniversary trip with my wife", { relationship: "couple", distance: "INTERNATIONAL", purpose: "romance" }],
  ["서울에서 혼자 힐링", { relationship: "solo", distance: "LOCAL_CITY", purpose: "relaxation" }],
  ["Madrid viaje con amigos", { relationship: "friends", distance: "INTERNATIONAL", purpose: "exploration" }],
  ["서울에서 아이와 하루 보내기", { relationship: "family", distance: "LOCAL_CITY", purpose: "general" }],
  ["Busan conference with my team", { relationship: "colleagues", distance: "WEEKEND", purpose: "business" }]
];

for (const [mission, expected] of scenarios) test(`context: ${mission}`, () => {
  const context = buildMissionContext(mission, { currentLocation: "Seoul", durationDays: expected.distance === "DAY_TRIP" ? 1 : 2 });
  assert.equal(context.relationship.value, expected.relationship);
  assert.equal(context.distanceClass, expected.distance);
  assert.equal(context.purpose.value, expected.purpose);
  assert.ok(context.transport.length > 0);
});

test("domestic context suppresses international-only preparation", () => {
  const context = buildMissionContext("부산 가족 여행", { currentLocation: "Seoul", durationDays: 3 });
  assert.equal(context.requiresInternationalTravel, false);
  assert.deepEqual(context.suppress, ["airport", "passport", "embassy", "immigration", "departure-guide"]);
});

test("emotion inference stays internal and is never serialized", () => {
  const context = buildMissionContext("서울에서 여친과 기념일 데이트", { currentLocation: "Seoul" });
  assert.ok(context.internal.emotions.includes("romance"));
  assert.doesNotMatch(JSON.stringify(context), /emotion/i);
});

test("ONE Pick, explanation, alternatives, diverse food and map are always available", () => {
  const review = buildContextualExperienceIntelligence({ mission: "서울에서 여친과 주말 데이트", language: "ko", currentLocation: "Seoul" });
  assert.ok(review.recommendation);
  assert.ok(review.explanation);
  assert.ok(review.alternativeExperiences.length >= 3);
  assert.equal(new Set(review.foodExperiences).size, 4);
  assert.equal(review.mapModel.enabled, true);
});

test("mission creation keeps the provider mission pack and adds context before execution", () => {
  const mission = createMission("부산 가족 여행", { language: "ko", currentLocation: "Seoul", durationDays: 2 });
  assert.ok(mission.missionPack);
  assert.ok(mission.requestedCapabilities.length);
  assert.equal(mission.context.distanceClass, "WEEKEND");
  assert.equal(mission.approvalProtection.required, true);
});
