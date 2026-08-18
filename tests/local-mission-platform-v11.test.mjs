import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildLocalMissionPlan,
  classifyHealthcareUrgency,
  classifyLocalMission,
  getLocalMissionEngine,
  isLocalMissionType,
  LOCAL_MISSION_ENGINE_IDS,
  LOCAL_MISSION_PIPELINE
} from "../js/engine/local-mission-platform/local-mission-platform.js";
import { buildUniversalMission } from "../js/engine/universal-mission-engine-v4.js";
import { classifyMission } from "../js/engine/mission-classification.js";

test("V11 Phase 1 local engines are config-driven and complete", () => {
  assert.deepEqual(LOCAL_MISSION_ENGINE_IDS, [
    "education",
    "healthcare",
    "sports_wellness",
    "beauty",
    "professionals",
    "career",
    "foreigner_korea",
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
  assert.match(source, /hotels:\s*12/);
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

test("V11 Korean local mission prompts classify into the correct reusable engines", () => {
  const cases = [
    ["인천 서구에서 중학생 영어 내신 학원 찾아줘", "education"],
    ["초등학생 수학 학원 중 숙제가 너무 많지 않은 곳 찾아줘", "education"],
    ["이가 아픈데 오늘 갈 수 있는 치과 찾아줘", "healthcare"],
    ["암 진료를 받을 대학병원 찾아줘", "healthcare"],
    ["오늘 밤 문 연 약국 찾아줘", "healthcare"],
    ["집 근처 필라테스와 수영장을 비교해 줘", "sports_wellness"],
    ["레이저 피부 시술을 받을 곳 찾아줘", "beauty"],
    ["이민 전문 변호사 찾아줘", "professionals"],
    ["싱크대 누수 수리업체 찾아줘", "home_services"],
    ["한국에서 일자리를 찾고 싶어", "career"],
    ["한국에서 외국인이 회사를 시작하려면 준비해 줘", "foreigner_korea"],
    ["영어 가능한 통역사를 찾아줘", "professionals"]
  ];

  for (const [prompt, type] of cases) {
    assert.equal(classifyMission(prompt), type);
    assert.equal(classifyLocalMission(prompt).providerType, type);
    const plan = buildLocalMissionPlan({ type, mission: prompt, language: "ko" });
    assert.equal(plan.supported, true);
    assert.equal(plan.zeroBlankResult, true);
    assert.ok(plan.providerLayer.rankedProviders.length > 0);
    assert.ok(plan.essentialFollowUps.length <= 3);
    assert.equal(plan.approval.required, true);
    assert.equal(plan.execution.enabled, false);
  }
});

test("V11 healthcare separates routine, urgent and emergency navigation without diagnosis", () => {
  assert.equal(classifyHealthcareUrgency("정기 검진 받을 병원 찾아줘"), "routine");
  assert.equal(classifyHealthcareUrgency("이가 아픈데 오늘 갈 수 있는 치과 찾아줘"), "urgent");
  assert.equal(classifyHealthcareUrgency("가슴 통증과 호흡곤란이 있어"), "emergency");

  const plan = buildLocalMissionPlan({ type: "healthcare", mission: "암 진료를 받을 대학병원 찾아줘", language: "ko" });
  assert.equal(plan.safetyMode, "medical_navigation_only");
  assert.ok(plan.adapterReadiness.some((adapter) => adapter.id === "hira" && adapter.state === "future"));
  assert.doesNotMatch(JSON.stringify(plan), /best doctor|최고의 의사|diagnosis|진단/i);
});

test("Universal Mission Engine reuses the local registry for local missions", () => {
  const mission = buildUniversalMission({ mission: "싱크대 누수 수리업체 찾아줘", language: "ko" });
  assert.equal(mission.providerType, "home_services");
  assert.deepEqual(mission.pipeline, ["mission","classifier","human-reasoning","context","experience","provider","live-intelligence","one-pick","preparation","approval","receipt"]);
  assert.equal(mission.localMissionPlan.engineId, "home_services");
  assert.ok(mission.providers.length);
  assert.equal(mission.preparation.executionEnabled, false);
});
