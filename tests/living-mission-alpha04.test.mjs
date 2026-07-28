import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ALPHA04_LIVING_MISSION_VERSION,
  createLivingMissionWorkspace,
  livingMissionStorageKey,
  sectionWasRecentlyUpdated
} from "../js/engine/workspace/living-mission-alpha04.js";

const resultsPageSource = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
const resultsHtml = readFileSync(new URL("../results.html", import.meta.url), "utf8");
const resultsEntry = readFileSync(new URL("../results.js", import.meta.url), "utf8");
const resultsCss = readFileSync(new URL("../results.css", import.meta.url), "utf8");

test("ALPHA-04 creates one clear living mission workspace status", () => {
  const workspace = createLivingMissionWorkspace({
    type: "travel",
    rawInput: "Sapporo trip",
    schedule: { startDate: "2026-07-27", endDate: "2026-07-30" }
  }, { language: "en" });

  assert.equal(workspace.version, ALPHA04_LIVING_MISSION_VERSION);
  assert.equal(workspace.status.code, "ready");
  assert.equal(typeof workspace.status.label, "string");
  assert.ok(workspace.status.label.length > 0);
  assert.ok(workspace.stages.some((stage) => stage.state === "done"));
  assert.ok(workspace.nextAction.length > 0);
});

test("ALPHA-04 hides completed tasks and exposes only pending work", () => {
  const workspace = createLivingMissionWorkspace({
    type: "travel",
    rawInput: "Trip with missing dates",
    schedule: {}
  }, { language: "ko" });

  assert.equal(workspace.status.code, "waiting_dates");
  assert.ok(workspace.tasks.some((task) => task.id === "dates"));
  assert.ok(workspace.tasks.every((task) => task.done !== true));
});

test("ALPHA-04 records scenario history and affected section updates", () => {
  const workspace = createLivingMissionWorkspace({
    rawInput: "Sapporo trip",
    alpha04Scenario: "weather-changed"
  }, { language: "en" });

  assert.ok(workspace.history.some((event) => event.type === "weather_update"));
  assert.equal(sectionWasRecentlyUpdated(workspace, "timeline"), true);
  assert.equal(sectionWasRecentlyUpdated(workspace, "flights"), false);
  assert.ok(workspace.notifications.some((notice) => /Weather changed/i.test(notice.label)));
});

test("ALPHA-04 approval history keeps preparation approval separate from booking approval", () => {
  const workspace = createLivingMissionWorkspace({
    rawInput: "Sapporo trip",
    alpha04Scenario: "approval-completed"
  }, { language: "en" });

  assert.ok(workspace.approvalHistory.length >= 1);
  assert.equal(workspace.approvalHistory[0].scope, "search_preparation");
  assert.equal(workspace.approvalHistory[0].executionApproved, false);
  assert.match(workspace.approvalHistory[0].label, /Booking\/payment still not approved/);
});

test("ALPHA-04 results page integrates workspace card, section markers, resume state, and cache busting", () => {
  assert.match(resultsPageSource, /createLivingMissionWorkspaceCard/);
  assert.match(resultsPageSource, /livingMissionStorageKey/);
  assert.match(resultsPageSource, /data-section-id/);
  assert.match(resultsPageSource, /restoreAlpha04UiState/);
  assert.match(resultsPageSource, /alpha04Scenario/);
  assert.match(resultsCss, /\.alpha04-workspace-card/);
  assert.match(resultsCss, /\.is-recently-updated/);
  assert.match(resultsHtml, /20260729-alpha05-execution-orchestrator/);
  assert.match(resultsEntry, /20260729-alpha05-execution-orchestrator/);
});

test("ALPHA-04 storage key is deterministic and scoped to a mission", () => {
  const mission = { rawInput: "Sapporo trip", destination: { city: "Sapporo", country: "Japan" } };
  assert.equal(livingMissionStorageKey(mission), livingMissionStorageKey(mission));
  assert.notEqual(livingMissionStorageKey(mission), livingMissionStorageKey({ rawInput: "Paris trip" }));
});
