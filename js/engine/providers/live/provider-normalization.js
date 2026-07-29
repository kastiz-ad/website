import { PROVIDER_SOURCE_STATES, createProviderEvidence } from "./provider-result.js";

export const PROVIDER_ORCHESTRATION_VERSION = "PROVIDER_ORCHESTRATION_V1";

const text = (value, fallback = "") => String(value ?? fallback).trim();
const nowIso = () => new Date().toISOString();
const clone = (value) => JSON.parse(JSON.stringify(value ?? null));
const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];

const makeId = (prefix, item = {}, fallback = "") => (
  item.id ||
  item.providerId ||
  item.placeId ||
  `${prefix}-${Math.abs(text(item.name || item.airline || item.property || fallback || "one").split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0))}`
);

const normalizePrice = (value = {}, fallbackCurrency = "KRW") => {
  if (typeof value === "number") return { currency: fallbackCurrency, amount: value, min: value, max: value };
  if (!value || typeof value !== "object") return { currency: fallbackCurrency, amount: null, min: null, max: null };
  return {
    currency: value.currency || fallbackCurrency,
    amount: typeof value.amount === "number" ? value.amount : null,
    min: typeof value.min === "number" ? value.min : null,
    max: typeof value.max === "number" ? value.max : null
  };
};

const sourceStateFrom = (item = {}, fallback = PROVIDER_SOURCE_STATES.UNAVAILABLE) => (
  item.liveStatus ||
  item.sourceState ||
  item.source ||
  item.providerEvidence?.sourceState ||
  fallback
);

export const normalizeFlightOffer = (item = {}, { provider = "unknown-flight-provider", fallbackCurrency = "KRW" } = {}) => ({
  id: makeId("flight", item, item.flightNumber),
  provider: item.provider || provider,
  airline: text(item.airline || item.name || item.provider, "Unknown airline"),
  flightNumber: text(item.flightNumber || item.number || ""),
  departureAirport: text(item.departureAirport || item.originAirport || item.origin || ""),
  arrivalAirport: text(item.arrivalAirport || item.destinationAirport || item.destination || ""),
  departureTime: item.departureTime || item.departure || null,
  arrivalTime: item.arrivalTime || item.arrival || null,
  duration: item.duration || item.durationMinutes || null,
  stops: Number.isFinite(Number(item.stops)) ? Number(item.stops) : null,
  cabin: text(item.cabin || "economy"),
  baggage: item.baggage || null,
  fareRules: item.fareRules || item.rules || null,
  currency: item.currency || item.estimatedPrice?.currency || fallbackCurrency,
  price: normalizePrice(item.price || item.estimatedPrice, item.currency || item.estimatedPrice?.currency || fallbackCurrency),
  liveStatus: sourceStateFrom(item, PROVIDER_SOURCE_STATES.UNAVAILABLE),
  retrievedAt: item.retrievedAt || item.providerEvidence?.retrievedAt || nowIso(),
  evidence: item.providerEvidence || createProviderEvidence({ provider: item.provider || provider, sourceState: sourceStateFrom(item) })
});

export const normalizeAccommodationOffer = (item = {}, { provider = "unknown-accommodation-provider", fallbackCurrency = "KRW" } = {}) => ({
  id: makeId("accommodation", item, item.name),
  provider: item.provider || provider,
  providerHotelId: item.providerHotelId || item.hotelId || "",
  providerOfferId: item.providerOfferId || item.offerId || "",
  property: text(item.property || item.name || item.title, "Unnamed property"),
  area: text(item.area || item.neighborhood || item.address || ""),
  coordinates: item.coordinates || null,
  rating: typeof item.rating === "number" ? item.rating : null,
  price: normalizePrice(item.price || item.estimatedNightlyPrice || item.estimatedPrice, item.currency || fallbackCurrency),
  totalStayPrice: item.price?.total ?? item.totalStayPrice ?? null,
  nightlyPrice: item.price?.nightly ?? item.nightlyPrice ?? null,
  taxes: item.price?.taxes || item.taxes || [],
  fees: item.price?.fees || item.fees || [],
  availability: item.availability || (item.available === true ? "available" : "unknown"),
  roomType: item.roomType || "unknown",
  roomDescription: item.roomDescription || "",
  checkInDate: item.checkInDate || null,
  checkOutDate: item.checkOutDate || null,
  cancellation: item.cancellation || item.cancellationPolicy || null,
  accessibility: item.accessibility || item.accessibilityNotes || null,
  distanceToItinerary: item.distanceToItinerary || item.distance || null,
  missionScore: item.missionScore ?? null,
  missionImpact: item.missionImpact || null,
  images: asArray(item.images || item.photos).map((image) => typeof image === "string" ? { url: image } : clone(image)),
  liveStatus: sourceStateFrom(item, PROVIDER_SOURCE_STATES.UNAVAILABLE),
  retrievedAt: item.retrievedAt || item.providerEvidence?.retrievedAt || nowIso(),
  evidence: item.providerEvidence || createProviderEvidence({ provider: item.provider || provider, sourceState: sourceStateFrom(item) })
});

