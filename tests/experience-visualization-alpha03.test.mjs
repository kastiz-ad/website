import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const resultsPageSource = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
const resultsCss = readFileSync(new URL("../results.css", import.meta.url), "utf8");
const resultsHtml = readFileSync(new URL("../results.html", import.meta.url), "utf8");
const resultsEntry = readFileSync(new URL("../results.js", import.meta.url), "utf8");

const travelDetailSource = resultsPageSource.slice(
  resultsPageSource.indexOf("const createAlpha03ExperienceHtml"),
  resultsPageSource.indexOf("const createTravelPackagesCard")
);
const journeyMapSource = resultsPageSource.slice(
  resultsPageSource.indexOf("const createAlpha03JourneyMap"),
  resultsPageSource.indexOf("const createAlpha03OptionPreviewCard")
);

test("ALPHA-03 renders experience before logistics without a new engine", () => {
  assert.match(resultsPageSource, /createAlpha03ExperienceHtml/);
  assert.match(resultsPageSource, /getAlpha03DestinationProfile/);
  assert.match(resultsPageSource, /buildV23TravelJourneys/);
  assert.match(resultsPageSource, /createMissionInsightsCard/);
  assert.match(resultsPageSource, /createProgressiveRefinementCard/);

  const experienceIndex = travelDetailSource.indexOf("alpha03-recommendation-stage");
  const mapIndex = travelDetailSource.indexOf("createAlpha03JourneyMap");
  const restaurantIndex = travelDetailSource.indexOf("Food");
  const placesIndex = travelDetailSource.indexOf("Places");
  const dayIndex = travelDetailSource.indexOf("Timeline");
  const optionIndex = travelDetailSource.indexOf("createAlpha03OptionPreview");
  const prepIndex = travelDetailSource.indexOf("alpha03-preparation-details");

  assert.ok(experienceIndex >= 0);
  assert.ok(mapIndex >= 0);
  assert.ok(restaurantIndex > mapIndex);
  assert.ok(placesIndex > restaurantIndex);
  assert.ok(dayIndex > placesIndex);
  assert.ok(optionIndex > dayIndex);
  assert.ok(prepIndex > optionIndex);
});

test("ALPHA-03 restaurant and place previews are truthful and do not fake ratings", () => {
  assert.match(resultsPageSource, /getAlpha03ItemAdvice/);
  assert.match(resultsPageSource, /what to order/);
  assert.match(resultsPageSource, /cached_public/);
  assert.match(resultsPageSource, /estimated/);
  assert.doesNotMatch(travelDetailSource, /fake rating|review count|reservationStatus|availability confirmed/i);
  assert.doesNotMatch(travelDetailSource, /4\.[0-9]\s*★|stars/i);
});

test("ALPHA-03 creates distinct founder preview experiences for Sapporo", () => {
  ["Sapporo Ramen Yokocho", "Sapporo Beer Museum", "Nijo Market", "JR Tower Observatory"].forEach((name) => {
    assert.match(resultsPageSource, new RegExp(name));
  });
  ["food", "value", "rest", "balanced"].forEach((tone) => {
    assert.match(resultsPageSource, new RegExp(`${tone}`));
  });
});

test("ALPHA-03 preparation is collapsed and visual cards are responsive", () => {
  assert.match(travelDetailSource, /alpha04SectionAttrs\(workspace, "preparation", "alpha03-preparation-details"\)/);
  assert.doesNotMatch(travelDetailSource, /alpha03-preparation-details" open/);
  [
    ".alpha03-recommendation-stage",
    ".alpha03-map-canvas",
    ".alpha03-budget-breakdown",
    ".alpha03-card-grid",
    ".alpha03-visual-card",
    ".alpha03-timeline-strip",
    ".alpha03-option-preview",
    ".alpha03-preparation-details"
  ].forEach((selector) => assert.match(resultsCss, new RegExp(selector.replace(".", "\\."))));
  assert.match(resultsCss, /@media \(max-width: 768px\)[\s\S]*alpha03-card-grid/);
});

test("ALPHA-03 cache key is active in result entry files", () => {
  assert.match(resultsHtml, /20260730-approval-engine/);
  assert.match(resultsEntry, /20260730-approval-engine/);
});

test("ALPHA-03 keeps map pins clean and transport choices top-aligned", () => {
  assert.match(journeyMapSource, /class="alpha03-map-pin/);
  assert.doesNotMatch(journeyMapSource, /<b>/);
  assert.match(resultsPageSource, /Train \+ local bus \+ walk/);
  assert.match(resultsPageSource, /Subway pass route/);
  assert.match(resultsPageSource, /Late-night taxi backup/);
  assert.match(resultsCss, /alpha03-option-preview[\s\S]*align-items:\s*start/);
  assert.match(resultsCss, /alpha03-preview-group > div[\s\S]*align-content:\s*start/);
});

test("ALPHA-03 restaurant fallbacks are destination-aware instead of Japan-only", () => {
  assert.match(resultsPageSource, /restaurantCuisineProfiles/);
  assert.match(resultsPageSource, /cuisineProfilesByContinent/);
  assert.match(resultsPageSource, /ONE destination cuisine fallback/);
  assert.match(resultsPageSource, /Classic deli/);
  assert.match(resultsPageSource, /Ceviche house/);
  assert.match(resultsPageSource, /Churrascaria/);
});
