import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { enrichNamedEntityMedia, mediaTitleMatchesEntity, selectExactEntityMedia, summarizeMediaEnrichment } from "../js/engine/media/global-content-media-enrichment.js";

const mission = { destination: { city: "Medellín", latitude: 6.2442, longitude: -75.5812 } };

test("exact entity matching rejects unrelated destination imagery", () => {
  assert.equal(mediaTitleMatchesEntity("Landmark Hotel Medellín", "Landmark Hotel Medellín"), true);
  assert.equal(mediaTitleMatchesEntity("Landmark Hotel Medellín", "Botero Square"), false);
});

test("all displayed entities enter bounded asynchronous media enrichment", async () => {
  const items = Array.from({ length: 12 }, (_, index) => ({ label: `Hotel ${index + 1}`, kind: "hotel" }));
  const attempted = [];
  const enriched = await enrichNamedEntityMedia(items, mission, async (item) => {
    attempted.push(item.label);
    return [{ pageid: item.label, title: item.label, thumbnail: { source: `https://img.example/${encodeURIComponent(item.label)}.jpg` }, coordinates: [{ lat: 6.25, lon: -75.58 }] }];
  });
  assert.equal(attempted.length, 12);
  assert.equal(enriched.length, 12);
  assert.ok(enriched.every((item) => item.imageStatus === "exact_public_lookup" && item.imageUrl));
});

test("provider images are preserved without unnecessary lookup", async () => {
  let calls = 0;
  const [item] = await enrichNamedEntityMedia([{ label: "Sites Hotel", imageUrl: "https://provider.example/sites.jpg" }], mission, async () => { calls += 1; return []; });
  assert.equal(calls, 0);
  assert.equal(item.imageStatus, "exact_provider");
  assert.equal(item.imageUrl, "https://provider.example/sites.jpg");
});

test("location-conflicting and unrelated media become an honest terminal fallback", () => {
  const item = selectExactEntityMedia({ label: "Carmen", kind: "restaurant" }, [{ pageid: 1, title: "Carmen", thumbnail: { source: "https://img.example/carmen.jpg" }, coordinates: [{ lat: 40.7, lon: -74 }] }], mission);
  assert.equal(item.imageUrl, undefined);
  assert.equal(item.imageStatus, "no_safe_candidate");
});

test("lookup failure exits loading state for every card", async () => {
  const enriched = await enrichNamedEntityMedia([{ label: "A" }, { label: "B" }, { label: "C" }], mission, async () => { throw new Error("offline"); });
  assert.deepEqual(enriched.map((item) => item.imageStatus), ["lookup_failed", "lookup_failed", "lookup_failed"]);
  assert.deepEqual(summarizeMediaEnrichment(enriched), { lookup_failed: 3 });
});

test("results renderer does not substitute city context photos for named restaurants or hotels", async () => {
  const source = await readFile(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /attachImageCandidatePool\(hotelSource, destinationContextImages/);
  assert.doesNotMatch(source, /restaurants = restaurants\.map\(\(item, index\).*destinationVisualPlaces/s);
  assert.match(source, /evidencedFlights\.length \? evidencedFlights : flightSearchActions/);
});
