export const REAL_API_FOUNDATION_VERSION = "20260730-real-api-foundation-v1";

export const PROVIDER_TYPES = Object.freeze({
  MAP: "map",
  PLACES: "places",
  GEOCODING: "geocoding",
  ROUTES: "routes",
  PAYMENT: "payment",
  FLIGHT: "flight",
  ACCOMMODATION: "accommodation",
  WEATHER: "weather",
  EVENT: "event",
  FINANCIAL: "financial",
  RESERVATION: "reservation"
});

export const PROVIDER_HEALTH = Object.freeze({
  ENABLED: "enabled",
  SETUP_REQUIRED: "setup_required",
  UNAVAILABLE: "unavailable"
});

const configured = (value) => Boolean(String(value || "").trim());

export function createBrowserProviderRegistry(config = (typeof window !== "undefined" ? window.KASTIZ_PROVIDER_CONFIG || {} : {})) {
  const mapsConfigured = configured(config.GOOGLE_MAPS_BROWSER_KEY || config.GOOGLE_MAPS_API_KEY);
  const tossConfigured = configured(config.TOSS_CLIENT_KEY) && String(config.TOSS_MODE || "test") === "test";
  const flightConfigured = config.FLIGHT_PROVIDER_ENABLED === true || config.FLIGHT_PROVIDER_ENABLED === "true";
  const hotelConfigured = config.ACCOMMODATION_PROVIDER_ENABLED === true || config.ACCOMMODATION_PROVIDER_ENABLED === "true";
  const weatherConfigured = config.WEATHER_PROVIDER_ENABLED === true || config.WEATHER_PROVIDER_ENABLED === "true";
  const eventConfigured = config.EVENT_PROVIDER_ENABLED === true || config.EVENT_PROVIDER_ENABLED === "true";
  const exchangeRateConfigured = config.EXCHANGE_RATE_PROVIDER_ENABLED === true || config.EXCHANGE_RATE_PROVIDER_ENABLED === "true";
  const entry = ({ id, type, enabled, credentialStatus, capabilities = [], environment = "browser" }) => ({
    id,
    name: id,
    type,
    enabled: Boolean(enabled),
    credentialStatus,
    capabilities,
    environment,
    healthStatus: enabled ? PROVIDER_HEALTH.ENABLED : PROVIDER_HEALTH.SETUP_REQUIRED,
    lastSuccessfulRequest: null,
    lastErrorCategory: enabled ? null : "setup_required"
  });
  return Object.freeze({
    version: REAL_API_FOUNDATION_VERSION,
    providers: Object.freeze([
      entry({ id: "google-maps", type: PROVIDER_TYPES.MAP, enabled: mapsConfigured, credentialStatus: mapsConfigured ? "browser_key_configured" : "missing_google_maps_browser_key", capabilities: ["render_map", "markers", "bounds"] }),
      entry({ id: "google-geocoding", type: PROVIDER_TYPES.GEOCODING, enabled: true, credentialStatus: "server_checked", capabilities: ["server_geocode"] }),
      entry({ id: "google-places", type: PROVIDER_TYPES.PLACES, enabled: true, credentialStatus: "server_checked", capabilities: ["server_text_search"] }),
      entry({ id: "google-routes", type: PROVIDER_TYPES.ROUTES, enabled: true, credentialStatus: "server_checked", capabilities: ["server_routes"] }),
      entry({ id: "toss-payments-test", type: PROVIDER_TYPES.PAYMENT, enabled: tossConfigured, credentialStatus: tossConfigured ? "test_client_key_configured" : "missing_toss_client_key", capabilities: ["external_test_payment"] }),
      entry({ id: "amadeus-flight-offers", type: PROVIDER_TYPES.FLIGHT, enabled: flightConfigured, credentialStatus: flightConfigured ? "server_checked" : "missing_amadeus_credentials", capabilities: flightConfigured ? ["server_flight_search", "fare_rules", "health_check"] : ["setup_required"], environment: "server" }),
      entry({ id: "amadeus-hotel-offers", type: PROVIDER_TYPES.ACCOMMODATION, enabled: hotelConfigured, credentialStatus: hotelConfigured ? "server_checked" : "missing_amadeus_credentials", capabilities: hotelConfigured ? ["server_hotel_search", "availability", "rates", "cancellation", "mission_scoring"] : ["setup_required"], environment: "server" }),
      entry({ id: "open-meteo-weather", type: PROVIDER_TYPES.WEATHER, enabled: weatherConfigured, credentialStatus: weatherConfigured ? "public_provider_enabled" : "weather_provider_disabled", capabilities: weatherConfigured ? ["forecast", "hazard_detection", "itinerary_impact"] : ["setup_required"], environment: "public" }),
      entry({ id: "events-provider", type: PROVIDER_TYPES.EVENT, enabled: eventConfigured, credentialStatus: eventConfigured ? "server_checked" : "missing_event_provider_credentials", capabilities: eventConfigured ? ["event_search", "event_scoring", "schedule_conflict_check"] : ["setup_required"], environment: "server" }),
      entry({ id: "exchange-rate-provider", type: PROVIDER_TYPES.FINANCIAL, enabled: exchangeRateConfigured, credentialStatus: exchangeRateConfigured ? "server_checked" : "missing_exchange_rate_provider_credentials", capabilities: exchangeRateConfigured ? ["exchange_rates", "currency_conversion", "budget_impact"] : ["setup_required"], environment: "server" }),
      entry({ id: "reservation-provider", type: PROVIDER_TYPES.RESERVATION, enabled: false, credentialStatus: "not_connected", capabilities: ["setup_required"], environment: "future" })
    ]),
    secretExposure: Object.freeze({
      googleServerKeysExposedToBrowser: false,
      tossSecretExposedToBrowser: false
    })
  });
}

export async function fetchProviderStatus({ apiBase = "/api/v1", fetcher = fetch } = {}) {
  const response = await fetcher(`${apiBase}/providers/status`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("provider_status_unavailable");
  return response.json();
}
