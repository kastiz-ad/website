import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHumanReasoningObject,
  HUMAN_REASONING_PIPELINE_SLOT,
  inferMissionHypotheses,
  normalizeReasoningLanguage
} from "../js/engine/human-reasoning/human-reasoning-engine.js";
import { buildUniversalMission, classifyUniversalMission, PIPELINE } from "../js/engine/universal-mission-engine-v4.js";

test("V12 inserts Human Reasoning Engine between classifier and mission engine context", () => {
  const mission = buildUniversalMission({ mission: "싱크대 누수 수리업체 찾아줘", language: "ko" });

  assert.equal(PIPELINE[0], "mission");
  assert.equal(PIPELINE[1], "classifier");
  assert.equal(PIPELINE[2], HUMAN_REASONING_PIPELINE_SLOT);
  assert.equal(mission.pipeline[2], "human-reasoning");
  assert.equal(mission.humanReasoning.version, "V12");
  assert.equal(mission.humanReasoning.selectedMission.type, "home_services");
  assert.equal(mission.humanReasoning.approvalRequired, true);
  assert.equal(mission.humanReasoning.executionEnabled, false);
});

test("V12 detects ambiguous intent before mission generation", () => {
  const reasoning = buildHumanReasoningObject({
    mission: "help me",
    classification: { mission: "help me", providerType: "professional-service", confidence: "unknown" },
    language: "en"
  });

  assert.equal(reasoning.ambiguityDetected, true);
  assert.ok(reasoning.confidence < 0.5);
  assert.ok(reasoning.recommendedFollowUpQuestions.length > 0);
});

test("V12 detects missing high-value information without over-asking", () => {
  const reasoning = buildHumanReasoningObject({
    mission: "Find a dentist",
    classification: { mission: "Find a dentist", providerType: "healthcare", confidence: "rule-supported" },
    language: "en"
  });

  assert.deepEqual(reasoning.missingInformation, ["location", "urgency"]);
  assert.deepEqual(reasoning.recommendedFollowUpQuestions.map((item) => item.field), ["location", "urgency"]);
});

test("V12 eliminates unnecessary questions when confidence is high", () => {
  const classification = classifyUniversalMission("Find an English academy near Incheon this week");
  const reasoning = buildHumanReasoningObject({
    mission: "Find an English academy near Incheon this week",
    classification,
    language: "en",
    location: "Incheon",
    date: "this week"
  });

  assert.ok(reasoning.confidence >= 0.85);
  assert.deepEqual(reasoning.missingInformation, []);
  assert.deepEqual(reasoning.recommendedFollowUpQuestions, []);
  assert.equal(reasoning.selectedMission.type, "education");
});

test("V12 keeps low confidence missions in question mode", () => {
  const reasoning = buildHumanReasoningObject({
    mission: "something better",
    classification: { mission: "something better", providerType: "professional-service", confidence: "unknown" },
    language: "en"
  });

  assert.ok(reasoning.confidence < 0.5);
  assert.ok(reasoning.missingInformation.length >= 2);
  assert.ok(reasoning.recommendedFollowUpQuestions.length >= 1);
});

test("V12 generates hypotheses for multiple possible missions", () => {
  const hypotheses = inferMissionHypotheses({
    mission: "한국에서 외국인이 회사 시작하고 비자도 준비해줘",
    classification: {
      mission: "한국에서 외국인이 회사 시작하고 비자도 준비해줘",
      providerType: "foreigner_korea",
      confidence: "config-supported",
      candidates: [
        { id: "foreigner_korea", score: 24 },
        { id: "government", score: 20 },
        { id: "professionals", score: 14 }
      ]
    }
  });

  assert.ok(hypotheses.length >= 2);
  assert.equal(hypotheses[0].type, "foreigner_korea");
  assert.ok(hypotheses.some((item) => item.type === "government"));
});

test("V12 maintains multilingual support for Korean and Spanish", () => {
  assert.equal(normalizeReasoningLanguage(undefined, "치과 찾아줘"), "ko");
  assert.equal(normalizeReasoningLanguage(undefined, "Necesito un dentista hoy cerca de Gangnam"), "es");

  const ko = buildHumanReasoningObject({
    mission: "오늘 강남 치과 찾아줘",
    classification: { mission: "오늘 강남 치과 찾아줘", providerType: "healthcare", confidence: "rule-supported" },
    language: "ko"
  });
  const es = buildHumanReasoningObject({
    mission: "Necesito una academia de inglés en Seúl esta semana",
    classification: { mission: "Necesito una academia de inglés en Seúl esta semana", providerType: "education", confidence: "rule-supported" },
    language: "es"
  });

  assert.match(ko.reasoningSummary, /미션/);
  assert.match(es.reasoningSummary, /Misión/);
  assert.equal(ko.selectedMission.label, "의료");
  assert.equal(es.selectedMission.label, "Educación");
});

test("V12 never enables execution or provider action", () => {
  const reasoning = buildHumanReasoningObject({
    mission: "Book a flight to New York tomorrow",
    classification: { mission: "Book a flight to New York tomorrow", providerType: "travel", confidence: "rule-supported" },
    language: "en"
  });

  assert.equal(reasoning.approvalRequired, true);
  assert.equal(reasoning.executionEnabled, false);
  assert.doesNotMatch(JSON.stringify(reasoning), /paymentConfirmed|providerContacted|reservationMade/i);
});
