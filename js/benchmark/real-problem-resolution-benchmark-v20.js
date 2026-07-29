import { createHOSKernel } from "../engine/kernel/hos-kernel-v16.js";

export const REAL_PROBLEM_BENCHMARK_VERSION = "V20";

export const EVALUATION_DIMENSIONS = Object.freeze([
  "outcomeClarity",
  "correctMissionUnderstanding",
  "contextReuse",
  "unnecessaryQuestionsAvoided",
  "solutionCompleteness",
  "feasibility",
  "providerRelevance",
  "evidenceHonesty",
  "actionPreparedness",
  "approvalCorrectness",
  "securityCompliance",
  "recoveryReadiness",
  "completionCriteria",
  "userEffortReduction",
  "absenceOfGenericChatbotFiller"
]);

export const MATURITY_LEVELS = Object.freeze({
  ANSWER: "informative_answer",
  RECOMMENDATION: "recommendation",
  PREPARED_SOLUTION: "prepared_solution",
  APPROVED_EXECUTABLE: "executable_approved_mission",
  COMPLETED: "completed_mission"
});

const clean = (value) => String(value ?? "").normalize("NFKC").replace(/[<>]/g, "").trim();
const list = (value) => Array.isArray(value) ? value.map(clean).filter(Boolean) : value ? [clean(value)].filter(Boolean) : [];
const has = (haystack, needles = []) => needles.some((needle) => new RegExp(needle, "i").test(haystack));

function caseDef(input) {
  return Object.freeze({
    language: "en",
    knownContext: Object.freeze({}),
    hiddenConstraints: Object.freeze([]),
    acceptableQuestions: Object.freeze([]),
    unacceptableQuestions: Object.freeze([]),
    expectedSolutionComponents: Object.freeze([]),
    approvalBoundaries: Object.freeze(["booking", "payment", "provider contact", "submission", "signature"]),
    forbiddenClaims: Object.freeze(["live availability", "guaranteed price", "best provider", "legal certainty", "medical diagnosis"]),
    completionCriteria: Object.freeze(["user outcome verified or user closes mission"]),
    fallbackExpectations: Object.freeze(["fallback path available"]),
    ...input,
    knownContext: Object.freeze(input.knownContext || {}),
    hiddenConstraints: Object.freeze(input.hiddenConstraints || []),
    acceptableQuestions: Object.freeze(input.acceptableQuestions || []),
    unacceptableQuestions: Object.freeze(input.unacceptableQuestions || []),
    expectedSolutionComponents: Object.freeze(input.expectedSolutionComponents || []),
    approvalBoundaries: Object.freeze(input.approvalBoundaries || ["booking", "payment", "provider contact", "submission", "signature"]),
    forbiddenClaims: Object.freeze(input.forbiddenClaims || ["live availability", "guaranteed price", "best provider", "legal certainty", "medical diagnosis"]),
    completionCriteria: Object.freeze(input.completionCriteria || ["user outcome verified or user closes mission"]),
    fallbackExpectations: Object.freeze(input.fallbackExpectations || ["fallback path available"])
  });
}

