import {
  DATA_STATES,
  fetchJsonWithTimeout,
  hasEnv,
  providerError,
  providerSuccess,
  setupRequired
} from "./provider-contracts.js";

export const GOOGLE_GEOCODING_REQUIRED_ENV = Object.freeze(["GOOGLE_MAPS_SERVER_KEY"]);
export const GOOGLE_PLACES_REQUIRED_ENV = Object.freeze(["GOOGLE_PLACES_API_KEY"]);
export const GOOGLE_ROUTES_REQUIRED_ENV = Object.freeze(["GOOGLE_ROUTES_API_KEY"]);

export const GOOGLE_PLACES_FIELD_MASK = Object.freeze([
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.businessStatus",
  "places.currentOpeningHours",
  "places.regularOpeningHours",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.photos",
  "places.types",
  "places.primaryType",
  "places.googleMapsUri"
]);

export const GOOGLE_ROUTES_FIELD_MASK = Object.freeze([
  "routes.duration",
  "routes.staticDuration",
  "routes.distanceMeters",
  "routes.polyline.encodedPolyline",
  "routes.legs.distanceMeters",
  "routes.legs.duration",
  "routes.legs.staticDuration",
  "routes.legs.polyline.encodedPolyline",
  "routes.legs.steps.distanceMeters",
  "routes.legs.steps.staticDuration",
  "routes.legs.steps.navigationInstruction",
  "routes.legs.steps.travelMode",
  "routes.travelAdvisory.transitFare"
]);

const text = (value) => String(value || "").trim();
const numberOrNull = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const nowIso = () => new Date().toISOString();

const locationFromGoogle = (location = {}) => {
  const lat = numberOrNull(location.lat ?? location.latitude);
  const lng = numberOrNull(location.lng ?? location.longitude);
  return lat === null || lng === null ? null : { lat, lng };
};

export function normalizeGeocodeResult(result = {}, { retrievedAt = nowIso() } = {}) {
  return {
    provider: "google-geocoding",
    formattedAddress: result.formatted_address || "",
    placeId: result.place_id || "",
    coordinates: locationFromGoogle(result.geometry?.location),
    locationType: result.geometry?.location_type || null,
    confidenceType: result.geometry?.location_type || "unknown",
    types: result.types || [],
    sourceRetrievedAt: retrievedAt,
    providerEvidence: {
      provider: "google-geocoding",
      dataState: DATA_STATES.VERIFIED_LIVE,
      placeId: result.place_id || null,
      endpoint: "geocode/json",
      retrievedAt
    }
  };
}

export function normalizePlaceResult(place = {}, { retrievedAt = nowIso() } = {}) {
  return {
    id: place.id || "",
    provider: "google-places",
    providerPlaceId: place.id || "",
    name: place.displayName?.text || place.formattedAddress || "",
    categories: [place.primaryType, ...(place.types || [])].filter(Boolean),
    address: place.formattedAddress || "",
    coordinates: locationFromGoogle(place.location),
    rating: place.rating ?? null,
    ratingCount: place.userRatingCount ?? null,
    priceLevel: place.priceLevel || null,
    businessStatus: place.businessStatus || null,
    openingStatus: typeof place.currentOpeningHours?.openNow === "boolean" ? { openNow: place.currentOpeningHours.openNow } : null,
    regularOpeningHours: place.regularOpeningHours || null,
    website: place.websiteUri || "",
    phone: place.internationalPhoneNumber || place.nationalPhoneNumber || "",
    googleMapsUri: place.googleMapsUri || "",
    photos: (place.photos || []).map((photo) => ({
      name: photo.name,
      widthPx: photo.widthPx || null,
      heightPx: photo.heightPx || null,
      authorAttributions: photo.authorAttributions || []
    })),
    sourceRetrievedAt: retrievedAt,
    providerEvidence: {
      provider: "google-places",
      dataState: DATA_STATES.VERIFIED_LIVE,
      placeId: place.id || null,
      endpoint: "places:searchText",
      fieldMask: GOOGLE_PLACES_FIELD_MASK,
      retrievedAt
    }
  };
}

export function normalizeRouteResult(route = {}, request = {}, { retrievedAt = nowIso() } = {}) {
  return {
    id: `google-route-${retrievedAt}-${route.distanceMeters || 0}`,
    provider: "google-routes",
    origin: request.origin,
    destination: request.destination,
    mode: request.travelMode || request.mode || "TRANSIT",
    distanceMeters: route.distanceMeters ?? null,
    durationSeconds: Number.parseInt(String(route.duration || "0").replace("s", ""), 10) || null,
    staticDurationSeconds: Number.parseInt(String(route.staticDuration || "0").replace("s", ""), 10) || null,
    polyline: route.polyline?.encodedPolyline || "",
    legs: (route.legs || []).map((leg) => ({
      distanceMeters: leg.distanceMeters ?? null,
      durationSeconds: Number.parseInt(String(leg.duration || "0").replace("s", ""), 10) || null,
      staticDurationSeconds: Number.parseInt(String(leg.staticDuration || "0").replace("s", ""), 10) || null,
      polyline: leg.polyline?.encodedPolyline || "",
      steps: (leg.steps || []).map((step) => ({
        mode: step.travelMode || null,
        distanceMeters: step.distanceMeters ?? null,
        staticDurationSeconds: Number.parseInt(String(step.staticDuration || "0").replace("s", ""), 10) || null,
        instruction: step.navigationInstruction?.instructions || ""
      }))
    })),
    fare: route.travelAdvisory?.transitFare || null,
    accessibilityEvidence: null,
    retrievedAt,
    providerEvidence: {
      provider: "google-routes",
      dataState: DATA_STATES.VERIFIED_LIVE,
      endpoint: "directions/v2:computeRoutes",
      fieldMask: GOOGLE_ROUTES_FIELD_MASK,
      retrievedAt
    }
  };
}

