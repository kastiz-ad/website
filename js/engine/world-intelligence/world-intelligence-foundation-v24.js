import {
  SOURCE_STATES,
  createBusinessModel,
  createGovernmentResourceModel,
  createHotelModel,
  createRestaurantModel,
  createUnavailableModel
} from "./world-models-v24.js";
import {
  createV24AdapterRegistry,
  createV24FixtureAdapter
} from "./provider-adapters-v24.js";

export const WORLD_INTELLIGENCE_VERSION = "V24";

const SOURCE_STATE_LABELS = Object.freeze({
  verified_live: {
    en: "Verified",
    ko: "검증됨",
    es: "Verificado"
  },
  cached_public: {
    en: "Public info",
    ko: "공개 정보",
    es: "Información pública"
  },
  estimated: {
    en: "Estimated",
    ko: "예상",
    es: "Estimado"
  },
  placeholder: {
    en: "Search ready",
    ko: "검색 준비",
    es: "Búsqueda lista"
  },
  unavailable: {
    en: "Live search required",
    ko: "실시간 검색 필요",
    es: "Requiere búsqueda"
  }
});

const KNOWN_FIXTURE_SCENARIOS = new Set([
  "fully-verified",
  "mixed-source",
  "estimated-only",
  "search-required",
  "provider-unavailable",
  "multiple-providers-merged"
]);

const clean = (value) => String(value || "").trim();

export const sourceStateUserLabel = (state, language = "en") => (
  SOURCE_STATE_LABELS[state]?.[language]
  || SOURCE_STATE_LABELS[state]?.en
  || SOURCE_STATE_LABELS.unavailable.en
);

const emptyBreakdown = () => SOURCE_STATES.reduce((breakdown, state) => {
  breakdown[state] = 0;
  return breakdown;
}, {});

const countSources = (groups = {}) => {
  const breakdown = emptyBreakdown();
  Object.values(groups).flat().forEach((item) => {
    const state = SOURCE_STATES.includes(item?.sourceState) ? item.sourceState : "unavailable";
    breakdown[state] += 1;
  });
  return Object.freeze(breakdown);
};

const averageConfidence = (groups = {}) => {
  const items = Object.values(groups).flat();
  if (!items.length) return 0;
  const total = items.reduce((sum, item) => sum + Number(item?.confidence || 0), 0);
  return Math.round((total / items.length) * 100) / 100;
};

const providerResultByCategory = (result, category) => (
  Array.isArray(result?.providerResults)
    ? result.providerResults.find((item) => item?.category === category)
    : null
);

const ensureFallbackHotels = (models, destination) => {
  if (models.some((item) => item?.name)) return models;
  return [
    createHotelModel({
      id: "hotel-live-search-required",
      name: null,
      location: destination?.city || destination?.country || null,
      provider: "ONE World Intelligence",
      sourceState: "unavailable",
      confidence: 0,
      priceState: "requires_live_search",
      availabilityState: "requires_live_search",
      sourceMetadata: {
        provider: "ONE World Intelligence",
        sourceState: "unavailable",
        freshness: "live accommodation search required",
        confidence: 0,
        evidence: ["no connected hotel provider returned usable accommodation data"]
      }
    })
  ];
};

const ensureFallbackRestaurants = (models, destination) => {
  if (models.some((item) => item?.name)) return models;
  return [
    createRestaurantModel({
      id: "restaurant-live-search-required",
      name: null,
      category: "restaurant",
      provider: "ONE World Intelligence",
      sourceState: "unavailable",
      confidence: 0,
      openingHoursState: "requires_live_search",
      priceLevelState: "requires_live_search",
      sourceMetadata: {
        provider: "ONE World Intelligence",
        sourceState: "unavailable",
        freshness: "live restaurant search required",
        confidence: 0,
        evidence: [`no connected restaurant provider returned usable data for ${destination?.city || destination?.country || "destination"}`]
      }
    })
  ];
};

const normalizePublicResources = (result) => {
  const categories = ["official_travel_advice", "embassy", "public_resources", "entry_requirements"];
  return categories.flatMap((category) => {
    const provider = providerResultByCategory(result, category);
    const items = Array.isArray(provider?.items) ? provider.items : [];
    return items.map((item, index) => createGovernmentResourceModel({
      id: `${category}-${index + 1}`,
      agency: item.source || provider?.provider || null,
      service: item.label || item.value || category,
      official: Boolean(item.official || /gov|embassy|consular/i.test(item.source || item.url || "")),
      provider: provider?.provider || item.source || "Public resource",
      sourceState: item.sourceState || "cached_public",
      lastVerified: provider?.updatedAt || provider?.lastVerified || null,
      freshness: "public official resource",
      confidence: item.confidence ?? 0.66
    }));
  });
};

