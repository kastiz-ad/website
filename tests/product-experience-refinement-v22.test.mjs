import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const resultsPageSource = fs.readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
const resultsCss = fs.readFileSync(new URL("../results.css", import.meta.url), "utf8");
const resultsHtml = fs.readFileSync(new URL("../results.html", import.meta.url), "utf8");
const resultsEntry = fs.readFileSync(new URL("../results.js", import.meta.url), "utf8");

test("V22 exposes founder-review preview routes for each major domain", () => {
  assert.match(resultsPageSource, /MANUAL_V22_SCENARIOS/);
  for (const scenario of ["travel", "education", "healthcare", "business", "home-services", "career"]) {
    assert.match(resultsPageSource, new RegExp(`${scenario}`));
  }
  assert.match(resultsPageSource, /v22Scenario/);
});

test("V22 keeps the existing engine and adds only a presentation layer", () => {
  assert.match(resultsPageSource, /createHOSKernel/);
  assert.match(resultsPageSource, /renderResolutionPlanMission/);
  assert.match(resultsPageSource, /DOMAIN_PRESENTATION/);
  assert.match(resultsPageSource, /localizeDomainText/);
  assert.match(resultsPageSource, /v22DomainLayout/);
});

test("V22 replaces prototype leakage with product-quality result components", () => {
  for (const marker of [
    "What ONE understood",
    "Recommended solution",
    "Other good options",
    "Already prepared",
    "Things I still need",
    "Ready when you are"
  ]) {
    assert.match(resultsPageSource, new RegExp(marker));
  }
  assert.doesNotMatch(resultsHtml, /Live public data \+ estimated travel options/);
});

test("V22/V23 renders travel as experience-first choices before provider details", () => {
  assert.match(resultsPageSource, /createTravelPackagesCard/);
  assert.match(resultsPageSource, /travel-package-card/);
  assert.match(resultsPageSource, /v23-travel-experience/);
  assert.match(resultsPageSource, /v23-journey-card/);
  assert.match(resultsPageSource, /sourceStateLabel/);
});

test("V22 has responsive premium result styling", () => {
  for (const marker of [
    ".mission-grid.is-domain-layout",
    ".v22-card",
    ".v22-path-grid",
    ".travel-package-grid",
    ".travel-package-option",
    ".v23-travel-experience",
    ".v23-journey-card",
    "@media (max-width: 640px)"
  ]) {
    assert.match(resultsCss, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("V23 travel-first cache key is active in results entry files", () => {
  assert.match(resultsEntry, /20260729-alpha14-selection-fix/);
  assert.match(resultsHtml, /20260729-alpha14-selection-fix/);
});
