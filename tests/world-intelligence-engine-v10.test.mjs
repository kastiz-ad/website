import test from "node:test";
import assert from "node:assert/strict";
import { detectMissionLanguage, resolveWorldDestination, validateWorldMission } from "../js/engine/world/world-intelligence-engine.js";
import { buildMissionContext } from "../js/engine/context/mission-context-intelligence.js";
import { classifyMission } from "../js/engine/mission-classification.js";

const cases = [
  ["viaje a ho chi min", "es", "Ho Chi Minh City", "VN"],
  ["리마", "ko", "Lima", "PE"],
  ["Mexico City", "en", "Mexico City", "MX"],
  ["Weekend trip to Osaka", "en", "Osaka", "JP"],
  ["Business trip to Singapore", "en", "Singapore", "SG"],
  ["7 day honeymoon in Japan", "en", "Tokyo", "JP"],
  ["서울에서 부산 2박3일", "ko", "Busan", "KR"]
];

for (const [mission, language, city, countryCode] of cases) {
  test(`V10 resolves ${mission}`, () => {
    assert.equal(detectMissionLanguage(mission).value, language);
    const destination = resolveWorldDestination(mission);
    assert.equal(destination?.city, city);
    assert.equal(destination?.countryCode, countryCode);
    const context = buildMissionContext(mission, { currentLocation: "Seoul" });
    assert.equal(context.destination.city, city);
    assert.equal(context.destination.countryCode, countryCode);
    assert.equal(context.interfaceLanguage, "en");
  });
}

test("Spanish travel wording routes into the travel engine", () => {
  assert.equal(classifyMission("viaje a ho chi min"), "travel");
  assert.equal(classifyMission("vacaciones en Lima"), "travel");
});

test("UI language never overrides mission language", () => {
  assert.equal(buildMissionContext("viaje a ho chi min", { language: "ko", currentLocation: "Seoul" }).missionLanguage.value, "es");
  assert.equal(buildMissionContext("여친 주말 데이트", { language: "en", currentLocation: "Seoul" }).missionLanguage.value, "ko");
  assert.equal(buildMissionContext("Weekend trip to Osaka", { language: "es", currentLocation: "Seoul" }).missionLanguage.value, "en");
});

test("explicit destination always outranks current location", () => {
  const context = buildMissionContext("Mexico City", { currentLocation: "Seoul" });
  assert.equal(context.destination.city, "Mexico City");
  assert.equal(context.origin.city, "Seoul");
  assert.equal(context.requiresInternationalTravel, true);
});

test("local romantic mission uses current city without international providers", () => {
  const context = buildMissionContext("여친 주말 데이트", { currentLocation: "Seoul" });
  assert.equal(context.destination.city, "Seoul");
  assert.equal(context.relationship.value, "couple");
  assert.equal(context.providerEligibility.flights, false);
  assert.equal(context.providerEligibility.visa, false);
});

test("destination quality gate rejects mixed-city recommendations", () => {
  const context = buildMissionContext("Mexico City", { currentLocation: "Seoul" });
  const quality = validateWorldMission(context, [
    { city: "Mexico City", countryCode: "MX" },
    { city: "Seoul", countryCode: "KR" }
  ]);
  assert.equal(quality.passed, false);
  assert.equal(quality.invalid.length, 1);
});
