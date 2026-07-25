import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildLocalMissionPlan,
  getLocalMissionEngine,
  isLocalMissionType,
  LOCAL_MISSION_ENGINE_IDS,
  LOCAL_MISSION_PIPELINE
} from "../js/engine/local-mission-platform/local-mission-platform.js";
import { classifyMission } from "../js/engine/mission-classification.js";

test("V11 Phase 1 local engines are config-driven and complete", () => {
  assert.deepEqual(LOCAL_MISSION_ENGINE_IDS, [
    "education",
    "healthcare",
    "sports_wellness",
    "beauty",
    "professionals",
    "career",
    "government",
    "home_services"
  ]);

  for (const id of LOCAL_MISSION_ENGINE_IDS) {
    const engine = getLocalMissionEngine(id);
    assert.ok(engine);
    assert.ok(engine.services.length >= 3);
    assert.ok(engine.providerTypes.length);
    assert.ok(engine.rankingSignals.length >= 5);
    assert.ok(engine.essentialQuestions.length <= 3, `${id} should ask only essential follow-ups`);
  }
});

test("every local mission uses the existing core architecture and approval protection", () => {
  for (const id of LOCAL_MISSION_ENGINE_IDS) {
    const plan = buildLocalMissionPlan({
      type: id,
      mission: `Find a ${id} provider near me`,
      location: "Seoul",
      language: "en"
    });
    assert.equal(plan.supported, true);
    assert.deepEqual(plan.pipeline, LOCAL_MISSION_PIPELINE);
    assert.equal(plan.approval.required, true);
    assert.equal(plan.execution.enabled, false);
    assert.equal(plan.execution.blockedUntilApproval, true);
    assert.equal(plan.zeroBlankResult, true);
    assert.ok(plan.providerLayer.rankedProviders.length >= 3);
    assert.ok(plan.nextStep);
  }
});

test("local platform supports English, Korean, and Spanish labels", () => {
  assert.equal(buildLocalMissionPlan({ type: "healthcare", language: "en" }).engineLabel, "Healthcare");
  assert.equal(buildLocalMissionPlan({ type: "healthcare", language: "ko" }).engineLabel, "의료");
  assert.equal(buildLocalMissionPlan({ type: "healthcare", language: "es" }).engineLabel, "Salud");
});

test("classifier recognizes Phase 1 local mission families without breaking existing categories", () => {
  assert.equal(classifyMission("Find me an English tutor."), "tutoring");
  assert.equal(classifyMission("Find a dentist near Gangnam"), "healthcare");
  assert.equal(classifyMission("pilates near me"), "sports_wellness");
  assert.equal(classifyMission("강남 피부과 찾아줘"), "beauty");
  assert.equal(classifyMission("architect and translator for my project"), "professionals");
  assert.equal(classifyMission("passport renewal permit"), "government_services");
  assert.equal(classifyMission("pest control service"), "home_services");
  assert.equal(classifyMission("resume and interview help"), "career");
});

test("travel result generator keeps investor-demo option counts", () => {
  const source = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  assert.match(source, /flights:\s*8/);
  assert.match(source, /hotels:\s*8/);
  assert.match(source, /restaurants:\s*12/);
  assert.match(source, /slice\(0,\s*TRAVEL_OPTION_TARGETS\.flights\)/);
  assert.match(source, /slice\(0,\s*TRAVEL_OPTION_TARGETS\.hotels\)/);
  assert.match(source, /slice\(0,\s*TRAVEL_OPTION_TARGETS\.restaurants\)/);
});

test("unsupported local mission types fail safely", () => {
  const plan = buildLocalMissionPlan({ type: "unsupported" });
  assert.equal(plan.supported, false);
  assert.equal(plan.approvalRequired, true);
  assert.equal(plan.executionEnabled, false);
});

test("local mission type helper is strict", () => {
  assert.equal(isLocalMissionType("education"), true);
  assert.equal(isLocalMissionType("travel"), false);
});
