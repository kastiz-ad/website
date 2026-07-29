import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  createProviderRegistry,
  DATA_STATES,
  PROVIDER_TRUTH_STATUS,
  classifyProviderFailure,
  createProviderEvidence,
  isProviderConnected,
  providerError,
  providerSuccess
} from "../functions/api/v1/_lib/providers/provider-contracts.js";
import {
  GOOGLE_PLACES_FIELD_MASK,
  GOOGLE_ROUTES_FIELD_MASK,
  computeRoutesWithGoogle,
  geocodeWithGoogle,
  normalizeGeocodeResult,
  normalizePlaceResult,
  normalizeRouteResult,
  searchTextWithGooglePlaces
} from "../functions/api/v1/_lib/providers/google.js";
import {
  assertNoRawPaymentCredentials,
  confirmTossTestPayment,
  createTossTestPaymentOrder,
  resetTossIdempotencyMemory
} from "../functions/api/v1/_lib/providers/toss.js";
import { createBrowserProviderRegistry } from "../js/engine/providers/live/provider-registry.js";
import { PaymentProvider } from "../js/engine/providers/live/payment-provider.js";
import { ReservationProvider } from "../js/engine/providers/live/reservation-provider.js";
import { FlightProvider } from "../js/engine/providers/live/flight-provider.js";
import { AccommodationProvider } from "../js/engine/providers/live/accommodation-provider.js";

test("provider registry exposes configured/setup-required state without secrets", () => {
  const registry = createProviderRegistry({
    GOOGLE_MAPS_BROWSER_KEY: "browser-public-key",
    GOOGLE_MAPS_SERVER_KEY: "server-secret-key",
    GOOGLE_PLACES_API_KEY: "places-secret-key",
    GOOGLE_ROUTES_API_KEY: "routes-secret-key",
    TOSS_CLIENT_KEY: "test_ck",
    TOSS_SECRET_KEY: "test_sk",
    TOSS_MODE: "test"
  });
  assert.equal(registry.providers.find((provider) => provider.id === "google-maps").healthStatus, "enabled");
  assert.equal(registry.secretExposure.googleServerKeysExposedToBrowser, false);
  assert.equal(registry.secretExposure.tossSecretExposedToBrowser, false);
  assert.doesNotMatch(JSON.stringify(registry.publicConfig), /server-secret-key|places-secret-key|routes-secret-key|test_sk/);
  assert.match(JSON.stringify(registry.publicConfig), /browser-public-key|test_ck/);
});

test("missing Google and Toss credentials return setup_required instead of fake live data", async () => {
  const geocode = await geocodeWithGoogle({}, { query: "Tokyo" });
  const places = await searchTextWithGooglePlaces({}, { textQuery: "matcha ice cream in Tokyo" });
  const routes = await computeRoutesWithGoogle({}, { origin: { lat: 35, lng: 139 }, destination: { lat: 35.1, lng: 139.1 } });
  const toss = await createTossTestPaymentOrder({}, { missionId: "m1", amount: 1000 });
  assert.equal(geocode.dataState, DATA_STATES.SETUP_REQUIRED);
  assert.equal(places.dataState, DATA_STATES.SETUP_REQUIRED);
  assert.equal(routes.dataState, DATA_STATES.SETUP_REQUIRED);
  assert.equal(toss.dataState, DATA_STATES.SETUP_REQUIRED);
});

test("Google normalizers preserve live evidence without inventing missing fields", () => {
  const geocode = normalizeGeocodeResult({
    formatted_address: "Lima, Peru",
    place_id: "place-lima",
    geometry: { location: { lat: -12.0464, lng: -77.0428 }, location_type: "APPROXIMATE" },
    types: ["locality", "political"]
  }, { retrievedAt: "2026-07-30T00:00:00Z" });
  assert.equal(geocode.formattedAddress, "Lima, Peru");
  assert.equal(geocode.locationType, "APPROXIMATE");
  assert.equal(geocode.providerEvidence.dataState, DATA_STATES.VERIFIED_LIVE);

  const place = normalizePlaceResult({
    id: "places/abc",
    displayName: { text: "Nakamura Tokichi" },
    formattedAddress: "Kyoto, Japan",
    location: { latitude: 35.0116, longitude: 135.7681 },
    rating: 4.5,
    userRatingCount: 1200,
    types: ["cafe"],
    currentOpeningHours: { openNow: true }
  }, { retrievedAt: "2026-07-30T00:00:00Z" });
  assert.equal(place.name, "Nakamura Tokichi");
  assert.equal(place.openingStatus.openNow, true);
  assert.equal(place.priceLevel, null);

  const route = normalizeRouteResult({
    duration: "1200s",
    staticDuration: "1100s",
    distanceMeters: 4000,
    polyline: { encodedPolyline: "abcd" },
    legs: [{ distanceMeters: 4000, steps: [{ travelMode: "WALK", navigationInstruction: { instructions: "Walk to station" } }] }]
  }, { origin: { lat: 1, lng: 2 }, destination: { lat: 3, lng: 4 }, travelMode: "WALK" }, { retrievedAt: "2026-07-30T00:00:00Z" });
  assert.equal(route.mode, "WALK");
  assert.equal(route.durationSeconds, 1200);
  assert.equal(route.legs[0].steps[0].instruction, "Walk to station");
});

