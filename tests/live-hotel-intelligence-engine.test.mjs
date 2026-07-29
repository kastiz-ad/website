import assert from "node:assert/strict";
import { test } from "node:test";

import {
  AMADEUS_HOTEL_PROVIDER_ID,
  amadeusHotelHealthCheck,
  listHotelsWithAmadeus,
  normalizeAmadeusHotelOfferResponse,
  normalizeHotelSearchInput,
  searchHotelOffersWithAmadeus
} from "../functions/api/v1/_lib/providers/amadeus-hotels.js";
import { DATA_STATES, createProviderRegistry } from "../functions/api/v1/_lib/providers/provider-contracts.js";
import {
  AccommodationProvider,
  AvailabilityProvider,
  CancellationProvider,
  HOTEL_SORTS,
  HotelProvider,
  RateProvider,
  compareHotelsForMission,
  createHotelChangeExplanation,
  filterHotelOffers,
  rankHotelsForMission,
  scoreHotelForMission
} from "../js/engine/providers/live/accommodation-provider.js";
import { createBrowserProviderRegistry } from "../js/engine/providers/live/provider-registry.js";

const hotelListPayload = {
  data: [{
    chainCode: "HI",
    iataCode: "PAR",
    hotelId: "HLPAR266",
    name: "Hilton Paris Opera",
    geoCode: { latitude: 48.8757, longitude: 2.3258 },
    address: { countryCode: "FR", cityName: "Paris", lines: ["108 Rue Saint-Lazare"] },
    timeZoneName: "Europe/Paris"
  }]
};

const hotelOffersPayload = {
  data: [{
    type: "hotel-offers",
    hotel: {
      hotelId: "HLPAR266",
      name: "Hilton Paris Opera",
      cityCode: "PAR",
      geoCode: { latitude: 48.8757, longitude: 2.3258 }
    },
    available: true,
    offers: [{
      id: "OFFER-1",
      checkInDate: "2026-09-01",
      checkOutDate: "2026-09-04",
      roomQuantity: 1,
      guests: { adults: 2 },
      room: {
        typeEstimated: { category: "STANDARD_ROOM", bedType: "DOUBLE" },
        description: { text: "Double room near station with elevator access" }
      },
      price: {
        currency: "EUR",
        base: "600.00",
        total: "690.00",
        taxes: [{ code: "CITY_TAX", amount: "30.00", currency: "EUR", included: false }],
        fees: [{ type: "SERVICE", amount: "60.00", currency: "EUR" }]
      },
      policies: {
        paymentType: "guarantee",
        cancellations: [{ deadline: "2026-08-29T18:00:00", amount: "100.00", description: { text: "Free cancellation until deadline" } }]
      }
    }]
  }, {
    type: "hotel-offers",
    hotel: {
      hotelId: "MOPAR001",
      name: "Montmartre Walk-Up Stay",
      cityCode: "PAR",
      geoCode: { latitude: 48.8867, longitude: 2.3431 }
    },
    available: true,
    offers: [{
      id: "OFFER-2",
      checkInDate: "2026-09-01",
      checkOutDate: "2026-09-04",
      roomQuantity: 1,
      guests: { adults: 2 },
      room: { typeEstimated: { category: "SINGLE_ROOM", bedType: "SINGLE" }, description: { text: "Single room walk-up" } },
      price: { currency: "EUR", base: "360.00", total: "390.00", taxes: [] },
      policies: {}
    }]
  }]
};

const missionRequest = {
  cityCode: "PAR",
  checkInDate: "2026-09-01",
  checkOutDate: "2026-09-04",
  adults: 2,
  roomQuantity: 1,
  currency: "EUR",
  budget: 750,
  travelerType: "couple",
  accessibility: "elevator preferred",
  itinerary: [
    { title: "Opera", coordinates: { lat: 48.8719, lng: 2.3316 } },
    { title: "Louvre", coordinates: { lat: 48.8606, lng: 2.3376 } }
  ]
};

