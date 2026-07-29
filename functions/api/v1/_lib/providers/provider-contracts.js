import { ApiError } from "../http.js";

export const REAL_API_FOUNDATION_VERSION = "20260730-real-api-foundation-v1";

export const PROVIDER_TYPES = Object.freeze({
  MAP: "map",
  PLACES: "places",
  GEOCODING: "geocoding",
  ROUTES: "routes",
  PAYMENT: "payment",
  FLIGHT: "flight",
  ACCOMMODATION: "accommodation",
  RESERVATION: "reservation"
});

export const PROVIDER_STATES = Object.freeze({
  ENABLED: "enabled",
  SETUP_REQUIRED: "setup_required",
  AUTHENTICATION_FAILED: "authentication_failed",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  QUOTA_EXCEEDED: "quota_exceeded",
  NETWORK_ERROR: "network_error",
  TEMPORARILY_UNAVAILABLE: "temporarily_unavailable",
  ERROR: "error"
});

export const DATA_STATES = Object.freeze({
  VERIFIED_LIVE: "verified_live",
  SETUP_REQUIRED: "setup_required",
  AUTHENTICATION_FAILED: "authentication_failed",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  QUOTA_EXCEEDED: "quota_exceeded",
  NETWORK_ERROR: "network_error",
  UNAVAILABLE: "unavailable",
  ERROR: "error"
});

export const PROVIDER_TRUTH_STATUS = Object.freeze({
  CONNECTED_AND_VERIFIED: "Connected and verified",
  CODE_READY_CREDENTIALS_REQUIRED: "Code ready — credentials required",
  CREDENTIALS_CONFIGURED_VERIFICATION_FAILED: "Credentials configured — verification failed",
  PROVIDER_APPROVAL_REQUIRED: "Provider approval required",
  CONTRACT_REQUIRED: "Contract required",
  SANDBOX_ONLY: "Sandbox only",
  TEST_ENVIRONMENT_ONLY: "Test environment only",
  TEMPORARILY_UNAVAILABLE: "Temporarily unavailable",
  NOT_IMPLEMENTED: "Not implemented"
});

export function hasEnv(env = {}, keys = []) {
  return keys.every((key) => typeof env[key] === "string" && env[key].trim().length > 0);
}

