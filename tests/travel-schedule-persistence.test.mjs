import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const homeSource = fs.readFileSync(new URL("../js/pages/home-page.js", import.meta.url), "utf8");
const resultsSource = fs.readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");

test("travel missions open the schedule step before starting", () => {
  assert.match(homeSource, /if \(type === "travel"\) \{\s*pendingFollowUp = null;\s*openScheduleModal\(mission\);/);
  assert.match(homeSource, /const schedule = \{ startDate: scheduleStartDate\.value, endDate: scheduleEndDate\.value, timePreference: scheduleTimePreference\.value \};/);
  assert.match(homeSource, /startMission\(pendingMissionText, schedule\);/);
});

test("the final summary renders and preserves the selected dates", () => {
  assert.match(resultsSource, /metadata\?\.start \|\|/);
  assert.match(resultsSource, /metadata\?\.end \|\|/);
  assert.match(resultsSource, /s: \[schedule\.startDate \|\| "", schedule\.endDate \|\| "", schedule\.timePreference \|\| "any"\]/);
});
