import test from "node:test";
import assert from "node:assert/strict";
import { createCanonicalDestinationIdentity, destinationIdentityFromMissionResult, destinationIdentityKey, resolveCanonicalDestinationIdentity } from "../js/engine/world/canonical-destination-identity.js";

test("canonical identity preserves provider-backed geographic identity", () => {
  const identity = createCanonicalDestinationIdentity({ id: "medellin-co", city: "Medellín", state: "Antioquia", country: "Colombia", countryCode: "CO", latitude: 6.2442, longitude: -75.5812, timezone: "America/Bogota", placeType: "city" }, { source: "provider_geocoder", provider: "Open-Meteo", lookupId: "123" });
  assert.equal(identity.displayName, "Medellín, Antioquia, Colombia");
  assert.equal(identity.key, "city:CO:antioquia:medellin");
  assert.equal(identity.provenance.source, "provider_geocoder");
  assert.equal(identity.confidence, 0.96);
});

test("ambiguous names cannot silently resolve", () => {
  const resolution = resolveCanonicalDestinationIdentity("Plan a trip to Paris");
  assert.equal(resolution.status, "ambiguous");
  assert.equal(resolution.identity, null);
  assert.ok(resolution.candidates.some((item) => item.countryCode === "FR"));
  assert.ok(resolution.candidates.some((item) => item.countryCode === "US"));
});

test("explicit qualification resolves an ambiguous city", () => {
  const resolution = resolveCanonicalDestinationIdentity("Plan a trip to Paris, Texas");
  assert.equal(resolution.status, "resolved");
  assert.equal(resolution.identity.countryCode, "US");
  assert.equal(resolution.identity.region, "Texas");
});

test("country-only identities require a local anchor", () => {
  const resolution = resolveCanonicalDestinationIdentity("Plan a trip to Colombia");
  assert.equal(resolution.identity.destinationType, "country");
  assert.equal(resolution.identity.status, "country_requires_anchor");
  assert.equal(resolution.identity.requiresLocalAnchor, true);
});

test("user selection is authoritative and stable across save restore", () => {
  const resolution = resolveCanonicalDestinationIdentity("San José", { selected: { city: "San José", state: "San José", country: "Costa Rica", countryCode: "CR", latitude: 9.9281, longitude: -84.0907 } });
  const restored = destinationIdentityFromMissionResult({ destinationIdentity: JSON.parse(JSON.stringify(resolution.identity)) });
  assert.equal(restored.key, resolution.identity.key);
  assert.equal(restored.provenance.source, "user_selected");
  assert.equal(restored.confidence, 1);
});

test("identity keys isolate same-name destinations", () => {
  assert.notEqual(destinationIdentityKey({ city: "Paris", region: "Île-de-France", countryCode: "FR" }), destinationIdentityKey({ city: "Paris", region: "Texas", countryCode: "US" }));
});
