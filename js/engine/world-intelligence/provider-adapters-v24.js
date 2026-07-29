import {
  createAcademyModel,
  createBusinessModel,
  createClinicModel,
  createFlightModel,
  createGovernmentResourceModel,
  createHotelModel,
  createRestaurantModel,
  createUnavailableModel
} from "./world-models-v24.js";

export const DEFAULT_PROVIDER_CAPABILITIES = Object.freeze({
  supportsSearch: false,
  supportsComparison: false,
  supportsAvailability: false,
  supportsBooking: false,
  supportsReviews: false,
  supportsPhotos: false,
  supportsPricing: false,
  supportsMaps: false,
  supportsRealtime: false,
  supportsAuthentication: false
});

export const createProviderCapabilities = (capabilities = {}) => Object.freeze({
  ...DEFAULT_PROVIDER_CAPABILITIES,
  ...capabilities
});

export class WorldProviderAdapter {
  constructor({
    adapterId,
    providerType,
    label,
    mode = "future",
    capabilities = {},
    status = "unavailable"
  }) {
    this.adapterId = adapterId;
    this.providerType = providerType;
    this.label = label || adapterId;
    this.mode = mode;
    this.status = status;
    this.capabilities = createProviderCapabilities(capabilities);
    this.lastRefresh = null;
    this.failures = [];
  }

  diagnostics() {
    return Object.freeze({
      adapterId: this.adapterId,
      providerType: this.providerType,
      label: this.label,
      mode: this.mode,
      status: this.status,
      lastRefresh: this.lastRefresh,
      failures: [...this.failures],
      capabilities: this.capabilities
    });
  }

  async search() {
    return [];
  }
}

export class LocalPlacesAdapter extends WorldProviderAdapter {
  constructor() {
    super({
      adapterId: "open-public-local-places",
      providerType: "maps",
      label: "Open public local places",
      mode: "cached_public",
      status: "available",
      capabilities: {
        supportsSearch: true,
        supportsComparison: true,
        supportsMaps: true,
        supportsReviews: false,
        supportsPhotos: false,
        supportsRealtime: false
      }
    });
  }

  search({ providerResult, destination } = {}) {
    const items = Array.isArray(providerResult?.items) ? providerResult.items : [];
    this.lastRefresh = providerResult?.updatedAt || providerResult?.lastVerified || new Date().toISOString();
    return items.map((item, index) => {
      const common = {
        id: `${item.kind || "place"}-${index + 1}`,
        name: item.label || null,
        location: destination?.city || destination?.country || null,
        coordinates: item.coordinates || null,
        provider: item.source || providerResult?.provider || this.label,
        sourceState: item.sourceState || "cached_public",
        lastVerified: providerResult?.updatedAt || providerResult?.lastVerified || null,
        cacheAge: providerResult?.cacheAge || null,
        freshness: item.freshness || "public information",
        confidence: item.confidence ?? 0.62,
        sourceMetadata: {
          provider: item.source || providerResult?.provider || this.label,
          sourceState: item.sourceState || "cached_public",
          lastVerified: providerResult?.updatedAt || providerResult?.lastVerified || null,
          cacheAge: providerResult?.cacheAge || null,
          freshness: item.freshness || "public information",
          confidence: item.confidence ?? 0.62,
          evidence: [item.label, item.source].filter(Boolean)
        }
      };
      if (item.kind === "hotel") {
        return createHotelModel({
          ...common,
          priceState: "requires_live_search",
          availabilityState: "requires_live_search",
          photosAvailable: false,
          bookingSupported: false,
          tags: item.tags || [],
          ratingAvailable: false,
          reviewCountAvailable: false
        });
      }
      if (item.kind === "restaurant") {
        return createRestaurantModel({
          ...common,
          category: item.cuisine || item.category || "restaurant",
          openingHoursState: "requires_live_search",
          reservationSupported: false,
          priceLevelState: "requires_live_search",
          ratingAvailable: false
        });
      }
      return createBusinessModel({
        ...common,
        category: item.kind || "place",
        officialStatus: "public_listing"
      });
    });
  }
}

export class PublicWeatherAdapter extends WorldProviderAdapter {
  constructor() {
    super({
      adapterId: "open-public-weather",
      providerType: "weather",
      label: "Open public weather",
      mode: "cached_public",
      status: "available",
      capabilities: { supportsSearch: true, supportsRealtime: false }
    });
  }

  search({ providerResult } = {}) {
    const items = Array.isArray(providerResult?.items) ? providerResult.items : [];
    this.lastRefresh = providerResult?.updatedAt || providerResult?.lastVerified || null;
    return items.map((item, index) => Object.freeze({
      modelType: "Weather",
      id: `weather-${index + 1}`,
      label: item.label,
      value: item.value,
      humidity: item.humidity,
      precipitation: item.precipitation,
      sourceState: item.sourceState || "cached_public",
      lastVerified: providerResult?.updatedAt || providerResult?.lastVerified || null,
      confidence: item.confidence ?? 0.68,
      sourceMetadata: {
        provider: providerResult?.provider || this.label,
        sourceState: item.sourceState || "cached_public",
        freshness: "public forecast",
        confidence: item.confidence ?? 0.68
      }
    }));
  }
}

