import assert from "node:assert/strict";
import { test } from "node:test";

import {
  AMADEUS_FLIGHT_PROVIDER_ID,
  amadeusFlightHealthCheck,
  normalizeAmadeusFlightResponse,
  normalizeFlightSearchInput,
  searchFlightsWithAmadeus
} from "../functions/api/v1/_lib/providers/amadeus-flights.js";
import {
  FLIGHT_SORTS,
  FlightProvider,
  filterFlightOffers,
  sortFlightOffers
} from "../js/engine/providers/live/flight-provider.js";
import { DATA_STATES, createProviderRegistry } from "../functions/api/v1/_lib/providers/provider-contracts.js";
import { createBrowserProviderRegistry } from "../js/engine/providers/live/provider-registry.js";

const sampleAmadeusPayload = {
  data: [{
    type: "flight-offer",
    id: "1",
    itineraries: [{
      duration: "PT2H10M",
      segments: [{
        carrierCode: "KE",
        number: "2101",
        departure: { iataCode: "ICN", at: "2026-08-01T09:00:00" },
        arrival: { iataCode: "HND", at: "2026-08-01T11:10:00" }
      }]
    }],
    price: { currency: "KRW", grandTotal: "280000" },
    travelerPricings: [{
      fareDetailsBySegment: [{
        cabin: "ECONOMY",
        brandedFareLabel: "STANDARD",
        includedCheckedBags: { quantity: 1 }
      }]
    }]
  }, {
    type: "flight-offer",
    id: "2",
    itineraries: [{
      duration: "PT3H25M",
      segments: [{
        carrierCode: "OZ",
        number: "1085",
        departure: { iataCode: "ICN", at: "2026-08-01T07:00:00" },
        arrival: { iataCode: "KIX", at: "2026-08-01T08:50:00" }
      }, {
        carrierCode: "OZ",
        number: "9001",
        departure: { iataCode: "KIX", at: "2026-08-01T09:30:00" },
        arrival: { iataCode: "HND", at: "2026-08-01T10:25:00" }
      }]
    }],
    price: { currency: "KRW", grandTotal: "190000" },
    travelerPricings: [{ fareDetailsBySegment: [{ cabin: "ECONOMY" }] }]
  }],
  dictionaries: { carriers: { KE: "Korean Air", OZ: "Asiana Airlines" } }
};

test("flight search returns setup_required without credentials and never fabricates offers", async () => {
  const result = await searchFlightsWithAmadeus({}, { origin: "ICN", destination: "HND", departure: "2026-08-01" });
  assert.equal(result.provider, AMADEUS_FLIGHT_PROVIDER_ID);
  assert.equal(result.dataState, DATA_STATES.SETUP_REQUIRED);
  assert.deepEqual(result.items, []);
  assert.match(result.error.message, /credentials/i);
});

test("flight search validates normalized mission input before provider call", async () => {
  const result = await searchFlightsWithAmadeus({ AMADEUS_CLIENT_ID: "id", AMADEUS_CLIENT_SECRET: "secret" }, { origin: "Seoul", destination: "Tokyo" });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "invalid_flight_search_input");
});

test("Amadeus live response normalization returns provider evidence and honest fields", () => {
  const offers = normalizeAmadeusFlightResponse(sampleAmadeusPayload, { retrievedAt: "2026-07-30T00:00:00Z", environment: "test" });
  assert.equal(offers.length, 2);
  assert.equal(offers[0].airline, "Korean Air");
  assert.equal(offers[0].flightNumber, "KE2101");
  assert.equal(offers[0].origin, "ICN");
  assert.equal(offers[0].destination, "HND");
  assert.equal(offers[0].duration, 130);
  assert.equal(offers[0].stops, 0);
  assert.equal(offers[0].price.amount, 280000);
  assert.equal(offers[0].providerEvidence.dataState, DATA_STATES.VERIFIED_LIVE);
  assert.match(offers[0].providerEvidence.limitations.join(" "), /does not issue tickets/i);
});

