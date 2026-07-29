import { MapProvider } from "./map-provider.js";
import { PlacesProvider } from "./places-provider.js";
import { RouteProvider } from "./route-provider.js";
import {
  PROVIDER_SOURCE_STATES,
  createProviderEvidence,
  createProviderResult,
  missingApiKeyResult
} from "./provider-result.js";

export const GOOGLE_PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.currentOpeningHours",
  "places.photos",
  "places.websiteUri",
  "places.types"
];

export const GOOGLE_ROUTES_FIELD_MASK = [
  "routes.duration",
  "routes.distanceMeters",
  "routes.polyline.encodedPolyline",
  "routes.legs.distanceMeters",
  "routes.legs.duration"
];

export const createGoogleProviderConfig = (env = {}) => {
  const browserConfig = typeof window !== "undefined" ? window.KASTIZ_PROVIDER_CONFIG || {} : {};
  const isBrowser = typeof window !== "undefined";
  return {
    enabled: String(env.GOOGLE_PROVIDER_ENABLED ?? browserConfig.GOOGLE_PROVIDER_ENABLED ?? "false") === "true",
    mapsApiKey: env.GOOGLE_MAPS_BROWSER_KEY || env.GOOGLE_MAPS_API_KEY || browserConfig.GOOGLE_MAPS_BROWSER_KEY || browserConfig.GOOGLE_MAPS_API_KEY || "",
    geocodingKey: isBrowser ? "" : (env.GOOGLE_MAPS_SERVER_KEY || env.GOOGLE_MAPS_API_KEY || ""),
    placesApiKey: isBrowser ? "" : (env.GOOGLE_PLACES_API_KEY || ""),
    routesApiKey: isBrowser ? "" : (env.GOOGLE_ROUTES_API_KEY || ""),
    mapId: env.GOOGLE_MAPS_MAP_ID || env.GOOGLE_MAP_ID || browserConfig.GOOGLE_MAPS_MAP_ID || browserConfig.GOOGLE_MAP_ID || "",
    apiBase: env.KASTIZ_API_BASE || browserConfig.KASTIZ_API_BASE || "/api/v1"
  };
};

const jsonFetch = async (url, options = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw Object.assign(new Error(data?.error?.message || `Provider returned ${response.status}.`), {
        code: data?.error?.status || `http_${response.status}`
      });
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
};

export class GoogleMapProvider extends MapProvider {
  constructor({ config = createGoogleProviderConfig() } = {}) {
    super({ providerId: "google-maps", label: "Google Maps" });
    this.config = config;
  }

  async geocode(query, options = {}) {
    if (!this.config.enabled || (!this.config.geocodingKey && typeof window === "undefined")) {
      return missingApiKeyResult(this.providerId, ["GOOGLE_PROVIDER_ENABLED=true", "GOOGLE_MAPS_SERVER_KEY"]);
    }
    if (typeof window !== "undefined") {
      try {
        const data = await jsonFetch(`${this.config.apiBase}/providers/google/geocode`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, ...options })
        });
        return createProviderResult({
          ok: Array.isArray(data.items) && data.items.length > 0,
          provider: this.providerId,
          sourceState: data.dataState || PROVIDER_SOURCE_STATES.LIVE,
          data: data.items || [],
          evidence: createProviderEvidence({ provider: this.providerId, sourceState: data.dataState || PROVIDER_SOURCE_STATES.LIVE, endpoint: "api/v1/providers/google/geocode" }),
          error: data.error
        });
      } catch (error) {
        return createProviderResult({ ok: false, provider: this.providerId, sourceState: PROVIDER_SOURCE_STATES.ERROR, error });
      }
    }
    const endpoint = "https://maps.googleapis.com/maps/api/geocode/json";
    const url = new URL(endpoint);
    url.searchParams.set("address", query);
    url.searchParams.set("key", this.config.geocodingKey);
    if (options.language) url.searchParams.set("language", options.language);
    try {
      const data = await jsonFetch(url.toString());
      const results = (data.results || []).map((place) => ({
        id: place.place_id,
        placeId: place.place_id,
        name: place.formatted_address,
        address: place.formatted_address,
        coordinates: {
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng
        },
        provider: this.providerId,
        source: PROVIDER_SOURCE_STATES.LIVE,
        retrievedAt: new Date().toISOString(),
        providerEvidence: createProviderEvidence({
          provider: this.providerId,
          sourceState: PROVIDER_SOURCE_STATES.LIVE,
          placeId: place.place_id,
          endpoint
        })
      }));
      return createProviderResult({
        ok: results.length > 0,
        provider: this.providerId,
        sourceState: PROVIDER_SOURCE_STATES.LIVE,
        data: results,
        evidence: createProviderEvidence({ provider: this.providerId, sourceState: PROVIDER_SOURCE_STATES.LIVE, endpoint })
      });
    } catch (error) {
      return createProviderResult({ ok: false, provider: this.providerId, sourceState: PROVIDER_SOURCE_STATES.ERROR, error });
    }
  }
}

export class GooglePlacesProvider extends PlacesProvider {
  constructor({ config = createGoogleProviderConfig() } = {}) {
    super({ providerId: "google-places", label: "Google Places" });
    this.config = config;
  }

