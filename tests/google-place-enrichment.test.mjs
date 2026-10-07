import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  clearGoogleTravelEntityRequestCache,
  fetchGoogleTravelEntityEnrichment,
  googlePlaceToDestinationEntity,
  reconcileVerifiedGoogleEntities,
  validateGooglePlaceForDestination
} from "../js/engine/world/google-place-enrichment.js";
import { GOOGLE_PLACES_FIELD_MASK, normalizePlaceResult } from "../functions/api/v1/_lib/providers/google.js";
import { previewItemImage } from "../js/engine/world/preview-destination-intelligence.js";
import { normalizedImageIdentity } from "../js/ui/travel-image-allocation.js";

const identity = Object.freeze({ key: "co:medellin", displayName: "Medellín, Colombia", city: "Medellín", country: "Colombia", countryCode: "CO", latitude: 6.2442, longitude: -75.5812 });
const place = (overrides = {}) => ({
  id: "ChIJexact", providerPlaceId: "ChIJexact", name: "Exact Medellín Restaurant",
  address: "El Poblado, Medellín, Antioquia, Colombia",
  coordinates: { lat: 6.21, lng: -75.57 }, categories: ["restaurant", "food"],
  rating: 4.6, ratingCount: 2143,
  photos: [{ name: "places/ChIJexact/photos/photo_ref_1" }],
  addressComponents: [{ longText: "Colombia", shortText: "CO", types: ["country"] }],
  providerEvidence: { provider: "google-places", placeId: "ChIJexact", dataState: "verified_live" },
  ...overrides
});

test("Google Place destination validation rejects cross-destination and wrong entity types", () => {
  assert.equal(validateGooglePlaceForDestination(place(), identity, "restaurant").accepted, true);
  assert.equal(validateGooglePlaceForDestination(place({ coordinates: { lat: 4.711, lng: -74.0721 } }), identity, "restaurant").reason, "destination_coordinate_conflict");
  assert.equal(validateGooglePlaceForDestination(place({ categories: ["lodging"] }), identity, "restaurant").reason, "entity_type_conflict");
});

test("validated Google entity keeps customer rating separate and uses same-origin photo proxy", () => {
  const { entity } = googlePlaceToDestinationEntity(place(), identity, "restaurant");
  assert.equal(entity.providerPlaceId, "ChIJexact");
  assert.equal(entity.customerRating, 4.6);
  assert.equal(entity.customerRatingCount, 2143);
  assert.match(entity.imageUrl, /^\/api\/v1\/providers\/google\/photo\?/);
  assert.doesNotMatch(entity.imageUrl, /key=|GOOGLE_PLACES_API_KEY/i);
  assert.equal(entity.imageSource, "Google Places");
});

test("one mission performs exactly one bounded search per visible entity kind", async () => {
  clearGoogleTravelEntityRequestCache();
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    const kind = calls.length === 1 ? "restaurant" : "hotel";
    return new Response(JSON.stringify({ ok: true, items: [place({ id: `id-${kind}`, providerPlaceId: `id-${kind}`, categories: [kind === "hotel" ? "lodging" : "restaurant"] })] }), { status: 200 });
  };
  const first = await fetchGoogleTravelEntityEnrichment(identity, { fetcher });
  const second = await fetchGoogleTravelEntityEnrichment(identity, { fetcher });
  assert.equal(calls.length, 2);
  assert.equal(first, second);
  assert.ok(calls.every((call) => call.body.maxResultCount === 8));
  assert.equal(first.restaurants.length, 1);
  assert.equal(first.hotels.length, 1);
});

test("missing coordinates use one bounded locality lookup before entity searches", async () => {
  clearGoogleTravelEntityRequestCache();
  const calls = [];
  const fetcher = async (url, options) => {
    const body = JSON.parse(options.body); calls.push(body);
    if (body.includedType === "locality") return new Response(JSON.stringify({ ok: true, items: [place({ name: "Cairo", address: "Cairo, Egypt", coordinates: { lat: 30.0444, lng: 31.2357 }, categories: ["locality"], addressComponents: [{ longText: "Egypt", shortText: "EG", types: ["country"] }] })] }));
    const kind = body.includedType === "lodging" ? "hotel" : "restaurant";
    return new Response(JSON.stringify({ ok: true, items: [place({ id: `cairo-${kind}`, providerPlaceId: `cairo-${kind}`, address: "Cairo, Egypt", coordinates: { lat: 30.04, lng: 31.23 }, categories: [kind === "hotel" ? "lodging" : "restaurant"], addressComponents: [{ longText: "Egypt", shortText: "EG", types: ["country"] }] })] }));
  };
  const result = await fetchGoogleTravelEntityEnrichment({ key: "city:EG:_:cairo", city: "Cairo", country: "Egypt", countryCode: "EG" }, { fetcher });
  assert.equal(calls.length, 3);
  assert.equal(result.status, "verified_live");
  assert.equal(result.identity.latitude, 30.0444);
  assert.equal(result.identity.country, "Egypt");
  assert.equal(result.identity.countryCode, "EG");
  assert.equal(result.restaurants.length, 1);
  assert.equal(result.hotels.length, 1);
});

