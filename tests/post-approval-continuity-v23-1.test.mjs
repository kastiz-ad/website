import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const resultsPageSource = fs.readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
const resultsCss = fs.readFileSync(new URL("../results.css", import.meta.url), "utf8");
const resultsHtml = fs.readFileSync(new URL("../results.html", import.meta.url), "utf8");

const v231Block = resultsPageSource.slice(
  resultsPageSource.indexOf("const isV231TravelPreparationFlow"),
  resultsPageSource.indexOf("const buildExecutionSummary")
);

const approvalBranch = resultsPageSource.slice(
  resultsPageSource.indexOf("const runApprovalSequence"),
  resultsPageSource.indexOf("trackEvent(\"simulated_execution_started\"")
);

test("V23.1 adds truthful preparation continuation after travel approval", () => {
  assert.match(resultsPageSource, /renderV231PreparationContinuation/);
  assert.match(resultsPageSource, /preparation_approved/);
  assert.match(resultsPageSource, /selectedJourneyId/);
  assert.match(resultsPageSource, /selectedJourneyName/);
  assert.match(resultsPageSource, /providerSearchStatus/);
  assert.match(resultsPageSource, /completionEvidence: null/);
  assert.match(v231Block, /No booking, payment, ticketing, submission, or provider contact has occurred/);
  assert.match(v231Block, /실시간 조회만 승인하기/);
  assert.match(v231Block, /Approve live search only/);
});

test("V23.1 travel approval branch does not call fake execution summary", () => {
  assert.match(approvalBranch, /isV231TravelPreparationFlow\(\)/);
  assert.match(approvalBranch, /renderV231PreparationContinuation\(\)/);
  assert.match(approvalBranch, /preparation_approved/);
  assert.doesNotMatch(approvalBranch, /buildExecutionSummary\(\)/);
  assert.doesNotMatch(approvalBranch, /simulated_execution_completed/);
});

test("V23.1 continuation block avoids fake completion artifacts", () => {
  for (const forbidden of ["ONE-DEMO", "prototype-reference-qr", "KE-101", "KE-102", "Approved execution summary", "ONE'D", "All in"]) {
    assert.doesNotMatch(v231Block, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("V23.1 approval review is scoped to journey preparation", () => {
  assert.match(resultsPageSource, /const journey = isV231TravelPreparationFlow\(\) \? getV231SelectedJourney\(\) : null/);
  assert.match(resultsPageSource, /Selected journey/);
  assert.match(resultsPageSource, /Prepare search and comparison only/);
  assert.match(resultsPageSource, /No booking, payment, ticketing, submission, or provider contact/);
});

test("V23.1 blocks direct fake completion references without provider evidence", () => {
  assert.match(resultsPageSource, /renderV231BlockedCompletionState/);
  assert.match(resultsPageSource, /completion-blocked-view/);
  assert.match(resultsPageSource, /Completion requires evidence/);
  assert.match(resultsPageSource, /\^ONE-DEMO-\[A-Z0-9\]\{8\}\$/);
  const directReferenceBranch = resultsPageSource.slice(
    resultsPageSource.indexOf("if (/^ONE-DEMO-[A-Z0-9]{8}$/"),
    resultsPageSource.indexOf("} else if (currentResult?.portableShare === true)")
  );
  assert.match(directReferenceBranch, /renderV231BlockedCompletionState\(\)/);
  assert.doesNotMatch(directReferenceBranch, /buildExecutionSummary\(\)/);
});

test("V23.1 exposes manual post-approval preview states without fake completion", () => {
  assert.match(resultsPageSource, /MANUAL_V231_APPROVAL_SCENARIOS/);
  for (const scenario of [
    "preparation-approved-no-dates",
    "dates-known-no-live-provider",
    "live-search-approved-adapter-unavailable",
    "cached-public-provider-result",
    "verified-live-provider-result-not-booked",
    "booking-approval-requested",
    "provider-processing",
    "real-completion-fixture",
    "direct-completion-blocked",
    "korean-language-integrity"
  ]) {
    assert.match(resultsPageSource, new RegExp(scenario));
  }
  assert.match(resultsPageSource, /applyV231ManualApprovalScenario/);
  assert.match(resultsPageSource, /v23ApprovalScenario/);
});

test("V23.1 styling supports the continuation and blocked states", () => {
  for (const marker of [
    ".v231-continuation",
    ".v231-stage-strip",
    ".v231-selected-journey",
    ".v231-action-grid",
    ".v231-next-action",
    ".v231-primary",
    ".completion-blocked-view"
  ]) {
    assert.match(resultsCss, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("static HTML no longer defaults to fake ONE'D completion copy", () => {
  assert.match(resultsHtml, /Next step prepared/);
  assert.match(resultsHtml, /No booking, payment, or provider execution has occurred/);
  assert.doesNotMatch(resultsHtml, /Everything is prepared\. You're always in control\./);
});
