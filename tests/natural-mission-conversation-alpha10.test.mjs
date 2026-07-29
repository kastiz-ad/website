import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ALPHA10_NATURAL_MISSION_CONVERSATION_VERSION,
  MAX_ALPHA10_VISIBLE_QUESTIONS,
  applyConversationCorrection,
  buildConversationUnderstandingLayer,
  buildNaturalFollowUpQuestions,
  extractConversationUnderstanding,
  validateConversationUnderstandingLayer
} from "../js/engine/conversation/natural-mission-conversation-alpha10.js";

test("ALPHA-10 extracts mission facts from natural travel conversation", () => {
  const understanding = extractConversationUnderstanding({
    messages: ["I'd like to take my parents to Japan this October. We don't like walking too much and we'd love good seafood."],
    result: { destination: { city: "Tokyo", country: "Japan" } },
    language: "en"
  });
  assert.equal(understanding.version, ALPHA10_NATURAL_MISSION_CONVERSATION_VERSION);
  assert.match(understanding.missionIntent, /travel/i);
  assert.ok(understanding.locations.join(" ").includes("Tokyo"));
  assert.ok(understanding.dates.some((date) => /October/.test(date)));
  assert.ok(understanding.people.some((person) => /parents/.test(person)));
  assert.ok(understanding.preferences.some((preference) => /seafood/.test(preference)));
  assert.ok(understanding.preferences.some((preference) => /walking/.test(preference)));
});

test("ALPHA-10 supports Korean and Spanish natural language extraction", () => {
  const korean = extractConversationUnderstanding({
    messages: ["부모님과 10월에 일본 여행 가고 싶어요. 해산물은 좋아하고 많이 걷는 건 싫어요."],
    result: { destination: { cityKo: "도쿄", countryKo: "일본" } },
    language: "ko"
  });
  const spanish = extractConversationUnderstanding({
    messages: ["Quiero un viaje a Lima en noviembre con mi familia y comida de mar."],
    result: { destination: { city: "Lima", country: "Peru" } },
    language: "es"
  });
  assert.equal(korean.language, "ko");
  assert.ok(korean.people.includes("부모님"));
  assert.ok(korean.preferences.some((preference) => /해산물|걷/.test(preference)));
  assert.equal(spanish.language, "es");
  assert.ok(spanish.dates.some((date) => /noviembre/.test(date)));
  assert.ok(spanish.people.includes("familia"));
});

test("ALPHA-10 asks at most two natural questions and no duplicate questions", () => {
  const understanding = extractConversationUnderstanding({
    messages: ["Plan a trip for me."],
    result: {},
    language: "en"
  });
  const questions = buildNaturalFollowUpQuestions(understanding, {
    visible: [
      { id: "travel-dates", titleText: "When do you want to travel?" },
      { id: "travel-priority", titleText: "What matters most?" },
      { id: "travel-budget", titleText: "How much can you spend?" }
    ]
  }, { language: "en" });
  assert.ok(questions.length <= MAX_ALPHA10_VISIBLE_QUESTIONS);
  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
  assert.doesNotMatch(questions.map((question) => question.text).join(" "), /required fields|complete the following/i);
});

test("high confidence conversation recommends intelligent silence", () => {
  const layer = buildConversationUnderstandingLayer({
    messages: ["NYC business trip in October with a mid-range budget, prefer central hotels and subway."],
    result: { type: "travel", destination: { city: "New York City", country: "USA" } },
    language: "en"
  });
  assert.equal(layer.version, ALPHA10_NATURAL_MISSION_CONVERSATION_VERSION);
  assert.equal(layer.confidence.level, "high");
  assert.equal(layer.visibleQuestions.length, 0);
  assert.equal(layer.silenceRecommended, true);
  assert.equal(validateConversationUnderstandingLayer(layer).ok, true);
});

test("low confidence conversation confirms naturally before mission generation assumptions", () => {
  const layer = buildConversationUnderstandingLayer({
    messages: ["Help me with this soon."],
    result: {},
    language: "en"
  });
  assert.equal(layer.shouldConfirm, true);
  assert.ok(layer.visibleQuestions.length <= 2);
  assert.equal(layer.workspaceUpdate.neverExecute, true);
});

test("corrections update only affected fields and explain why", () => {
  const base = extractConversationUnderstanding({
    messages: ["Japan trip in October with my parents and seafood."],
    result: { destination: { country: "Japan" } },
    language: "en"
  });
  const updated = applyConversationCorrection(base, "Actually make it November.", { language: "en" });
  assert.ok(updated.changes.includes("dates"));
  assert.ok(updated.understanding.dates.some((date) => /November/.test(date)));
  assert.ok(updated.understanding.people.some((person) => /parents/.test(person)));
  assert.match(updated.explanation, /Updated because/i);
});

test("ALPHA-10 reuses existing systems and remains non-executing", () => {
  const layer = buildConversationUnderstandingLayer({
    messages: ["Find a dentist today near Seoul."],
    result: {
      type: "healthcare",
      worldIntelligence: {},
      alpha09ProviderTrust: {}
    },
    refinement: { visible: [{ id: "urgency", titleText: "Is this urgent pain?" }] },
    predictions: { visible: [] },
    memory: { appliedMemories: [] },
    language: "en"
  });
  assert.equal(layer.systemsReused.progressiveRefinement, true);
  assert.equal(layer.systemsReused.predictiveIntelligence, true);
  assert.equal(layer.systemsReused.personalMissionMemory, true);
  assert.equal(layer.systemsReused.providerTrustNetwork, true);
  assert.equal(layer.workspaceUpdate.neverExecute, true);
});

test("results page and cache-busted entries wire the ALPHA-10 panel", () => {
  const page = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  const entry = readFileSync(new URL("../results.js", import.meta.url), "utf8");
  assert.match(page, /buildConversationUnderstandingLayer/);
  assert.match(page, /natural-mission-conversation/);
  assert.match(page, /alpha10NaturalConversation/);
  assert.match(html, /20260730-universal-execution/);
  assert.match(entry, /20260730-universal-execution/);
});
