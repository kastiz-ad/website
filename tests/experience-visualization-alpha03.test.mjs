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

test("ALPHA-03 renders experience before logistics without a new engine", () => {
  assert.match(resultsPageSource, /createAlpha03ExperienceHtml/);
  assert.match(resultsPageSource, /getAlpha03DestinationProfile/);
  assert.match(resultsPageSource, /buildV23TravelJourneys/);
  assert.match(resultsPageSource, /createMissionInsightsCard/);
  assert.match(resultsPageSource, /createProgressiveRefinementCard/);

  const experienceIndex = travelDetailSource.indexOf("alpha03-story-panel");
  const restaurantIndex = travelDetailSource.indexOf("Restaurants");
  const placesIndex = travelDetailSource.indexOf("Places");
  const dayIndex = travelDetailSource.indexOf("Day preview");
  const hotelIndex = travelDetailSource.indexOf("Hotel direction");
  const flightIndex = travelDetailSource.indexOf("Flight direction");
  const prepIndex = travelDetailSource.indexOf("alpha03-preparation-details");

  assert.ok(experienceIndex >= 0);
  assert.ok(restaurantIndex > experienceIndex);
  assert.ok(placesIndex > restaurantIndex);
  assert.ok(dayIndex > placesIndex);
  assert.ok(hotelIndex > dayIndex);
  assert.ok(flightIndex > hotelIndex);
  assert.ok(prepIndex > flightIndex);
});

test("ALPHA-03 restaurant and place previews are truthful and do not fake ratings", () => {
  assert.match(travelDetailSource, /sourceStateLabel/);
  assert.match(resultsPageSource, /cached_public/);
  assert.match(resultsPageSource, /estimated/);
  assert.doesNotMatch(travelDetailSource, /fake rating|review count|reservationStatus|availability confirmed/i);
  assert.doesNotMatch(travelDetailSource, /4\.[0-9]\s*â˜…|stars/i);
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
    ".alpha03-story-panel",
    ".alpha03-card-grid",
    ".alpha03-visual-card",
    ".alpha03-day-grid",
    ".alpha03-logistics-strip",
    ".alpha03-preparation-details"
  ].forEach((selector) => assert.match(resultsCss, new RegExp(selector.replace(".", "\\."))));
  assert.match(resultsCss, /@media \(max-width: 768px\)[\s\S]*alpha03-card-grid/);
});

test("ALPHA-03 cache key is active in result entry files", () => {
  assert.match(resultsHtml, /20260729-alpha14-selection-fix/);
  assert.match(resultsEntry, /20260729-alpha14-selection-fix/);
});