  async searchPlaces({ textQuery, locationBias, languageCode = "en", maxResultCount = 10 } = {}) {
    if (typeof window !== "undefined") {
      try {
        const data = await jsonFetch(`${this.config.apiBase}/providers/google/places`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ textQuery, locationBias, languageCode, maxResultCount })
        });
        return createProviderResult({
          ok: Array.isArray(data.items) && data.items.length > 0,
          provider: this.providerId,
          sourceState: data.dataState || PROVIDER_SOURCE_STATES.LIVE,
          data: data.items || [],
          evidence: createProviderEvidence({ provider: this.providerId, sourceState: data.dataState || PROVIDER_SOURCE_STATES.LIVE, endpoint: "api/v1/providers/google/places", fieldMask: GOOGLE_PLACES_FIELD_MASK }),
          error: data.error
        });
      } catch (error) {
        return createProviderResult({ ok: false, provider: this.providerId, sourceState: PROVIDER_SOURCE_STATES.ERROR, error });
      }
    }
    if (!this.config.enabled || !this.config.placesApiKey) {
      return missingApiKeyResult(this.providerId, ["GOOGLE_PROVIDER_ENABLED=true", "GOOGLE_PLACES_API_KEY"]);
    }
    const endpoint = "https://places.googleapis.com/v1/places:searchText";
    const body = {
      textQuery,
      languageCode,
      maxResultCount: Math.min(Math.max(Number(maxResultCount) || 10, 1), 20)
    };
    if (locationBias?.lat && locationBias?.lng) {
      body.locationBias = {
        circle: {
          center: { latitude: Number(locationBias.lat), longitude: Number(locationBias.lng) },
          radius: Math.min(Math.max(Number(locationBias.radiusMeters) || 6000, 500), 50000)
        }
      };
    }
    try {
      const data = await jsonFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.config.placesApiKey,
          "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK.join(",")
        },
        body: JSON.stringify(body)
      });
      const places = (data.places || []).map((place) => ({
        id: place.id,
        placeId: place.id,
        name: place.displayName?.text || place.formattedAddress || "Unnamed place",
        address: place.formattedAddress || "",
        coordinates: place.location ? { lat: place.location.latitude, lng: place.location.longitude } : null,
        rating: place.rating ?? null,
        isOpen: place.currentOpeningHours?.openNow ?? null,
        website: place.websiteUri || "",
        photos: (place.photos || []).map((photo) => ({ name: photo.name })),
        types: place.types || [],
        provider: this.providerId,
        source: PROVIDER_SOURCE_STATES.LIVE,
        retrievedAt: new Date().toISOString(),
        providerEvidence: createProviderEvidence({
          provider: this.providerId,
          sourceState: PROVIDER_SOURCE_STATES.LIVE,
          placeId: place.id,
          endpoint,
          fieldMask: GOOGLE_PLACES_FIELD_MASK
        })
      }));
      return createProviderResult({
        ok: places.length > 0,
        provider: this.providerId,
        sourceState: PROVIDER_SOURCE_STATES.LIVE,
        data: places,
        evidence: createProviderEvidence({ provider: this.providerId, sourceState: PROVIDER_SOURCE_STATES.LIVE, endpoint, fieldMask: GOOGLE_PLACES_FIELD_MASK })
      });
    } catch (error) {
      return createProviderResult({ ok: false, provider: this.providerId, sourceState: PROVIDER_SOURCE_STATES.ERROR, error });
    }
  }
}

export class GoogleRouteProvider extends RouteProvider {
  constructor({ config = createGoogleProviderConfig() } = {}) {
    super({ providerId: "google-routes", label: "Google Routes" });
    this.config = config;
  }

  async computeRoute({ origin, destination, travelMode = "TRANSIT", languageCode = "en" } = {}) {
    if (typeof window !== "undefined") {
      try {
        const data = await jsonFetch(`${this.config.apiBase}/providers/google/routes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin, destination, travelMode, languageCode })
        });
        return createProviderResult({
          ok: Array.isArray(data.items) && data.items.length > 0,
          provider: this.providerId,
          sourceState: data.dataState || PROVIDER_SOURCE_STATES.LIVE,
          data: data.items || [],
          evidence: createProviderEvidence({ provider: this.providerId, sourceState: data.dataState || PROVIDER_SOURCE_STATES.LIVE, endpoint: "api/v1/providers/google/routes", fieldMask: GOOGLE_ROUTES_FIELD_MASK }),
          error: data.error
        });
      } catch (error) {
        return createProviderResult({ ok: false, provider: this.providerId, sourceState: PROVIDER_SOURCE_STATES.ERROR, error });
      }
    }
    if (!this.config.enabled || !this.config.routesApiKey) {
      return missingApiKeyResult(this.providerId, ["GOOGLE_PROVIDER_ENABLED=true", "GOOGLE_ROUTES_API_KEY"]);
    }
    const endpoint = "https://routes.googleapis.com/directions/v2:computeRoutes";
    const point = (value) => ({
      location: {
        latLng: {
          latitude: Number(value.lat),
          longitude: Number(value.lng)
        }
      }
    });
    try {
      const data = await jsonFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.config.routesApiKey,
          "X-Goog-FieldMask": GOOGLE_ROUTES_FIELD_MASK.join(",")
        },
        body: JSON.stringify({
          origin: point(origin),
          destination: point(destination),
          travelMode,
          languageCode
        })
      });
      return createProviderResult({
        ok: Array.isArray(data.routes) && data.routes.length > 0,
        provider: this.providerId,
        sourceState: PROVIDER_SOURCE_STATES.LIVE,
        data: data.routes || [],
        evidence: createProviderEvidence({ provider: this.providerId, sourceState: PROVIDER_SOURCE_STATES.LIVE, endpoint, fieldMask: GOOGLE_ROUTES_FIELD_MASK })
      });
    } catch (error) {
      return createProviderResult({ ok: false, provider: this.providerId, sourceState: PROVIDER_SOURCE_STATES.ERROR, error });
    }
  }
}
