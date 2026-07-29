import { createProviderResult, unavailableProviderResult } from "./provider-result.js";

export const LIVE_HOTEL_INTELLIGENCE_VERSION = "20260730-live-hotel-intelligence-v1";

export const HOTEL_AVAILABILITY = Object.freeze({
  AVAILABLE: "available",
  LIMITED: "limited",
  SOLD_OUT: "sold_out",
  UNKNOWN: "unknown",
  UNAVAILABLE: "availability_unavailable"
});

export const HOTEL_SORTS = Object.freeze({
  MISSION_FIT: "mission_fit",
  LOWEST_TOTAL: "lowest_total",
  LOWEST_NIGHTLY: "lowest_nightly",
  SHORTEST_WALK: "shortest_walk",
  CANCELLATION: "cancellation",
  ACCESSIBILITY: "accessibility"
});

const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const text = (value) => String(value ?? "").trim();
const numberOrNull = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const lower = (value) => text(value).toLowerCase();
const has = (value, pattern) => pattern.test(lower(value));
const priceTotal = (hotel = {}) => Number(hotel.price?.total ?? hotel.price?.amount ?? hotel.price?.max ?? Number.POSITIVE_INFINITY);
const priceNightly = (hotel = {}) => Number(hotel.price?.nightly ?? hotel.price?.min ?? Number.POSITIVE_INFINITY);

export function normalizeAccommodationSearchRequest(request = {}) {
  return {
    cityCode: text(request.cityCode || request.destinationCityCode || request.destinationIata).toUpperCase(),
    latitude: numberOrNull(request.latitude ?? request.coordinates?.lat ?? request.destination?.coordinates?.lat),
    longitude: numberOrNull(request.longitude ?? request.coordinates?.lng ?? request.destination?.coordinates?.lng),
    hotelIds: asArray(request.hotelIds || request.providerHotelIds).map((id) => text(id).toUpperCase()).filter(Boolean),
    checkInDate: text(request.checkInDate || request.checkIn || request.startDate),
    checkOutDate: text(request.checkOutDate || request.checkOut || request.endDate),
    adults: Math.min(Math.max(Number.parseInt(request.adults || request.guests || request.passengers || 1, 10) || 1, 1), 9),
    roomQuantity: Math.min(Math.max(Number.parseInt(request.roomQuantity || request.rooms || 1, 10) || 1, 1), 9),
    currency: text(request.currency || request.currencyCode || "KRW").toUpperCase(),
    radius: Math.min(Math.max(Number.parseInt(request.radius || 8, 10) || 8, 1), 100),
    amenities: asArray(request.amenities),
    ratings: asArray(request.ratings || request.stars),
    filters: request.filters || {},
    sort: request.sort || HOTEL_SORTS.MISSION_FIT,
    missionContext: request.missionContext || {},
    itinerary: asArray(request.itinerary || request.dailyItinerary || request.timeline),
    budget: request.budget || request.maxTotal || null,
    travelerType: request.travelerType || request.partyType || request.relationship || null,
    pace: request.pace || request.missionPace || null,
    accessibility: request.accessibility || null
  };
}

