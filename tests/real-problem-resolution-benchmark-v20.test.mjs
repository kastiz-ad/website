import test from "node:test";
import assert from "node:assert/strict";
import {
  EVALUATION_DIMENSIONS,
  MATURITY_LEVELS,
  REAL_PROBLEM_BENCHMARK_CASES,
  evaluateBenchmarkCase,
  formatBenchmarkReport,
  runRealProblemResolutionBenchmark
} from "../js/benchmark/real-problem-resolution-benchmark-v20.js";

test("V20 benchmark defines at least 25 real-world scenarios with required metadata", () => {
  assert.ok(REAL_PROBLEM_BENCHMARK_CASES.length >= 25);
  for (const scenario of REAL_PROBLEM_BENCHMARK_CASES) {
    assert.ok(scenario.id);
    assert.ok(scenario.initialUserStatement);
    assert.ok(Array.isArray(scenario.expectedSolutionComponents));
    assert.ok(Array.isArray(scenario.approvalBoundaries));
    assert.ok(Array.isArray(scenario.forbiddenClaims));
    assert.ok(Array.isArray(scenario.completionCriteria));
    assert.ok(Array.isArray(scenario.fallbackExpectations));
  }
});

test("V20 scorer covers all fifteen evaluation dimensions", () => {
  assert.equal(EVALUATION_DIMENSIONS.length, 15);
  const result = evaluateBenchmarkCase(REAL_PROBLEM_BENCHMARK_CASES[0]);
  assert.deepEqual(Object.keys(result.dimensionScores), [...EVALUATION_DIMENSIONS]);
  assert.ok(result.totalScore <= result.maxScore);
});

test("V20 distinguishes maturity levels rather than treating all output as complete", () => {
  const summary = runRealProblemResolutionBenchmark();
  assert.equal(summary.caseCount, REAL_PROBLEM_BENCHMARK_CASES.length);
  assert.ok(summary.maturityCounts[MATURITY_LEVELS.PREPARED_SOLUTION] > 0);
  assert.equal(summary.maturityCounts[MATURITY_LEVELS.COMPLETED], 0);
});

test("V20 exposes honest weak areas instead of only pass/fail", () => {
  const summary = runRealProblemResolutionBenchmark();
  assert.ok(summary.weakestMissionAreas.length >= 3);
  assert.ok(summary.results.every((result) => result.weakestDimensions.length));
  assert.ok(summary.averagePercent > 0 && summary.averagePercent <= 100);
});

test("V20 fail conditions catch advice-only and unsafe fake systems", () => {
  const fakeKernel = {
    run() {
      return {
        executionPreparation: { executionEnabled: true },
        mission: { providers: [{ name: "Provider" }] }
      };
    }
  };
  const result = evaluateBenchmarkCase(REAL_PROBLEM_BENCHMARK_CASES[0], { kernel: fakeKernel });
  assert.equal(result.passed, false);
  assert.ok(result.failConditions.includes("provider list without solution path"));
  assert.ok(result.failConditions.includes("performs action without approval"));
});

test("V20 report is human-readable and includes pass/fail summary", () => {
  const report = formatBenchmarkReport(runRealProblemResolutionBenchmark());
  assert.match(report, /Real Problem Resolution Benchmark Report/);
  assert.match(report, /Passed:/);
  assert.match(report, /Weakest mission areas/);
  assert.match(report, /Case summary/);
});
