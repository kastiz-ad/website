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

export const PROVIDER_HEALTH = Object.freeze({
  ENABLED: "enabled",
  SETUP_REQUIRED: "setup_required",
  UNAVAILABLE: "unavailable"
});

const configured = (value) => Boolean(String(value || "").trim());

export function createBrowserProviderRegistry(config = (typeof window !== "undefined" ? window.KASTIZ_PROVIDER_CONFIG || {} : {})) {
  const mapsConfigured = configured(config.GOOGLE_MAPS_BROWSER_KEY || config.GOOGLE_MAPS_API_KEY);
  const tossConfigured = configured(config.TOSS_CLIENT_KEY) && String(config.TOSS_MODE || "test") === "test";
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
      entry({ id: "flight-provider", type: PROVIDER_TYPES.FLIGHT, enabled: false, credentialStatus: "not_connected", capabilities: ["setup_required"], environment: "future" }),
      entry({ id: "accommodation-provider", type: PROVIDER_TYPES.ACCOMMODATION, enabled: false, credentialStatus: "not_connected", capabilities: ["setup_required"], environment: "future" }),
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
