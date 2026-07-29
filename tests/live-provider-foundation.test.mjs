import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { ProviderManager, createMemoryCache, createProviderManager } from "../js/engine/providers/live/provider-manager.js";
import { GoogleMapProvider, GooglePlacesProvider, GoogleRouteProvider, createGoogleProviderConfig, GOOGLE_PLACES_FIELD_MASK, GOOGLE_ROUTES_FIELD_MASK } from "../js/engine/providers/live/google-provider-adapters.js";
import { PROVIDER_SOURCE_STATES } from "../js/engine/providers/live/provider-result.js";

test("Live Provider Foundation exposes swappable provider interfaces", () => {
  const manager = createProviderManager();
  assert.ok(manager instanceof ProviderManager);
  assert.equal(typeof manager.geocode, "function");
  assert.equal(typeof manager.searchPlaces, "function");
  assert.equal(typeof manager.computeRoute, "function");
});

test("Google provider adapters fail closed when keys are missing", async () => {
  const config = createGoogleProviderConfig({});
  const manager = createProviderManager({
    mapProvider: new GoogleMapProvider({ config }),
    placesProvider: new GooglePlacesProvider({ config }),
    routeProvider: new GoogleRouteProvider({ config })
  });

  const geocode = await manager.geocode("Tokyo");
  const places = await manager.searchPlaces({ textQuery: "sushi in Tokyo" });
  const route = await manager.computeRoute({ origin: { lat: 35.6812, lng: 139.7671 }, destination: { lat: 35.6586, lng: 139.7454 } });

  assert.equal(geocode.sourceState, PROVIDER_SOURCE_STATES.MISSING_KEY);
  assert.equal(places.sourceState, PROVIDER_SOURCE_STATES.MISSING_KEY);
  assert.equal(route.sourceState, PROVIDER_SOURCE_STATES.MISSING_KEY);
  assert.match(places.developerInstructions.join(" "), /GOOGLE_PLACES_API_KEY/);
});

test("Cost protection provides cache reuse and request deduplication hooks", async () => {
  const cache = createMemoryCache({ ttlMs: 10000, now: () => 1000 });
  const manager = createProviderManager({ cache });
  let calls = 0;
  manager.mapProvider.geocode = async () => {
    calls += 1;
    return { ok: true, provider: "test", sourceState: PROVIDER_SOURCE_STATES.LIVE, data: [{ name: "Tokyo" }] };
  };

  const first = await manager.geocode("Tokyo");
  const second = await manager.geocode("Tokyo");

  assert.equal(calls, 1);
  assert.equal(first.ok, true);
  assert.equal(second.sourceState, PROVIDER_SOURCE_STATES.CACHED);
});

test("Google adapters define field masks to avoid unnecessary paid fields", () => {
  assert.ok(GOOGLE_PLACES_FIELD_MASK.includes("places.id"));
  assert.ok(GOOGLE_PLACES_FIELD_MASK.includes("places.location"));
  assert.ok(GOOGLE_ROUTES_FIELD_MASK.includes("routes.duration"));
  assert.ok(GOOGLE_ROUTES_FIELD_MASK.includes("routes.distanceMeters"));
});

test("Google environment placeholders and setup docs exist", () => {
  const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  const audit = readFileSync(new URL("../LIVE_PROVIDER_FOUNDATION_AUDIT.md", import.meta.url), "utf8");
  const setup = readFileSync(new URL("../LIVE_PROVIDER_GOOGLE_SETUP.md", import.meta.url), "utf8");

  assert.match(envExample, /GOOGLE_PROVIDER_ENABLED=false/);
  assert.match(envExample, /GOOGLE_MAPS_API_KEY=/);
  assert.match(envExample, /GOOGLE_PLACES_API_KEY=/);
  assert.match(envExample, /GOOGLE_ROUTES_API_KEY=/);
  assert.match(audit, /Never display.*live provider data/i);
  assert.match(setup, /Restrict domains/);
});

test("UX cleanup keeps the journey choices before the daily schedule and uses CSS ONE mark", () => {
  const resultsPage = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const resultsHtml = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  const resultsCss = readFileSync(new URL("../results.css", import.meta.url), "utf8");

  assert.ok(resultsPage.indexOf("v23-journey-layout") < resultsPage.indexOf("v23-selected-journey"));
  assert.doesNotMatch(resultsPage, /v23-journey-layout product-journey-layout is-compact\" hidden/);
  assert.match(resultsHtml, /with-one-mark/);
  assert.doesNotMatch(resultsHtml.slice(resultsHtml.indexOf("bottom-actions")), /one-final-circle\.png\?v=20260713-20/);
  assert.match(resultsCss, /conic-gradient/);
});
