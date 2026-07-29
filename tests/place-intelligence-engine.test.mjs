import test from "node:test";
import assert from "node:assert/strict";
import {
  decidePlaceResolution,
  distanceKm,
  placeFallbackPlan,
  rankPlaceCandidates,
  validatePlaceMission
} from "../js/engine/world/place-intelligence-engine.js";

const paris = [
  { city: "Paris", country: "France", code: "FR", state: "Île-de-France", latitude: 48.8566, longitude: 2.3522, importance: .95, capital: true },
  { city: "Paris", country: "United States", code: "US", state: "Texas", latitude: 33.6609, longitude: -95.5555, importance: .38 },
  { city: "Paris", country: "Canada", code: "CA", state: "Ontario", latitude: 43.194, longitude: -80.3845, importance: .36 }
];

test("ambiguous Paris requires an explicit destination selection", () => {
  const result = decidePlaceResolution("Paris", paris);
  assert.equal(result.autoSelect, false);
  assert.equal(result.requiresSelection, true);
  assert.equal(result.selected, null);
  assert.equal(result.candidates.length, 3);
  assert.equal(result.candidates[0].flag, "🇫🇷");
});

test("country-qualified Paris auto-selects with high confidence", () => {
  const result = decidePlaceResolution("Trip to Paris France", paris);
  assert.equal(result.autoSelect, true);
  assert.equal(result.selected.country, "France");
  assert.ok(result.confidence >= .95);
});

test("multilingual aliases can be ranked without changing canonical place data", () => {
  const candidates = [{ city: "Ho Chi Minh City", country: "Vietnam", code: "VN", aliases: ["Saigon", "HCMC", "호치민", "Ciudad Ho Chi Minh"], importance: .85 }];
  for (const query of ["Saigon", "HCMC", "호치민", "Ciudad Ho Chi Minh"]) {
    assert.equal(rankPlaceCandidates(query, candidates)[0].city, "Ho Chi Minh City");
  }
});

test("distance is included when the user location is available", () => {
  const km = distanceKm({ latitude: 37.5665, longitude: 126.978 }, { latitude: 35.6762, longitude: 139.6503 });
  assert.ok(km > 1100 && km < 1200);
});

test("final validation rejects another city and blank sections", () => {
  const destination = { city: "New York City", country: "United States", code: "US" };
  const invalid = validatePlaceMission({ destination, language: "en", recommendations: [{ city: "Seoul", country: "South Korea", countryCode: "KR" }], sections: [{ items: [] }] });
  assert.equal(invalid.passed, false);
  assert.equal(invalid.checks.recommendationsBelongToDestination, false);
  assert.equal(invalid.checks.noBlankSections, false);
});

test("fallback order never permits a blank result", () => {
  const result = placeFallbackPlan({ DESTINATION_SPECIFIC_DATA: false, COUNTRY_LEVEL_DATA: false, REGIONAL_RECOMMENDATIONS: true });
  assert.equal(result.selected, "REGIONAL_RECOMMENDATIONS");
  assert.equal(result.blankResultsAllowed, false);
});