test("hotel provider returns setup_required without credentials and never fabricates inventory", async () => {
  const result = await searchHotelOffersWithAmadeus({}, missionRequest);
  assert.equal(result.provider, AMADEUS_HOTEL_PROVIDER_ID);
  assert.equal(result.dataState, DATA_STATES.SETUP_REQUIRED);
  assert.deepEqual(result.items, []);
  assert.match(result.error.message, /credentials/i);
});

test("hotel search validates normalized mission input", async () => {
  const result = await searchHotelOffersWithAmadeus({ AMADEUS_CLIENT_ID: "id", AMADEUS_CLIENT_SECRET: "secret" }, { cityCode: "PAR" });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "invalid_hotel_search_input");
});

test("Amadeus hotel response normalizes price, taxes, fees, room, cancellation and evidence", () => {
  const offers = normalizeAmadeusHotelOfferResponse(hotelOffersPayload, { retrievedAt: "2026-07-30T00:00:00Z", environment: "test" });
  assert.equal(offers.length, 2);
  assert.equal(offers[0].name, "Hilton Paris Opera");
  assert.equal(offers[0].availability, "available");
  assert.equal(offers[0].price.total, 690);
  assert.equal(offers[0].price.nightly, 230);
  assert.equal(offers[0].price.taxes[0].code, "CITY_TAX");
  assert.equal(offers[0].roomType, "double");
  assert.match(offers[0].cancellation.description, /Free cancellation/);
  assert.equal(offers[0].providerEvidence.dataState, DATA_STATES.VERIFIED_LIVE);
  assert.match(offers[0].providerEvidence.limitations.join(" "), /does not create hotel reservations/i);
});

