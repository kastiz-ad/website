import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { allocateUniqueTravelImages, normalizedImageIdentity } from "../js/ui/travel-image-allocation.js";
import { osmEmbedUrlForProfile } from "../js/engine/world/preview-destination-intelligence.js";
import { resolveSemanticItineraryImages } from "../js/ui/semantic-itinerary-image.js";

test("restaurant image allocation is deterministic, unique, and uses truthful alternates", () => {
  const shared = { url: "https://images.example/restaurant.jpg?w=900&q=80", sourceId: "photo-1" };
  const alternate = { url: "https://images.example/restaurant-2.jpg", sourceId: "photo-2" };
  const images = allocateUniqueTravelImages([
    { name: "A", image: shared },
    { name: "B", image: { ...shared, alternates: [alternate] } },
    { name: "C", image: shared }
  ]);
  assert.equal(images[0].sourceId, "photo-1");
  assert.equal(images[1].sourceId, "photo-2");
  assert.equal(images[2], null);
  assert.equal(new Set(images.filter(Boolean).map(normalizedImageIdentity)).size, 2);
});

test("URL transformations cannot disguise a duplicate image", () => {
  assert.equal(
    normalizedImageIdentity({ url: "https://images.example/photo.jpg?w=300&q=50" }),
    normalizedImageIdentity({ url: "https://images.example/photo.jpg?w=1200&q=90" })
  );
});

test("itinerary never repeats a semantic or destination fallback image", () => {
  const days = [1, 2, 3].map((day) => ({ day: `Day ${day}`, title: "Old Town", slots: [["📍", "Morning", "Old Town"]] }));
  const places = [{ name: "Old Town", image: { url: "https://images.example/old-town.jpg" } }];
  const images = resolveSemanticItineraryImages(days, places, { url: "https://images.example/destination.jpg" });
  assert.deepEqual(images.map((image) => image?.url || null), ["https://images.example/old-town.jpg", "https://images.example/destination.jpg", null]);
});

test("canonical map centers remain isolated for same-name and Colombian destinations", () => {
  const medellin = osmEmbedUrlForProfile({ latitude: 6.2442, longitude: -75.5812 });
  const bogota = osmEmbedUrlForProfile({ latitude: 4.711, longitude: -74.0721 });
  const parisTexas = osmEmbedUrlForProfile({ latitude: 33.6609, longitude: -95.5555 });
  const parisFrance = osmEmbedUrlForProfile({ latitude: 48.8566, longitude: 2.3522 });
  assert.match(medellin, /marker=6\.24420%2C-75\.58120/);
  assert.notEqual(medellin, bogota);
  assert.notEqual(parisTexas, parisFrance);
});

test("Travel renderer uses canonical coordinates and premium compact surfaces", async () => {
  const [page, loading, css, html] = await Promise.all([
    readFile(new URL("../js/pages/results-page.js", import.meta.url), "utf8"),
    readFile(new URL("../js/pages/loading-page.js", import.meta.url), "utf8"),
    readFile(new URL("../results.css", import.meta.url), "utf8"),
    readFile(new URL("../results.html", import.meta.url), "utf8")
  ]);
  assert.match(page, /const canonicalDestination = result\.destinationIdentity \|\| result\.destination/);
  assert.match(loading, /destinationCity === profileAnchor/);
  assert.match(loading, /destinationIdentity: createCanonicalDestinationIdentity\(destination/);
  assert.match(loading, /fetchWikipediaInfo\(preparedMission\)/);
  assert.match(loading, /let destinationImage = data\?\.originalimage\?\.source \|\| data\?\.thumbnail\?\.source/);
  assert.match(loading, /generator=geosearch/);
  assert.match(loading, /imageAlternates: destinationImageAlternates/);
  assert.match(page, /const destinationHero = destinationInfo\?\.imageUrl/);
  assert.match(page, /const destinationVisualPlaces = \(destinationInfo\?\.imageAlternates/);
  assert.doesNotMatch(page, /medellin-city-hero-v1|restaurantScores/);
  assert.match(page, /alpha03-food-select-mark[\s\S]*<svg viewBox="0 0 24 24"/);
  assert.doesNotMatch(page, /ownImage \|\| "https:\/\/images\.unsplash\.com\/photo-1517248135467/);
  assert.match(page, /scaleEstimate\(routeFlightEstimate, 2\.2, 3\.2\)/);
  assert.match(page, /scaleEstimate\(routeFlightEstimate, 4, 6\)/);
  assert.match(page, /transportEstimate\(2\.2, 3\.5\)/);
  assert.match(page, /itineraryImages = resolveSemanticItineraryImages/);
  assert.match(loading, /if \(Number\.isFinite\(latitude\) && Number\.isFinite\(longitude\)\)/);
  assert.match(page, /data-map-destination-key=/);
  assert.match(page, /data-map-center=/);
  assert.match(page, /alpha03-map-destination/);
  assert.match(page, /const hasMapCenter = Number\.isFinite/);
  assert.match(page, /alpha03-itinerary-visual-summary/);
  assert.match(page, /alpha03-itinerary-details/);
  assert.match(page, /data-itinerary-jump=/);
  assert.match(page, /data-full-itinerary/);
  assert.match(page, /allocateUniqueTravelImages\(restaurants/);
  assert.match(page, /allocateUniqueTravelImages\(highlightPlaces/);
  assert.match(page, /createOneFreeTrustMarkup/);
  assert.match(page, /createAlpha03OptionPreview/);
  assert.match(css, /Premium Travel results v2/);
  assert.match(css, /grid-template-columns:minmax\(0,3fr\) minmax\(320px,1\.08fr\)/);
  assert.match(css, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /alpha03-timeline-card \.alpha03-day-slot\{display:grid!important/);
  assert.match(css, /width:calc\(100vw - 12px\)/);
  assert.match(css, /alpha03-card-score/);
  assert.match(css, /alpha03-itinerary-visual-rail/);
  assert.match(css, /alpha03-itinerary-detail-list/);
  assert.match(css, /mission-lifecycle-panel[^}]*display:none!important/);
  assert.match(html, /20260910-approved-dashboard-v10/);
});

test("Medellín cards use distinct destination-specific media instead of global stock", async () => {
  const page = await readFile(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  assert.match(page, /match:\/\\bmedell\[ií\]n\\b\|메데인\/i/);
  for (const venue of ["El Cielo", "Carmen", "Alambique", "OCI.Mde", "Lucia"]) {
    assert.ok(page.includes(`["${venue}","https:`), `${venue} must have a destination-specific image`);
  }
  assert.match(page, /"medellín": \["Diez Hotel Categoría Colombia", "574 Hotel", "Living by Armoniko", "Landmark Hotel Medellín"/);
  assert.match(page, /profile\.country = worldCityVisualPack\.country \|\| profile\.country/);
  assert.match(page, /profile\.latitude = Number\.isFinite\(Number\(worldCityVisualPack\.latitude\)\)/);
  assert.match(page, /if \(worldCityVisualPack\.hero\?\.\[1\]\)/);
});
