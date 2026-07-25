import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { classifyMission } from "../js/engine/mission-classification.js";
import { classifyUniversalMission } from "../js/engine/universal-mission-engine-v4.js";
import { createHOSKernel } from "../js/engine/kernel/hos-kernel-v16.js";

const kernel = createHOSKernel();

function run(prompt, language = /[\u3131-\uD79D]/.test(prompt) ? "ko" : "en") {
  return kernel.run({ mission: prompt, language, currentLocation: "Seoul" });
}

test("V21.1 routes child English weakness to education playbook, never travel", () => {
  const prompt = "아이가 영어가 부족한데 어떻게 할까?";
  const output = run(prompt);
  const planText = JSON.stringify(output.resolutionPlan);

  assert.equal(classifyMission(prompt), "education");
  assert.equal(classifyUniversalMission(prompt).providerType, "education");
  assert.equal(output.humanReasoning.selectedMission.type, "education");
  assert.equal(output.missionIntelligence.selectedPlaybookId, "education/child-english-performance-decline");
  assert.equal(output.resolutionPlan.domain, "education");
  assert.equal(output.resolutionPlan.missionType, "child-english-performance-decline");
  assert.match(planText, /English level|academy|tutor|home-study/i);
  assert.doesNotMatch(planText, /flight|hotel|restaurant|airport|passport|visa/i);
  assert.ok(output.resolutionPlan.missingEssentialInformation.length <= 2);
});

test("V21.1 routes middle-school English academy finder to academy playbook", () => {
  const prompt = "인천 서구에서 중학생 영어 내신 학원 찾아줘";
  const output = run(prompt);

  assert.equal(classifyMission(prompt), "education");
  assert.equal(classifyUniversalMission(prompt).providerType, "education");
  assert.equal(output.missionIntelligence.selectedPlaybookId, "education/find-middle-school-english-academy");
  assert.equal(output.resolutionPlan.domain, "education");
  assert.equal(output.resolutionPlan.missionType, "academy-finder");
  assert.doesNotMatch(JSON.stringify(output.resolutionPlan), /flight|hotel|airport/i);
});

test("V21.1 keeps Japan travel routing intact", () => {
  const output = run("일본 여행");

  assert.equal(output.humanReasoning.selectedMission.type, "travel");
  assert.equal(output.missionIntelligence.selectedPlaybookId, "travel/japan-trip");
  assert.equal(output.resolutionPlan.domain, "travel");
  assert.match(JSON.stringify(output.resolutionPlan.providerRequiredActions), /flight booking|hotel booking/i);
});

test("V21.1 healthcare and home-service prompts stay in their own domains", () => {
  const dental = run("이가 아픈데 오늘 갈 수 있는 치과 찾아줘");
  const leak = run("싱크대 누수 수리업체 찾아줘");

  assert.equal(dental.resolutionPlan.domain, "healthcare");
  assert.equal(dental.missionIntelligence.selectedPlaybookId, "healthcare/same-day-tooth-pain");
  assert.equal(leak.resolutionPlan.domain, "home-services");
  assert.equal(leak.missionIntelligence.selectedPlaybookId, "home-services/sink-leak");
});

test("V21.1 unknown help prompt does not silently fall back to travel", () => {
  const output = run("도와줘");

  assert.equal(classifyMission("도와줘"), "general_mission");
  assert.equal(classifyUniversalMission("도와줘").providerType, "general_mission");
  assert.notEqual(output.resolutionPlan.domain, "travel");
  assert.equal(output.missionIntelligence.selectedPlaybookId, null);
});

test("V21.1 results renderer has a domain-aware non-travel path and no missing-result travel fallback", () => {
  const source = fs.readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");

  assert.match(source, /renderResolutionPlanMission/);
  assert.match(source, /isTravelResult/);
  assert.match(source, /createNeutralMissionResult/);
  assert.match(source, /v21Scenario/);
  assert.doesNotMatch(source, /if \(!stored\) return createFallbackTravelResult\(\);/);
});
