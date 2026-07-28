import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ACTION_STATES,
  ALPHA05_EXECUTION_ORCHESTRATOR_VERSION,
  advanceActionGraph,
  createExecutionOrchestrator,
  validateExecutionOrchestrator
} from "../js/engine/workspace/execution-orchestrator-alpha05.js";

const resultsPageSource = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
const resultsHtml = readFileSync(new URL("../results.html", import.meta.url), "utf8");
const resultsEntry = readFileSync(new URL("../results.js", import.meta.url), "utf8");
const resultsCss = readFileSync(new URL("../results.css", import.meta.url), "utf8");

const travelMission = Object.freeze({
  type: "travel",
  rawInput: "Sapporo trip",
  schedule: { startDate: "2026-07-27", endDate: "2026-07-30" },
  destination: { city: "Sapporo", country: "Japan" }
});

test("ALPHA-05 creates an action graph with only approved action states", () => {
  const orchestrator = createExecutionOrchestrator(travelMission, { language: "en" });
  assert.equal(orchestrator.version, ALPHA05_EXECUTION_ORCHESTRATOR_VERSION);
  assert.ok(orchestrator.actionGraph.nodes.length >= 7);
  assert.ok(orchestrator.actionGraph.nodes.every((action) => ACTION_STATES.includes(action.status)));
  assert.ok(orchestrator.actionGraph.edges.some((edge) => edge.from === "travel-dates" && edge.to === "flight-search"));
  assert.equal(validateExecutionOrchestrator(orchestrator).valid, true);
});

test("dependencies keep date-sensitive actions blocked until travel dates exist", () => {
  const orchestrator = createExecutionOrchestrator({ ...travelMission, schedule: {} }, { language: "en", scenario: "travel-awaiting-dates" });
  const flightSearch = orchestrator.actionGraph.nodes.find((action) => action.id === "flight-search");
  const hotelCompare = orchestrator.actionGraph.nodes.find((action) => action.id === "hotel-compare");
  assert.equal(flightSearch.status, "Blocked");
  assert.deepEqual(flightSearch.blockedBy, ["travel-dates"]);
  assert.equal(hotelCompare.status, "Blocked");
  assert.equal(orchestrator.nextBestAction.actionId, "travel-dates");
});

test("approval scopes stay separated for search compare booking and provider contact", () => {
  const orchestrator = createExecutionOrchestrator(travelMission, { language: "en", scenario: "travel-awaiting-approval" });
  const scopes = new Set(orchestrator.actionGraph.nodes.filter((action) => action.approvalRequired).map((action) => action.approvalScope));
  assert.ok(scopes.has("search"));
  assert.ok(scopes.has("compare"));
  assert.ok(scopes.has("booking"));
  assert.ok(scopes.has("provider_contact"));
  assert.ok(![...scopes].some((scope) => /booking.*payment|payment.*booking/i.test(scope)));
  assert.equal(orchestrator.nextBestAction.actionId, "booking-approval");
});

test("provider failure or blocked hotel does not fail the entire mission", () => {
  const orchestrator = createExecutionOrchestrator(travelMission, { language: "en", scenario: "travel-blocked-hotel" });
  const hotel = orchestrator.actionGraph.nodes.find((action) => action.id === "hotel-compare");
  const restaurants = orchestrator.actionGraph.nodes.find((action) => action.id === "restaurant-review");
  const blockedSection = orchestrator.board.find((section) => section.id === "blocked");
  const readySection = orchestrator.board.find((section) => section.id === "readyNow");
  assert.equal(hotel.status, "Blocked");
  assert.equal(restaurants.status, "Ready");
  assert.ok(blockedSection.actions.includes("hotel-compare"));
  assert.ok(readySection.actions.includes("restaurant-review"));
});

test("execution requests are mock/future and execution remains disabled", () => {
  const orchestrator = createExecutionOrchestrator(travelMission, { language: "en" });
  assert.equal(orchestrator.executionSafety.executionEnabled, false);
  assert.ok(orchestrator.actionRequests.length);
  assert.ok(orchestrator.actionRequests.every((request) => request.liveIntegration === false));
  assert.ok(orchestrator.actionRequests.every((request) => request.providerRedirectState.carriesSensitiveCredentials === false));
});

test("action graph can advance one action and unlock dependencies safely", () => {
  const orchestrator = createExecutionOrchestrator({ ...travelMission, schedule: {} }, { language: "en", scenario: "travel-awaiting-dates" });
  const advanced = advanceActionGraph(orchestrator, { actionId: "travel-dates", status: "Completed", reason: "Dates selected" });
  const flightSearch = advanced.actionGraph.nodes.find((action) => action.id === "flight-search");
  assert.equal(flightSearch.status, "Ready");
});

test("ALPHA-05 supports general multi-domain missions without travel-only logic", () => {
  const orchestrator = createExecutionOrchestrator({
    type: "healthcare",
    rawInput: "Find a dentist today",
    resolutionPlan: { domain: "healthcare", missionId: "healthcare-1", resolutionId: "resolution-healthcare-1", approvalRequiredActions: ["schedule", "contact"] }
  }, { language: "en", scenario: "awaiting-approval" });
  assert.equal(orchestrator.domain, "healthcare");
  assert.ok(orchestrator.actionGraph.nodes.some((action) => action.id === "provider-shortlist"));
  assert.equal(validateExecutionOrchestrator(orchestrator).valid, true);
});

test("ALPHA-05 integrates with results page, CSS, and cache-busted demo entry", () => {
  assert.match(resultsPageSource, /createExecutionOrchestratorCard/);
  assert.match(resultsPageSource, /alpha05Scenario/);
  assert.match(resultsCss, /\.alpha05-orchestrator-card/);
  assert.match(resultsCss, /\.alpha05-board/);
  assert.match(resultsHtml, /20260729-results-sophisticated/);
  assert.match(resultsEntry, /20260729-results-sophisticated/);
});
