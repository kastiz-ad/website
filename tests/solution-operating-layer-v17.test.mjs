import test from "node:test";
import assert from "node:assert/strict";
import { createHOSKernel } from "../js/engine/kernel/hos-kernel-v16.js";
import { buildResolutionPlan } from "../js/engine/solution/solution-operating-layer-v17.js";

function run(mission, extra = {}) {
  return createHOSKernel().run({ mission, language: "ko", ...extra }).resolutionPlan;
}

test("sink leak produces urgent home-service resolution without provider contact", () => {
  const plan = run("싱크대에서 물이 새고 있어", { currentLocation: "Seoul" });
  assert.equal(plan.domain, "home-services");
  assert.equal(plan.urgency, "urgent");
  assert.ok(plan.immediateSafetyActions.some((item) => /valve|Photograph|electronics/i.test(item)));
  assert.ok(plan.providerRequiredActions.includes("provider availability confirmation"));
  assert.equal(plan.providerContactEnabled, false);
  assert.ok(plan.fallbackPlan);
});

test("falling English grades become a resolution path, not only academy list", () => {
  const plan = run("아이가 영어 성적이 계속 떨어져");
  assert.equal(plan.domain, "education");
  assert.match(plan.desiredOutcome, /study support|academy|tutor/i);
  assert.ok(plan.solutionPaths.length >= 3);
  assert.ok(plan.solutionPaths.some((path) => /tutor/i.test(path.title)));
  assert.ok(plan.solutionPaths.some((path) => /study/i.test(path.title)));
  assert.ok(!plan.risks.join(" ").match(/diagnosis/i));
});

test("company formation separates official channels, providers, dependencies and approval", () => {
  const plan = run("한국에서 회사를 만들고 싶어");
  assert.equal(plan.domain, "business");
  assert.ok(plan.providerRequiredActions.some((item) => /official|professional/i.test(item)));
  assert.ok(plan.dependencies.includes("Explicit user approval"));
  assert.ok(plan.approvalRequiredActions.includes("application submission"));
  assert.ok(plan.risks.some((risk) => /legal certainty/i.test(risk)));
  assert.equal(plan.executionEnabled, false);
});

test("tooth pain is healthcare navigation with urgency and no diagnosis", () => {
  const plan = run("이가 너무 아픈데 오늘 치료받고 싶어", { currentLocation: "Incheon" });
  assert.equal(plan.domain, "healthcare");
  assert.equal(plan.urgency, "urgent_or_emergency_check");
  assert.ok(plan.immediateSafetyActions.some((item) => /emergency care/i.test(item)));
  assert.ok(plan.providerRequiredActions.some((item) => /appointment|provider/i.test(item)));
  assert.ok(plan.risks.some((risk) => /does not diagnose/i.test(risk)));
});

test("Japan travel keeps travel preparation path and booking approval boundary", () => {
  const plan = run("다음 달에 일본 여행 가고 싶어");
  assert.equal(plan.domain, "travel");
  assert.ok(plan.solutionPaths.some((path) => /flight|hotel/i.test(path.requiredSteps.join(" "))));
  assert.ok(plan.providerRequiredActions.includes("flight booking"));
  assert.ok(plan.approvalRequiredActions.includes("booking"));
  assert.equal(plan.executionEnabled, false);
});

test("Korea job search prepares career resolution and blocks submissions", () => {
  const plan = run("한국에서 일자리를 찾아야 해");
  assert.equal(plan.domain, "career");
  assert.ok(plan.desiredOutcome.match(/job-search|application|resume/i));
  assert.ok(plan.solutionPaths.some((path) => /Resume|Job platform|Interview/i.test(path.requiredSteps.join(" "))));
  assert.ok(plan.approvalRequiredActions.includes("application submission"));
});

test("kernel exposes V17 resolutionPlan after mission routing and before approval", () => {
  const result = createHOSKernel().run({ mission: "Find a dentist today", language: "en", currentLocation: "Seoul" });
  assert.ok(result.resolutionPlan);
  assert.equal(result.resolutionPlan.currentStatus, "prepared_for_review");
  const stages = result.kernelTrace.filter((event) => event.event === "stage_started").map((event) => event.stage);
  assert.ok(stages.indexOf("solution") > stages.indexOf("mission-routing"));
  assert.ok(stages.indexOf("approval") > stages.indexOf("solution"));
});

test("fallback plan prevents blank generic answers", () => {
  const plan = buildResolutionPlan({ mission: "I need help with something complicated" });
  assert.ok(plan.solutionPaths.length);
  assert.ok(plan.recommendedPath);
  assert.ok(plan.fallbackPlan);
  assert.equal(plan.executionEnabled, false);
});
