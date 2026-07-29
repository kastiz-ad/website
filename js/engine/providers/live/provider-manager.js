import { MapProvider } from "./map-provider.js";
import { PlacesProvider } from "./places-provider.js";
import { RouteProvider } from "./route-provider.js";
import {
  LIVE_PROVIDER_FOUNDATION_VERSION,
  PROVIDER_SOURCE_STATES,
  createProviderResult
} from "./provider-result.js";

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
    cache = createMemoryCache(),
    deduper = createRequestDeduper(),
    quotaGuard = createQuotaGuard()
  } = {}) {
    this.version = LIVE_PROVIDER_FOUNDATION_VERSION;
    this.mapProvider = mapProvider;
    this.placesProvider = placesProvider;
    this.routeProvider = routeProvider;
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
}

export const createProviderManager = (options = {}) => new ProviderManager(options);

