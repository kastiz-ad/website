import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ALPHA02_REFINEMENT_VERSION,
  MAX_VISIBLE_REFINEMENT_QUESTIONS,
  applyRefinementAnswer,
  archiveRefinementQuestion,
  buildProgressiveRefinement,
  createEmptyRefinementState,
  refinementStorageKey
} from "../js/engine/refinement/progressive-refinement-alpha02.js";

const travelResult = {
  id: "alpha02-sapporo-parents",
  type: "travel",
  rawInput: "I want to take my parents to Sapporo",
  destination: { city: "Sapporo", country: "Japan" },
  budget: {},
  worldIntelligence: { sourceBreakdown: { estimated: 2 } }
};

test("ALPHA-02 asks at most two high-value refinement questions", () => {
  const refinement = buildProgressiveRefinement(travelResult, { destination: { city: "Sapporo" } }, createEmptyRefinementState(), { language: "en" });
  assert.equal(refinement.version, ALPHA02_REFINEMENT_VERSION);
  assert.ok(refinement.visible.length <= MAX_VISIBLE_REFINEMENT_QUESTIONS);
  assert.ok(refinement.visible.length > 0);
  assert.ok(refinement.visible.every((question) => ["critical", "high"].includes(question.priority)));
  assert.ok(refinement.visible.some((question) => question.id === "travel-walking-preference"));
  assert.ok(refinement.collapsed.every((question) => question.priority === "helpful"));
  assert.equal(refinement.visible.some((question) => /departure airport|insurance|restaurant/i.test(question.titleText)), false);
});

test("ALPHA-02 never duplicates known or already archived questions", () => {
  const state = {
    answers: { "travel-walking-preference": "less_walking" },
    archived: { "travel-food-vs-sightseeing": { status: "hidden" } }
  };
  const refinement = buildProgressiveRefinement(travelResult, {}, state, { language: "en" });
  const ids = refinement.all.map((question) => question.id);
  assert.equal(ids.includes("travel-walking-preference"), false);
  assert.equal(ids.includes("travel-food-vs-sightseeing"), false);
});

test("ALPHA-02 answers update mission state without execution or restart flags", () => {
  const updated = applyRefinementAnswer(travelResult, { questionId: "travel-walking-preference", value: "less_walking" }, { language: "en" });
  assert.equal(updated.alpha02Refinements.answers["travel-walking-preference"], "less_walking");
  assert.match(updated.alpha02LastUpdate, /less walking|shorter routes|transfers/i);
  assert.equal(updated.executionStatus, undefined);
  assert.equal(updated.approvalState?.approved, undefined);
});

test("ALPHA-02 archive lifecycle supports skip later and hidden", () => {
  const skipped = archiveRefinementQuestion(createEmptyRefinementState(), "travel-food-vs-sightseeing", "later");
  assert.equal(skipped.archived["travel-food-vs-sightseeing"].status, "later");
  const refinement = buildProgressiveRefinement(travelResult, {}, skipped, { language: "en" });
  assert.equal(refinement.all.some((question) => question.id === "travel-food-vs-sightseeing"), false);
});

test("ALPHA-02 supports healthcare education business and career domains", () => {
  const cases = [
    ["Ã¬ÂÂ´ÃªÂ°â‚¬ Ã¬â€¢â€žÃ­â€Ë†Ã«ÂÂ° Ã¬ËœÂ¤Ã«Å Ëœ ÃªÂ°Ë† Ã¬Ë†Ëœ Ã¬Å¾Ë†Ã«Å â€ Ã¬Â¹ËœÃªÂ³Â¼ Ã¬Â°Â¾Ã¬â€¢â€žÃ¬Â¤Ëœ", "healthcare", "urgency"],
    ["Ã¬Â¤â€˜Ã­â€¢â„¢Ã¬Æ’Â Ã¬ËœÂÃ¬â€“Â´ Ã«â€šÂ´Ã¬â€¹Â  Ã­â€¢â„¢Ã¬â€ºÂ Ã¬Â°Â¾Ã¬â€¢â€žÃ¬Â¤Ëœ", "education", "student"],
    ["Ã­â€¢Å“ÃªÂµÂ­Ã¬â€”ÂÃ¬â€žÅ“ Ã­Å¡Å’Ã¬â€šÂ¬Ã«Â¥Â¼ Ã¬â€¹Å“Ã¬Å¾â€˜Ã­â€¢ËœÃªÂ³Â  Ã¬â€¹Â¶Ã¬â€“Â´", "business", "business"],
    ["Ã­â€¢Å“ÃªÂµÂ­Ã¬â€”ÂÃ¬â€žÅ“ Ã¬ÂÂ¼Ã¬Å¾ÂÃ«Â¦Â¬Ã«Â¥Â¼ Ã¬Â°Â¾ÃªÂ³Â  Ã¬â€¹Â¶Ã¬â€“Â´", "career", "field"]
  ];
  for (const [mission, domain, expected] of cases) {
    const refinement = buildProgressiveRefinement({ rawInput: mission, resolutionPlan: { domain } }, {}, {}, { language: "ko" });
    assert.equal(refinement.domain, domain);
    assert.ok(refinement.visible.some((question) => question.id.includes(expected) || question.titleText));
  }
});

test("ALPHA-02 storage key is mission-scoped and safe", () => {
  const first = refinementStorageKey({ id: "one" });
  const second = refinementStorageKey({ id: "two" });
  assert.notEqual(first, second);
  assert.match(first, /^kastiz-one-alpha02-refinement:/);
});

test("ALPHA-02 UI is wired without homepage redesign", () => {
  const resultsPage = fs.readFileSync("js/pages/results-page.js", "utf8");
  const css = fs.readFileSync("results.css", "utf8");
  const resultsHtml = fs.readFileSync("results.html", "utf8");
  const resultsEntry = fs.readFileSync("results.js", "utf8");
  assert.match(resultsPage, /createProgressiveRefinementCard/);
  assert.match(resultsPage, /data-answer-value/);
  assert.match(resultsPage, /mission_refinement_answered/);
  assert.match(resultsPage, /renderMission\(\)/);
  assert.match(css, /\.alpha02-refinement-card/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(resultsHtml, /20260729-alpha09-provider-trust-network/);
  assert.match(resultsEntry, /20260729-alpha09-provider-trust-network/);
});
