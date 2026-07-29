import test from "node:test";
import assert from "node:assert/strict";
import { createHOSKernel } from "../js/engine/kernel/hos-kernel-v16.js";
import { loadMissionIntelligencePlaybooks } from "../js/mission-intelligence/mission-intelligence-loader-v21.js";
import { createMissionIntelligenceRegistry, filterEssentialQuestions } from "../js/mission-intelligence/mission-intelligence-registry-v21.js";
import { validateMissionPlaybook, validateMissionPlaybookCollection } from "../js/mission-intelligence/mission-intelligence-validator-v21.js";
import { runRealProblemResolutionBenchmark } from "../js/benchmark/real-problem-resolution-benchmark-v20.js";

test("V21 loads twelve valid initial mission playbooks", () => {
  const playbooks = loadMissionIntelligencePlaybooks();
  assert.equal(playbooks.length, 12);
  const validation = validateMissionPlaybookCollection(playbooks);
  assert.equal(validation.valid, true);
});

test("V21 rejects malformed and unsafe playbooks", () => {
  const invalid = validateMissionPlaybook({
    playbookId: "bad",
    version: "V21",
    domain: "payments",
    missionType: "unsafe",
    essentialQuestions: ["What is your full card number?", "CVV?"]
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.includes("missing_completion_criteria"));
  assert.ok(invalid.errors.includes("unsafe_credential_request"));
});

test("V21 rejects duplicate playbook IDs", () => {
  const [one] = loadMissionIntelligencePlaybooks();
  const validation = validateMissionPlaybookCollection([one, one]);
  assert.equal(validation.valid, false);
  assert.deepEqual(validation.duplicateIds, [one.playbookId]);
});

test("V21 selects correct playbooks for core Korean missions", () => {
  const registry = createMissionIntelligenceRegistry();
  assert.equal(registry.select({ mission: "싱크대에서 물이 새고 있어", classification: { providerType: "home-services" }, language: "ko" }).selectedPlaybookId, "home-services/sink-leak");
  assert.equal(registry.select({ mission: "이가 너무 아픈데 오늘 치료받고 싶어", classification: { providerType: "healthcare" }, language: "ko" }).selectedPlaybookId, "healthcare/same-day-tooth-pain");
  assert.equal(registry.select({ mission: "다음 달에 일본 여행 가고 싶어", classification: { providerType: "travel" }, language: "ko" }).selectedPlaybookId, "travel/japan-trip");
});

test("V21 reports ambiguity when playbooks have similar fit", () => {
  const registry = createMissionIntelligenceRegistry();
  const selection = registry.select({ mission: "영어 학원 성적", classification: { providerType: "education" }, language: "ko" });
  assert.equal(selection.ambiguous, true);
  assert.ok(selection.compatiblePlaybooks.length > 1);
});

test("V21 handles regional compatibility and multilingual matching", () => {
  const registry = createMissionIntelligenceRegistry();
  const spanish = registry.select({ mission: "viaje a japón", classification: { providerType: "travel" }, language: "es" });
  assert.equal(spanish.selectedPlaybookId, "travel/japan-trip");
  assert.ok(spanish.reasons.includes("language supported"));
});

test("V21 filters essential questions using known context", () => {
  const playbook = loadMissionIntelligencePlaybooks().find((item) => item.playbookId === "home-services/sink-leak");
  const questions = filterEssentialQuestions(playbook, { knownContext: { severity: "urgent", serviceArea: "Seoul" } });
  assert.ok(questions.length <= 3);
});

test("V21 enriches ResolutionPlan through HOS without replacing architecture", () => {
  const result = createHOSKernel().run({ mission: "아이가 영어 성적이 계속 떨어져", language: "ko" });
  assert.equal(result.missionIntelligence.selectedPlaybookId, "education/child-english-performance-decline");
  assert.equal(result.resolutionPlan.missionIntelligence.selectedPlaybookId, "education/child-english-performance-decline");
  assert.ok(result.resolutionPlan.solutionPaths.length >= 3);
  assert.ok(result.resolutionPlan.approvalRequiredActions.includes("payment"));
  assert.equal(result.executionPreparation.executionEnabled, false);
});

test("V21 preserves provider capability filtering and evidence labels", () => {
  const result = createHOSKernel().run({ mission: "오늘 밤 문 연 약국 찾아줘", language: "ko", currentLocation: "Seoul" });
  assert.equal(result.missionIntelligence.selectedPlaybookId, "healthcare/open-pharmacy");
  assert.ok(result.resolutionPlan.providerRequiredActions.includes("verified opening hours"));
  assert.ok(result.resolutionPlan.evidence.some((item) => item.state === "playbook-required"));
});

test("V21 preserves fallback, completion criteria, approval, and no unsafe credentials", () => {
  const result = createHOSKernel().run({ mission: "한국에서 외국인이 회사를 시작하려면 준비해 줘", language: "ko" });
  assert.ok(result.resolutionPlan.fallbackPlan);
  assert.ok(result.resolutionPlan.completionCriteria.length);
  assert.ok(result.trustedActionGateway.actionRequests.length);
  const text = JSON.stringify(result.trustedActionGateway.actionRequests).toLowerCase();
  assert.ok(!/full card|cvv|bank password|otp/.test(text));
});

test("V21 benchmark comparison keeps V20 honest while adding playbook signals", () => {
  const summary = runRealProblemResolutionBenchmark();
  assert.equal(summary.caseCount, 25);
  assert.ok(summary.averagePercent >= 81);
  assert.ok(summary.maturityCounts.prepared_solution >= 17);
  assert.equal(summary.maturityCounts.completed_mission, 0);
});
