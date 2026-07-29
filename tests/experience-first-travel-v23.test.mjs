import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const resultsPageSource = fs.readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
const resultsCss = fs.readFileSync(new URL("../results.css", import.meta.url), "utf8");
const resultsHtml = fs.readFileSync(new URL("../results.html", import.meta.url), "utf8");
const resultsEntry = fs.readFileSync(new URL("../results.js", import.meta.url), "utf8");

const travelRender = resultsPageSource.slice(
  resultsPageSource.indexOf("const renderTravelMission"),
  resultsPageSource.indexOf("const renderResolutionPlanMission")
);

test("V23 exposes travel-first manual preview scenarios", () => {
  assert.match(resultsPageSource, /MANUAL_V23_TRAVEL_SCENARIOS/);
  assert.match(resultsPageSource, /v23TravelScenario/);
  for (const scenario of [
    "sapporo-general",
    "sapporo-food",
    "sapporo-family",
    "sapporo-budget",
    "missing-live-data",
    "mixed-source-states",
    "mobile",
    "long-provider-names",
    "no-visa-required",
    "visa-unresolved"
  ]) {
    assert.match(resultsPageSource, new RegExp(scenario));
  }
});

test("V23 travel renders one experience system instead of provider-first cards", () => {
  assert.match(resultsPageSource, /buildV23TravelJourneys/);
  assert.match(resultsPageSource, /createTravelPackagesCard/);
  assert.match(resultsPageSource, /v23-travel-experience/);
  assert.match(resultsPageSource, /v23-journey-layout/);
  assert.match(resultsPageSource, /v23-selected-journey/);
  assert.match(resultsPageSource, /updateV23JourneySelection/);
  assert.doesNotMatch(travelRender, /createVisaVerificationCard/);
  assert.doesNotMatch(travelRender, /createMissionCard\(\{\s*id:\s*"flights"/);
  assert.doesNotMatch(travelRender, /createMissionCard\(\{\s*id:\s*"hotel"/);
  assert.doesNotMatch(travelRender, /createMissionCard\(\{\s*id:\s*"restaurants"/);
});

test("V23 travel uses explicit source states and avoids fake live claims", () => {
  for (const state of ["verified_live", "cached_public", "estimated", "placeholder", "unavailable"]) {
    assert.match(resultsPageSource, new RegExp(state));
  }
  assert.match(resultsPageSource, /providerSourceNote/);
  assert.match(resultsPageSource, /No fictional provider shown/);
  assert.match(resultsPageSource, /Live provider search is required/);
});

test("V23 travel contains the required approval-first safety language", () => {
  assert.match(resultsPageSource, /Live Search Ready/);
  assert.match(resultsPageSource, /approvalProtection/);
  assert.match(resultsPageSource, /Start Live Search/);
  assert.match(resultsPageSource, /v23-approval-preview/);
  assert.doesNotMatch(resultsPageSource, /passport\/visa upload/i);
});

test("V23 travel styling supports responsive, no-overflow layouts", () => {
  for (const marker of [
    ".mission-grid.is-v23-travel-layout",
    ".v23-travel-experience",
    ".v23-journey-layout",
    ".v23-alternative-journeys",
    ".v23-detail-grid",
    ".v23-approval-preview",
    "@media (max-width: 980px)",
    "@media (max-width: 768px)",
    "@media (max-width: 640px)",
    "@media (prefers-reduced-motion: reduce)"
  ]) {
    assert.match(resultsCss, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("V23 result cache key is active", () => {
  assert.match(resultsEntry, /20260730-provider-orchestration/);
  assert.match(resultsHtml, /20260730-provider-orchestration/);
});
