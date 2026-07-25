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

test("V22 renders travel as complete packages before detailed choices", () => {
  assert.match(resultsPageSource, /createTravelPackagesCard/);
  assert.match(resultsPageSource, /travel-package-card/);
  assert.match(resultsPageSource, /Travel packages prepared by ONE/);
  assert.match(resultsPageSource, /Complete options/);
});

test("V22 has responsive premium result styling", () => {
  for (const marker of [
    ".mission-grid.is-domain-layout",
    ".v22-card",
    ".v22-path-grid",
    ".travel-package-grid",
    ".travel-package-option",
    "@media (max-width: 640px)"
  ]) {
    assert.match(resultsCss, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("V22 cache key is active in results entry files", () => {
  assert.match(resultsEntry, /20260726-v22-product-refinement/);
  assert.match(resultsHtml, /20260726-v22-product-refinement/);
});
