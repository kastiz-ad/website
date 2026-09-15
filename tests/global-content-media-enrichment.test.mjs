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
  assert.ok(enriched.every((item) => item.imageStatus === "EXACT_LOADED" && item.imageUrl));
});

test("provider images are preserved while alternate candidates are still collected", async () => {
  let calls = 0;
  const [item] = await enrichNamedEntityMedia([{ label: "Sites Hotel", providerId: "node/123", imageUrl: "https://provider.example/sites.jpg" }], mission, async () => { calls += 1; return [{ title: "Sites Hotel", thumbnail: { source: "https://img.example/sites-alt.jpg" }, coordinates: [{ lat: 6.25, lon: -75.58 }] }]; });
  assert.equal(calls, 1);
  assert.equal(item.imageStatus, "EXACT_LOADED");
  assert.equal(item.imageUrl, "https://provider.example/sites.jpg");
  assert.equal(item.images.length, 2);
});

test("stable entity-linked media is accepted without weak free-text metadata", () => {
  const item = selectExactEntityMedia({ label: "Carmen", kind: "restaurant", providerId: "node/456" }, [{
    title: "File:Dining room.jpg",
    original: { source: "https://commons.wikimedia.org/wiki/Special:FilePath/Dining_room.jpg" },
    entityLinked: true,
    providerEntityId: "node/456",
    mediaSource: "Wikidata / Wikimedia Commons"
  }], mission);
  assert.equal(item.imageStatus, "EXACT_LOADED");
  assert.equal(item.images[0].entityLinked, true);
  assert.equal(item.imageDiagnostics.candidates[0].reason, "entity_linked");
});

test("loader preserves OSM and Nominatim entity-linked media identifiers", async () => {
  const source = await readFile(new URL("../js/pages/loading-page.js", import.meta.url), "utf8");
  assert.match(source, /wikidata: tags\.wikidata/);
  assert.match(source, /providerId: `\$\{entry\.type\}\/\$\{entry\.id\}`/);
  assert.match(source, /place\.extratags\?\.wikidata/);
  assert.match(source, /wbgetentities/);
});

test("location-conflicting and unrelated media become an honest terminal fallback", () => {
  const item = selectExactEntityMedia({ label: "Carmen", kind: "restaurant" }, [{ pageid: 1, title: "Carmen", thumbnail: { source: "https://img.example/carmen.jpg" }, coordinates: [{ lat: 40.7, lon: -74 }] }], mission);
  assert.equal(item.imageUrl, undefined);
  assert.equal(item.imageStatus, "NO_SAFE_IMAGE");
});

test("ambiguous exact-name media without destination evidence is rejected", () => {
  const item = selectExactEntityMedia({ label: "Guadalupe", kind: "restaurant" }, [{
    pageid: 5,
    title: "Guadalupe",
    description: "1848 peace treaty between Mexico and the United States",
    thumbnail: { source: "https://img.example/treaty.jpg" }
  }], mission);
  assert.equal(item.imageUrl, undefined);
  assert.equal(item.imageStatus, "NO_SAFE_IMAGE");
});

test("exact-name media without coordinates is accepted when destination context is present", () => {
  const item = selectExactEntityMedia({ label: "Carmen", kind: "restaurant" }, [{
    pageid: 6,
    title: "Carmen",
    description: "Restaurant in Medellín, Colombia",
    thumbnail: { source: "https://img.example/carmen-medellin.jpg" }
  }], mission);
  assert.equal(item.imageUrl, "https://img.example/carmen-medellin.jpg");
  assert.equal(item.imageStatus, "EXACT_LOADED");
});

test("same-name destination media is rejected when it is not a restaurant", () => {
  const item = selectExactEntityMedia({ label: "Guadalupe", kind: "restaurant" }, [{
    pageid: 7,
    title: "Catedral de Medellín - Nuestra Señora de Guadalupe",
    description: "Cathedral in Medellín, Colombia",
    thumbnail: { source: "https://img.example/guadalupe-cathedral.jpg" }
  }], mission);
  assert.equal(item.imageUrl, undefined);
  assert.equal(item.imageStatus, "NO_SAFE_IMAGE");
});

test("restaurant names do not accept image-bearing disambiguation pages", () => {
  const item = selectExactEntityMedia({ label: "Lulu", kind: "restaurant" }, [{
    pageid: 8,
    title: "Lulu",
    description: "Wikimedia disambiguation page",
    extract: "Lulu Ziegler; Lulu restaurant in Stockholm",
    thumbnail: { source: "https://img.example/lulu-ziegler.jpg" }
  }], { destination: { city: "Stockholm", country: "Sweden" } });
  assert.equal(item.imageUrl, undefined);
  assert.equal(item.imageStatus, "NO_SAFE_IMAGE");
});

test("lookup failure exits loading state for every card", async () => {
  const enriched = await enrichNamedEntityMedia([{ label: "A" }, { label: "B" }, { label: "C" }], mission, async () => { throw new Error("offline"); });
  assert.deepEqual(enriched.map((item) => item.imageStatus), ["SOURCE_BLOCKED", "SOURCE_BLOCKED", "SOURCE_BLOCKED"]);
  assert.deepEqual(summarizeMediaEnrichment(enriched), { SOURCE_BLOCKED: 3 });
});

test("exact lookup preserves multiple independently retryable image candidates", () => {
  const pages = [1, 2, 3].map((pageid) => ({ pageid, title: `Carmen Medellín ${pageid}`, thumbnail: { source: `https://img.example/carmen-${pageid}.jpg` } }));
  const item = selectExactEntityMedia({ label: "Carmen Medellín" }, pages, mission);
  assert.equal(item.imageStatus, "EXACT_LOADED");
  assert.equal(item.images.length, 3);
  assert.equal(item.imageUrl, item.images[0].url);
});

test("one invalid or non-image candidate does not erase a later valid alternate", () => {
  const pages = [
    { pageid: 1, title: "Carmen Medellín", imageinfo: [{ url: "https://example.com/not-an-image", mime: "text/html" }] },
    { pageid: 2, title: "Carmen Medellín dining room", imageinfo: [{ thumburl: "https://img.example/carmen.jpg", mime: "image/jpeg" }] }
  ];
  const item = selectExactEntityMedia({ label: "Carmen Medellín" }, pages, mission);
  assert.equal(item.imageUrl, "https://img.example/carmen.jpg");
  assert.equal(item.images.length, 1);
});

test("results renderer does not substitute city context photos for named restaurants or hotels", async () => {
  const source = await readFile(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /attachImageCandidatePool\(hotelSource, destinationContextImages/);
  assert.doesNotMatch(source, /restaurants = restaurants\.map\(\(item, index\).*destinationVisualPlaces/s);
  assert.match(source, /evidencedFlights\.length \? evidencedFlights : flightSearchActions/);
  assert.match(source, /selectNextTravelImageCandidate/);
  assert.doesNotMatch(source, /alpha03-thumb\.has-image img"\)\) event\.target\.hidden = true/);
});
