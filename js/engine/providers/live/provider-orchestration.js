import { createProviderManager } from "./provider-manager.js";
import {
  APPROVAL_SCOPES,
  assertProviderActionAllowed,
  createExecutionPreview,
  createMissionLifecycle
} from "../../approval/approval-engine-v1.js";
import { PROVIDER_SOURCE_STATES, unavailableProviderResult } from "./provider-result.js";
import {
  PROVIDER_ORCHESTRATION_VERSION,
  compareAccommodationOffers,
  compareFlightOffers,
  normalizeAccommodationOffer,
  normalizeFlightOffer,
  normalizeTransportJourney,
  readableTransportJourney
} from "./provider-normalization.js";

const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const destinationLabel = (result = {}) => result.destination?.city || result.destination?.country || result.countryProfile?.name || result.display?.destination || "";

export const PROVIDER_STATES = Object.freeze({
  WAITING: "waiting",
  SEARCHING: "searching",
  SUCCESS: "success",
  UNAVAILABLE: "unavailable",
  RATE_LIMITED: "rate_limited",
  RETRY: "retry",
  EXPIRED: "expired"
});

const statusFromResult = (result = {}) => {
  if (result.ok) return PROVIDER_STATES.SUCCESS;
  if (result.error?.code === "daily_quota_guard") return PROVIDER_STATES.RATE_LIMITED;
  if (["missing_api_key", "provider_not_configured"].includes(result.error?.code) || [PROVIDER_SOURCE_STATES.MISSING_KEY, PROVIDER_SOURCE_STATES.UNAVAILABLE].includes(result.sourceState)) return PROVIDER_STATES.UNAVAILABLE;
  if (result.error) return PROVIDER_STATES.RETRY;
  return PROVIDER_STATES.WAITING;
};

const oneWayRequest = (result = {}) => ({
  origin: result.origin || result.departure || "Seoul",
  destination: destinationLabel(result),
  departureDate: result.schedule?.startDate || null,
  returnDate: result.schedule?.endDate || null,
  tripType: result.schedule?.endDate ? "round_trip" : "one_way",
  cabin: result.cabin || "economy",
  filters: result.providerFilters?.flights || {}
});

const accommodationRequest = (result = {}) => ({
  destination: destinationLabel(result),
  checkIn: result.schedule?.startDate || null,
  checkOut: result.schedule?.endDate || null,
  guests: result.travelParty?.travelerCount || result.travelerCount || 1,
  rooms: result.travelParty?.rooms || result.rooms || 1,
  filters: result.providerFilters?.hotels || {}
});

export const createProviderStatus = (id, result = unavailableProviderResult(id, "search")) => ({
  id,
  state: statusFromResult(result),
  sourceState: result.sourceState || PROVIDER_SOURCE_STATES.UNAVAILABLE,
  retryAvailable: !result.ok,
  retrievedAt: result.evidence?.retrievedAt || new Date().toISOString(),
  errorCode: result.error?.code || null
});

export const createProviderComparison = ({ flights = [], accommodations = [], transport = [] } = {}) => {
  const rankedFlights = compareFlightOffers(flights);
  const rankedAccommodations = compareAccommodationOffers(accommodations);
  const rankedTransport = asArray(transport);
  return {
    selected: {
      flight: rankedFlights[0] || null,
      accommodation: rankedAccommodations[0] || null,
      transport: rankedTransport[0] || null
    },
    tradeOffs: [
      rankedFlights[0]?.tradeOff,
      rankedAccommodations[0]?.tradeOff,
      rankedTransport[0] ? readableTransportJourney(rankedTransport[0]) : ""
    ].filter(Boolean),
    ranked: {
      flights: rankedFlights,
      accommodations: rankedAccommodations,
      transport: rankedTransport
    }
  };
};

