import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  ALPHA14_EXPLAINABLE_INTELLIGENCE_VERSION,
  EXPLANATION_DETAIL_LEVELS,
  EXPLANATION_TYPES,
  createExplanationLayer,
  recordMissionExplanationChange,
  setExplanationDetailLevel,
  validateExplanationLayer
} from "../js/engine/explanations/explainable-intelligence-alpha14.js";

const baseResult = {
  missionId: "alpha14-demo",
  rawInput: "Plan a Tokyo trip",
  type: "travel",
  destination: { city: "Tokyo", country: "Japan" },
  missionContext: { missionType: "travel", purpose: { value: "family trip" } },
  alpha06PredictiveIntelligence: {
    predictions: [
      {
        id: "passport",
        title: "Passport validity check",
        reason: "International travel can depend on passport validity."
      }
    ]
  },
  alpha09ProviderTrust: {
    topProviders: [
      {
        providerName: "Korean Air",
        category: "flight",
        badge: "known_provider",
        explanation: "This provider fits the route and has visible reliability signals."
      }
    ],
    warnings: ["Live availability must be checked before approval."]
  },
  alpha11MissionMonitoring: {
    notifications: [
      {
        eventId: "hotel-date-change",
        whatChanged: "Hotels updated because travel dates changed.",
        priority: "high"
      }
    ]
  }
};

test("ALPHA-14 creates concise explanations from existing visible outputs", () => {
  const layer = createExplanationLayer({ result: baseResult, language: "en" });
  assert.equal(layer.version, ALPHA14_EXPLAINABLE_INTELLIGENCE_VERSION);
  assert.equal(layer.mode, "outcome_explanations_not_internal_reasoning");
  assert.ok(layer.explanations.length >= 5);
  assert.ok(layer.explanations.some((explanation) => explanation.type === EXPLANATION_TYPES.MISSION_RECOMMENDATION));
  assert.ok(layer.explanations.some((explanation) => explanation.type === EXPLANATION_TYPES.PREDICTION));
  assert.ok(layer.explanations.some((explanation) => explanation.type === EXPLANATION_TYPES.PROVIDER_RECOMMENDATION));
  assert.ok(layer.explanations.some((explanation) => explanation.type === EXPLANATION_TYPES.MISSION_UPDATE));
  assert.ok(layer.explanations.some((explanation) => explanation.type === EXPLANATION_TYPES.APPROVAL_REQUEST));
  assert.ok(validateExplanationLayer(layer).ok);
});

test("ALPHA-14 never exposes chain-of-thought or internal implementation language", () => {
  const layer = createExplanationLayer({
    result: {
      ...baseResult,
      alpha09ProviderTrust: {
        topProviders: [
          {
            providerName: "Unsafe wording",
            explanation: "Internal prompt and chain-of-thought say choose this."
          }
        ]
      }
    },
    language: "en"
  });
  const text = layer.explanations.map((explanation) => explanation.answer).join(" ").toLowerCase();
  assert.doesNotMatch(text, /chain-of-thought|internal prompt|agent discussion|model internals/);
  assert.equal(validateExplanationLayer(layer).ok, true);
});

test("ALPHA-14 supports user detail controls without revealing internals", () => {
  const state = setExplanationDetailLevel({}, EXPLANATION_DETAIL_LEVELS.DETAILED);
  const layer = createExplanationLayer({ result: baseResult, detailLevel: state.detailLevel, language: "en" });
  assert.equal(layer.detailLevel, EXPLANATION_DETAIL_LEVELS.DETAILED);
  assert.ok(layer.userControls.minimal);
  assert.ok(layer.userControls.standard);
  assert.ok(layer.userControls.detailed);
  assert.equal(layer.exposesInternalReasoning, false);
});

test("ALPHA-14 explanations update with mission change history", () => {
  const history = recordMissionExplanationChange([], {
    explanation: "Hotels updated because travel dates changed.",
    type: EXPLANATION_TYPES.MISSION_CHANGE,
    at: "2026-07-29T00:00:00.000Z"
  });
  const layer = createExplanationLayer({ result: baseResult, history, language: "en" });
  assert.equal(layer.missionHistory.length, 1);
  assert.match(layer.missionHistory[0].explanation, /travel dates changed/);
});

test("ALPHA-14 localizes explanation questions in Korean and Spanish", () => {
  const ko = createExplanationLayer({ result: baseResult, language: "ko" });
  const es = createExplanationLayer({ result: baseResult, language: "es" });
  assert.ok(ko.explanations.some((explanation) => explanation.question.includes("왜")));
  assert.ok(es.explanations.some((explanation) => explanation.question.includes("¿")));
});

test("ALPHA-14 validation catches malformed or verbose unsafe layers", () => {
  const validation = validateExplanationLayer({
    version: "wrong",
    mode: "chain_of_thought",
    exposesInternalReasoning: true,
    explanations: [
      {
        question: "Why?",
        answer: "Sentence one. Sentence two. Sentence three. Sentence four."
      }
    ]
  });
  assert.equal(validation.ok, false);
  assert.ok(validation.failures.includes("wrong_version"));
  assert.ok(validation.failures.includes("wrong_mode"));
  assert.ok(validation.failures.includes("internal_reasoning_exposed"));
  assert.ok(validation.failures.includes("detail_controls_missing"));
  assert.ok(validation.failures.includes("too_verbose"));
});

test("ALPHA-14 is wired into result page and cache key", () => {
  const page = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  const entry = readFileSync(new URL("../results.js", import.meta.url), "utf8");

  assert.match(page, /createExplanationLayer/);
  assert.match(page, /attachExplainableIntelligenceLayer\(currentResult\)/);
  assert.match(page, /data-card-id="explainable-intelligence"/);
  assert.match(html, /20260729-alpha14-explainable-intelligence/);
  assert.match(entry, /20260729-alpha14-explainable-intelligence/);
});

test("ALPHA-14 demo result shell has no mojibake and refreshes stale demo links", () => {
  const html = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /Ã|Â|â/);
  assert.match(html, /Kastiz ONE — Mission Ready/);
  assert.match(html, /Prototype · approval protected · no external action/);
  assert.match(html, /Anything you’d like ONE to change or add\?/);
  assert.match(html, /funding-demo-final\.website-42u\.pages\.dev/);
});