const distanceKm = (a, b) => {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return null;
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(Number(b.lat) - Number(a.lat));
  const dLng = toRad(Number(b.lng) - Number(a.lng));
  const lat1 = toRad(Number(a.lat));
  const lat2 = toRad(Number(b.lat));
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const itineraryPoints = (request = {}) => asArray(request.itinerary).map((item) => item.coordinates || item.location || null).filter((point) => point?.lat && point?.lng);

export function estimateHotelMissionImpact(hotel = {}, request = {}) {
  const points = itineraryPoints(request);
  const hotelPoint = hotel.coordinates;
  const distances = points.map((point) => distanceKm(hotelPoint, point)).filter((value) => value !== null);
  const averageItineraryDistanceKm = distances.length ? Math.round((distances.reduce((sum, value) => sum + value, 0) / distances.length) * 10) / 10 : null;
  const dailyWalkingKm = averageItineraryDistanceKm === null ? null : Math.round(Math.min(averageItineraryDistanceKm * 0.45, 8) * 10) / 10;
  const lateArrivalFit = has(`${hotel.roomDescription} ${hotel.address || ""}`, /station|airport|train|metro|subway|central|terminal|역|공항/);
  const earlyDepartureFit = lateArrivalFit || has(hotel.name, /airport|terminal/);
  const accessibleFit = Boolean(request.accessibility) && has(`${hotel.accessibility || ""} ${hotel.roomDescription || ""}`, /accessible|wheelchair|elevator|barrier|휠체어|엘리베이터/);
  const budgetDelta = Number.isFinite(Number(request.budget)) && Number.isFinite(priceTotal(hotel))
    ? Math.round((priceTotal(hotel) - Number(request.budget)) * 100) / 100
    : null;
  return {
    averageItineraryDistanceKm,
    estimatedDailyWalkingKm: dailyWalkingKm,
    lateArrivalFit,
    earlyDepartureFit,
    accessibleFit,
    budgetDelta,
    measurable: {
      distanceKnown: averageItineraryDistanceKm !== null,
      budgetKnown: budgetDelta !== null,
      providerPriceKnown: Number.isFinite(priceTotal(hotel))
    }
  };
}

export function scoreHotelForMission(hotel = {}, request = {}) {
  const impact = estimateHotelMissionImpact(hotel, request);
  const total = priceTotal(hotel);
  const budget = numberOrNull(request.budget);
  const underBudget = budget === null || !Number.isFinite(total) ? 0 : total <= budget ? 16 : -Math.min((total - budget) / Math.max(budget, 1) * 20, 20);
  const distanceScore = impact.averageItineraryDistanceKm === null ? 0 : Math.max(0, 24 - impact.averageItineraryDistanceKm * 4);
  const accessibilityScore = request.accessibility ? (impact.accessibleFit ? 14 : -8) : 0;
  const cancellationScore = /free|refundable|deadline|취소|cancel/i.test(JSON.stringify(hotel.cancellation || "")) ? 8 : 0;
  const roomScore = request.travelerType === "family" && hotel.roomType === "family" ? 8
    : request.travelerType === "solo" && ["single", "double"].includes(hotel.roomType) ? 4
      : request.travelerType === "couple" && ["double", "suite", "ryokan"].includes(hotel.roomType) ? 6
        : 0;
  const arrivalScore = impact.lateArrivalFit ? 6 : 0;
  const availabilityScore = hotel.availability === HOTEL_AVAILABILITY.AVAILABLE ? 10
    : hotel.availability === HOTEL_AVAILABILITY.LIMITED ? 4
      : hotel.availability === HOTEL_AVAILABILITY.SOLD_OUT ? -100
        : 0;
  const score = Math.round(50 + underBudget + distanceScore + accessibilityScore + cancellationScore + roomScore + arrivalScore + availabilityScore);
  const reasons = [
    impact.averageItineraryDistanceKm !== null ? `Average itinerary distance: ${impact.averageItineraryDistanceKm} km` : "",
    impact.estimatedDailyWalkingKm !== null ? `Estimated daily walking impact: ${impact.estimatedDailyWalkingKm} km` : "",
    impact.lateArrivalFit ? "Better fit for late arrival or station access" : "",
    impact.accessibleFit ? "Accessibility preference is supported by visible hotel signals" : "",
    budget !== null && Number.isFinite(total) ? (total <= budget ? "Fits the stated budget" : "Over the stated budget") : "",
    cancellationScore ? "Cancellation policy evidence is present" : "",
    hotel.availability === HOTEL_AVAILABILITY.AVAILABLE ? "Provider returned an available offer" : ""
  ].filter(Boolean).slice(0, 5);
  return {
    score: Math.max(0, Math.min(100, score)),
    impact,
    reasons,
    explanation: reasons.join(". ") || "Hotel can be compared, but mission-specific evidence is limited."
  };
}

export function createHotelChangeExplanation(previousHotel = {}, nextHotel = {}, request = {}) {
  const previous = estimateHotelMissionImpact(previousHotel, request);
  const next = estimateHotelMissionImpact(nextHotel, request);
  const changes = [];
  if (previous.estimatedDailyWalkingKm !== null && next.estimatedDailyWalkingKm !== null) {
    const diff = Math.round((previous.estimatedDailyWalkingKm - next.estimatedDailyWalkingKm) * 10) / 10;
    if (diff > 0) changes.push(`This hotel reduces estimated daily walking by ${diff} km.`);
    if (diff < 0) changes.push(`This hotel increases estimated daily walking by ${Math.abs(diff)} km.`);
  }
  const oldTotal = priceTotal(previousHotel);
  const newTotal = priceTotal(nextHotel);
  if (Number.isFinite(oldTotal) && Number.isFinite(newTotal)) {
    const diff = Math.round((newTotal - oldTotal) * 100) / 100;
    if (diff > 0) changes.push(`Total stay increases by ${diff} ${nextHotel.price?.currency || previousHotel.price?.currency || ""}.`.trim());
    if (diff < 0) changes.push(`Total stay decreases by ${Math.abs(diff)} ${nextHotel.price?.currency || previousHotel.price?.currency || ""}.`.trim());
  }
  if (!changes.length) changes.push("No measurable mission impact changed from available provider data.");
  return changes;
}

export function filterHotelOffers(hotels = [], filters = {}) {
  return asArray(hotels).filter((hotel) => {
    if (filters.maxTotal && priceTotal(hotel) > Number(filters.maxTotal)) return false;
    if (filters.maxNightly && priceNightly(hotel) > Number(filters.maxNightly)) return false;
    if (filters.roomType && lower(hotel.roomType) !== lower(filters.roomType)) return false;
    if (filters.accessibility && !has(`${hotel.accessibility || ""} ${hotel.roomDescription || ""}`, /accessible|wheelchair|elevator|barrier|휠체어|엘리베이터/)) return false;
    if (filters.cancellation && !/cancel|refund|취소/i.test(JSON.stringify(hotel.cancellation || ""))) return false;
    if (filters.availability && lower(hotel.availability) !== lower(filters.availability)) return false;
    if (filters.amenity && !has(`${hotel.amenities || ""} ${hotel.roomDescription || ""}`, new RegExp(text(filters.amenity), "i"))) return false;
    return true;
  });
}

export function rankHotelsForMission(hotels = [], request = {}) {
  return filterHotelOffers(hotels, request.filters).map((hotel) => {
    const missionScore = scoreHotelForMission(hotel, request);
    return { ...hotel, missionScore: missionScore.score, missionImpact: missionScore.impact, whySelected: missionScore.explanation, scoreReasons: missionScore.reasons };
  }).sort((a, b) => {
    if (request.sort === HOTEL_SORTS.LOWEST_TOTAL) return priceTotal(a) - priceTotal(b);
    if (request.sort === HOTEL_SORTS.LOWEST_NIGHTLY) return priceNightly(a) - priceNightly(b);
    if (request.sort === HOTEL_SORTS.SHORTEST_WALK) return (a.missionImpact?.estimatedDailyWalkingKm ?? Number.POSITIVE_INFINITY) - (b.missionImpact?.estimatedDailyWalkingKm ?? Number.POSITIVE_INFINITY);
    if (request.sort === HOTEL_SORTS.ACCESSIBILITY) return Number(Boolean(b.missionImpact?.accessibleFit)) - Number(Boolean(a.missionImpact?.accessibleFit));
    return Number(b.missionScore || 0) - Number(a.missionScore || 0);
  });
}

export function compareHotelsForMission(hotels = [], request = {}) {
  const ranked = rankHotelsForMission(hotels, request).slice(0, 4);
  return {
    hotels: ranked,
    dimensions: ["walking", "transport", "price", "neighborhood", "amenities", "cancellation", "distance", "missionScore"],
    selected: ranked[0] || null,
    explanations: ranked.map((hotel, index) => ({
      providerHotelId: hotel.providerHotelId,
      name: hotel.name || hotel.property,
      rank: index + 1,
      missionScore: hotel.missionScore,
      reasons: hotel.scoreReasons || []
    }))
  };
}

export class AccommodationProvider {
  constructor({
    providerId = "amadeus-hotel-offers",
    label = "Hotel Intelligence",
    apiBase = "/api/v1",
    fetcher = typeof fetch !== "undefined" ? fetch.bind(globalThis) : null,
    enabled = false
  } = {}) {
    this.providerId = providerId;
    this.label = label;
    this.providerType = "accommodation";
    this.apiBase = apiBase.replace(/\/$/, "");
    this.fetcher = fetcher;
    this.enabled = Boolean(enabled);
    this.activeController = null;
  }

  cancelObsoleteSearch() {
    this.activeController?.abort?.();
    this.activeController = null;
  }

  async request(endpoint, payload = {}, { method = "POST", signal = null } = {}) {
    if (!this.enabled || !this.fetcher) return unavailableProviderResult(this.providerId, endpoint);
    const controller = new AbortController();
    this.activeController = controller;
    const linkedSignal = signal || controller.signal;
    try {
      const response = await this.fetcher(`${this.apiBase}/providers/hotels/${endpoint}`, {
        method,
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: method === "GET" ? undefined : JSON.stringify(payload),
        signal: linkedSignal
      });
      const data = await response.json().catch(() => null);
      if (!response.ok && !data?.error) {
        return createProviderResult({ ok: false, provider: this.providerId, sourceState: "error", error: { code: `http_${response.status}`, message: "Hotel provider request failed." } });
      }
      return data;
    } catch (error) {
      if (error?.name === "AbortError") return createProviderResult({ ok: false, provider: this.providerId, sourceState: "unavailable", error: { code: "request_cancelled", message: "Obsolete hotel search was cancelled." } });
      return createProviderResult({ ok: false, provider: this.providerId, sourceState: "error", error: { code: "network_error", message: "Hotel search could not reach the server." } });
    } finally {
      if (this.activeController === controller) this.activeController = null;
    }
  }

  async searchAccommodations(request = {}) {
    this.cancelObsoleteSearch();
    const normalizedRequest = normalizeAccommodationSearchRequest(request);
    const result = await this.request("search", normalizedRequest);
    return this.normalizeResponse(result, normalizedRequest);
  }

  searchHotels(request = {}) {
    return this.searchAccommodations(request);
  }

  listHotels(request = {}) {
    return this.request("list", normalizeAccommodationSearchRequest(request));
  }

  searchAvailability(request = {}) {
    return this.searchAccommodations(request);
  }

  searchRates(request = {}) {
    return this.searchAccommodations(request);
  }

  getCancellationPolicy(request = {}) {
    return this.request("cancellation", request);
  }

  getHotelDetails(request = {}) {
    return this.request("details", request);
  }

  compareHotels(hotels = [], request = {}) {
    return compareHotelsForMission(hotels, normalizeAccommodationSearchRequest(request));
  }

  healthCheck() {
    return this.request("health", {}, { method: "GET" });
  }

  normalizeResponse(result = {}, request = {}) {
    const ranked = rankHotelsForMission(result.items || result.data || [], request);
    return {
      ...result,
      provider: result.provider || this.providerId,
      items: ranked,
      data: ranked,
      normalized: ranked,
      comparison: compareHotelsForMission(ranked, request),
      searchRequest: request,
      bookingEnabled: false,
      reservationEnabled: false,
      honesty: {
        pricesMayChange: true,
        reservationsCreated: false,
        availabilityRequiresProviderEvidence: true,
        providerTimestamp: result.retrievedAt || result.evidence?.retrievedAt || null
      }
    };
  }
}

export class HotelProvider extends AccommodationProvider {}
export class AvailabilityProvider extends AccommodationProvider {}
export class RateProvider extends AccommodationProvider {}
export class CancellationProvider extends AccommodationProvider {}