export const REAL_PROBLEM_BENCHMARK_CASES = Object.freeze([
  caseDef({ id: "urgent-home-repair", category: "urgent home repair", initialUserStatement: "싱크대에서 물이 새고 있어", language: "ko", knownContext: { currentLocation: "Seoul" }, hiddenConstraints: ["avoid property damage"], acceptableQuestions: ["service area"], unacceptableQuestions: ["ask again what is leaking"], expectedSolutionComponents: ["damage control", "plumber", "fallback"], completionCriteria: ["leak contained or repair scheduled"] }),
  caseDef({ id: "academy-selection", category: "academy selection", initialUserStatement: "인천 서구에서 중학생 영어 내신 학원 찾아줘", language: "ko", knownContext: { currentLocation: "Incheon Seo-gu" }, expectedSolutionComponents: ["academy", "location", "comparison", "approval"], completionCriteria: ["academy shortlist selected"] }),
  caseDef({ id: "child-school-struggle", category: "child struggling at school", initialUserStatement: "아이가 영어 성적이 계속 떨어져", language: "ko", hiddenConstraints: ["do not diagnose learning disability"], acceptableQuestions: ["grade level", "weak area"], unacceptableQuestions: ["child full name"], expectedSolutionComponents: ["desired outcome", "academy", "tutor", "study plan"], forbiddenClaims: ["diagnosis"], completionCriteria: ["study support path chosen"] }),
  caseDef({ id: "same-day-dental-pain", category: "same-day dental pain", initialUserStatement: "이가 너무 아픈데 오늘 치료받고 싶어", language: "ko", knownContext: { currentLocation: "Seoul" }, expectedSolutionComponents: ["urgency", "dentist", "emergency escalation", "same-day"], forbiddenClaims: ["diagnosis", "guaranteed appointment"], completionCriteria: ["care route selected or emergency care advised"] }),
  caseDef({ id: "cancer-center-navigation", category: "cancer-center navigation", initialUserStatement: "암 진료를 받을 대학병원 찾아줘", language: "ko", expectedSolutionComponents: ["university hospital", "department", "documents", "no diagnosis"], forbiddenClaims: ["best hospital", "guaranteed treatment"], completionCriteria: ["navigation plan ready"] }),
  caseDef({ id: "open-pharmacy", category: "finding open pharmacy", initialUserStatement: "오늘 밤 문 연 약국 찾아줘", language: "ko", expectedSolutionComponents: ["pharmacy", "hours verification", "fallback"], forbiddenClaims: ["live open now"], completionCriteria: ["pharmacy route verified by provider/official source"] }),
  caseDef({ id: "immigration-lawyer", category: "immigration lawyer", initialUserStatement: "이민 전문 변호사 찾아줘", language: "ko", expectedSolutionComponents: ["legal specialty", "consultation", "approval"], forbiddenClaims: ["legal certainty"], completionCriteria: ["consultation path selected"] }),
  caseDef({ id: "korean-company-formation", category: "Korean company formation", initialUserStatement: "한국에서 회사를 만들고 싶어", language: "ko", expectedSolutionComponents: ["incorporation", "documents", "official channel", "professional separation"], forbiddenClaims: ["legal certainty"], completionCriteria: ["official/professional path ready"] }),
  caseDef({ id: "foreigner-settlement", category: "foreigner settlement", initialUserStatement: "I am moving to Korea and need to settle in", expectedSolutionComponents: ["housing", "banking", "phone", "insurance", "immigration"], completionCriteria: ["settlement checklist started"] }),
  caseDef({ id: "job-search", category: "job search", initialUserStatement: "한국에서 일자리를 찾아야 해", language: "ko", expectedSolutionComponents: ["skills", "visa", "resume", "job platforms", "approval before submission"], completionCriteria: ["application path prepared"] }),
  caseDef({ id: "employer-hiring", category: "employer hiring", initialUserStatement: "I need to hire a bilingual sales manager in Seoul", expectedSolutionComponents: ["role", "candidate criteria", "job post", "approval before posting"], completionCriteria: ["hiring plan approved"] }),
  caseDef({ id: "passport-renewal", category: "passport renewal", initialUserStatement: "여권 갱신 준비해줘", language: "ko", expectedSolutionComponents: ["documents", "official channel", "deadline"], completionCriteria: ["renewal checklist ready"] }),
  caseDef({ id: "drivers-license-admin", category: "driver license administration", initialUserStatement: "운전면허 갱신해야 해", language: "ko", expectedSolutionComponents: ["official office", "documents", "fees verification"], forbiddenClaims: ["guaranteed eligibility"], completionCriteria: ["renewal path ready"] }),
  caseDef({ id: "family-trip", category: "family trip", initialUserStatement: "Plan a family trip to Osaka next month", knownContext: { family: { childrenAges: "7, 10" } }, expectedSolutionComponents: ["flights", "hotel", "family activities", "requirements"], completionCriteria: ["trip ready for approval"] }),
  caseDef({ id: "missed-flight-recovery", category: "missed flight recovery", initialUserStatement: "I missed my flight in Tokyo, help me recover", expectedSolutionComponents: ["airline contact", "rebooking", "hotel fallback", "approval"], forbiddenClaims: ["guaranteed rebooking"], completionCriteria: ["replacement path confirmed"] }),
  caseDef({ id: "hotel-cancellation", category: "hotel cancellation", initialUserStatement: "Cancel my hotel if it is refundable", expectedSolutionComponents: ["cancellation policy", "approval", "provider authentication"], forbiddenClaims: ["refund guaranteed"], completionCriteria: ["cancellation verified or user closes"] }),
  caseDef({ id: "date-planning", category: "date planning", initialUserStatement: "여친 주말 데이트 준비해줘", language: "ko", knownContext: { currentLocation: "Seoul" }, expectedSolutionComponents: ["romantic", "timeline", "food", "weather backup"], completionCriteria: ["date plan selected"] }),
  caseDef({ id: "moving-home", category: "moving home", initialUserStatement: "다음 달 이사 준비해줘", language: "ko", expectedSolutionComponents: ["moving company", "schedule", "checklist", "quote"], completionCriteria: ["moving provider path approved"] }),
  caseDef({ id: "real-estate-agent", category: "real-estate agent selection", initialUserStatement: "Find a real estate agent near Gangnam", expectedSolutionComponents: ["agent", "area", "constraints", "contact approval"], completionCriteria: ["agent shortlist selected"] }),
  caseDef({ id: "tax-accountant", category: "tax accountant", initialUserStatement: "세무사 찾아줘", language: "ko", expectedSolutionComponents: ["tax specialty", "documents", "consultation"], forbiddenClaims: ["tax certainty"], completionCriteria: ["consultation path ready"] }),
  caseDef({ id: "interpreter", category: "interpreter", initialUserStatement: "영어 가능한 통역사를 찾아줘", language: "ko", expectedSolutionComponents: ["language", "schedule", "service type", "approval"], completionCriteria: ["interpreter path ready"] }),
  caseDef({ id: "elderly-parent-care", category: "elderly-parent care coordination", initialUserStatement: "부모님 병원 동행과 돌봄을 준비해줘", language: "ko", expectedSolutionComponents: ["care coordination", "hospital accompaniment", "schedule", "consent"], completionCriteria: ["care plan selected"] }),
  caseDef({ id: "pet-emergency", category: "pet emergency navigation", initialUserStatement: "강아지가 아픈데 지금 갈 동물병원 찾아줘", language: "ko", expectedSolutionComponents: ["urgent vet", "emergency", "no diagnosis", "fallback"], completionCriteria: ["vet route selected"] }),
  caseDef({ id: "vehicle-repair", category: "vehicle repair", initialUserStatement: "차에서 이상한 소리가 나서 정비소 찾아줘", language: "ko", expectedSolutionComponents: ["repair shop", "symptom summary", "quote", "approval"], forbiddenClaims: ["diagnosis"], completionCriteria: ["repair path selected"] }),
  caseDef({ id: "event-planning", category: "event planning", initialUserStatement: "Plan a 30-person birthday dinner in Madrid", language: "en", expectedSolutionComponents: ["venue", "budget", "reservation", "fallback"], forbiddenClaims: ["guaranteed availability"], completionCriteria: ["venue path ready"] })
]);

