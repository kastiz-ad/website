import test from "node:test";
import assert from "node:assert/strict";
import { buildMissionContext } from "../js/engine/context/mission-context-intelligence.js";
import { generateExperience } from "../js/engine/experience-generator/one-experience-generator.js";
import { readFile } from "node:fs/promises";

test("local couple date disables international-only providers", () => {
  const context = buildMissionContext("여친 주말 데이트", { currentLocation: "Seoul", language: "ko" });
  assert.equal(context.destination.id, "seoul");
  assert.equal(context.relationship.value, "couple");
  assert.equal(context.distanceClass, "LOCAL_CITY");
  assert.equal(context.providerEligibility.flights, false);
  assert.equal(context.providerEligibility.airports, false);
  assert.equal(context.providerEligibility.visa, false);
  assert.equal(context.providerEligibility.hotel, false);
});

test("NYC trip is destination-locked and enables international preparation", () => {
  const context = buildMissionContext("NYC 5 day trip", { currentLocation: "Seoul", language: "en" });
  assert.equal(context.destination.city, "New York City");
  assert.equal(context.destination.country, "US");
  assert.equal(context.durationDays, 5);
  assert.equal(context.distanceClass, "INTERNATIONAL");
  assert.equal(context.providerEligibility.flights, true);
  assert.equal(context.providerEligibility.hotel, true);
  assert.equal(context.providerEligibility.visa, true);
  assert.equal(context.geographicConstraint.strict, true);
});

test("a non-Seoul destination can never receive Seoul-only ingredients", () => {
  const context = buildMissionContext("Busan date", { currentLocation: "Seoul", language: "en" });
  const generated = generateExperience({ mission: "Busan date", context, language: "en" });
  const serialized = JSON.stringify(generated);
  assert.equal(generated.quality.passed, true);
  assert.doesNotMatch(serialized, /han-river|lotte-world|seoul-sky|hongdae|myeongdong|gangnam/i);
});

test("explicit destination metadata outranks generic mission wording", () => {
  const context = buildMissionContext("weekend trip", { currentLocation: "Seoul", destination: "New York City", destinationCountryCode: "US", durationDays: 5 });
  assert.equal(context.destination.id, "new-york");
  assert.equal(context.distanceClass, "INTERNATIONAL");
});

test("approval remains required and external execution remains disabled", () => {
  const context = buildMissionContext("서울 데이트", { currentLocation: "Seoul" });
  const generated = generateExperience({ mission: "서울 데이트", context });
  assert.deepEqual(generated.approval, { required: true, approved: false, externalExecution: false });
});

test("travel results use destination-locked travel recommendations, not the generic experience generator", async () => {
  const source = await readFile(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  assert.match(source, /Travel options prepared specifically for/);
  assert.match(source, /Every displayed travel option is restricted to the detected destination/);
  assert.match(source, /const review = experienceMission/);
});
