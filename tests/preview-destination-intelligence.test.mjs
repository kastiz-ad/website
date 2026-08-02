import test from "node:test";
import assert from "node:assert/strict";
import {
  dedupePreviewDestinations,
  previewTravelIntent,
  profileForResult,
  resolvePreviewDestination
} from "../js/engine/world/preview-destination-intelligence.js";

test("preview destination intelligence recognizes multilingual travel intent", () => {
  assert.equal(previewTravelIntent("voyage a Tokyo"), true);
  assert.equal(previewTravelIntent("viaje a Paris"), true);
  assert.equal(previewTravelIntent("일본 여행"), true);
});

test("preview destination intelligence dedupes Tokyo city and prefecture matches", () => {
  const matches = dedupePreviewDestinations([
    { city: "Tokyo", country: "Japan", code: "JP", latitude: 35.6762, longitude: 139.6503 },
    { city: "Tokyo", state: "Tokyo", country: "Japan", code: "JP", latitude: 35.6895, longitude: 139.6917 }
  ]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].country, "Japan");
});

test("preview destination intelligence provides city-specific profiles beyond Japan", () => {
  assert.equal(resolvePreviewDestination("voyage a Paris")?.city, "Paris");
  assert.equal(profileForResult({ rawInput: "trip to Los Angeles" })?.city, "Los Angeles");
  assert.ok(profileForResult({ rawInput: "Singapore family vacation" })?.places.length >= 6);
});