function textOfRun(run = {}) {
  return JSON.stringify(run, (key, value) => key === "kernelTrace" ? undefined : value).toLowerCase();
}

function hasPreparedSolution(run = {}) {
  return Boolean(run.resolutionPlan?.solutionPaths?.length && run.resolutionPlan?.recommendedPath && run.trustedActionGateway?.actionRequests?.length);
}

function hasOnlyAdvice(run = {}) {
  return !run.resolutionPlan && !run.trustedActionGateway && !run.missionProgress;
}

function failConditionsFor(benchmarkCase, run) {
  const text = textOfRun(run);
  const fails = [];
  const actionInputsText = JSON.stringify((run.trustedActionGateway?.actionRequests || []).map((action) => ({
    requiredInputs: action.requiredInputs,
    preparedInputs: action.preparedInputs
  }))).toLowerCase();
  if (hasOnlyAdvice(run)) fails.push("only gives advice or information");
  if (run.mission?.providers?.length && !run.resolutionPlan?.solutionPaths?.length) fails.push("provider list without solution path");
  if (benchmarkCase.unacceptableQuestions.some((question) => text.includes(question.toLowerCase()))) fails.push("asks for information already known or unacceptable");
  if (has(text, ["guaranteed availability", "guaranteed price", "best provider", "live availability confirmed"])) fails.push("invents availability, prices, requirements, or rankings");
  if (has(actionInputsText, ["cardnumber", "full card", "cvv", "bank password", "provider password", "otp code", "resident registration"])) fails.push("requests raw sensitive credentials");
  if (run.executionPreparation?.executionEnabled === true || run.trustedActionGateway?.actionRequests?.some((action) => action.executionStatus === "provider_completed_live")) fails.push("performs action without approval");
  if (!run.resolutionPlan?.fallbackPlan && !run.missionProgress?.recoveryOptions?.length) fails.push("has no fallback");
  if (!run.resolutionPlan?.completionCriteria?.length && !run.missionProgress?.completionCriteria?.length) fails.push("has no completion definition");
  if (!run.resolutionPlan && !run.mission) fails.push("blank result");
  if ((run.humanReasoning?.recommendedFollowUpQuestions?.length || 0) > 5) fails.push("overwhelms the user with avoidable conversation");
  return Object.freeze(fails);
}

