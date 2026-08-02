import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPreviewMapMarkers,
  dedupePreviewDestinations,
  osmEmbedUrlForProfile,
  previewItemAdvice,
  previewItemImage,
  previewTravelIntent,
  profileForResult,
  resolvePreviewDestination
} from "../js/engine/world/preview-destination-intelligence.js";

const sourceFiles = [
  "index.html",
  "results.html",
  "one-pass.html",
  "js/pages/home-page.js",
  "js/pages/loading-page.js",
  "js/pages/results-page.js",
  "js/engine/world/preview-destination-intelligence.js",
  "results.css"
];

const mojibakeSignatures = ["\u00c3\u00a2", "\u00c3\u0192", "\u00ef\u00bf\u00bd", "`r`n"];

test("release preview source files do not contain BOM or known mojibake signatures", async () => {
  const fs = await import("node:fs/promises");
  for (const file of sourceFiles) {
    const buffer = await fs.readFile(file);
    assert.equal(buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf, false, `${file} must not start with UTF-8 BOM`);
    const text = buffer.toString("utf8");
    for (const signature of mojibakeSignatures) {
      assert.equal(text.includes(signature), false, `${file} contains mojibake signature ${signature}`);
    }
  }
});

test("preview destination intelligence recognizes multilingual travel input", () => {
  assert.equal(previewTravelIntent("voyage \u00e0 Paris"), true);
  assert.equal(previewTravelIntent("organise un voyage \u00e0 Paris"), true);
  assert.equal(previewTravelIntent("viaje a Par\u00eds"), true);
  assert.equal(previewTravelIntent("\uc77c\ubcf8 \uc5ec\ud589"), true);
  assert.equal(previewTravelIntent("trip to Tokyo"), true);
  assert.equal(resolvePreviewDestination("trip to Tokyo")?.profile.city, "Tokyo");
  assert.equal(resolvePreviewDestination("organise un voyage \u00e0 Paris")?.profile.country, "France");
});

test("preview destination intelligence dedupes Tokyo city and prefecture matches", () => {
  const deduped = dedupePreviewDestinations([
    { city: "Tokyo", country: "Japan" },
    { name: "Tokyo", country: "Japan" },
    { city: "Paris", country: "France" }
  ]);
  assert.deepEqual(deduped.map((entry) => entry.city || entry.name), ["Tokyo", "Paris"]);
});

test("supported preview destinations provide real image URLs and item advice", () => {
  for (const prompt of ["trip to Tokyo", "Paris", "NYC", "London", "Seoul", "Bangkok", "Singapore", "Rome", "Barcelona", "Sydney"]) {
    const profile = resolvePreviewDestination(prompt)?.profile;
    assert.ok(profile, `${prompt} should resolve`);
    assert.ok(profile.hero.url.startsWith("https://images.unsplash.com/"));
    const sample = [...profile.restaurants, ...profile.places][0];
    assert.ok(previewItemImage(sample)?.url.includes("images.unsplash.com"));
    assert.ok(previewItemAdvice(sample, "fr").length > 8);
  }
});

test("preview map markers and OSM embed are generated from destination coordinates", () => {
  const tokyo = resolvePreviewDestination("Tokyo")?.profile;
  const url = osmEmbedUrlForProfile(tokyo);
  const markers = buildPreviewMapMarkers(tokyo);
  assert.ok(url.includes("openstreetmap.org/export/embed.html"));
  assert.ok(url.includes("marker=35."));
  assert.ok(markers.length >= 4);
  assert.ok(markers.every((marker) => marker.left.endsWith("%") && marker.top.endsWith("%")));
});

test("results page is wired for rich preview images, map and approval flow", async () => {
  const fs = await import("node:fs/promises");
  const text = await fs.readFile("js/pages/results-page.js", "utf8");
  assert.ok(text.includes("previewItemImage"));
  assert.ok(text.includes("osmEmbedUrlForProfile"));
  assert.ok(text.includes("runPreviewApprovalConfirmation"));
  assert.ok(text.includes("hasValidApprovalPackage"));
  assert.ok(text.includes("data-alpha03-map=\"osm\""));
});

test("French and unsupported UI languages fall back without blocking results", () => {
  const paris = resolvePreviewDestination("organise un voyage \u00e0 Paris")?.profile;
  assert.equal(paris.country, "France");
  assert.equal(profileForResult({ mission: "voyage \u00e0 Paris" })?.country, "France");
  assert.ok(previewItemAdvice(paris.places[0], "de").length > 8);
  assert.ok(paris.places.some((place) => place.name.includes("Musee") || place.name.includes("Ile")));
});
