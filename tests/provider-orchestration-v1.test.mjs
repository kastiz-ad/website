import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { AccommodationProvider } from "../js/engine/providers/live/accommodation-provider.js";
import { FlightProvider } from "../js/engine/providers/live/flight-provider.js";
import { ProviderManager, createMemoryCache } from "../js/engine/providers/live/provider-manager.js";
import {
  PROVIDER_ORCHESTRATION_VERSION,
  compareAccommodationOffers,
  compareFlightOffers,
  normalizeAccommodationOffer,
  normalizeFlightOffer,
  normalizeTransportJourney,
  readableTransportJourney
} from "../js/engine/providers/live/provider-normalization.js";
import {
  PROVIDER_STATES,
  createProviderOrchestrationFromMissionData,
  searchAndCompareProviders
} from "../js/engine/providers/live/provider-orchestration.js";
import { createProviderResult } from "../js/engine/providers/live/provider-result.js";

class DemoFlightProvider extends FlightProvider {
  constructor() {
    super({ providerId: "demo-flight-provider", label: "Demo Flight Provider" });
    this.calls = 0;
  }

  async searchFlights() {
    this.calls += 1;
    return createProviderResult({
      ok: true,
      provider: this.providerId,
      sourceState: "cached_public",
      data: [
        { airline: "Korean Air", flightNumber: "KE703", stops: 0, duration: 130, estimatedPrice: { currency: "KRW", min: 420000, max: 610000 } },
        { airline: "One Stop Air", flightNumber: "OS101", stops: 1, duration: 220, estimatedPrice: { currency: "KRW", min: 360000, max: 500000 } }
      ]
    });
  }
}

class DemoAccommodationProvider extends AccommodationProvider {
  async searchAccommodations() {
    return createProviderResult({
      ok: true,
      provider: this.providerId,
      sourceState: "cached_public",
      data: [
        { name: "Station Hotel", area: "Tokyo Station", rating: 4.5, estimatedNightlyPrice: { currency: "KRW", min: 180000, max: 260000 }, accessibility: "elevator" },
        { name: "Far Hotel", area: "Outer area", rating: 4.8, estimatedNightlyPrice: { currency: "KRW", min: 350000, max: 450000 } }
      ]
    });
  }
}

const mission = () => ({
  id: "provider-orchestration-japan",
  type: "travel",
  rawInput: "7 day Japan trip",
  origin: "Seoul",
  destination: { city: "Tokyo", country: "Japan", countryCode: "JP" },
  schedule: { startDate: "2026-08-01", endDate: "2026-08-07" },
  flights: [{ provider: "mission-estimate", airline: "Korean Air", flightNumber: "KE703", stops: 0, duration: 130, estimatedPrice: { currency: "KRW", min: 420000, max: 610000 } }],
  hotels: [{ provider: "mission-estimate", name: "Station Hotel", area: "Tokyo Station", rating: 4.5, estimatedNightlyPrice: { currency: "KRW", min: 180000, max: 260000 }, accessibility: "elevator" }]
});

test("ProviderManager exposes all provider category interfaces and unavailable providers fail safely", async () => {
  const manager = new ProviderManager();
  assert.equal(typeof manager.searchFlights, "function");
  assert.equal(typeof manager.searchAccommodations, "function");
  assert.equal(typeof manager.searchRestaurants, "function");
  assert.equal(typeof manager.searchExperiences, "function");
  const result = await manager.searchFlights({ origin: "Seoul", destination: "Tokyo" });
  assert.equal(result.ok, false);
  assert.equal(result.normalized.length, 0);
  assert.equal(result.error.code, "provider_not_configured");
});