export function maskPublicCredential(value = "") {
  if (!value) return "";
  const text = String(value);
  if (text.length <= 8) return "configured";
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

export function setupRequired(providerId, requiredEnv = [], message = "Provider credentials are not configured.") {
  return {
    ok: false,
    provider: providerId,
    dataState: DATA_STATES.SETUP_REQUIRED,
    error: {
      code: "setup_required",
      message,
      requiredEnv
    },
    items: [],
    retrievedAt: new Date().toISOString()
  };
}

export function classifyProviderFailure(error = {}) {
  const code = String(error.code || "").toLowerCase();
  const status = Number(error.status || 0);
  if ([401, 403].includes(status) || /permission|unauth|forbidden|api_key|key_invalid|request_denied/.test(code)) {
    return DATA_STATES.AUTHENTICATION_FAILED;
  }
  if ([402, 429].includes(status) || /quota|billing|rate_limit|resource_exhausted|over_query_limit/.test(code)) {
    return DATA_STATES.QUOTA_EXCEEDED;
  }
  if ([408, 504].includes(status) || /timeout|network|fetch/.test(code)) {
    return DATA_STATES.NETWORK_ERROR;
  }
  if ([500, 502, 503].includes(status) || /unavailable|internal|provider_http_5/.test(code)) {
    return DATA_STATES.PROVIDER_UNAVAILABLE;
  }
  return DATA_STATES.ERROR;
}

export function isProviderConnected(result = {}) {
  return Boolean(
    result.ok &&
    result.dataState === DATA_STATES.VERIFIED_LIVE &&
    Array.isArray(result.items) &&
    result.items.length > 0 &&
    result.evidence?.provider &&
    result.evidence?.retrievedAt
  );
}

export function truthStatusForProvider(provider = {}, verificationResult = null) {
  if (verificationResult && isProviderConnected(verificationResult)) return PROVIDER_TRUTH_STATUS.CONNECTED_AND_VERIFIED;
  if (provider.requiresContract) return PROVIDER_TRUTH_STATUS.CONTRACT_REQUIRED;
  if (provider.requiresApproval) return PROVIDER_TRUTH_STATUS.PROVIDER_APPROVAL_REQUIRED;
  if (provider.environment === "sandbox") return PROVIDER_TRUTH_STATUS.SANDBOX_ONLY;
  if (provider.environment === "test" && provider.enabled) return PROVIDER_TRUTH_STATUS.TEST_ENVIRONMENT_ONLY;
  if (provider.enabled && verificationResult?.ok === false) return PROVIDER_TRUTH_STATUS.CREDENTIALS_CONFIGURED_VERIFICATION_FAILED;
  if (provider.credentialStatus && !provider.enabled && provider.credentialStatus !== "not_connected") return PROVIDER_TRUTH_STATUS.CODE_READY_CREDENTIALS_REQUIRED;
  if (provider.lastErrorCategory === "temporarily_unavailable") return PROVIDER_TRUTH_STATUS.TEMPORARILY_UNAVAILABLE;
  return PROVIDER_TRUTH_STATUS.NOT_IMPLEMENTED;
}

export function createProviderEvidence({ provider, operation, responseId = null, environment = "unknown", requestStatus = "unknown", availabilityStatus = null, expiresAt = null, confirmationReference = null, retrievedAt = new Date().toISOString() } = {}) {
  return {
    provider,
    operation,
    providerResponseIdentifier: responseId,
    retrievalTimestamp: retrievedAt,
    environment,
    requestStatus,
    relevantAvailabilityStatus: availabilityStatus,
    expirationOrFreshness: expiresAt,
    confirmationReference
  };
}

export function providerError(providerId, error, category = "provider_error") {
  const dataState = classifyProviderFailure({ ...error, code: error?.code || category });
  return {
    ok: false,
    provider: providerId,
    dataState,
    error: {
      code: error?.code || category,
      message: error?.status ? error.message : "Provider request failed. Try again shortly."
    },
    items: [],
    retrievedAt: new Date().toISOString()
  };
}

export function providerSuccess(providerId, items = [], evidence = {}) {
  const safeItems = Array.isArray(items) ? items : [];
  return {
    ok: safeItems.length > 0,
    provider: providerId,
    dataState: safeItems.length > 0 ? DATA_STATES.VERIFIED_LIVE : DATA_STATES.UNAVAILABLE,
    items: safeItems,
    evidence: {
      provider: providerId,
      retrievedAt: new Date().toISOString(),
      ...evidence
    },
    retrievedAt: new Date().toISOString()
  };
}

export async function fetchJsonWithTimeout(url, options = {}, { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(
        response.status,
        data?.error?.status || data?.code || `provider_http_${response.status}`,
        data?.error?.message || data?.message || "Provider returned an error."
      );
    }
    return data;
  } catch (error) {
    if (error?.name === "AbortError") throw new ApiError(504, "provider_timeout", "Provider request timed out.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function createProviderRegistry(env = {}) {
  const googleMapsBrowser = hasEnv(env, ["GOOGLE_MAPS_BROWSER_KEY"]);
  const googleGeocoding = hasEnv(env, ["GOOGLE_MAPS_SERVER_KEY"]);
  const googlePlaces = hasEnv(env, ["GOOGLE_PLACES_API_KEY"]);
  const googleRoutes = hasEnv(env, ["GOOGLE_ROUTES_API_KEY"]);
  const tossClient = hasEnv(env, ["TOSS_CLIENT_KEY"]);
  const tossSecret = hasEnv(env, ["TOSS_SECRET_KEY"]);
  const tossTestMode = String(env.TOSS_MODE || "test").toLowerCase() === "test";
  const amadeusFlight = env.FLIGHT_PROVIDER_ENABLED === "true" && hasEnv(env, ["AMADEUS_CLIENT_ID", "AMADEUS_CLIENT_SECRET"]);
  const amadeusHotel = env.ACCOMMODATION_PROVIDER_ENABLED === "true" && hasEnv(env, ["AMADEUS_CLIENT_ID", "AMADEUS_CLIENT_SECRET"]);

  const entry = ({ id, type, enabled, credentialStatus, capabilities = [], environment = "test", lastErrorCategory = null }) => ({
    id,
    name: id,
    type,
    enabled: Boolean(enabled),
    credentialStatus,
    capabilities,
    environment,
    healthStatus: enabled ? PROVIDER_STATES.ENABLED : PROVIDER_STATES.SETUP_REQUIRED,
    lastSuccessfulRequest: null,
    lastErrorCategory
  });

  return {
    version: REAL_API_FOUNDATION_VERSION,
    providers: [
      entry({ id: "google-maps", type: PROVIDER_TYPES.MAP, enabled: googleMapsBrowser, credentialStatus: googleMapsBrowser ? "browser_key_configured" : "missing_google_maps_browser_key", capabilities: ["render_map", "markers", "bounds"], environment: "browser" }),
      entry({ id: "google-geocoding", type: PROVIDER_TYPES.GEOCODING, enabled: googleGeocoding, credentialStatus: googleGeocoding ? "server_key_configured" : "missing_google_maps_server_key", capabilities: ["geocode", "place_id", "location_type"], environment: "server" }),
      entry({ id: "google-places", type: PROVIDER_TYPES.PLACES, enabled: googlePlaces, credentialStatus: googlePlaces ? "api_key_configured" : "missing_google_places_api_key", capabilities: ["text_search", "restaurants", "cafes", "attractions", "hotels_as_places_only"], environment: "server" }),
      entry({ id: "google-routes", type: PROVIDER_TYPES.ROUTES, enabled: googleRoutes, credentialStatus: googleRoutes ? "api_key_configured" : "missing_google_routes_api_key", capabilities: ["walking", "driving", "transit", "polyline"], environment: "server" }),
      entry({ id: "toss-payments-test", type: PROVIDER_TYPES.PAYMENT, enabled: tossClient && tossSecret && tossTestMode, credentialStatus: tossClient && tossSecret ? "test_credentials_configured" : "missing_toss_test_credentials", capabilities: ["test_payment_order", "server_confirm", "idempotency_guard"], environment: "test" }),
      entry({ id: "amadeus-flight-offers", type: PROVIDER_TYPES.FLIGHT, enabled: amadeusFlight, credentialStatus: amadeusFlight ? "server_credentials_configured" : "missing_amadeus_credentials", capabilities: ["searchFlights", "searchRoundTrip", "searchOneWay", "searchMultiCity", "getFareRules", "getFlightDetails", "healthCheck", "normalizeResponse"], environment: env.AMADEUS_ENV || "test", lastErrorCategory: amadeusFlight ? null : "setup_required" }),
      entry({ id: "amadeus-hotel-offers", type: PROVIDER_TYPES.ACCOMMODATION, enabled: amadeusHotel, credentialStatus: amadeusHotel ? "server_credentials_configured" : "missing_amadeus_credentials", capabilities: ["listHotels", "searchAccommodations", "searchAvailability", "searchRates", "getCancellationPolicy", "getHotelDetails", "healthCheck", "missionScoring"], environment: env.AMADEUS_ENV || "test", lastErrorCategory: amadeusHotel ? null : "setup_required" }),
      entry({ id: "reservation-provider", type: PROVIDER_TYPES.RESERVATION, enabled: false, credentialStatus: "not_connected", capabilities: ["setup_required"], environment: "future", lastErrorCategory: "provider_not_connected" })
    ],
    publicConfig: {
      googleMapsBrowserKeyConfigured: googleMapsBrowser,
      googleMapsBrowserKey: googleMapsBrowser ? env.GOOGLE_MAPS_BROWSER_KEY : "",
      googleMapsMapId: env.GOOGLE_MAPS_MAP_ID || env.GOOGLE_MAP_ID || "",
      tossClientKeyConfigured: tossClient,
      tossClientKey: tossClient && tossTestMode ? env.TOSS_CLIENT_KEY : "",
      tossMode: tossTestMode ? "test" : "disabled"
    },
    secretExposure: {
      googleServerKeysExposedToBrowser: false,
      tossSecretExposedToBrowser: false
    }
  };
}