export async function geocodeWithGoogle(env = {}, { query, language = "en", region = "" } = {}) {
  if (!hasEnv(env, GOOGLE_GEOCODING_REQUIRED_ENV)) {
    return setupRequired("google-geocoding", GOOGLE_GEOCODING_REQUIRED_ENV, "Google Geocoding needs a server key before live destination verification can run.");
  }
  const address = text(query);
  if (!address) return providerError("google-geocoding", { code: "missing_query", status: 400, message: "A destination query is required." }, "missing_query");
  const endpoint = "https://maps.googleapis.com/maps/api/geocode/json";
  const url = new URL(endpoint);
  url.searchParams.set("address", address);
  url.searchParams.set("key", env.GOOGLE_MAPS_SERVER_KEY);
  if (language) url.searchParams.set("language", language);
  if (region) url.searchParams.set("region", region);
  try {
    const retrievedAt = nowIso();
    const payload = await fetchJsonWithTimeout(url.toString(), {}, { timeoutMs: Number(env.GOOGLE_PROVIDER_TIMEOUT_MS || 8000) });
    if (payload.status && payload.status !== "OK" && payload.status !== "ZERO_RESULTS") {
      return providerError("google-geocoding", { code: payload.status.toLowerCase(), status: 502, message: "Google Geocoding returned a provider status." }, "provider_status");
    }
    const items = (payload.results || []).map((result) => normalizeGeocodeResult(result, { retrievedAt }));
    return providerSuccess("google-geocoding", items, { endpoint: "geocode/json", status: payload.status || "OK" });
  } catch (error) {
    return providerError("google-geocoding", error);
  }
}

export async function searchTextWithGooglePlaces(env = {}, request = {}) {
  if (!hasEnv(env, GOOGLE_PLACES_REQUIRED_ENV)) {
    return setupRequired("google-places", GOOGLE_PLACES_REQUIRED_ENV, "Google Places needs an API key before live place search can run.");
  }
  const textQuery = text(request.textQuery || request.query);
  if (!textQuery) return providerError("google-places", { code: "missing_text_query", status: 400, message: "A textQuery is required." }, "missing_query");

  const body = {
    textQuery,
    languageCode: request.languageCode || request.language || "en",
    maxResultCount: Math.min(Math.max(Number(request.maxResultCount || 10), 1), 20)
  };
  if (request.includedType) body.includedType = request.includedType;
  if (request.strictTypeFiltering) body.strictTypeFiltering = true;
  if (request.locationBias?.lat && request.locationBias?.lng) {
    body.locationBias = {
      circle: {
        center: { latitude: Number(request.locationBias.lat), longitude: Number(request.locationBias.lng) },
        radius: Math.min(Math.max(Number(request.locationBias.radiusMeters || 6000), 500), 50000)
      }
    };
  }

  try {
    const retrievedAt = nowIso();
    const payload = await fetchJsonWithTimeout("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK.join(",")
      },
      body: JSON.stringify(body)
    }, { timeoutMs: Number(env.GOOGLE_PROVIDER_TIMEOUT_MS || 8000) });
    const items = (payload.places || []).map((place) => normalizePlaceResult(place, { retrievedAt }));
    return providerSuccess("google-places", items, { endpoint: "places:searchText", fieldMask: GOOGLE_PLACES_FIELD_MASK });
  } catch (error) {
    return providerError("google-places", error);
  }
}

export async function computeRoutesWithGoogle(env = {}, request = {}) {
  if (!hasEnv(env, GOOGLE_ROUTES_REQUIRED_ENV)) {
    return setupRequired("google-routes", GOOGLE_ROUTES_REQUIRED_ENV, "Google Routes needs an API key before live routing can run.");
  }
  const origin = request.origin || {};
  const destination = request.destination || {};
  if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
    return providerError("google-routes", { code: "missing_coordinates", status: 400, message: "Origin and destination coordinates are required." }, "missing_coordinates");
  }
  const point = (value) => ({ location: { latLng: { latitude: Number(value.lat), longitude: Number(value.lng) } } });
  const body = {
    origin: point(origin),
    destination: point(destination),
    travelMode: request.travelMode || request.mode || "TRANSIT",
    languageCode: request.languageCode || request.language || "en"
  };
  try {
    const retrievedAt = nowIso();
    const payload = await fetchJsonWithTimeout("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_ROUTES_API_KEY,
        "X-Goog-FieldMask": GOOGLE_ROUTES_FIELD_MASK.join(",")
      },
      body: JSON.stringify(body)
    }, { timeoutMs: Number(env.GOOGLE_PROVIDER_TIMEOUT_MS || 8000) });
    const items = (payload.routes || []).map((route) => normalizeRouteResult(route, request, { retrievedAt }));
    return providerSuccess("google-routes", items, { endpoint: "directions/v2:computeRoutes", fieldMask: GOOGLE_ROUTES_FIELD_MASK });
  } catch (error) {
    return providerError("google-routes", error);
  }
}