test("flight, accommodation and transport responses normalize into ONE-owned models", () => {
  const flight = normalizeFlightOffer({ provider: "x", airline: "Asiana", flightNumber: "OZ102", stops: 0, estimatedPrice: { currency: "KRW", min: 410000 } });
  assert.equal(flight.provider, "x");
  assert.equal(flight.airline, "Asiana");
  assert.equal(flight.price.currency, "KRW");
  assert.equal(flight.liveStatus, "unavailable");

  const hotel = normalizeAccommodationOffer({ provider: "y", name: "City Hotel", rating: 4.6, estimatedNightlyPrice: { currency: "KRW", min: 200000 }, photos: ["https://example.com/a.jpg"] });
  assert.equal(hotel.property, "City Hotel");
  assert.equal(hotel.images[0].url, "https://example.com/a.jpg");

  const route = normalizeTransportJourney({ provider: "google-routes", steps: [{ mode: "walk", instruction: "Walk 4 min" }, { mode: "train", instruction: "JR Yamanote Line" }] });
  assert.match(readableTransportJourney(route), /Walk 4 min/);
  assert.match(readableTransportJourney(route), /JR Yamanote Line/);
});

test("ONE compares normalized providers instead of listing raw provider JSON", () => {
  const flights = [
    normalizeFlightOffer({ airline: "One Stop", stops: 1, duration: 220, estimatedPrice: { currency: "KRW", min: 300000 } }),
    normalizeFlightOffer({ airline: "Direct", stops: 0, duration: 130, estimatedPrice: { currency: "KRW", min: 420000 } })
  ];
  assert.equal(compareFlightOffers(flights)[0].airline, "Direct");
  assert.ok(compareFlightOffers(flights)[0].whySelected);

  const hotels = [
    normalizeAccommodationOffer({ name: "Accessible Hotel", rating: 4.2, estimatedNightlyPrice: { currency: "KRW", min: 160000 }, accessibility: "wheelchair accessible" }),
    normalizeAccommodationOffer({ name: "Expensive Hotel", rating: 4.8, estimatedNightlyPrice: { currency: "KRW", min: 600000 } })
  ];
  assert.equal(compareAccommodationOffers(hotels)[0].property, "Accessible Hotel");
});

test("provider orchestration can compare current mission data without fake live success", () => {
  const layer = createProviderOrchestrationFromMissionData(mission());
  assert.equal(layer.version, PROVIDER_ORCHESTRATION_VERSION);
  assert.equal(layer.bookingEnabled, false);
  assert.equal(layer.paymentEnabled, false);
  assert.equal(layer.secretsExposed, false);
  assert.equal(layer.comparison.selected.flight.airline, "Korean Air");
  assert.equal(layer.providerStatuses.flights.state, PROVIDER_STATES.UNAVAILABLE);
});

test("live adapter path normalizes, compares and caches provider searches", async () => {
  const flightProvider = new DemoFlightProvider();
  const manager = new ProviderManager({
    flightProvider,
    accommodationProvider: new DemoAccommodationProvider({ providerId: "demo-hotel-provider" }),
    cache: createMemoryCache({ ttlMs: 60_000 })
  });
  const first = await searchAndCompareProviders(mission(), { manager, language: "en" });
  const second = await searchAndCompareProviders(mission(), { manager, language: "en" });
  assert.equal(first.providerStatuses.flights.state, PROVIDER_STATES.SUCCESS);
  assert.equal(first.normalized.flights[0].provider, "demo-flight-provider");
  assert.equal(first.comparison.selected.flight.airline, "Korean Air");
  assert.equal(second.providerStatuses.flights.state, PROVIDER_STATES.SUCCESS);
  assert.equal(flightProvider.calls, 1);
});

test("results page wires provider orchestration and cache-busted demo entry", () => {
  const source = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  const manager = readFileSync(new URL("../js/engine/providers/live/provider-manager.js", import.meta.url), "utf8");
  assert.match(source, /createProviderOrchestrationFromMissionData/);
  assert.match(source, /providerOrchestration/);
  assert.match(manager, /searchFlights/);
  assert.match(manager, /searchAccommodations/);
  assert.match(html, /20260730-provider-orchestration/);
});
