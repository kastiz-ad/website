import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { applyMissionEdit, createFounderOrchestrationDemo } from "../js/engine/orchestration/mission-orchestration-engine.js";
import { createMissionState } from "../js/engine/orchestration/mission-store.js";
import { parseMissionEdit, parseMissionSeed } from "../js/engine/orchestration/mission-parser.js";

const baseJapanMission = () => ({
  id: "demo-japan",
  missionId: "demo-japan",
  type: "travel",
  rawInput: "Plan my Japan trip.",
  mission: "Plan my Japan trip.",
  destination: { city: "Japan", country: "Japan", countryCode: "JP" },
  schedule: { startDate: "2026-08-01", endDate: "2026-08-07" },
  selectedFlight: { airline: "Korean Air" },
  selectedHotel: { name: "Hotel Metropolitan Tokyo Marunouchi" },
  selectedTransport: { name: "Airport rail + subway" },
  budget: { min: 2400000, max: 5300000 },
  restaurants: [{ name: "Tokyo ramen alley", tags: ["ramen"] }],
  places: [{ name: "Universal Studios Japan", tags: ["theme park"] }]
});

test("MissionState becomes the one canonical mission object", () => {
  const state = createMissionState(baseJapanMission());
  assert.equal(state.id, "demo-japan");
  assert.equal(state.destinations[0].city, "Japan");
  assert.equal(state.selectedFlight.airline, "Korean Air");
  assert.equal(state.selectedHotel.name, "Hotel Metropolitan Tokyo Marunouchi");
  assert.ok(Array.isArray(state.travellers));
});

test("Mission parser extracts structured seed facts and edit intent", () => {
  const seed = parseMissionSeed("Plan a 7 day Japan trip from Seoul for my mother and me.");
  assert.equal(seed.duration, 7);
  assert.deepEqual(seed.travellers, ["user", "mother"]);
  const edit = parseMissionEdit("Add matcha ice cream.");
  assert.equal(edit.type, "ADD_FOOD_STOP");
  assert.deepEqual(edit.changedFields, ["foodPreferences", "restaurants", "dailyPlan"]);
});

test("Add matcha updates only food route timeline and map dependencies", () => {
  const result = applyMissionEdit(baseJapanMission(), "Add matcha ice cream.");
  assert.equal(result.regeneratedEverything, false);
  assert.equal(result.mission.selectedFlight.airline, "Korean Air");
  assert.equal(result.mission.selectedHotel.name, "Hotel Metropolitan Tokyo Marunouchi");
  assert.equal(result.mission.schedule.startDate, "2026-08-01");
  assert.match(result.mission.orchestrationInjections.restaurants[0].name, /matcha/i);
  assert.ok(result.affectedSections.includes("restaurants"));
  assert.ok(result.affectedSections.includes("timeline"));
  assert.ok(result.affectedSections.includes("journey"));
  assert.ok(!result.affectedSections.includes("flights"));
  assert.ok(!result.affectedSections.includes("hotels"));
  assert.deepEqual(result.providerRefreshPlan.map((item) => item.scope), ["nearby_food_only", "changed_itinerary_segments_only", "changed_markers_only"]);
});

test("Add sushi, no seafood, vegetarian and no museums change the correct slices", () => {
  const sushi = applyMissionEdit(baseJapanMission(), "Add sushi.");
  assert.match(sushi.mission.orchestrationInjections.restaurants[0].name, /sushi/i);

  const noSeafood = applyMissionEdit(sushi.mission, "No seafood.");
  assert.ok(noSeafood.mission.missionState.hardConstraints.includes("no seafood"));
  assert.ok(noSeafood.affectedSections.includes("restaurants"));
  assert.ok(!noSeafood.affectedSections.includes("flights"));

  const vegetarian = applyMissionEdit(baseJapanMission(), "Only vegetarian restaurants.");
  assert.match(vegetarian.mission.orchestrationInjections.restaurants[0].name, /vegetarian/i);

  const noMuseums = applyMissionEdit(baseJapanMission(), "Remove museums.");
  assert.ok(noMuseums.mission.missionState.hardConstraints.includes("no museums"));
  assert.ok(noMuseums.affectedSections.includes("places"));
  assert.ok(noMuseums.affectedSections.includes("timeline"));
});

test("Accessibility edit updates mobility dependents without changing destination or dates", () => {
  const result = applyMissionEdit(baseJapanMission(), "My mother cannot use stairs.");
  assert.ok(result.mission.missionState.mobilityRequirements.includes("no stairs"));
  assert.equal(result.mission.destination.city, "Japan");
  assert.equal(result.mission.schedule.endDate, "2026-08-07");
  assert.ok(result.affectedSections.includes("preparation"));
  assert.ok(result.affectedSections.includes("restaurants"));
  assert.ok(result.affectedSections.includes("places"));
  assert.ok(result.affectedSections.includes("timeline"));
  assert.ok(!result.affectedSections.includes("flights"));
});

test("Hotel, budget, shopping and Disney edits recalculate only affected modules", () => {
  const hotel = applyMissionEdit(baseJapanMission(), "Stay closer to Shibuya.");
  assert.equal(hotel.mission.accommodation.requestedArea, "Shibuya");
  assert.ok(hotel.affectedSections.includes("hotels"));
  assert.ok(!hotel.affectedSections.includes("flights"));

  const budget = applyMissionEdit(baseJapanMission(), "Reduce budget by $500.");
  assert.equal(budget.mission.constraints.budgetAdjustment, -500);
  assert.ok(budget.affectedSections.includes("budget"));
  assert.ok(budget.affectedSections.includes("hotels"));
  assert.ok(budget.affectedSections.includes("flights"));

  const shopping = applyMissionEdit(baseJapanMission(), "Spend more time shopping.");
  assert.match(shopping.mission.orchestrationInjections.places[0].name, /shopping/i);
  assert.ok(shopping.affectedSections.includes("places"));

  const disney = applyMissionEdit(baseJapanMission(), "Move Disney to Day 3.");
  assert.equal(disney.mission.orchestrationTimelinePins.Disney, 3);
  assert.ok(disney.affectedSections.includes("timeline"));
  assert.ok(!disney.affectedSections.includes("hotels"));
});

test("Founder demo chains accessibility and matcha without page refresh architecture", () => {
  const demo = createFounderOrchestrationDemo(baseJapanMission());
  assert.deepEqual(demo.edits, ["My mother cannot use stairs.", "Add matcha ice cream."]);
  assert.ok(demo.finalMission.missionState.mobilityRequirements.includes("no stairs"));
  assert.match(demo.finalMission.orchestrationInjections.restaurants[0].name, /matcha/i);
  assert.ok(demo.providerRefreshPlan.some((item) => item.scope === "nearby_food_only"));
});

test("Results page is wired to Mission Orchestration, undo and changed-section rendering", () => {
  const source = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../results.css", import.meta.url), "utf8");
  assert.match(source, /applyMissionEdit/);
  assert.match(source, /data-mission-undo/);
  assert.match(source, /orchestrationInjections/);
  assert.match(source, /missionState/);
  assert.match(css, /revision-affected-parts/);
});

