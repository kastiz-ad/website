import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const resultsPageSource = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");

test("travel customer results hide founder-only alpha diagnostics by default", () => {
  assert.match(resultsPageSource, /const isFounderDiagnosticsMode = \(\) =>/);
  assert.match(resultsPageSource, /if \(isFounderDiagnosticsMode\(\)\) \{/);
  assert.match(resultsPageSource, /attachMissionDirectorBrief\(currentResult\)/);
  assert.match(resultsPageSource, /!isTravelResult\(currentResult\) \|\| isFounderDiagnosticsMode\(\)/);
});

test("specific city travel avoids generic placeholder places", () => {
  assert.match(resultsPageSource, /const buildSpecificCityJourneys = \(result, destination, duration\) =>/);
  assert.match(resultsPageSource, /new york\|nyc\|뉴욕/);
  assert.match(resultsPageSource, /Statue of Liberty/);
  assert.match(resultsPageSource, /Central Park/);
  assert.match(resultsPageSource, /B&H Photo Video/);
  assert.doesNotMatch(resultsPageSource, /local table/);
  assert.doesNotMatch(resultsPageSource, /central landmark/);
  assert.doesNotMatch(resultsPageSource, /old town \/ main district/);
});

test("day cards respect trip length and reserve checkout for the final day", () => {
  const dayBuilder = resultsPageSource.slice(
    resultsPageSource.indexOf("const buildAlpha03DayCards"),
    resultsPageSource.indexOf("const createAlpha03Card")
  );
  assert.match(dayBuilder, /Array\.from\(\{ length: tripDays \}/);
  assert.match(dayBuilder, /index === tripDays - 1/);
  assert.match(dayBuilder, /Hotel checkout/);
  assert.match(dayBuilder, /Airport transfer/);
  assert.match(dayBuilder, /Departure/);
  assert.doesNotMatch(dayBuilder, /baseDays\[index % baseDays\.length\]/);
});

test("travel results use the refined premium product hierarchy", () => {
  assert.match(resultsPageSource, /Quick adjustment/);
  assert.match(resultsPageSource, /alpha03-recommendation-stage/);
  assert.match(resultsPageSource, /Start Live Search/);
  assert.match(resultsPageSource, /Live Search Ready/);
  assert.match(resultsPageSource, /getCompactTravelBudgetLabel/);
  assert.match(resultsPageSource, /product-refined-results/);
  assert.match(resultsPageSource, /alpha03-option-preview/);
  assert.match(resultsPageSource, /alpha03-budget-breakdown/);
  assert.doesNotMatch(resultsPageSource, /Trip designed for you/);
  assert.doesNotMatch(resultsPageSource, /four ways/);
  assert.doesNotMatch(resultsPageSource, /cuatro formas/);
});
