import { createProviderResult, unavailableProviderResult } from "./provider-result.js";

export const REAL_FLIGHT_SEARCH_VERSION = "20260730-real-flight-search-v1";

export const FLIGHT_SORTS = Object.freeze({
  BEST_MATCH: "best_match",
  LOWEST_PRICE: "lowest_price",
  SHORTEST_DURATION: "shortest_duration",
  FEWEST_STOPS: "fewest_stops",
  EARLIEST_DEPARTURE: "earliest_departure",
  LATEST_DEPARTURE: "latest_departure"
});

const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const text = (value) => String(value ?? "").trim();
const priceAmount = (offer = {}) => Number(offer.price?.amount ?? offer.price?.min ?? Number.POSITIVE_INFINITY);
const minutes = (offer = {}) => Number(offer.duration ?? Number.POSITIVE_INFINITY);
const stops = (offer = {}) => Number(offer.stops ?? Number.POSITIVE_INFINITY);
const departureMs = (offer = {}) => new Date(offer.departureTime || 0).getTime() || 0;

export function normalizeFlightSearchRequest(request = {}) {
  return {
    origin: text(request.origin || request.originLocationCode || request.departureAirport).toUpperCase(),
    destination: text(request.destination || request.destinationLocationCode || request.arrivalAirport).toUpperCase(),
    departure: text(request.departure || request.departureDate || request.startDate),
    return: text(request.return || request.returnDate || request.endDate),
    passengers: Math.max(1, Number.parseInt(request.passengers || request.adults || request.travelers || 1, 10) || 1),
    cabin: text(request.cabin || "economy").toLowerCase(),
    currency: text(request.currency || request.currencyCode || "KRW").toUpperCase(),
    language: text(request.language || "en"),
    flexibility: request.flexibility || null,
    accessibility: request.accessibility || null,
    budget: request.budget || request.maxPrice || null,
    max: Math.min(Math.max(Number.parseInt(request.max || request.limit || 8, 10) || 8, 1), 50),
    nonStop: request.nonStop === true || request.stops === 0,
    airlines: asArray(request.airlines || request.includedAirlineCodes).map((code) => text(code).toUpperCase()),
    excludedAirlineCodes: asArray(request.excludedAirlineCodes).map((code) => text(code).toUpperCase()),
    sort: request.sort || FLIGHT_SORTS.BEST_MATCH,
    filters: request.filters || {}
  };
}

export function sortFlightOffers(offers = [], sort = FLIGHT_SORTS.BEST_MATCH) {
  return [...asArray(offers)].sort((a, b) => {
    if (sort === FLIGHT_SORTS.LOWEST_PRICE) return priceAmount(a) - priceAmount(b);
    if (sort === FLIGHT_SORTS.SHORTEST_DURATION) return minutes(a) - minutes(b);
    if (sort === FLIGHT_SORTS.FEWEST_STOPS) return stops(a) - stops(b);
    if (sort === FLIGHT_SORTS.EARLIEST_DEPARTURE) return departureMs(a) - departureMs(b);
    if (sort === FLIGHT_SORTS.LATEST_DEPARTURE) return departureMs(b) - departureMs(a);
    return (Number(b.oneScore || 0) - Number(a.oneScore || 0)) || (priceAmount(a) - priceAmount(b));
  });
}

export function filterFlightOffers(offers = [], filters = {}) {
  const airlines = new Set(asArray(filters.airlines).map((item) => text(item).toUpperCase()).filter(Boolean));
  const cabin = text(filters.cabin).toUpperCase();
  const maxStops = Number.isFinite(Number(filters.stops)) ? Number(filters.stops) : null;
  const minPrice = Number.isFinite(Number(filters.minPrice)) ? Number(filters.minPrice) : null;
  const maxPrice = Number.isFinite(Number(filters.maxPrice)) ? Number(filters.maxPrice) : null;
  return asArray(offers).filter((offer) => {
    if (airlines.size && !airlines.has(text(offer.airlineCode || offer.airline).toUpperCase())) return false;
    if (cabin && text(offer.cabin).toUpperCase() !== cabin) return false;
    if (maxStops !== null && stops(offer) > maxStops) return false;
    const price = priceAmount(offer);
    if (minPrice !== null && price < minPrice) return false;
    if (maxPrice !== null && price > maxPrice) return false;
    if (filters.departureAfter && departureMs(offer) < new Date(filters.departureAfter).getTime()) return false;
    if (filters.departureBefore && departureMs(offer) > new Date(filters.departureBefore).getTime()) return false;
    return true;
  });
}

export class FlightProvider {
  constructor({
    providerId = "amadeus-flight-offers",
    label = "Flight Search",
    apiBase = "/api/v1",
    fetcher = typeof fetch !== "undefined" ? fetch.bind(globalThis) : null,
    enabled = false
  } = {}) {
    this.providerId = providerId;
    this.label = label;
    this.providerType = "flight";
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
      const response = await this.fetcher(`${this.apiBase}/providers/flights/${endpoint}`, {
        method,
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: method === "GET" ? undefined : JSON.stringify(payload),
        signal: linkedSignal
      });
      const data = await response.json().catch(() => null);
      if (!response.ok && !data?.error) {
        return createProviderResult({
          ok: false,
          provider: this.providerId,
          sourceState: "error",
          error: { code: `http_${response.status}`, message: "Flight provider request failed." }
        });
      }
      return data;
    } catch (error) {
      if (error?.name === "AbortError") {
        return createProviderResult({
          ok: false,
          provider: this.providerId,
          sourceState: "unavailable",
          error: { code: "request_cancelled", message: "Obsolete flight search was cancelled." }
        });
      }
      return createProviderResult({
        ok: false,
        provider: this.providerId,
        sourceState: "error",
        error: { code: "network_error", message: "Flight search could not reach the server." }
      });
    } finally {
      if (this.activeController === controller) this.activeController = null;
    }
  }

  async searchFlights(request = {}) {
    this.cancelObsoleteSearch();
    const normalizedRequest = normalizeFlightSearchRequest(request);
    const result = await this.request("search", normalizedRequest);
    return this.normalizeResponse(result, normalizedRequest);
  }

  searchRoundTrip(request = {}) {
    return this.searchFlights({ ...request, tripType: "round_trip" });
  }

  searchOneWay(request = {}) {
    return this.searchFlights({ ...request, return: "", returnDate: "", tripType: "one_way" });
  }

  searchMultiCity(request = {}) {
    return this.request("multi-city", request).then((result) => this.normalizeResponse(result, normalizeFlightSearchRequest(request)));
  }

  getFareRules(request = {}) {
    return this.request("fare-rules", request);
  }

  getFlightDetails(request = {}) {
    return this.request("details", request);
  }

  healthCheck() {
    return this.request("health", {}, { method: "GET" });
  }

  normalizeResponse(result = {}, request = {}) {
    const filtered = filterFlightOffers(result.items || result.data || [], request.filters);
    const sorted = sortFlightOffers(filtered, request.sort);
    return {
      ...result,
      provider: result.provider || this.providerId,
      items: sorted,
      data: sorted,
      normalized: sorted,
      searchRequest: request,
      bookingEnabled: false,
      ticketingEnabled: false,
      honesty: {
        pricesMayChange: true,
        ticketsIssued: false,
        seatsReserved: false,
        providerTimestamp: result.retrievedAt || result.evidence?.retrievedAt || null
      }
    };
  }
}