test("Google API wrappers use official endpoints, field masks and normalize mocked live responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes("geocode")) {
      return new Response(JSON.stringify({ status: "OK", results: [{ formatted_address: "Seoul, South Korea", place_id: "seoul", geometry: { location: { lat: 37.5665, lng: 126.978 }, location_type: "APPROXIMATE" } }] }), { status: 200 });
    }
    if (String(url).includes("places:searchText")) {
      assert.match(options.headers["X-Goog-FieldMask"], /places\.displayName/);
      return new Response(JSON.stringify({ places: [{ id: "p1", displayName: { text: "Tsujiri" }, formattedAddress: "Kyoto", location: { latitude: 35, longitude: 135 }, rating: 4.4 }] }), { status: 200 });
    }
    if (String(url).includes("computeRoutes")) {
      assert.match(options.headers["X-Goog-FieldMask"], /routes\.distanceMeters/);
      return new Response(JSON.stringify({ routes: [{ duration: "600s", distanceMeters: 1000 }] }), { status: 200 });
    }
    return new Response("{}", { status: 404 });
  };
  try {
    const env = { GOOGLE_MAPS_SERVER_KEY: "server", GOOGLE_PLACES_API_KEY: "places", GOOGLE_ROUTES_API_KEY: "routes" };
    const geocode = await geocodeWithGoogle(env, { query: "서울" });
    const places = await searchTextWithGooglePlaces(env, { textQuery: "matcha Kyoto" });
    const routes = await computeRoutesWithGoogle(env, { origin: { lat: 35, lng: 135 }, destination: { lat: 35.1, lng: 135.1 } });
    assert.equal(geocode.items[0].formattedAddress, "Seoul, South Korea");
    assert.equal(places.items[0].name, "Tsujiri");
    assert.equal(routes.items[0].distanceMeters, 1000);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Toss test adapter rejects raw sensitive data, confirms with minimum receipt and prevents duplicates", async () => {
  assert.throws(() => assertNoRawPaymentCredentials({ cardNumber: "4111111111111111" }), /Raw payment credentials/);
  resetTossIdempotencyMemory();
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({ paymentKey: "pay_123", orderId: "ORDER_123", totalAmount: 1000, method: "카드", status: "DONE", approvedAt: "2026-07-30T00:00:00Z", card: { number: "411111******1111" } }), { status: 200 });
  };
  try {
    const env = { TOSS_CLIENT_KEY: "test_ck", TOSS_SECRET_KEY: "test_sk", TOSS_MODE: "test" };
    const prepared = await createTossTestPaymentOrder(env, { missionId: "m1", amount: 1000 });
    assert.equal(prepared.ok, true);
    const first = await confirmTossTestPayment(env, { paymentKey: "pay_123", orderId: "ORDER_123", amount: 1000 });
    const second = await confirmTossTestPayment(env, { paymentKey: "pay_123", orderId: "ORDER_123", amount: 1000 });
    assert.equal(first.items[0].status, "DONE");
    assert.equal(second.evidence.duplicatePrevented, true);
    assert.equal(calls, 1);
    assert.doesNotMatch(JSON.stringify(first), /411111/);
  } finally {
    globalThis.fetch = originalFetch;
    resetTossIdempotencyMemory();
  }
});

test("browser registry and provider interfaces do not expose server-only credentials", async () => {
  const registry = createBrowserProviderRegistry({ GOOGLE_MAPS_BROWSER_KEY: "browser", TOSS_CLIENT_KEY: "test_ck", TOSS_MODE: "test" });
  assert.equal(registry.secretExposure.googleServerKeysExposedToBrowser, false);
  assert.equal(registry.secretExposure.tossSecretExposedToBrowser, false);
  assert.equal(registry.providers.find((provider) => provider.id === "amadeus-flight-offers").enabled, false);

  const payment = new PaymentProvider();
  const raw = payment.rejectRawPaymentCredentials({ cvv: "123" });
  assert.equal(raw.ok, false);
  const reservation = await new ReservationProvider().prepareReservation({ hotel: "x" });
  const flight = await new FlightProvider({ fetcher: null }).searchFlights({ destination: "Tokyo" });
  const accommodation = await new AccommodationProvider().searchAccommodations({ destination: "Tokyo" });
  assert.equal(reservation.error.code, "provider_not_configured");
  assert.equal(flight.error.code, "provider_not_configured");
  assert.equal(accommodation.error.code, "provider_not_configured");
});

