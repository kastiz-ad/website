import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ALPHA08_MULTI_AGENT_COLLABORATION_VERSION,
  createMissionDirectorBrief,
  createSpecialistRegistry,
  mergeSpecialistOutputs,
  resolveSpecialistConflicts,
  selectSpecialistsForMission,
  validateMissionDirectorBrief
} from "../js/engine/agents/mission-director-alpha08.js";

const travelMission = {
  id: "ONE-DEMO-ALPHA08",
  type: "travel",
  rawInput: "I want to take my parents to Sapporo for five days.",
  destination: { city: "Sapporo", country: "Japan" },
  schedule: { startDate: "2026-08-10", endDate: "2026-08-14" },
  flights: [{ provider: "Korean Air" }, { provider: "Japan Airlines" }],
  hotels: [{ name: "JR Tower Hotel Nikko Sapporo" }, { name: "Sapporo Grand Hotel" }],
  restaurants: [{ name: "Soup Curry GARAKU" }, { name: "Sapporo Beer Garden" }],
  budget: { estimatedTotal: { min: 2400000, max: 5100000, currency: "KRW" } },
  worldIntelligence: { models: { destination: [{ sourceState: "cached_public" }] } }
};

test("ALPHA-08 selects the right specialists for a complex travel mission", () => {
  const selection = selectSpecialistsForMission({ result: travelMission, language: "en" });
  for (const id of ["travel", "flights", "hotels", "restaurants", "logistics", "visa", "insurance", "finance", "translation"]) {
    assert.ok(selection.selected.includes(id), `${id} should participate`);
  }
  assert.ok(selection.skipped.includes("healthcare"));
  assert.equal(selection.domain, "travel");
});

test("Mission Director creates one unified response and hides internal agents from users", () => {
  const brief = createMissionDirectorBrief({
    result: travelMission,
    language: "en",
    worldIntelligence: travelMission.worldIntelligence,
    personalMissionMemory: {
      applied: [{ category: "travel", key: "walkingTolerance", value: "short walks", confidence: 0.9 }]
    },
    predictiveIntelligence: {
      visible: [
        { id: "p1", title: "Check documents", reason: "International travel", confidence: 0.91 },
        { id: "p2", title: "Weather backup", reason: "Sapporo weather", confidence: 0.81 },
        { id: "p3", title: "Hotel refresh", reason: "Availability changes", confidence: 0.77 },
        { id: "p4", title: "Currency", reason: "JPY spend", confidence: 0.74 }
      ]
    }
  });

  const validation = validateMissionDirectorBrief(brief);
  assert.equal(brief.version, ALPHA08_MULTI_AGENT_COLLABORATION_VERSION);
  assert.equal(validation.ok, true);
  assert.equal(validation.visibleAgentCount, 0);
  assert.equal(brief.userFacingMode, "single-one-response");
  assert.equal(brief.safety.specialistsCanExecute, false);
  assert.equal(brief.safety.usesUnifiedPersonalMissionMemory, true);
  assert.equal(brief.unifiedResponse.predictions.length, 3);
  assert.ok(brief.unifiedResponse.recommendations.length >= 6);
});

test("Mission Director supports business, healthcare, study abroad, relocation, and family vacation previews", () => {
  const scenarios = [
    {
      result: { type: "business", rawInput: "Help me start a company in Korea", destination: { city: "Seoul", country: "South Korea" } },
      expected: ["business", "legal", "finance", "logistics", "translation"]
    },
    {
      result: { type: "healthcare", rawInput: "Find a dentist open today near me", destination: { city: "Incheon", country: "South Korea" } },
      expected: ["healthcare", "logistics", "translation"]
    },
    {
      result: { type: "education", rawInput: "Study abroad in Canada", destination: { country: "Canada" } },
      expected: ["education", "logistics", "translation"]
    },
    {
      result: { type: "relocation", rawInput: "Move to Korea with my family", destination: { country: "South Korea" } },
      expected: ["travel", "visa", "insurance", "logistics", "translation"]
    },
    {
      result: { type: "travel", rawInput: "family vacation to Singapore", destination: { city: "Singapore", country: "Singapore" }, hotels: [{}], restaurants: [{}] },
      expected: ["travel", "hotels", "restaurants", "logistics", "finance"]
    }
  ];

  for (const scenario of scenarios) {
    const brief = createMissionDirectorBrief({ result: scenario.result, language: "en" });
    for (const id of scenario.expected) assert.ok(brief.specialistSelection.selected.includes(id), `${id} should be selected`);
    assert.equal(validateMissionDirectorBrief(brief).ok, true);
  }
});