test("Amadeus wrapper uses OAuth and official flight offers endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const called = [];
  globalThis.fetch = async (url, options = {}) => {
    called.push(String(url));
    if (String(url).includes("/v1/security/oauth2/token")) {
      assert.equal(options.method, "POST");
      assert.match(String(options.body), /client_credentials/);
      return new Response(JSON.stringify({ access_token: "token", token_type: "Bearer", expires_in: 1799 }), { status: 200 });
    }
    if (String(url).includes("/v2/shopping/flight-offers")) {
      assert.match(options.headers.Authorization, /^Bearer token$/);
      assert.match(String(url), /originLocationCode=ICN/);
      assert.match(String(url), /destinationLocationCode=HND/);
      return new Response(JSON.stringify(sampleAmadeusPayload), { status: 200 });
    }
    return new Response("{}", { status: 404 });
  };
  try {
    const result = await searchFlightsWithAmadeus(
      { AMADEUS_CLIENT_ID: "id", AMADEUS_CLIENT_SECRET: "secret", AMADEUS_ENV: "test" },
      { origin: "ICN", destination: "HND", departure: "2026-08-01", return: "2026-08-07", passengers: 2, cabin: "economy", currency: "KRW" }
    );
    assert.equal(result.ok, true);
    assert.equal(result.items[0].airline, "Korean Air");
    assert.equal(result.evidence.endpoint, "v2/shopping/flight-offers");
    assert.equal(called.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("flight provider exposes required methods and keeps ticketing disabled", async () => {
  const provider = new FlightProvider({
    apiBase: "/api/v1",
    enabled: true,
    fetcher: async () => new Response(JSON.stringify({
      ok: true,
      provider: AMADEUS_FLIGHT_PROVIDER_ID,
      items: normalizeAmadeusFlightResponse(sampleAmadeusPayload),
      retrievedAt: "2026-07-30T00:00:00Z"
    }), { status: 200 })
  });
  for (const method of ["searchFlights", "searchMultiCity", "searchRoundTrip", "searchOneWay", "getFareRules", "getFlightDetails", "healthCheck", "normalizeResponse"]) {
    assert.equal(typeof provider[method], "function");
  }
  const result = await provider.searchRoundTrip({ origin: "ICN", destination: "HND", departure: "2026-08-01", return: "2026-08-07", sort: FLIGHT_SORTS.LOWEST_PRICE });
  assert.equal(result.items[0].airline, "Asiana Airlines");
  assert.equal(result.bookingEnabled, false);
  assert.equal(result.ticketingEnabled, false);
  assert.equal(result.honesty.pricesMayChange, true);
});

test("flight sorting and filtering supports user controls", () => {
  const offers = normalizeAmadeusFlightResponse(sampleAmadeusPayload);
  assert.equal(sortFlightOffers(offers, FLIGHT_SORTS.LOWEST_PRICE)[0].airline, "Asiana Airlines");
  assert.equal(sortFlightOffers(offers, FLIGHT_SORTS.FEWEST_STOPS)[0].airline, "Korean Air");
  assert.equal(filterFlightOffers(offers, { airlines: ["KE"], stops: 0 }).length, 1);
  assert.equal(filterFlightOffers(offers, { maxPrice: 200000 })[0].airline, "Asiana Airlines");
});

test("flight provider health and registries are truthful", async () => {
  const missing = await amadeusFlightHealthCheck({});
  assert.equal(missing.dataState, DATA_STATES.SETUP_REQUIRED);
  const serverRegistry = createProviderRegistry({ FLIGHT_PROVIDER_ENABLED: "true", AMADEUS_CLIENT_ID: "id", AMADEUS_CLIENT_SECRET: "secret" });
  assert.equal(serverRegistry.providers.find((provider) => provider.id === AMADEUS_FLIGHT_PROVIDER_ID).enabled, true);
  const browserRegistry = createBrowserProviderRegistry({ FLIGHT_PROVIDER_ENABLED: "true" });
  const browserFlight = browserRegistry.providers.find((provider) => provider.id === AMADEUS_FLIGHT_PROVIDER_ID);
  assert.equal(browserFlight.enabled, true);
  assert.doesNotMatch(JSON.stringify(browserRegistry), /AMADEUS_CLIENT_SECRET|test-secret-value/);
});

test("required demo routes normalize common Korea-Japan searches without credentials", () => {
  for (const destination of ["HND", "NRT", "KIX", "FUK"]) {
    const input = normalizeFlightSearchInput({ origin: "ICN", destination, departure: "2026-08-01", return: "2026-08-07", passengers: 2 });
    assert.equal(input.origin, "ICN");
    assert.equal(input.destination, destination);
    assert.equal(input.tripType, "round_trip");
  }
});
