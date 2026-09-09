import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { classifyMission, destinationAwareMissionType } from "../js/engine/mission-classification.js";
import { resolveCanonicalDestinationIdentity } from "../js/engine/world/canonical-destination-identity.js";

globalThis.addEventListener = () => {};
globalThis.localStorage = { getItem: (key) => key === "kastiz-one-consent" ? '{"necessary":true,"analytics":false}' : null, setItem: () => {} };
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
const { detectWorldwideTravelDestination } = await import("../js/ui/mission-followup.js");

const routedType = async (mission) => {
  const classifiedType = classifyMission(mission);
  if (classifiedType !== "general_mission" && classifiedType !== "travel") return classifiedType;
  const matches = await detectWorldwideTravelDestination(mission, "en");
  return destinationAwareMissionType(classifiedType, { resolvedDestination: matches.length > 0 });
};

test("qualified bare destinations enter Travel without hard-coded classifier cities", async () => {
  for (const input of [
    "Medellin Colombia",
    "Medellín Colombia",
    "Tokyo Japan",
    "Busan Korea",
    "Paris France",
    "Cape Town South Africa",
    "Queenstown New Zealand",
    "서울 한국"
  ]) assert.equal(await routedType(input), "travel", input);

  const parisTexas = resolveCanonicalDestinationIdentity("Paris Texas");
  assert.equal(parisTexas.status, "resolved");
  assert.equal(destinationAwareMissionType(classifyMission("Paris Texas"), { resolvedDestination: true }), "travel");

  const tokyo = resolveCanonicalDestinationIdentity("東京 日本");
  assert.equal(tokyo.status, "resolved");
  assert.equal(destinationAwareMissionType(classifyMission("東京 日本"), { resolvedDestination: true }), "travel");
});

test("explicit Medellín travel request remains Travel", async () => {
  assert.equal(await routedType("Plan a 5-day trip to Medellín, Colombia for 2 people"), "travel");
});

test("destination evidence cannot override explicit non-travel mission precedence", async () => {
  for (const [input, expected] of [
    ["Prepare a presentation about Medellín", "presentation"],
    ["Research Medellín's economy", "research"],
    ["Prepare me for an interview in Tokyo", "interview"]
  ]) {
    assert.equal(classifyMission(input), expected, input);
    assert.equal(destinationAwareMissionType(expected, { resolvedDestination: true }), expected, input);
    assert.equal(await routedType(input), expected, input);
  }
});

test("country-only and ambiguous names do not become resolved city evidence", () => {
  for (const input of ["Japan", "Georgia"]) {
    const resolution = resolveCanonicalDestinationIdentity(input);
    assert.equal(resolution.status, "country_requires_anchor", input);
    assert.equal(resolution.identity.requiresLocalAnchor, true, input);
  }
  const paris = resolveCanonicalDestinationIdentity("Paris");
  assert.equal(paris.status, "ambiguous");
  assert.equal(paris.identity, null);
});

test("homepage routing selects the existing Travel renderer and preserves its rich surfaces", async () => {
  const [home, results] = await Promise.all([
    readFile(new URL("../js/pages/home-page.js", import.meta.url), "utf8"),
    readFile(new URL("../js/pages/results-page.js", import.meta.url), "utf8")
  ]);
  assert.match(home, /destinationAwareMissionType/);
  assert.match(home, /openScheduleModal\(mission\)/);
  assert.match(results, /isTravelResult/);
  assert.match(results, /renderTravelMission/);
  for (const surface of ["flight", "hotel", "restaurant", "itinerary", "transport", "budget", "trust", "modify", "approval", "provider"]) {
    assert.match(results.toLowerCase(), new RegExp(surface), surface);
  }
});

test("homepage cache chain deploys the destination-aware routing fix", async () => {
  const [html, entry, home] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../script.js", import.meta.url), "utf8"),
    readFile(new URL("../js/pages/home-page.js", import.meta.url), "utf8")
  ]);
  const version = /20260908-global-travel-routing-v1/;
  assert.match(html, version);
  assert.match(entry, version);
  assert.match(home, version);
});

test("results bootstrap preserves a matching stored Travel mission before URL fallback reconstruction", async () => {
  const [resultsHtml, resultsEntry, results] = await Promise.all([
    readFile(new URL("../results.html", import.meta.url), "utf8"),
    readFile(new URL("../results.js", import.meta.url), "utf8"),
    readFile(new URL("../js/pages/results-page.js", import.meta.url), "utf8")
  ]);
  assert.match(results, /const storedResultMatchesRoute/);
  assert.match(results, /storedResultMatchesRoute\(parsed, params\) \|\| !hasExplicitPreviewMission/);
  assert.ok(
    results.indexOf("storedResultMatchesRoute(parsed, params)") < results.indexOf("const manualScenario = getManualScenarioResult()"),
    "matching same-flow storage must be considered before manual URL reconstruction"
  );
  const version = /20260910-approved-dashboard-v10/;
  assert.match(resultsHtml, version);
  assert.match(resultsEntry, version);
});