test("Conflict resolution keeps the strongest supported output without exposing disagreement", () => {
  const weaker = {
    specialistId: "travel",
    subproblem: "hotel",
    recommendation: "Stay far from transit.",
    confidence: 0.55,
    evidence: ["estimated"],
    status: "prepared"
  };
  const stronger = {
    specialistId: "hotels",
    subproblem: "hotel",
    recommendation: "Stay near Sapporo Station for parents and winter mobility.",
    confidence: 0.89,
    evidence: ["World Intelligence", "personal memory"],
    status: "prepared"
  };

  const resolved = resolveSpecialistConflicts([weaker, stronger], {
    worldIntelligence: {},
    personalMissionMemory: { applied: [{}] }
  });
  assert.equal(resolved.winners.length, 1);
  assert.equal(resolved.winners[0].specialistId, "hotels");
  assert.equal(resolved.conflicts[0].exposedToUser, false);
});

test("Merge removes duplicate recommendations", () => {
  const outputs = [
    { specialistId: "travel", subproblem: "budget", recommendation: "Refresh prices before approval.", confidence: 0.8, evidence: ["estimated"], status: "prepared" },
    { specialistId: "finance", subproblem: "budget", recommendation: "Refresh prices before approval.", confidence: 0.82, evidence: ["approval"], status: "prepared" }
  ];
  const merged = mergeSpecialistOutputs(outputs);
  assert.equal(merged.unifiedRecommendations.length, 1);
  assert.equal(merged.duplicateRecommendationsRemoved, 1);
});

test("Graceful degradation continues when a specialist fails", () => {
  const brief = createMissionDirectorBrief({
    result: travelMission,
    language: "en",
    failedSpecialists: ["restaurants"]
  });
  assert.equal(brief.gracefulDegradation.active, true);
  assert.ok(brief.gracefulDegradation.failedSpecialists.includes("restaurants"));
  assert.equal(brief.gracefulDegradation.missionCanContinue, true);
  assert.equal(validateMissionDirectorBrief(brief).ok, true);
});

test("Registry scales by running selected specialists and skipping the rest", () => {
  const registry = createSpecialistRegistry({
    specialists: Array.from({ length: 40 }, (_, index) => ({
      id: `future-${index}`,
      label: `Future ${index}`,
      domains: ["future"],
      triggers: [],
      owns: ["future"],
      run() {
        throw new Error("future specialist should not run");
      }
    }))
  });
  const brief = createMissionDirectorBrief({ result: travelMission, language: "en", registry });
  assert.ok(brief.observability.skippedSpecialists.length >= 40);
  assert.ok(brief.observability.durationMs > 0);
  assert.equal(validateMissionDirectorBrief(brief).ok, true);
});

test("Results page wires ALPHA-08 as internal metadata only", () => {
  const resultsPage = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const resultsHtml = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  const resultsEntry = readFileSync(new URL("../results.js", import.meta.url), "utf8");

  assert.match(resultsPage, /createMissionDirectorBrief/);
  assert.match(resultsPage, /alpha08VisibleAgents/);
  assert.doesNotMatch(resultsPage, /alpha08-agent-card/);
  assert.match(resultsHtml, /20260729-map-drag-cleanup/);
  assert.match(resultsEntry, /20260729-map-drag-cleanup/);
});