test("environment docs include exact variables and frontend source avoids server secrets", () => {
  const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  const adapters = readFileSync(new URL("../js/engine/providers/live/google-provider-adapters.js", import.meta.url), "utf8");
  const registry = readFileSync(new URL("../js/engine/providers/live/provider-registry.js", import.meta.url), "utf8");
  assert.match(envExample, /GOOGLE_MAPS_BROWSER_KEY=/);
  assert.match(envExample, /GOOGLE_MAPS_SERVER_KEY=/);
  assert.match(envExample, /TOSS_SECRET_KEY=/);
  assert.ok(GOOGLE_PLACES_FIELD_MASK.includes("places.displayName"));
  assert.ok(GOOGLE_ROUTES_FIELD_MASK.includes("routes.distanceMeters"));
  assert.doesNotMatch(adapters, /browserConfig\.GOOGLE_PLACES_API_KEY|browserConfig\.GOOGLE_ROUTES_API_KEY|browserConfig\.GOOGLE_MAPS_SERVER_KEY/);
  assert.doesNotMatch(registry, /TOSS_SECRET_KEY|GOOGLE_MAPS_SERVER_KEY|GOOGLE_PLACES_API_KEY|GOOGLE_ROUTES_API_KEY/);
});

test("provider truthfulness requires credentials auth response normalization and UI evidence", () => {
  assert.equal(isProviderConnected({ ok: true, dataState: DATA_STATES.VERIFIED_LIVE, items: [] }), false);
  assert.equal(isProviderConnected(providerSuccess("google-places", [{ name: "Real place" }], { provider: "google-places" })), true);
  assert.equal(providerSuccess("google-places", []).dataState, DATA_STATES.UNAVAILABLE);
  assert.equal(classifyProviderFailure({ status: 403, code: "REQUEST_DENIED" }), DATA_STATES.AUTHENTICATION_FAILED);
  assert.equal(classifyProviderFailure({ status: 429, code: "RESOURCE_EXHAUSTED" }), DATA_STATES.QUOTA_EXCEEDED);
  assert.equal(classifyProviderFailure({ status: 504, code: "provider_timeout" }), DATA_STATES.NETWORK_ERROR);
  assert.equal(providerError("google-places", { status: 503, code: "UNAVAILABLE", message: "Provider unavailable" }).dataState, DATA_STATES.PROVIDER_UNAVAILABLE);
  assert.equal(PROVIDER_TRUTH_STATUS.CONNECTED_AND_VERIFIED, "Connected and verified");
  assert.equal(createProviderEvidence({ provider: "google-places", operation: "searchText", responseId: "p1", environment: "preview", requestStatus: "success" }).providerResponseIdentifier, "p1");
});

test("founder activation checklist documents manual actions without asking for chat secrets", () => {
  const checklist = readFileSync(new URL("../FOUNDER_PROVIDER_ACTIVATION_CHECKLIST.md", import.meta.url), "utf8");
  for (const required of ["Purpose", "Website", "Required account", "Required permissions", "Estimated completion time", "Variables to copy", "Exactly where each variable belongs", "Verification steps", "Expected successful result", "Common mistakes", "Security recommendations"]) {
    assert.match(checklist, new RegExp(required));
  }
  assert.match(checklist, /Never paste API keys into Codex chat/);
  assert.match(checklist, /Provider is connected only when all are true/);
  assert.doesNotMatch(checklist, /paste.*key.*chat.*so Codex can use it/i);
});

test("founder actions required report has required final sections and one exact next step", () => {
  const report = readFileSync(new URL("../FOUNDER_ACTIONS_REQUIRED.md", import.meta.url), "utf8");
  for (const required of ["FOUNDER ACTIONS REQUIRED", "Provider name", "Current status", "What Codex completed", "Founder must complete manually", "Console/account area", "Required API/service", "Billing required", "Provider approval/contract required", "Environment variables", "Browser-safe/server-only", "Local development location", "Deployed location", "Restrictions", "Verification", "Expected success", "Common setup errors", "Security warnings", "Environment", "Estimated API-cost exposure", "EXACT NEXT STEP"]) {
    assert.match(report, new RegExp(required));
  }
  assert.match(report, /Code ready — credentials required/);
  assert.match(report, /Provider approval or contract required/);
  assert.match(report, /Test environment only/);
  assert.match(report, /GOOGLE_MAPS_SERVER_KEY/);
  assert.doesNotMatch(report, /All APIs are connected|Ready for production|Basically connected|Almost live|Ready enough|Should work/);
});