test("verified live discovery replaces stale collections and preserves explicit revisions", () => {
  const old = [
    { id: "old", name: "Old curated card", estimatedPrice: { currency: "KRW", min: 1, max: 2 }, source: "cached_public" },
    { id: "revision", name: "Founder choice", source: "user_revision", revisionCandidate: true }
  ];
  const fresh = [
    { id: "google:p1", providerPlaceId: "p1", name: "Current Place", source: "Google Places", sourceState: "verified_live", customerRating: 4.7 }
  ];
  const final = reconcileVerifiedGoogleEntities(old, fresh, { kind: "restaurant", limit: 12 });
  assert.deepEqual(final.map((item) => item.name), ["Current Place", "Founder choice"]);
  assert.deepEqual(final[0].estimatedPrice, old[0].estimatedPrice);
  assert.equal(final[0].customerRating, 4.7);
  assert.equal(final.some((item) => item.name === "Old curated card"), false);
});

test("proxied Google photos retain distinct provider image identities", () => {
  const first = previewItemImage({ imageUrl: "/api/v1/providers/google/photo?name=one", photoReference: "places/p1/photos/one", name: "One" });
  const second = previewItemImage({ imageUrl: "/api/v1/providers/google/photo?name=two", photoReference: "places/p2/photos/two", name: "Two" });
  assert.notEqual(normalizedImageIdentity(first), normalizedImageIdentity(second));
});

test("Google Places field mask is minimal and normalized output omits prohibited extras", () => {
  for (const field of ["places.id", "places.displayName", "places.formattedAddress", "places.location", "places.rating", "places.userRatingCount", "places.photos", "places.types", "places.primaryType", "places.addressComponents"]) assert.ok(GOOGLE_PLACES_FIELD_MASK.includes(field));
  for (const field of ["places.currentOpeningHours", "places.regularOpeningHours", "places.websiteUri", "places.nationalPhoneNumber", "places.internationalPhoneNumber", "places.reviews", "places.editorialSummary"]) assert.ok(!GOOGLE_PLACES_FIELD_MASK.includes(field));
  const normalized = normalizePlaceResult({ id: "p", displayName: { text: "P" }, currentOpeningHours: { openNow: true }, websiteUri: "https://example.com", nationalPhoneNumber: "secret" });
  assert.equal("openingStatus" in normalized, false);
  assert.equal("website" in normalized, false);
  assert.equal("phone" in normalized, false);
});

test("public integration route proxies photos without returning or logging server credentials", () => {
  const route = readFileSync(new URL("../functions/api/v1/[[path]].js", import.meta.url), "utf8");
  const page = readFileSync(new URL("../js/engine/world/google-place-enrichment.js", import.meta.url), "utf8");
  assert.match(route, /providers\/google\/photo/);
  assert.match(route, /providers-google-places/);
  assert.doesNotMatch(page, /GOOGLE_PLACES_API_KEY/);
  assert.doesNotMatch(page, /places\.googleapis\.com/);
});

test("results bootstrap supplies canonical profile coordinates without changing destination identity", () => {
  const results = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  assert.match(results, /const profile = profileForResult\(currentResult, getTravelDestinationLabel\(currentResult\)\)/);
  assert.match(results, /const identity = \{ \.\.\.\(currentResult\?\.destinationIdentity \|\| \{\}\), \.\.\.derivedIdentity \}/);
  assert.match(results, /key: identity\.key \|\| currentResult\?\.previewDestination\?\.id \|\| profile\?\.key \|\| profile\?\.id/);
  assert.match(results, /currentResult\?\.destination\?\.latitude/);
  assert.match(results, /resolvedPreviewProfile\?\.latitude/);
  assert.match(results, /worldVisualProfile\?\.latitude/);
  assert.match(results, /canonicalEnrichmentIdentity = destinationIdentityFromMissionResult/);
  assert.match(results, /destinationKey: enrichmentIdentity\.key/);
  assert.match(results, /latitude: identity\.latitude \?\? currentResult\?\.destination\?\.latitude/);
  assert.match(results, /longitude: identity\.longitude \?\? currentResult\?\.destination\?\.longitude/);
  assert.match(results, /googlePlaceEnrichment\?\.status === "verified_live"/);
});
