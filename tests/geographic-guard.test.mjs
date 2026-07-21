import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createGeographicScope, enforceGeographicScope, recommendationMatchesScope, stampGeographicEvidence } from "../js/engine/location/geographic-guard.js";

const lima = createGeographicScope({ destination: { city: "Lima", country: "Peru", countryCode: "PE" } }, { latitude: -12.0464, longitude: -77.0428 });

test("recommendations must match the detected city and country", () => {
  const allowed = stampGeographicEvidence({ label: "Miraflores" }, lima, { latitude: -12.1211, longitude: -77.0297 });
  const wrongCity = { ...allowed, city: "Seoul", country: "South Korea", countryCode: "KR" };
  assert.equal(recommendationMatchesScope(allowed, lima), true);
  assert.equal(recommendationMatchesScope(wrongCity, lima), false);
  assert.deepEqual(enforceGeographicScope([allowed, wrongCity], lima).map((item) => item.label), ["Miraflores"]);
});

test("coordinates outside the destination radius are rejected", () => {
  const nyc = createGeographicScope({ destination: { city: "New York City", country: "United States", countryCode: "US" } }, { latitude: 40.7128, longitude: -74.006 });
  const centralPark = stampGeographicEvidence({ label: "Central Park" }, nyc, { latitude: 40.7812, longitude: -73.9665 });
  const losAngeles = { ...centralPark, city: "New York City", latitude: 34.0522, longitude: -118.2437 };
  assert.equal(recommendationMatchesScope(centralPark, nyc), true);
  assert.equal(recommendationMatchesScope(losAngeles, nyc), false);
});

test("loading never substitutes Seoul for an unresolved destination", async () => {
  const source = await readFile(new URL("../js/pages/loading-page.js", import.meta.url), "utf8");
  assert.match(source, /no other city was substituted/);
  assert.match(source, /return null;/);
  assert.doesNotMatch(source, /return \{ latitude: 37\.5665, longitude: 126\.978 \};\s*\n\};/);
});
