import { MapProvider } from "./map-provider.js";
import { PlacesProvider } from "./places-provider.js";
import { RouteProvider } from "./route-provider.js";
import { FlightProvider } from "./flight-provider.js";
import { AccommodationProvider } from "./accommodation-provider.js";
import { ExperienceProvider } from "./experience-provider.js";
import { RestaurantProvider } from "./restaurant-provider.js";
import {
  LIVE_PROVIDER_FOUNDATION_VERSION,
  PROVIDER_SOURCE_STATES,
  createProviderResult
} from "./provider-result.js";
import {
  compareAccommodationOffers,
  compareFlightOffers,
  normalizeProviderResultSet,
  normalizeTransportJourney
} from "./provider-normalization.js";

const currentDayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

export const createMemoryCache = ({ ttlMs = 15 * 60 * 1000, now = () => Date.now() } = {}) => {
  const store = new Map();
  return {
    get(key) {
      const entry = store.get(key);
      if (!entry || entry.expiresAt <= now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    set(key, value) {
      store.set(key, { value, expiresAt: now() + ttlMs });
      return value;
    },
    clear() {
      store.clear();
    },
    size() {
      return store.size;
    }
  };
};

export const createRequestDeduper = () => {
  const inflight = new Map();
  return {
    async run(key, task) {
      if (inflight.has(key)) return inflight.get(key);
      const promise = Promise.resolve().then(task).finally(() => inflight.delete(key));
      inflight.set(key, promise);
      return promise;
    },
    size() {
      return inflight.size;
    }
  };
};

export const createQuotaGuard = ({ dailyLimit = 250, now = () => Date.now() } = {}) => {
  const usageByDay = new Map();
  return {
    check(providerId, cost = 1) {
      const day = currentDayKey(now());
      const key = `${day}:${providerId}`;
      const used = usageByDay.get(key) || 0;
      return {
        ok: used + cost <= dailyLimit,
        used,
        limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - used)
      };
    },
    record(providerId, cost = 1) {
      const day = currentDayKey(now());
      const key = `${day}:${providerId}`;
      const used = usageByDay.get(key) || 0;
      usageByDay.set(key, used + cost);
      return this.check(providerId, 0);
    }
  };
};

export class ProviderManager {
  constructor({
    mapProvider = new MapProvider(),
    placesProvider = new PlacesProvider(),
    routeProvider = new RouteProvider(),
    flightProvider = new FlightProvider(),
    accommodationProvider = new AccommodationProvider(),
    experienceProvider = new ExperienceProvider(),
    restaurantProvider = new RestaurantProvider(),
    cache = createMemoryCache(),
    deduper = createRequestDeduper(),
    quotaGuard = createQuotaGuard()
  } = {}) {
    this.version = LIVE_PROVIDER_FOUNDATION_VERSION;
    this.mapProvider = mapProvider;
    this.placesProvider = placesProvider;
    this.routeProvider = routeProvider;
    this.flightProvider = flightProvider;
    this.accommodationProvider = accommodationProvider;
    this.experienceProvider = experienceProvider;
    this.restaurantProvider = restaurantProvider;
    this.cache = cache;
    this.deduper = deduper;
    this.quotaGuard = quotaGuard;
  }

  async withProtection(providerId, cacheKey, cost, task) {
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        sourceState: PROVIDER_SOURCE_STATES.CACHED
      };
    }
    const quota = this.quotaGuard.check(providerId, cost);
    if (!quota.ok) {
      return createProviderResult({
        ok: false,
        provider: providerId,
        sourceState: PROVIDER_SOURCE_STATES.UNAVAILABLE,
        error: {
          code: "daily_quota_guard",
          message: `Daily provider guard blocked the request. Used ${quota.used}/${quota.limit}.`
        }
      });
    }
    return this.deduper.run(cacheKey, async () => {
      const result = await task();
      if (result?.ok) {
        this.quotaGuard.record(providerId, cost);
        this.cache.set(cacheKey, result);
      }
      return result;
    });
  }

  geocode(query, options = {}) {
    const providerId = this.mapProvider.providerId || "map-provider";
    const cacheKey = `geocode:${providerId}:${String(query || "").trim().toLowerCase()}:${JSON.stringify(options)}`;
    return this.withProtection(providerId, cacheKey, 1, () => this.mapProvider.geocode(query, options));
  }

  searchPlaces(request = {}) {
    const providerId = this.placesProvider.providerId || "places-provider";
    const cacheKey = `places:${providerId}:${JSON.stringify(request)}`;
    return this.withProtection(providerId, cacheKey, 1, () => this.placesProvider.searchPlaces(request));
  }

  computeRoute(request = {}) {
    const providerId = this.routeProvider.providerId || "route-provider";
    const cacheKey = `route:${providerId}:${JSON.stringify(request)}`;
    return this.withProtection(providerId, cacheKey, 1, () => this.routeProvider.computeRoute(request));
  }

  async searchFlights(request = {}) {
    const providerId = this.flightProvider.providerId || "flight-provider";
    const cacheKey = `flights:${providerId}:${JSON.stringify(request)}`;
    const result = await this.withProtection(providerId, cacheKey, 2, () => this.flightProvider.searchFlights(request));
    const normalized = normalizeProviderResultSet("flight", result, { provider: providerId });
    return {
      ...result,
      normalized,
      comparison: compareFlightOffers(normalized, { sort: request.sort || "best_overall" })
    };
  }

  async searchAccommodations(request = {}) {
    const providerId = this.accommodationProvider.providerId || "accommodation-provider";
    const cacheKey = `accommodation:${providerId}:${JSON.stringify(request)}`;
    const result = await this.withProtection(providerId, cacheKey, 2, () => this.accommodationProvider.searchAccommodations(request));
    const normalized = normalizeProviderResultSet("accommodation", result, { provider: providerId });
    return {
      ...result,
      normalized,
      comparison: compareAccommodationOffers(normalized)
    };
  }

  async searchTransport(request = {}) {
    const providerId = this.routeProvider.providerId || "route-provider";
    const result = await this.computeRoute(request);
    const normalized = normalizeProviderResultSet("transport", result, { provider: providerId });
    return {
      ...result,
      normalized: normalized.length ? normalized : (result.ok ? [normalizeTransportJourney({ provider: providerId, steps: result.data?.[0]?.legs || result.data?.[0]?.steps || [], liveStatus: result.sourceState })] : []),
      comparison: normalized
    };
  }

  async searchRestaurants(request = {}) {
    const providerId = this.restaurantProvider.providerId || this.placesProvider.providerId || "restaurant-provider";
    if (this.restaurantProvider.searchRestaurants !== RestaurantProvider.prototype.searchRestaurants) {
      const cacheKey = `restaurants:${providerId}:${JSON.stringify(request)}`;
      return this.withProtection(providerId, cacheKey, 1, () => this.restaurantProvider.searchRestaurants(request));
    }
    return this.searchPlaces({ ...request, textQuery: request.textQuery || request.query || "restaurants" });
  }

  async searchExperiences(request = {}) {
    const providerId = this.experienceProvider.providerId || this.placesProvider.providerId || "experience-provider";
    if (this.experienceProvider.searchExperiences !== ExperienceProvider.prototype.searchExperiences) {
      const cacheKey = `experiences:${providerId}:${JSON.stringify(request)}`;
      return this.withProtection(providerId, cacheKey, 1, () => this.experienceProvider.searchExperiences(request));
    }
    return this.searchPlaces({ ...request, textQuery: request.textQuery || request.query || "things to do" });
  }
}

export const createProviderManager = (options = {}) => new ProviderManager(options);