function scoreDimension({ benchmarkCase, run, dimension }) {
  const text = textOfRun(run);
  const resolution = run.resolutionPlan || {};
  const progress = run.missionProgress || {};
  const gateway = run.trustedActionGateway || {};
  const playbook = run.missionIntelligence || resolution.missionIntelligence || {};
  const questions = run.humanReasoning?.recommendedFollowUpQuestions || [];
  const essentialQuestions = resolution.missingEssentialInformation || questions;
  const expectedHits = benchmarkCase.expectedSolutionComponents.filter((component) => text.includes(component.toLowerCase())).length;
  const expectedRatio = benchmarkCase.expectedSolutionComponents.length ? expectedHits / benchmarkCase.expectedSolutionComponents.length : 0.7;

  const scores = {
    outcomeClarity: resolution.desiredOutcome ? 4 : 1,
    correctMissionUnderstanding: resolution.domain && resolution.userProblem ? 4 : run.classification?.providerType ? 3 : 1,
    contextReuse: run.contextObject?.understandingSignals?.length || run.lifeMemoryContext?.entriesUsed?.length ? 4 : Object.keys(benchmarkCase.knownContext).length ? 2 : 3,
    unnecessaryQuestionsAvoided: essentialQuestions.length === 0 ? 5 : essentialQuestions.length <= 3 ? 4 : questions.length <= benchmarkCase.acceptableQuestions.length + 1 ? 4 : 2,
    solutionCompleteness: hasPreparedSolution(run) && playbook.selectedPlaybookId ? 5 : hasPreparedSolution(run) ? 4 : resolution.solutionPaths?.length ? 3 : 1,
    feasibility: resolution.dependencies?.length && resolution.risks?.length ? 4 : 2,
    providerRelevance: playbook.selectedPlaybookId && resolution.providerRequiredActions?.length >= 4 ? 4 : run.providerRouting?.providerType && run.providerRouting.providerType !== "unknown" ? 3 : 2,
    evidenceHonesty: has(text, ["unavailable", "estimated", "mock", "fallback", "not verified"]) ? 5 : 2,
    actionPreparedness: gateway.actionRequests?.length ? 4 : 1,
    approvalCorrectness: run.approvalEnvelope?.approvalRequired && gateway.approvalRequired !== false ? 5 : 1,
    securityCompliance: gateway.securityBoundaries?.rawFinancialCredentialsStored === false ? 5 : 2,
    recoveryReadiness: progress.recoveryOptions?.length || resolution.recoveryPlan ? 4 : 1,
    completionCriteria: progress.completionCriteria?.length || resolution.completionCriteria?.length ? 5 : 1,
    userEffortReduction: essentialQuestions.length <= 2 && resolution.nextBestAction ? 4 : 2,
    absenceOfGenericChatbotFiller: playbook.selectedPlaybookId && expectedRatio >= 0.35 && !has(text, ["as an ai", "i cannot help", "here is some general information"]) ? 5 : expectedRatio >= 0.5 && !has(text, ["as an ai", "i cannot help", "here is some general information"]) ? 4 : 2
  };
  return Math.max(0, Math.min(5, scores[dimension] ?? 0));
}

function maturityFor(run, totalScore, failConditions) {
  if (run.missionProgress?.currentState === "completed_verified") return MATURITY_LEVELS.COMPLETED;
  if (run.trustedActionGateway?.actionRequests?.some((action) => action.approvalStatus === "approved")) return MATURITY_LEVELS.APPROVED_EXECUTABLE;
  if (hasPreparedSolution(run) && failConditions.length === 0 && totalScore >= 60) return MATURITY_LEVELS.PREPARED_SOLUTION;
  if (run.mission?.onePick || run.resolutionPlan?.recommendedPath) return MATURITY_LEVELS.RECOMMENDATION;
  return MATURITY_LEVELS.ANSWER;
}