const fixtureForScenario = (scenario, destination) => {
  if (!KNOWN_FIXTURE_SCENARIOS.has(scenario)) return null;
  const base = createV24FixtureAdapter(scenario);
  if (base) return base;
  if (scenario === "estimated-only") {
    return {
      hotels: [createHotelModel({ id: "fixture-estimated-hotel", name: `${destination?.city || "Destination"} accommodation search`, location: destination?.city, provider: "V24 founder fixture", sourceState: "estimated", confidence: 0.35, priceState: "estimated", availabilityState: "requires_live_search", fixture: true })],
      flights: [createUnavailableModel("Flight", { provider: "Future flight provider" })],
      restaurants: [createRestaurantModel({ id: "fixture-estimated-restaurant", name: `${destination?.city || "Destination"} dining search`, category: "local food", provider: "V24 founder fixture", sourceState: "estimated", confidence: 0.35, openingHoursState: "requires_live_search", priceLevelState: "estimated", fixture: true })]
    };
  }
  if (scenario === "multiple-providers-merged") {
    return {
      hotels: [
        createHotelModel({ id: "fixture-merged-hotel-1", name: "Merged Provider Stay", location: destination?.city, provider: "V24 founder fixture A", sourceState: "cached_public", confidence: 0.72, priceState: "requires_live_search", availabilityState: "requires_live_search", fixture: true }),
        createHotelModel({ id: "fixture-merged-hotel-2", name: "Merged Provider Stay", location: destination?.city, provider: "V24 founder fixture B", sourceState: "cached_public", confidence: 0.7, priceState: "requires_live_search", availabilityState: "requires_live_search", fixture: true })
      ],
      flights: [createUnavailableModel("Flight", { provider: "Future flight provider" })],
      restaurants: [createRestaurantModel({ id: "fixture-merged-restaurant", name: "Merged Local Table", category: "local food", provider: "V24 founder fixture", sourceState: "cached_public", confidence: 0.68, openingHoursState: "requires_live_search", priceLevelState: "requires_live_search", fixture: true })]
    };
  }
  return {
    hotels: [],
    flights: [createUnavailableModel("Flight", { provider: "Future flight provider" })],
    restaurants: [],
    failures: [{
      providerType: "travel",
      message: scenario === "provider-unavailable"
        ? "Connected provider unavailable in this founder scenario."
        : "Live search is required before showing provider-specific options."
    }]
  };
};

export const buildTravelWorldIntelligence = (result = {}, options = {}) => {
  const destination = result.destination || result.countryProfile || {};
  const registry = createV24AdapterRegistry();
  const localPlaces = providerResultByCategory(result, "local_places");
  const localModels = registry.hotels.search({ providerResult: localPlaces, destination });
  const publicHotels = localModels.filter((item) => item.modelType === "Hotel");
  const publicRestaurants = localModels.filter((item) => item.modelType === "Restaurant");
  const publicBusinesses = localModels.filter((item) => item.modelType === "Business");
  const weather = registry.weather.search({ providerResult: providerResultByCategory(result, "weather"), destination });
  const currency = registry.currency.search({ providerResult: providerResultByCategory(result, "currency"), destination });
  const governmentResources = normalizePublicResources(result);
  const scenario = clean(options.scenario || result.v24WorldScenario);
  const fixture = fixtureForScenario(scenario, destination);

  const models = {
    flights: fixture?.flights?.length ? fixture.flights : registry.flights.search({ destination, origin: result.origin || result.departureAirport }),
    hotels: ensureFallbackHotels(fixture?.hotels?.length ? fixture.hotels : publicHotels, destination),
    restaurants: ensureFallbackRestaurants(fixture?.restaurants?.length ? fixture.restaurants : publicRestaurants, destination),
    weather,
    currency,
    governmentResources,
    businesses: publicBusinesses,
    clinics: registry.clinics.search({ destination }),
    academies: registry.academies.search({ destination })
  };

  const failures = [
    ...(fixture?.failures || []),
    ...(localPlaces?.error ? [{ providerType: "local_places", message: localPlaces.error }] : []),
    ...(models.flights.some((item) => item.sourceState === "unavailable") ? [{ providerType: "flight", message: "No live flight provider is connected. ONE prepared search requirements only." }] : []),
    ...(models.hotels.every((item) => item.sourceState === "unavailable") ? [{ providerType: "hotel", message: "No live hotel provider is connected for this result. ONE will verify before approval." }] : []),
    ...(models.restaurants.every((item) => item.sourceState === "unavailable") ? [{ providerType: "restaurant", message: "No live restaurant provider is connected for this result. ONE will verify before approval." }] : [])
  ];

  return Object.freeze({
    version: WORLD_INTELLIGENCE_VERSION,
    domain: "travel",
    destination: Object.freeze({
      city: destination.city || destination.capital || null,
      country: destination.country || destination.name || null,
      countryCode: result.country || result.countryProfile?.code || destination.countryCode || null,
      continent: destination.continent || null
    }),
    fixtureMode: Boolean(fixture),
    scenario: scenario || null,
    models: Object.freeze(models),
    sourceBreakdown: countSources(models),
    adapters: Object.freeze(Object.values(registry).map((adapter) => adapter.diagnostics())),
    failures: Object.freeze(failures),
    cache: Object.freeze({
      strategy: "source-metadata-first; no provider data is treated as live unless marked verified_live",
      health: failures.length ? "degraded" : "ready"
    }),
    averageConfidence: averageConfidence(models),
    generatedAt: new Date().toISOString()
  });
};

export const validateWorldIntelligence = (foundation) => {
  const errors = [];
  const requiredGroups = new Set(["flights", "hotels", "restaurants"]);
  if (!foundation?.destination?.country && !foundation?.destination?.countryCode) errors.push("Destination country unresolved");
  if (!foundation?.models) errors.push("No unified models were created");
  Object.entries(foundation?.models || {}).forEach(([group, items]) => {
    if (!Array.isArray(items)) errors.push(`${group} is not an array`);
    if (Array.isArray(items) && requiredGroups.has(group) && !items.length) errors.push(`${group} has no entries`);
    items.forEach((item) => {
      if (!item?.modelType) errors.push(`${group} item missing modelType`);
      if (!item?.sourceMetadata) errors.push(`${group} item missing source metadata`);
      if (!SOURCE_STATES.includes(item?.sourceState)) errors.push(`${group} item has invalid source state`);
    });
  });
  return Object.freeze({ ok: errors.length === 0, errors });
};