test("Amadeus hotel wrapper lists hotels then searches live offers with official endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const called = [];
  globalThis.fetch = async (url, options = {}) => {
    called.push(String(url));
    if (String(url).includes("/v1/security/oauth2/token")) {
      return new Response(JSON.stringify({ access_token: "token", expires_in: 1799 }), { status: 200 });
    }
    if (String(url).includes("/v1/reference-data/locations/hotels/by-city")) {
      assert.match(String(url), /cityCode=PAR/);
      return new Response(JSON.stringify(hotelListPayload), { status: 200 });
    }
    if (String(url).includes("/v3/shopping/hotel-offers")) {
      assert.match(options.headers.Authorization, /^Bearer token$/);
      assert.match(String(url), /hotelIds=HLPAR266/);
      assert.match(String(url), /checkInDate=2026-09-01/);
      return new Response(JSON.stringify(hotelOffersPayload), { status: 200 });
    }
    return new Response("{}", { status: 404 });
  };
  try {
    const env = { AMADEUS_CLIENT_ID: "id", AMADEUS_CLIENT_SECRET: "secret", AMADEUS_ENV: "test" };
    const list = await listHotelsWithAmadeus(env, { cityCode: "PAR", checkInDate: "2026-09-01", checkOutDate: "2026-09-04" });
    const offers = await searchHotelOffersWithAmadeus(env, missionRequest);
    assert.equal(list.items[0].providerHotelId, "HLPAR266");
    assert.equal(offers.ok, true);
    assert.equal(offers.items[0].providerOfferId, "OFFER-1");
    assert.ok(called.some((url) => url.includes("/v1/reference-data/locations/hotels/by-city")));
    assert.ok(called.some((url) => url.includes("/v3/shopping/hotel-offers")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("mission scoring uses itinerary, accessibility, budget and cancellation instead of price only", () => {
  const offers = normalizeAmadeusHotelOfferResponse(hotelOffersPayload);
  const ranked = rankHotelsForMission(offers, missionRequest);
  assert.equal(ranked[0].name, "Hilton Paris Opera");
  assert.ok(ranked[0].missionScore > ranked[1].missionScore);
  assert.match(ranked[0].whySelected, /itinerary|walking|budget|available|Accessibility/i);
  assert.ok(scoreHotelForMission(ranked[0], missionRequest).reasons.length > 1);
});

test("hotel change explanation states only measurable impact", () => {
  const [next, previous] = rankHotelsForMission(normalizeAmadeusHotelOfferResponse(hotelOffersPayload), missionRequest);
  const explanation = createHotelChangeExplanation(previous, next, missionRequest);
  assert.ok(explanation.some((line) => /walking|Total stay/i.test(line)));
  assert.doesNotMatch(explanation.join(" "), /best|perfect|guaranteed/i);
});

test("comparison and filters support mission controls", () => {
  const offers = normalizeAmadeusHotelOfferResponse(hotelOffersPayload);
  assert.equal(filterHotelOffers(offers, { maxTotal: 500 }).length, 1);
  assert.equal(filterHotelOffers(offers, { roomType: "double" }).length, 1);
  const comparison = compareHotelsForMission(offers, { ...missionRequest, sort: HOTEL_SORTS.MISSION_FIT });
  assert.equal(comparison.dimensions.includes("missionScore"), true);
  assert.equal(comparison.hotels.length, 2);
});

test("browser hotel providers expose required interfaces and fail closed unless enabled", async () => {
  for (const Klass of [AccommodationProvider, HotelProvider, AvailabilityProvider, RateProvider, CancellationProvider]) {
    const provider = new Klass();
    const result = await provider.searchAccommodations?.(missionRequest) || await provider.searchAvailability?.(missionRequest);
    assert.equal(result.error.code, "provider_not_configured");
  }
});

test("enabled browser provider ranks live normalized hotels and never enables reservations", async () => {
  const provider = new AccommodationProvider({
    enabled: true,
    fetcher: async () => new Response(JSON.stringify({
      ok: true,
      provider: AMADEUS_HOTEL_PROVIDER_ID,
      items: normalizeAmadeusHotelOfferResponse(hotelOffersPayload),
      retrievedAt: "2026-07-30T00:00:00Z"
    }), { status: 200 })
  });
  const result = await provider.searchAccommodations(missionRequest);
  assert.equal(result.items[0].name, "Hilton Paris Opera");
  assert.equal(result.bookingEnabled, false);
  assert.equal(result.reservationEnabled, false);
  assert.equal(result.honesty.pricesMayChange, true);
});

test("hotel health and registries remain truthful without exposing server secrets", async () => {
  const missing = await amadeusHotelHealthCheck({});
  assert.equal(missing.dataState, DATA_STATES.SETUP_REQUIRED);
  const serverRegistry = createProviderRegistry({ ACCOMMODATION_PROVIDER_ENABLED: "true", AMADEUS_CLIENT_ID: "id", AMADEUS_CLIENT_SECRET: "secret" });
  assert.equal(serverRegistry.providers.find((provider) => provider.id === AMADEUS_HOTEL_PROVIDER_ID).enabled, true);
  const browserRegistry = createBrowserProviderRegistry({ ACCOMMODATION_PROVIDER_ENABLED: "true" });
  const hotel = browserRegistry.providers.find((provider) => provider.id === AMADEUS_HOTEL_PROVIDER_ID);
  assert.equal(hotel.enabled, true);
  assert.doesNotMatch(JSON.stringify(browserRegistry), /AMADEUS_CLIENT_SECRET|test-secret-value/);
});

test("mission hotel input supports city code, coordinates, hotel ids and room quantities", () => {
  assert.equal(normalizeHotelSearchInput({ cityCode: "tyo", checkIn: "2026-09-01", checkOut: "2026-09-04" }).cityCode, "TYO");
  assert.equal(normalizeHotelSearchInput({ coordinates: { lat: 35.6, lng: 139.7 }, rooms: 2 }).roomQuantity, 2);
  assert.deepEqual(normalizeHotelSearchInput({ hotelIds: ["hlpar266"] }).hotelIds, ["HLPAR266"]);
});
