export const SOURCE_STATES = Object.freeze([
  "verified_live",
  "cached_public",
  "estimated",
  "placeholder",
  "unavailable"
]);

export const PRICE_STATES = Object.freeze([
  "verified_live",
  "cached_public",
  "estimated",
  "requires_live_search",
  "unavailable"
]);

export const AVAILABILITY_STATES = Object.freeze([
  "verified_live",
  "cached_public",
  "requires_live_search",
  "unavailable"
]);

const clampConfidence = (value) => Math.max(0, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 0));

const safeSourceState = (value) => SOURCE_STATES.includes(value) ? value : "unavailable";
const safePriceState = (value) => PRICE_STATES.includes(value) ? value : "unavailable";
const safeAvailabilityState = (value) => AVAILABILITY_STATES.includes(value) ? value : "unavailable";

export const createSourceMetadata = ({
  provider = "unknown",
  sourceState = "unavailable",
  lastVerified = null,
  cacheAge = null,
  freshness = "unavailable",
  confidence = 0,
  fixture = false,
  evidence = []
} = {}) => Object.freeze({
  provider,
  sourceState: safeSourceState(sourceState),
  lastVerified,
  cacheAge,
  freshness,
  confidence: clampConfidence(confidence),
  fixture: fixture === true,
  evidence: Array.isArray(evidence) ? evidence.filter(Boolean) : []
});

const baseModel = (type, values = {}) => Object.freeze({
  modelType: type,
  id: values.id || `${type.toLowerCase()}-unavailable`,
  sourceState: safeSourceState(values.sourceState),
  lastVerified: values.lastVerified || null,
  cacheAge: values.cacheAge ?? null,
  freshness: values.freshness || "unavailable",
  confidence: clampConfidence(values.confidence),
  sourceMetadata: createSourceMetadata(values.sourceMetadata || values),
  fixture: values.fixture === true
});

export const createHotelModel = (values = {}) => Object.freeze({
  ...baseModel("Hotel", values),
  name: values.name || null,
  location: values.location || null,
  coordinates: values.coordinates || null,
  provider: values.provider || values.sourceMetadata?.provider || "unknown",
  priceState: safePriceState(values.priceState),
  availabilityState: safeAvailabilityState(values.availabilityState),
  photosAvailable: values.photosAvailable === true,
  bookingSupported: values.bookingSupported === true,
  tags: Array.isArray(values.tags) ? values.tags : [],
  ratingAvailable: values.ratingAvailable === true,
  reviewCountAvailable: values.reviewCountAvailable === true
});

export const createFlightModel = (values = {}) => Object.freeze({
  ...baseModel("Flight", values),
  origin: values.origin || null,
  destination: values.destination || null,
  airline: values.airline || null,
  flightNumber: values.sourceState === "verified_live" ? values.flightNumber || null : null,
  departure: values.departure || null,
  arrival: values.arrival || null,
  priceState: safePriceState(values.priceState),
  availabilityState: safeAvailabilityState(values.availabilityState),
  bookingSupported: values.bookingSupported === true
});

export const createRestaurantModel = (values = {}) => Object.freeze({
  ...baseModel("Restaurant", values),
  name: values.name || null,
  category: values.category || null,
  openingHoursState: safeAvailabilityState(values.openingHoursState),
  reservationSupported: values.reservationSupported === true,
  priceLevelState: safePriceState(values.priceLevelState),
  ratingAvailable: values.ratingAvailable === true
});

export const createClinicModel = (values = {}) => Object.freeze({
  ...baseModel("Clinic", values),
  name: values.name || null,
  specialty: values.specialty || null,
  sameDaySupported: values.sameDaySupported === true,
  insuranceInformationState: safeSourceState(values.insuranceInformationState)
});

export const createAcademyModel = (values = {}) => Object.freeze({
  ...baseModel("Academy", values),
  name: values.name || null,
  subjects: Array.isArray(values.subjects) ? values.subjects : [],
  gradeLevels: Array.isArray(values.gradeLevels) ? values.gradeLevels : [],
  onlineSupported: values.onlineSupported === true,
  location: values.location || null
});

export const createBusinessModel = (values = {}) => Object.freeze({
  ...baseModel("Business", values),
  name: values.name || null,
  category: values.category || null,
  officialStatus: values.officialStatus || "unknown"
});

export const createGovernmentResourceModel = (values = {}) => Object.freeze({
  ...baseModel("GovernmentResource", values),
  agency: values.agency || null,
  service: values.service || null,
  official: values.official === true
});

export const createUnavailableModel = (type, values = {}) => {
  const factories = {
    Hotel: createHotelModel,
    Flight: createFlightModel,
    Restaurant: createRestaurantModel,
    Clinic: createClinicModel,
    Academy: createAcademyModel,
    Business: createBusinessModel,
    GovernmentResource: createGovernmentResourceModel
  };
  const factory = factories[type] || ((record) => baseModel(type, record));
  return factory({
    ...values,
    id: values.id || `${String(type).toLowerCase()}-search-required`,
    sourceState: "unavailable",
    priceState: values.priceState || "requires_live_search",
    availabilityState: values.availabilityState || "requires_live_search",
    confidence: 0,
    sourceMetadata: {
      provider: values.provider || "ONE World Intelligence",
      sourceState: "unavailable",
      freshness: "search required",
      confidence: 0,
      evidence: ["no connected provider returned usable data"]
    }
  });
};
