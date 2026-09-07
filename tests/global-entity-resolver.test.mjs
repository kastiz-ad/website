import test from "node:test";
import assert from "node:assert/strict";
import { createCanonicalDestinationIdentity } from "../js/engine/world/canonical-destination-identity.js";
import { createEntitySearchFallback, resolveDestinationEntities } from "../js/engine/world/global-entity-resolver.js";
import { oneFreeTrustIndex } from "../js/ui/one-free-customer-journey.js";
import { applyMissionEdit } from "../js/engine/orchestration/mission-orchestration-engine.js";

const identity = (city, country, countryCode, latitude, longitude, state = "") => createCanonicalDestinationIdentity({ city, country, countryCode, latitude, longitude, state }, { source: "provider_geocoder" });
const places = (destination, candidates, kind = "restaurant", category = "") => resolveDestinationEntities({ identity: destination, candidates, kind, category });

test("provider restaurants retain canonical locality, evidence and identity", () => {
  const medellin = identity("Medellín", "Colombia", "CO", 6.2442, -75.5812, "Antioquia");
  const result = places(medellin, [{ label: "Verified venue", city: "Medellín", countryCode: "CO", latitude: 6.245, longitude: -75.58, source: "OpenStreetMap", providerId: "node-1", geographicVerified: true }]);
  assert.equal(result.entities[0].destinationKey, medellin.key);
  assert.equal(result.entities[0].provenance.source, "provider");
  assert.equal(result.entities[0].confidence, 0.94);
});

test("same-name cities cannot leak restaurant candidates", () => {
  const parisFrance = identity("Paris", "France", "FR", 48.8566, 2.3522, "Île-de-France");
  const result = places(parisFrance, [{ label: "Texas venue", city: "Paris", countryCode: "US", latitude: 33.66, longitude: -95.55, source: "OpenStreetMap", geographicVerified: true }]);
  assert.equal(result.entities[0].namedEntity, false);
  assert.equal(result.rejected[0].reason, "destination_conflict");
});

test("coordinates reject cross-city contamination even inside one country", () => {
  const cartagena = identity("Cartagena", "Colombia", "CO", 10.391, -75.479);
  const result = places(cartagena, [{ label: "Bogotá venue", countryCode: "CO", latitude: 4.711, longitude: -74.072, source: "OpenStreetMap", geographicVerified: true }]);
  assert.equal(result.rejected[0].reason, "destination_conflict");
});

test("unverified names are rejected in favor of honest category search", () => {
  const busan = identity("Busan", "South Korea", "KR", 35.1796, 129.0756);
  const result = places(busan, [{ label: "Plausible Dragon Restaurant" }], "restaurant", "seafood");
  assert.equal(result.status, "fallback");
  assert.equal(result.entities[0].entityType, "GENERIC_ACTIVITY");
  assert.equal(result.entities[0].namedEntity, false);
});

test("country-only and ambiguous identities block local entity generation", () => {
  const country = createCanonicalDestinationIdentity({ city: "Japan", country: "Japan", countryCode: "JP", placeType: "country" }, { source: "verified_catalog" });
  assert.equal(places(country, []).entities.length, 0);
  const ambiguous = createCanonicalDestinationIdentity({ city: "San Jose", country: "", countryCode: "" }, { status: "ambiguous", source: "parsed_text" });
  assert.equal(places(ambiguous, []).entities.length, 0);
});

test("nearby places are clearly classified as excursions", () => {
  const paris = identity("Paris", "France", "FR", 48.8566, 2.3522);
  const result = places(paris, [{ label: "Verified nearby place", countryCode: "FR", latitude: 49.4, longitude: 2.4, source: "OpenStreetMap", geographicVerified: true }], "place");
  assert.equal(result.entities[0].entityType, "NEARBY_EXCURSION");
  assert.equal(result.entities[0].relationshipToDestination, "nearby_excursion");
});

test("deduplication uses provider ids and geographic evidence", () => {
  const reykjavik = identity("Reykjavík", "Iceland", "IS", 64.1466, -21.9426);
  const candidate = { label: "Real Place", city: "Reykjavík", countryCode: "IS", latitude: 64.15, longitude: -21.94, source: "OpenStreetMap", providerId: "42", geographicVerified: true };
  const result = places(reykjavik, [candidate, { ...candidate, label: "Real Place duplicate" }], "place");
  assert.equal(result.entities.filter((item) => item.namedEntity).length, 1);
  assert.ok(result.rejected.some((item) => item.reason === "duplicate"));
});

test("localized fallback remains category-level and carries provider handoff", () => {
  const nairobi = identity("Nairobi", "Kenya", "KE", -1.2864, 36.8172);
  const fallback = createEntitySearchFallback({ identity: nairobi, kind: "place", category: "museum", locale: "fr" });
  assert.match(fallback.name, /Rechercher/);
  assert.match(fallback.providerHandoff.query, /Nairobi/);
  assert.equal(fallback.image, null);
});

test("generic entity evidence lowers the existing Trust Index", () => {
  const provider = oneFreeTrustIndex({ sourceStates: ["provider"] });
  const fallback = oneFreeTrustIndex({ sourceStates: ["generic_fallback"], missingProviders: 1, missingImages: 1 });
  assert.ok(Number(fallback.score) < Number(provider.score));
  assert.equal(fallback.label, "Limited");
});

test("Modify uses the canonical destination and does not invent a restaurant", () => {
  const medellin = identity("Medellín", "Colombia", "CO", 6.2442, -75.5812, "Antioquia");
  const result = applyMissionEdit({ id: "m1", type: "travel", destination: medellin, destinationIdentity: medellin, mission: "Trip to Medellín", restaurants: [], places: [] }, "Add another restaurant", { language: "en" });
  const added = result.mission.orchestrationInjections.restaurants[0];
  assert.equal(added.namedEntity, false);
  assert.equal(added.destinationKey, medellin.key);
  assert.match(added.name, /Search for another restaurant in Medellín/);
});

test("representative and previously uncurated destinations use one generic contract", () => {
  const samples = [
    ["Tokyo", "Japan", "JP", 35.6762, 139.6503], ["Cape Town", "South Africa", "ZA", -33.9249, 18.4241],
    ["Chiang Mai", "Thailand", "TH", 18.7883, 98.9853], ["Queenstown", "New Zealand", "NZ", -45.0312, 168.6626],
    ["Tirana", "Albania", "AL", 41.3275, 19.8187], ["Arequipa", "Peru", "PE", -16.409, -71.5375],
    ["Gaborone", "Botswana", "BW", -24.6282, 25.9231], ["Kaohsiung", "Taiwan", "TW", 22.6273, 120.3014],
    ["Porto Alegre", "Brazil", "BR", -30.0346, -51.2177], ["Ohrid", "North Macedonia", "MK", 41.1231, 20.8016],
    ["Pokhara", "Nepal", "NP", 28.2096, 83.9856], ["Nouméa", "New Caledonia", "NC", -22.2758, 166.458],
    ["Muscat", "Oman", "OM", 23.588, 58.3829], ["Kigali", "Rwanda", "RW", -1.9441, 30.0619]
  ];
  for (const sample of samples) {
    const destination = identity(...sample);
    const result = places(destination, [], "restaurant", "local food");
    assert.equal(result.entities[0].destinationKey, destination.key, sample[0]);
    assert.equal(result.entities[0].namedEntity, false, sample[0]);
    assert.equal(result.entities[0].provenance.source, "generic_fallback", sample[0]);
  }
});
