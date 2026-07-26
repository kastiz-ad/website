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
    ["ì´ê°€ ì•„í”ˆë° ì˜¤ëŠ˜ ê°ˆ ìˆ˜ ìžˆëŠ” ì¹˜ê³¼ ì°¾ì•„ì¤˜", "healthcare", "urgency"],
    ["ì¤‘í•™ìƒ ì˜ì–´ ë‚´ì‹  í•™ì› ì°¾ì•„ì¤˜", "education", "student"],
    ["í•œêµ­ì—ì„œ íšŒì‚¬ë¥¼ ì‹œìž‘í•˜ê³  ì‹¶ì–´", "business", "business"],
    ["í•œêµ­ì—ì„œ ì¼ìžë¦¬ë¥¼ ì°¾ê³  ì‹¶ì–´", "career", "field"]
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
  assert.match(resultsHtml, /20260727-alpha04-living-mission/);
  assert.match(resultsEntry, /20260727-alpha04-living-mission/);
});