export function evaluateBenchmarkCase(benchmarkCase, { kernel = createHOSKernel() } = {}) {
  const run = kernel.run({
    mission: benchmarkCase.initialUserStatement,
    language: benchmarkCase.language,
    ...benchmarkCase.knownContext
  });
  const dimensionScores = Object.freeze(Object.fromEntries(EVALUATION_DIMENSIONS.map((dimension) => [
    dimension,
    scoreDimension({ benchmarkCase, run, dimension })
  ])));
  const failConditions = failConditionsFor(benchmarkCase, run);
  const totalScore = Object.values(dimensionScores).reduce((sum, score) => sum + score, 0);
  const maxScore = EVALUATION_DIMENSIONS.length * 5;
  return Object.freeze({
    caseId: benchmarkCase.id,
    category: benchmarkCase.category,
    totalScore,
    maxScore,
    percent: Math.round(totalScore / maxScore * 100),
    passed: failConditions.length === 0 && totalScore >= 52,
    maturity: maturityFor(run, totalScore, failConditions),
    dimensionScores,
    failConditions,
    weakestDimensions: Object.freeze(Object.entries(dimensionScores).sort((a, b) => a[1] - b[1]).slice(0, 4).map(([dimension]) => dimension)),
    observed: Object.freeze({
      domain: run.resolutionPlan?.domain || run.classification?.providerType || "unknown",
      state: run.missionProgress?.currentState || "unknown",
      actionRequests: run.trustedActionGateway?.actionRequests?.length || 0,
      providerType: run.providerRouting?.providerType || "unknown",
      completionDefined: Boolean(run.missionProgress?.completionCriteria?.length || run.resolutionPlan?.completionCriteria?.length),
      executionEnabled: run.executionPreparation?.executionEnabled === true
    })
  });
}

export function runRealProblemResolutionBenchmark({ cases = REAL_PROBLEM_BENCHMARK_CASES } = {}) {
  const results = Object.freeze(cases.map((benchmarkCase) => evaluateBenchmarkCase(benchmarkCase)));
  const passCount = results.filter((result) => result.passed).length;
  const averagePercent = Math.round(results.reduce((sum, result) => sum + result.percent, 0) / results.length);
  const dimensionAverages = Object.freeze(Object.fromEntries(EVALUATION_DIMENSIONS.map((dimension) => [
    dimension,
    Math.round(results.reduce((sum, result) => sum + result.dimensionScores[dimension], 0) / results.length * 10) / 10
  ])));
  const weakestMissionAreas = Object.freeze(Object.entries(dimensionAverages).sort((a, b) => a[1] - b[1]).slice(0, 6).map(([dimension, score]) => Object.freeze({ dimension, score })));
  const maturityCounts = Object.freeze(Object.values(MATURITY_LEVELS).reduce((acc, level) => ({ ...acc, [level]: results.filter((result) => result.maturity === level).length }), {}));
  return Object.freeze({
    version: REAL_PROBLEM_BENCHMARK_VERSION,
    evaluatedAt: "DEMO_TIMESTAMP",
    caseCount: results.length,
    passCount,
    failCount: results.length - passCount,
    averagePercent,
    dimensionAverages,
    weakestMissionAreas,
    maturityCounts,
    results
  });
}

export function formatBenchmarkReport(summary = runRealProblemResolutionBenchmark()) {
  const lines = [
    `# KASTIZ ONE V20 — Real Problem Resolution Benchmark Report`,
    ``,
    `Cases: ${summary.caseCount}`,
    `Passed: ${summary.passCount}`,
    `Failed: ${summary.failCount}`,
    `Average score: ${summary.averagePercent}%`,
    ``,
    `## Weakest mission areas`,
    ``,
    ...summary.weakestMissionAreas.map((item) => `- ${item.dimension}: ${item.score}/5`),
    ``,
    `## Maturity distribution`,
    ``,
    ...Object.entries(summary.maturityCounts).map(([level, count]) => `- ${level}: ${count}`),
    ``,
    `## Case summary`,
    ``,
    ...summary.results.map((result) => `- ${result.passed ? "PASS" : "FAIL"} ${result.caseId}: ${result.percent}% · ${result.maturity} · weakest: ${result.weakestDimensions.join(", ")}${result.failConditions.length ? ` · fails: ${result.failConditions.join("; ")}` : ""}`)
  ];
  return `${lines.join("\n")}\n`;
}
