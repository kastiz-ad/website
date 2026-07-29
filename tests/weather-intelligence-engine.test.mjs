import assert from "node:assert/strict";
import { test } from "node:test";

import {
  OpenMeteoWeatherProvider,
  WEATHER_HAZARDS,
  WEATHER_PROVIDER_STATUS,
  createWeatherIntelligenceEngine,
  createWeatherProviderResult,
  detectWeatherHazards,
  estimateWeatherImpact
} from "../js/engine/weather/weather-intelligence-engine.js";

const forecast = [
  { time: "2026-09-02T13:00", temperatureC: 34, rainMm: 0, precipitationMm: 0, windKph: 12, weatherCode: 1 },
  { time: "2026-09-02T15:00", temperatureC: 28, rainMm: 6, precipitationMm: 8, windKph: 20, weatherCode: 63 },
  { time: "2026-09-02T18:00", temperatureC: 25, rainMm: 0, precipitationMm: 0, windKph: 58, weatherCode: 95 }
];

const mission = {
  id: "weather-mission",
  type: "travel",
  itinerary: [
    { id: "park", title: "Outdoor park walk" },
    { id: "museum", title: "Indoor museum visit" }
  ],
  routes: [{ id: "walk-route", walkingMinutes: 22 }]
};

test("Open-Meteo provider returns unavailable when coordinates or fetch are missing", async () => {
  const provider = new OpenMeteoWeatherProvider({ fetcher: null });
  const result = await provider.getForecast({});

  assert.equal(result.ok, false);
  assert.equal(result.status, WEATHER_PROVIDER_STATUS.PROVIDER_UNAVAILABLE);
  assert.match(result.message, /Weather provider unavailable/);
});

test("Open-Meteo provider normalizes live forecast with mocked fetch", async () => {
  const fetcher = async () => ({
    ok: true,
    async json() {
      return {
        hourly: {
          time: ["2026-09-02T13:00"],
          temperature_2m: [27],
          precipitation: [0],
          rain: [0],
          snowfall: [0],
          wind_speed_10m: [10],
          weather_code: [1]
        }
      };
    }
  });
  const provider = new OpenMeteoWeatherProvider({ fetcher });
  const result = await provider.getForecast({ latitude: 35.6, longitude: 139.7, startDate: "2026-09-02", endDate: "2026-09-02" });

  assert.equal(result.ok, true);
  assert.equal(result.status, WEATHER_PROVIDER_STATUS.VERIFIED_LIVE);
  assert.equal(result.forecast[0].temperatureC, 27);
});

test("weather hazards detect rain, heat, storm, wind and severe conditions", () => {
  const hazards = detectWeatherHazards(forecast);
  const types = new Set(hazards.map((hazard) => hazard.type));

  assert.ok(types.has(WEATHER_HAZARDS.RAIN));
  assert.ok(types.has(WEATHER_HAZARDS.HEAT));
  assert.ok(types.has(WEATHER_HAZARDS.STORM));
  assert.ok(types.has(WEATHER_HAZARDS.WIND));
  assert.ok(types.has(WEATHER_HAZARDS.SEVERE));
});

test("weather intelligence estimates itinerary and route impact", () => {
  const impact = estimateWeatherImpact({ forecast, itinerary: mission.itinerary, routes: mission.routes });

  assert.ok(impact.impactedItems.some((item) => item.id === "park"));
  assert.equal(impact.routeImpact.length, 1);
  assert.ok(impact.missionImpactScore > 70);
});

test("weather engine suggests approved-only itinerary ordering and route changes", () => {
  const engine = createWeatherIntelligenceEngine({
    result: mission,
    providerResult: createWeatherProviderResult({ ok: true, provider: "open-meteo", status: "verified_live", forecast }),
    language: "en"
  });

  assert.equal(engine.status, "ready");
  assert.ok(engine.suggestions.length >= 2);
  assert.ok(engine.suggestions.every((suggestion) => suggestion.requiresApproval));
  assert.ok(engine.suggestions.every((suggestion) => suggestion.providerBacked));
  assert.equal(engine.accessibilityReview.ok, true);
  assert.equal(engine.performanceReview.providerCalls, 1);
});

test("weather engine displays provider unavailable without fabricating forecast", () => {
  const engine = createWeatherIntelligenceEngine({ result: mission, providerResult: createWeatherProviderResult(), language: "ko" });

  assert.equal(engine.status, "unavailable");
  assert.equal(engine.suggestions.length, 0);
  assert.match(engine.message, /날씨 제공업체/);
});
