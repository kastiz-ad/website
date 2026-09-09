import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const homeSource = fs.readFileSync(new URL("../js/pages/home-page.js", import.meta.url), "utf8");
const resultsSource = fs.readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scriptSource = fs.readFileSync(new URL("../script.js", import.meta.url), "utf8");
const resultsHtmlSource = fs.readFileSync(new URL("../results.html", import.meta.url), "utf8");
const resultsEntrySource = fs.readFileSync(new URL("../results.js", import.meta.url), "utf8");
const homeStyleSource = fs.readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("homepage omits the saved trips panel while preserving stored-trip reopen support", () => {
  assert.doesNotMatch(indexSource, /savedTripsPanel|saved-trips-panel|Saved trips/);
  assert.doesNotMatch(homeSource, /renderSavedTrips|savedTripsList/);
  assert.doesNotMatch(homeStyleSource, /saved-trips-panel|saved-trips-list/);
  assert.match(homeSource, /PROTOTYPE_MISSION_ARCHIVE_KEY/);
  assert.match(homeSource, /reopenPrototypeMission/);
});

test("travel missions open the schedule step before starting", () => {
  assert.match(homeSource, /if \(type === "travel"\) \{\s*pendingFollowUp = null;\s*openScheduleModal\(mission\);/);
  assert.match(homeSource, /const schedule = collectScheduleDetails\(\);/);
  assert.match(homeSource, /source: Object\.values\(scheduleFieldSources\)\.includes\("manual"\) \? "mixed" : "inferred_or_default"/);
  assert.match(homeSource, /fieldSources: \{ \.\.\.scheduleFieldSources \}/);
  assert.match(homeSource, /scheduleFieldSources\.travelerCount = "manual"/);
  assert.match(homeSource, /travelerCount: normalizeScheduleCount\(scheduleTravelerCount\?\.value, 1\)/);
  assert.match(homeSource, /originAirport: scheduleDepartureAirport\?\.value \|\| "ICN"/);
  assert.match(homeSource, /startMission\(pendingMissionText, schedule\);/);
});

test("homepage cache keys expose the current travel constraint flow", () => {
  assert.match(indexSource, /script\.js\?v=20260908-global-travel-routing-v1/);
  assert.match(scriptSource, /home-page\.js\?v=20260908-global-travel-routing-v1/);
  assert.match(homeSource, /travel-constraint-parser\.js\?v=20260907-founder-qa-v20/);
  assert.match(resultsHtmlSource, /results\.js\?v=20260910-approved-dashboard-v10/);
  assert.match(resultsEntrySource, /results-page\.js\?v=20260910-approved-dashboard-v10/);
  assert.match(resultsSource, /one-free-customer-journey\.js\?v=20260908-global-trust-phase-f-v1/);
  assert.match(resultsSource, /approval-information-review\.js\?v=20260907-fr-approval-v1/);
  assert.match(resultsSource, /preview-destination-intelligence\.js\?v=20260907-card-descriptions-v3/);
  assert.doesNotMatch(resultsSource, /preview-destination-intelligence\.js\?v=20260813-preview-v79-1/);
});

test("the final summary renders and preserves the selected dates", () => {
  assert.match(resultsSource, /schedule\.startDate \|\| "—"/);
  assert.match(resultsSource, /schedule\.endDate \|\| "—"/);
  assert.match(resultsSource, /s: \[schedule\.startDate \|\| "", schedule\.endDate \|\| "", schedule\.timePreference \|\| "any"\]/);
  assert.match(resultsSource, /const \{ tripDays, tripNights \} = calculateTripDayCounts\(result\);/);
  assert.match(resultsSource, /Number\(effectiveNightlyBudget\.min \|\| 0\) \* tripNights \* rooms/);
  assert.match(resultsSource, /plannedMealsPerDay \* tripDays \* travelerCount/);
});
