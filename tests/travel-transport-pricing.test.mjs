import test from "node:test";
import assert from "node:assert/strict";
import { buildTransportCostBreakdown } from "../js/ui/travel-transport-pricing.js";

test("airport transfer is scoped one-way and is not multiplied by travelers or days", () => {
  const result = buildTransportCostBreakdown({
    airportTransferOneWay: { currency: "KRW", min: 30000, max: 50000 },
    localTransitPerPersonDay: { currency: "KRW", min: 5000, max: 8000 },
    travelerCount: 2,
    durationDays: 7
  });
  assert.deepEqual(result.airportTransferOneWay, { currency: "KRW", min: 30000, max: 50000 });
  assert.deepEqual(result.airportTransferRoundTrip, { currency: "KRW", min: 60000, max: 100000 });
});

test("local transit applies traveler and duration multipliers exactly once", () => {
  const result = buildTransportCostBreakdown({
    airportTransferOneWay: { currency: "COP", min: 100000, max: 140000 },
    localTransitPerPersonDay: { currency: "COP", min: 12000, max: 18000 },
    travelerCount: 2,
    durationDays: 5
  });
  assert.deepEqual(result.localTransitTripTotal, { currency: "COP", min: 120000, max: 180000 });
  assert.deepEqual(result.tripTotal, { currency: "COP", min: 320000, max: 460000 });
});

test("missing or mixed-currency pricing produces an honest unavailable result", () => {
  assert.equal(buildTransportCostBreakdown({}).reason, "destination_fare_unavailable");
  assert.equal(buildTransportCostBreakdown({
    airportTransferOneWay: { currency: "COP", min: 1, max: 2 },
    localTransitPerPersonDay: { currency: "KRW", min: 1, max: 2 }
  }).reason, "currency_mismatch");
});