export class PublicCurrencyAdapter extends WorldProviderAdapter {
  constructor() {
    super({
      adapterId: "open-public-currency",
      providerType: "currency",
      label: "Open public currency",
      mode: "cached_public",
      status: "available",
      capabilities: { supportsSearch: true, supportsPricing: true, supportsRealtime: false }
    });
  }

  search({ providerResult } = {}) {
    const items = Array.isArray(providerResult?.items) ? providerResult.items : [];
    this.lastRefresh = providerResult?.updatedAt || providerResult?.lastVerified || null;
    return items.map((item, index) => Object.freeze({
      modelType: "CurrencyRate",
      id: `currency-${index + 1}`,
      from: item.from || "KRW",
      to: item.to,
      rate: Number(item.rate ?? item.value) || null,
      sourceState: item.sourceState || "cached_public",
      lastVerified: providerResult?.updatedAt || providerResult?.lastVerified || null,
      confidence: item.confidence ?? 0.7,
      sourceMetadata: {
        provider: providerResult?.provider || this.label,
        sourceState: item.sourceState || "cached_public",
        freshness: "public rate",
        confidence: item.confidence ?? 0.7
      }
    }));
  }
}

export class FutureFlightAdapter extends WorldProviderAdapter {
  constructor() {
    super({
      adapterId: "future-flight-provider",
      providerType: "flight",
      label: "Future flight provider",
      mode: "future",
      status: "unavailable",
      capabilities: {
        supportsSearch: false,
        supportsComparison: true,
        supportsAvailability: false,
        supportsBooking: false,
        supportsPricing: false,
        supportsRealtime: false,
        supportsAuthentication: false
      }
    });
  }

  search({ destination, origin } = {}) {
    return [createUnavailableModel("Flight", {
      id: "flight-live-search-required",
      origin: origin || null,
      destination: destination?.city || destination?.country || null,
      provider: this.label
    })];
  }
}

export class FutureDomainAdapter extends WorldProviderAdapter {
  constructor(providerType, label) {
    super({
      adapterId: `future-${providerType}-provider`,
      providerType,
      label,
      mode: "future",
      status: "unavailable",
      capabilities: { supportsSearch: false, supportsComparison: true }
    });
  }

  search() {
    const typeMap = {
      clinic: "Clinic",
      academy: "Academy",
      government: "GovernmentResource",
      business: "Business"
    };
    return [createUnavailableModel(typeMap[this.providerType] || "Business", { provider: this.label })];
  }
}

export const createV24AdapterRegistry = () => Object.freeze({
  hotels: new LocalPlacesAdapter(),
  restaurants: new LocalPlacesAdapter(),
  weather: new PublicWeatherAdapter(),
  currency: new PublicCurrencyAdapter(),
  flights: new FutureFlightAdapter(),
  clinics: new FutureDomainAdapter("clinic", "Future clinic provider"),
  academies: new FutureDomainAdapter("academy", "Future academy provider"),
  government: new FutureDomainAdapter("government", "Future official resource provider")
});

export const createV24FixtureAdapter = (fixtureName) => {
  const now = "2026-07-27T00:00:00.000Z";
  const fixtures = {
    "fully-verified": {
      hotels: [
        createHotelModel({ id: "fixture-hotel-1", name: "Verified Sapporo Hotel", location: "Sapporo", provider: "V24 founder fixture", sourceState: "verified_live", lastVerified: now, freshness: "verified today", confidence: 0.96, priceState: "verified_live", availabilityState: "verified_live", photosAvailable: true, bookingSupported: false, ratingAvailable: true, reviewCountAvailable: true, fixture: true })
      ],
      flights: [
        createFlightModel({ id: "fixture-flight-1", origin: "ICN", destination: "CTS", airline: "Verified Airline", flightNumber: "VX-241", departure: "2026-08-01T09:00:00+09:00", arrival: "2026-08-01T11:40:00+09:00", provider: "V24 founder fixture", sourceState: "verified_live", lastVerified: now, freshness: "verified today", confidence: 0.95, priceState: "verified_live", availabilityState: "verified_live", bookingSupported: false, fixture: true })
      ],
      restaurants: [
        createRestaurantModel({ id: "fixture-restaurant-1", name: "Verified Ramen Kitchen", category: "ramen", provider: "V24 founder fixture", sourceState: "verified_live", lastVerified: now, freshness: "verified today", confidence: 0.94, openingHoursState: "verified_live", reservationSupported: false, priceLevelState: "verified_live", ratingAvailable: true, fixture: true })
      ]
    },
    "mixed-source": {
      hotels: [createHotelModel({ id: "fixture-hotel-cached", name: "Cached Public Sapporo Stay", location: "Sapporo", provider: "V24 founder fixture", sourceState: "cached_public", lastVerified: now, freshness: "public information", confidence: 0.72, priceState: "requires_live_search", availabilityState: "requires_live_search", fixture: true })],
      flights: [createUnavailableModel("Flight", { provider: "Future flight provider" })],
      restaurants: [createRestaurantModel({ id: "fixture-restaurant-estimated", name: "Estimated Soup Curry Place", category: "soup curry", provider: "V24 founder fixture", sourceState: "estimated", lastVerified: null, freshness: "estimated until live search", confidence: 0.42, openingHoursState: "requires_live_search", priceLevelState: "requires_live_search", fixture: true })]
    }
  };
  return fixtures[fixtureName] || null;
};