export const createProviderOrchestrationFromMissionData = (result = {}) => {
  const lifecycle = createMissionLifecycle(result, { state: "ready_for_approval" });
  const flights = asArray(result.flights).map((item) => normalizeFlightOffer(item, { provider: item.provider || "mission-estimate" }));
  const accommodations = asArray(result.hotels).map((item) => normalizeAccommodationOffer(item, { provider: item.provider || "mission-estimate" }));
  const transport = asArray(result.transportation?.routes || result.transportRoutes || result.airportTransfer ? [result.transportation?.routes, result.transportRoutes, result.airportTransfer].flat().filter(Boolean) : [])
    .map((item) => normalizeTransportJourney(item, { provider: item.provider || "mission-estimate" }));
  return {
    version: PROVIDER_ORCHESTRATION_VERSION,
    mode: "mission_data_only",
    connectedProviders: ["google-places", "google-routes"].filter(Boolean),
    unavailableProviders: ["amadeus-flight-offers", "accommodation-provider"],
    normalized: { flights, accommodations, transport },
    comparison: createProviderComparison({ flights, accommodations, transport }),
    providerStatuses: {
      flights: createProviderStatus("amadeus-flight-offers"),
      accommodations: createProviderStatus("accommodation-provider"),
      transport: transport.length ? { id: "google-routes", state: PROVIDER_STATES.SUCCESS, sourceState: PROVIDER_SOURCE_STATES.CACHED, retryAvailable: false, retrievedAt: new Date().toISOString(), errorCode: null } : createProviderStatus("google-routes")
    },
    approvalWorkflow: {
      lifecycle,
      requiredScopes: [APPROVAL_SCOPES.SEARCH_FLIGHTS, APPROVAL_SCOPES.SEARCH_HOTELS, APPROVAL_SCOPES.SEARCH_TRANSPORTATION],
      preview: createExecutionPreview([APPROVAL_SCOPES.SEARCH_FLIGHTS, APPROVAL_SCOPES.SEARCH_HOTELS, APPROVAL_SCOPES.SEARCH_TRANSPORTATION], { language: result.language || "en" }),
      message: "ONE is ready to search live providers. Nothing will be booked without another confirmation."
    },
    bookingEnabled: false,
    paymentEnabled: false,
    secretsExposed: false,
    note: "Provider orchestration normalizes and compares available mission/provider data. It does not book or pay."
  };
};

export const searchAndCompareProviders = async (result = {}, { manager = createProviderManager(), language = "en", approvalLifecycle = null, requireApproval = false } = {}) => {
  const lifecycle = approvalLifecycle || createMissionLifecycle(result, { state: "approved_for_search" });
  if (requireApproval) {
    const allowed = [
      assertProviderActionAllowed(lifecycle, APPROVAL_SCOPES.SEARCH_FLIGHTS, { providerAction: "amadeus-flight-offers" }),
      assertProviderActionAllowed(lifecycle, APPROVAL_SCOPES.SEARCH_HOTELS, { providerAction: "accommodation-provider" })
    ];
    if (allowed.some((item) => !item.allowed)) {
      return {
        version: PROVIDER_ORCHESTRATION_VERSION,
        mode: "provider_search_blocked",
        approvalWorkflow: {
          lifecycle,
          requiredScopes: [APPROVAL_SCOPES.SEARCH_FLIGHTS, APPROVAL_SCOPES.SEARCH_HOTELS],
          preview: createExecutionPreview([APPROVAL_SCOPES.SEARCH_FLIGHTS, APPROVAL_SCOPES.SEARCH_HOTELS], { language }),
          message: allowed.find((item) => !item.allowed)?.userMessage || "Approval required before provider search."
        },
        normalized: { flights: [], accommodations: [], transport: [] },
        comparison: createProviderComparison({ flights: [], accommodations: [], transport: [] }),
        providerStatuses: {
          flights: createProviderStatus("amadeus-flight-offers"),
          accommodations: createProviderStatus("accommodation-provider")
        },
        blocked: true,
        bookingEnabled: false,
        paymentEnabled: false,
        secretsExposed: false
      };
    }
  }
  const flightRequest = oneWayRequest(result);
  const hotelRequest = accommodationRequest(result);
  const [flightResult, hotelResult] = await Promise.all([
    manager.searchFlights({ ...flightRequest, language }),
    manager.searchAccommodations({ ...hotelRequest, language })
  ]);
  const flights = flightResult.normalized || [];
  const accommodations = hotelResult.normalized || [];
  return {
    version: PROVIDER_ORCHESTRATION_VERSION,
    mode: "provider_search",
    requests: { flights: flightRequest, accommodations: hotelRequest },
    normalized: { flights, accommodations, transport: [] },
    comparison: createProviderComparison({ flights, accommodations, transport: [] }),
    providerStatuses: {
      flights: createProviderStatus(flightResult.provider || "amadeus-flight-offers", flightResult),
      accommodations: createProviderStatus(hotelResult.provider || "accommodation-provider", hotelResult)
    },
    approvalWorkflow: {
      lifecycle,
      requiredScopes: [APPROVAL_SCOPES.SEARCH_FLIGHTS, APPROVAL_SCOPES.SEARCH_HOTELS],
      preview: createExecutionPreview([APPROVAL_SCOPES.SEARCH_FLIGHTS, APPROVAL_SCOPES.SEARCH_HOTELS], { language }),
      message: "Provider search requires a current scoped approval and never creates bookings or payments."
    },
    bookingEnabled: false,
    paymentEnabled: false,
    secretsExposed: false
  };
};
