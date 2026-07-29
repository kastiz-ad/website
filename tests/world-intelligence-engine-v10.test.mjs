import test from "node:test";
import assert from "node:assert/strict";
import { ambiguousWorldDestinationMatches, detectMissionLanguage, resolveWorldDestination, validateWorldMission } from "../js/engine/world/world-intelligence-engine.js";
import { buildMissionContext } from "../js/engine/context/mission-context-intelligence.js";
import { classifyMission } from "../js/engine/mission-classification.js";

const cases = [
  ["viaje a ho chi min", "es", "Ho Chi Minh City", "VN"],
  ["리마", "ko", "Lima", "PE"],
  ["Mexico City", "en", "Mexico City", "MX"],
  ["Weekend trip to Osaka", "en", "Osaka", "JP"],
  ["Business trip to Singapore", "en", "Singapore", "SG"],
  ["7 day honeymoon in Japan", "en", "Japan", "JP"],
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

const requiredDestinations = [
  ["Tokyo", "Tokyo", "JP"], ["Osaka", "Osaka", "JP"], ["Kyoto", "Kyoto", "JP"], ["Seoul", "Seoul", "KR"],
  ["Busan", "Busan", "KR"], ["Jeju", "Jeju", "KR"], ["Ho Chi Minh", "Ho Chi Minh City", "VN"], ["Hanoi", "Hanoi", "VN"],
  ["Singapore", "Singapore", "SG"], ["Bangkok", "Bangkok", "TH"], ["Taipei", "Taipei", "TW"], ["Hong Kong", "Hong Kong", "HK"],
  ["Lima", "Lima", "PE"], ["Cusco", "Cusco", "PE"], ["Machu Picchu", "Machu Picchu", "PE"], ["New York", "New York City", "US"],
  ["Los Angeles", "Los Angeles", "US"], ["London England", "London", "GB"], ["Paris France", "Paris", "FR"], ["Rome", "Rome", "IT"],
  ["Barcelona", "Barcelona", "ES"], ["Sydney", "Sydney", "AU"], ["Melbourne", "Melbourne", "AU"], ["Cape Town", "Cape Town", "ZA"],
  ["Dubai", "Dubai", "AE"], ["Mexico City", "Mexico City", "MX"], ["Santiago Chile", "Santiago", "CL"], ["Reykjavik", "Reykjavik", "IS"],
  ["Auckland", "Auckland", "NZ"]
];

test("V10.1 resolves required worldwide regression destinations", () => {
  for (const [query, city, countryCode] of requiredDestinations) {
    const destination = resolveWorldDestination(query);
    assert.equal(destination?.city, city, query);
    assert.equal(destination?.countryCode, countryCode, query);
    const context = buildMissionContext(`${query} trip`, { currentLocation: "Seoul" });
    assert.equal(context.destination.city, city, query);
    assert.equal(context.destination.countryCode, countryCode, query);
    assert.ok(context.destination.countryName || context.destination.country, query);
  }
});

test("V10.1 real Unicode Korean and Spanish aliases resolve correctly", () => {
  const aliases = [
    ["서울 여행", "Seoul", "KR"], ["ソウル", "Seoul", "KR"], ["리마 여행", "Lima", "PE"], ["뉴욕 여행", "New York City", "US"],
    ["엘에이 여행", "Los Angeles", "US"], ["도쿄 여행", "Tokyo", "JP"], ["오사카 여행", "Osaka", "JP"],
    ["호치민 여행", "Ho Chi Minh City", "VN"], ["상파울로 여행", "São Paulo", "BR"], ["과테말라 여행", "Guatemala City", "GT"],
    ["viaje a Nueva York", "New York City", "US"], ["viaje a Ciudad de México", "Mexico City", "MX"],
    ["viaje a París Francia", "Paris", "FR"], ["viaje a São Paulo", "São Paulo", "BR"]
  ];
  for (const [query, city, countryCode] of aliases) {
    const destination = resolveWorldDestination(query);
    assert.equal(destination?.city, city, query);
    assert.equal(destination?.countryCode, countryCode, query);
  }
});

test("V10.1 real Unicode language detection and ambiguity work", () => {
  assert.equal(detectMissionLanguage("일본 여행").value, "ko");
  assert.equal(detectMissionLanguage("viaje a México").value, "es");
  assert.equal(resolveWorldDestination("산티아고 여행"), null);
  assert.ok(ambiguousWorldDestinationMatches("산티아고 여행").length >= 4);
  assert.equal(resolveWorldDestination("Santiago Chile")?.countryCode, "CL");
  assert.equal(resolveWorldDestination("Paris France")?.countryCode, "FR");
  assert.equal(resolveWorldDestination("London Ontario")?.countryCode, "CA");
});
