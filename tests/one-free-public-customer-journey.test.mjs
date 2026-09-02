import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { buildOneFreeProviderHandoff, createDeviceTripRecord, oneFreeTrustIndex, oneFreeTrustProfile } from "../js/ui/one-free-customer-journey.js";

test("ONE Free provider handoff preserves destination, dates, travelers and selections", () => {
  const handoff = buildOneFreeProviderHandoff({
    destination: { city: "New York City" }, origin: "ICN",
    dates: { startDate: "2026-09-10", endDate: "2026-09-17" }, travelers: 2,
    selections: { flight: "Korean Air", hotel: "Hotel Beacon", restaurants: ["Katz's Delicatessen"], places: ["Statue of Liberty"] }
  });
  assert.equal(handoff.state, "available");
  assert.deepEqual(handoff.links.map((link) => link.id), ["flight-selected", "flights-all", "hotel-selected", "hotels-all", "restaurant-selected", "restaurants-all", "place-selected", "places-all"]);
  const combined = handoff.links.map((link) => new URL(link.url).searchParams.get("q")).join(" ");
  for (const value of ["New York City", "2026-09-10", "2026-09-17", "Korean Air", "Hotel Beacon", "Katz's Delicatessen", "Statue of Liberty"]) assert.match(combined, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const link of handoff.links) assert.match(link.url, /^https:\/\//);
});

test("provider handoff separates selected options from broad searches and labels limits honestly", () => {
  const handoff = buildOneFreeProviderHandoff({ destination: "Tokyo", origin: "ICN", dates: { startDate: "2026-10-01", endDate: "2026-10-03" }, travelers: 2, selections: { flight: "Korean Air", hotel: "Tokyo Station Hotel", restaurants: ["Sushi Dai"], places: ["Meiji Shrine"] } });
  for (const kind of ["flights", "hotels", "restaurants", "places"]) assert.equal(handoff.links.filter((link) => link.kind === kind).length, 2);
  assert.match(handoff.links.find((link) => link.id === "flight-selected").label, /this flight option/i);
  assert.match(handoff.links.find((link) => link.id === "flights-all").label, /all flights/i);
  assert.match(handoff.links.find((link) => link.id === "hotel-selected").url, /Tokyo\+Station\+Hotel/);
  assert.match(handoff.links.find((link) => link.id === "restaurant-selected").url, /Sushi\+Dai/);
  assert.match(handoff.links.find((link) => link.id === "place-selected").url, /Meiji\+Shrine/);
  assert.deepEqual(handoff.links.find((link) => link.id === "flights-all").transferred, ["origin", "destination", "dates", "travelers"]);
});

test("provider handoff omits fake selected actions when no restaurant or place was selected", () => {
  const handoff = buildOneFreeProviderHandoff({ destination: "Tokyo", dates: { startDate: "2026-10-01", endDate: "2026-10-03" }, travelers: 2 });
  assert.equal(handoff.links.some((link) => link.id === "restaurant-selected"), false);
  assert.equal(handoff.links.some((link) => link.id === "place-selected"), false);
  assert.equal(handoff.links.some((link) => link.id === "restaurants-all"), true);
  assert.equal(handoff.links.some((link) => link.id === "places-all"), true);
});

test("results timeline only uses an image when its place name matches that day", async () => {
  const source = await fs.readFile(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  assert.match(source, /resolveSemanticItineraryImages/);
  assert.match(source, /const dayImages = resolveSemanticItineraryImages\(days, places, destinationFallback, \{ usedImageUrls \}\)/);
  assert.doesNotMatch(source, /placeImageSeeds\[index % Math\.max\(1, placeImageSeeds\.length\)\]/);
});

test("ONE Free handoff is honestly unavailable without a destination", () => {
  const handoff = buildOneFreeProviderHandoff({ destination: null });
  assert.equal(handoff.state, "unavailable");
  assert.deepEqual(handoff.links, []);
});

test("trust index lowers estimated and missing-provider content", () => {
  const live = oneFreeTrustIndex({ sourceStates: ["verified_live", "verified_live"], localizedContent: true });
  const limited = oneFreeTrustIndex({ sourceStates: ["estimated", "placeholder"], missingImages: 2, missingProviders: 2, localizedContent: false });
  assert.ok(live.score > limited.score);
  assert.equal(live.label, "Trusted");
  assert.ok(["Limited", "Experimental"].includes(limited.label));
});

test("trust index scores each result section from its own evidence", () => {
  const trust = oneFreeTrustProfile({
    flights: { sourceStates: ["verified_live"], signals: { liveProvider: true } },
    hotels: { sourceStates: ["verified"], signals: { identity: true } },
    restaurants: { sourceStates: ["cached_public"] }
  });
  assert.equal(trust.flights.score, 4.9);
  assert.equal(trust.flights.label, "Trusted");
  assert.equal(trust.hotels.label, "Reliable");
  assert.equal(trust.restaurants.score, 3.8);
  assert.equal(trust.restaurants.label, "Estimated");
  assert.ok(trust.flights.score > trust.hotels.score);
  assert.ok(trust.hotels.score > trust.restaurants.score);
});

test("estimated data can never become Trusted", () => {
  const trust = oneFreeTrustIndex({ sourceStates: ["estimated"], signals: { provider: true, identity: true, destination: true, freshness: true, dates: true, travelers: true } });
  assert.ok(trust.score <= 4);
  assert.equal(trust.label, "Estimated");
});

test("fallback, demo and mock evidence are capped below reliable labels", () => {
  const fallback = oneFreeTrustIndex({ sourceStates: ["verified_live", "fallback"], signals: { destination: true } });
  const demo = oneFreeTrustIndex({ sourceStates: ["verified_live", "demo"] });
  const mock = oneFreeTrustIndex({ sourceStates: ["verified_live", "mock"] });
  assert.ok(fallback.score <= 3);
  assert.equal(fallback.label, "Limited");
  assert.ok(demo.score <= 2);
  assert.ok(mock.score <= 2);
  assert.notEqual(demo.label, "Trusted");
  assert.notEqual(mock.label, "Trusted");
});

test("unavailable or absent evidence produces Unverified without a number", () => {
  for (const sourceStates of [[], ["unavailable"], ["setup_required"]]) {
    const trust = oneFreeTrustIndex({ sourceStates });
    assert.equal(trust.score, null);
    assert.equal(trust.label, "Unverified");
  }
});

test("itinerary trust reflects weaker underlying components", () => {
  const trust = oneFreeTrustProfile({
    destination: { sourceStates: ["verified"] },
    places: { sourceStates: ["verified"] },
    restaurants: { sourceStates: ["fallback"] },
    transport: { sourceStates: ["cached_public"] },
    itinerary: { components: ["destination", "places", "restaurants", "transport"], scheduleFeasible: true }
  });
  assert.ok(trust.itinerary.score < trust.destination.score);
  assert.ok(trust.itinerary.score <= trust.restaurants.score + 0.9);
  assert.notEqual(trust.itinerary.label, "Trusted");
});

test("Trust Index uses one star and exposes click explanations in three languages", async () => {
  const source = await fs.readFile(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const start = source.indexOf("const createOneFreeTrustMarkup");
  const end = source.indexOf("const createAlpha03OptionPreviewCard", start);
  const markupSource = source.slice(start, end);
  assert.match(markupSource, /<details class="one-free-trust-inline">/);
  assert.match(markupSource, /★ \$\{score\}/);
  assert.doesNotMatch(markupSource, /★\s*★|★★★★★/);
  assert.match(source, /Unverified: \["Unverified", "미검증", "Sin verificar"\]/);
});

test("upgrade surface promises Free, Plus and Pro without enabling execution", async () => {
  const html = await fs.readFile(new URL("../upgrade.html", import.meta.url), "utf8");
  const script = await fs.readFile(new URL("../upgrade.js", import.meta.url), "utf8");
  assert.match(html, /ONE Free/);
  assert.match(html, /Plan it for me/);
  assert.match(html, /ONE Plus/);
  assert.match(html, /Help me complete it/);
  assert.match(html, /ONE Pro/);
  assert.match(html, /Do it for me/);
  assert.match(html, /Not operational today/);
  assert.match(script, /Payments and autonomous execution remain disabled/);
  assert.doesNotMatch(script, /checkout\(|executePayment|bookProvider/);
});

test("device save records never claim cloud sync", () => {
  const record = createDeviceTripRecord({ reference: "ONE-DEMO-ABC12345", result: { type: "travel" }, savedAt: "2026-08-19T00:00:00.000Z" });
  assert.equal(record.storage, "device");
  assert.equal(record.reference, "ONE-DEMO-ABC12345");
});

test("public travel result uses manual handoff and an explicit device save instead of a QR", async () => {
  const source = await fs.readFile(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const start = source.indexOf("const buildExecutionSummary");
  const end = source.indexOf("const runApprovalSequence", start);
  const customerSummary = source.slice(start, end);
  assert.match(customerSummary, /buildOneFreeProviderHandoff/);
  assert.match(customerSummary, /data-save-one-free-trip/);
  assert.match(customerSummary, /ONE Free does not book, reserve, purchase, charge, submit, or contact a provider/);
  assert.doesNotMatch(customerSummary, /api\.qrserver\.com/);
});

test("work missions remain preparation-only experiences", async () => {
  const source = await fs.readFile(new URL("../js/ui/work-mission-experience.js", import.meta.url), "utf8");
  assert.match(source, /preparation/i);
  assert.doesNotMatch(source, /executePayment|bookProvider|submitReservation/);
});