export const normalizeTransportJourney = (item = {}, { provider = "google-routes" } = {}) => {
  const steps = asArray(item.steps || item.legs || item.segments).map((step) => ({
    mode: text(step.mode || step.travelMode || step.type || "walk"),
    instruction: text(step.instruction || step.name || step.route || ""),
    duration: step.duration || step.durationMinutes || null,
    distance: step.distance || step.distanceMeters || null,
    cost: step.cost || null
  }));
  return {
    id: makeId("transport", item, steps.map((step) => step.instruction).join("-")),
    provider: item.provider || provider,
    origin: item.origin || null,
    destination: item.destination || null,
    steps,
    estimatedDuration: item.estimatedDuration || item.duration || null,
    estimatedCost: item.estimatedCost || item.cost || null,
    liveStatus: sourceStateFrom(item, PROVIDER_SOURCE_STATES.UNAVAILABLE),
    retrievedAt: item.retrievedAt || item.providerEvidence?.retrievedAt || nowIso(),
    evidence: item.providerEvidence || createProviderEvidence({ provider: item.provider || provider, sourceState: sourceStateFrom(item) })
  };
};

export const normalizeProviderResultSet = (type, result = {}, options = {}) => {
  const data = asArray(result?.data || result);
  if (type === "flight") return data.map((item) => normalizeFlightOffer(item, options));
  if (type === "accommodation") return data.map((item) => normalizeAccommodationOffer(item, options));
  if (type === "transport") return data.map((item) => normalizeTransportJourney(item, options));
  return data;
};

const minPrice = (offer = {}) => {
  const price = offer.price || {};
  return Number(price.amount ?? price.min ?? price.max ?? Number.POSITIVE_INFINITY);
};

const weighted = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const compareFlightOffers = (offers = [], { sort = "best_overall" } = {}) => asArray(offers)
  .map((offer) => {
    const stopsPenalty = weighted(offer.stops, 1) * 12;
    const price = minPrice(offer);
    const duration = weighted(offer.duration, 0);
    const score = sort === "lowest_price"
      ? -price
      : sort === "shortest_duration"
        ? -duration
        : 100 - stopsPenalty - (Number.isFinite(price) ? price / 100000 : 0) - (duration ? duration / 20 : 0);
    return {
      ...offer,
      oneScore: score,
      whySelected: offer.stops === 0 ? "Nonstop route with lower friction." : "Balanced fare and routing.",
      tradeOff: offer.stops > 0 ? "May cost less, but includes a connection." : "May cost more than one-stop options."
    };
  })
  .sort((a, b) => b.oneScore - a.oneScore);

export const compareAccommodationOffers = (offers = []) => asArray(offers)
  .map((offer) => {
    const price = minPrice(offer);
    const rating = weighted(offer.rating, 0);
    const accessibleBoost = /accessible|elevator|no stairs|wheelchair/i.test(text(offer.accessibility)) ? 8 : 0;
    const score = rating * 12 + accessibleBoost - (Number.isFinite(price) ? price / 10000 : 0);
    return {
      ...offer,
      oneScore: score,
      whySelected: accessibleBoost ? "Better accessibility fit for the mission." : "Balanced location, quality, and price fit.",
      tradeOff: Number.isFinite(price) ? "Final availability and cancellation terms still require provider verification." : "Price unavailable until provider search succeeds."
    };
  })
  .sort((a, b) => b.oneScore - a.oneScore);

export const readableTransportJourney = (journey = {}) => asArray(journey.steps)
  .map((step) => [step.instruction || step.mode, step.duration].filter(Boolean).join(" · "))
  .join(" → ");
