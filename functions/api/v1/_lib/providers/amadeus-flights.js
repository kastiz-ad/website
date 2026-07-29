import {
  DATA_STATES,
  fetchJsonWithTimeout,
  hasEnv,
  providerError,
  providerSuccess,
  setupRequired
} from "./provider-contracts.js";

export const AMADEUS_FLIGHT_PROVIDER_ID = "amadeus-flight-offers";
export const AMADEUS_REQUIRED_ENV = Object.freeze(["AMADEUS_CLIENT_ID", "AMADEUS_CLIENT_SECRET"]);
export const AMADEUS_FLIGHT_SEARCH_VERSION = "20260730-real-flight-search-v1";

const text = (value) => String(value ?? "").trim();
const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const numberOrNull = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const nowIso = () => new Date().toISOString();

const baseUrl = (env = {}) => String(env.AMADEUS_ENV || env.FLIGHT_PROVIDER_ENV || "test").toLowerCase() === "production"
  ? "https://api.amadeus.com"
  : "https://test.api.amadeus.com";

const amadeusSetupRequired = () => setupRequired(
  AMADEUS_FLIGHT_PROVIDER_ID,
  AMADEUS_REQUIRED_ENV,
  "Amadeus flight credentials are required before ONE can search live flight offers."
);

const cabinMap = Object.freeze({
  economy: "ECONOMY",
  premium_economy: "PREMIUM_ECONOMY",
  premium: "PREMIUM_ECONOMY",
  business: "BUSINESS",
  first: "FIRST"
});

const normalizeCabin = (value = "economy") => cabinMap[String(value).toLowerCase().replace(/\s+/g, "_")] || "ECONOMY";
const normalizeTripType = (request = {}) => request.tripType || (request.returnDate || request.return || request.endDate ? "round_trip" : "one_way");

export function normalizeFlightSearchInput(request = {}) {
  const passengers = Math.max(1, Number.parseInt(request.passengers || request.adults || request.travelers || 1, 10) || 1);
  return {
    origin: text(request.origin || request.originLocationCode || request.departureAirport).toUpperCase(),
    destination: text(request.destination || request.destinationLocationCode || request.arrivalAirport).toUpperCase(),
    departure: text(request.departure || request.departureDate || request.startDate),
    return: text(request.return || request.returnDate || request.endDate),
    passengers,
    cabin: normalizeCabin(request.cabin),
    currency: text(request.currency || request.currencyCode || "KRW").toUpperCase(),
    language: text(request.language || "en"),
    flexibility: request.flexibility || null,
    accessibility: request.accessibility || null,
    budget: request.budget || request.maxPrice || null,
    max: Math.min(Math.max(Number.parseInt(request.max || request.limit || 8, 10) || 8, 1), 50),
    nonStop: request.nonStop === true || request.stops === 0,
    includedAirlineCodes: asArray(request.includedAirlineCodes || request.airlines).map((code) => text(code).toUpperCase()).filter(Boolean),
    excludedAirlineCodes: asArray(request.excludedAirlineCodes).map((code) => text(code).toUpperCase()).filter(Boolean),
    tripType: normalizeTripType(request)
  };
}

export function validateFlightSearchInput(input = {}) {
  const missing = [];
  if (!/^[A-Z]{3}$/.test(input.origin || "")) missing.push("origin_iata");
  if (!/^[A-Z]{3}$/.test(input.destination || "")) missing.push("destination_iata");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.departure || "")) missing.push("departure_date");
  if (input.return && !/^\d{4}-\d{2}-\d{2}$/.test(input.return)) missing.push("return_date");
  return { ok: missing.length === 0, missing };
}

async function getAmadeusAccessToken(env = {}) {
  if (!hasEnv(env, AMADEUS_REQUIRED_ENV)) return { ok: false, setupRequired: true };
  const payload = new URLSearchParams();
  payload.set("grant_type", "client_credentials");
  payload.set("client_id", env.AMADEUS_CLIENT_ID);
  payload.set("client_secret", env.AMADEUS_CLIENT_SECRET);
  const data = await fetchJsonWithTimeout(`${baseUrl(env)}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString()
  }, { timeoutMs: Number(env.AMADEUS_PROVIDER_TIMEOUT_MS || env.FLIGHT_PROVIDER_TIMEOUT_MS || 8000) });
  return {
    ok: Boolean(data?.access_token),
    token: data?.access_token || "",
    expiresIn: data?.expires_in || null,
    tokenType: data?.token_type || "Bearer"
  };
}

const isoDurationToMinutes = (duration = "") => {
  const match = String(duration).match(/^P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (!match) return null;
  return (Number(match[1] || 0) * 60) + Number(match[2] || 0);
};

const checkedBagsFrom = (offer = {}) => {
  const details = asArray(offer.travelerPricings).flatMap((pricing) => asArray(pricing.fareDetailsBySegment));
  const first = details.find((detail) => detail.includedCheckedBags);
  if (!first) return null;
  const bags = first.includedCheckedBags;
  if (Number.isFinite(Number(bags.quantity))) return `${Number(bags.quantity)} checked bag${Number(bags.quantity) === 1 ? "" : "s"}`;
  if (Number.isFinite(Number(bags.weight))) return `${bags.weight}${bags.weightUnit || "kg"} checked baggage`;
  return null;
};

const fareFamilyFrom = (offer = {}) => {
  const detail = asArray(offer.travelerPricings).flatMap((pricing) => asArray(pricing.fareDetailsBySegment))[0] || {};
  return detail.brandedFareLabel || detail.brandedFare || detail.fareBasis || null;
};

export function normalizeAmadeusFlightOffer(offer = {}, { dictionaries = {}, retrievedAt = nowIso(), environment = "test" } = {}) {
  const itineraries = asArray(offer.itineraries);
  const firstItinerary = itineraries[0] || {};
  const segments = asArray(firstItinerary.segments);
  const firstSegment = segments[0] || {};
  const lastSegment = segments[segments.length - 1] || firstSegment;
  const carrierCode = firstSegment.carrierCode || firstSegment.operating?.carrierCode || "";
  const airline = dictionaries.carriers?.[carrierCode] || carrierCode || "Unknown airline";
  const priceAmount = numberOrNull(offer.price?.grandTotal || offer.price?.total);
  const currency = offer.price?.currency || "KRW";
  return {
    provider: AMADEUS_FLIGHT_PROVIDER_ID,
    providerFlightId: offer.id || "",
    airline,
    airlineCode: carrierCode,
    flightNumber: carrierCode && firstSegment.number ? `${carrierCode}${firstSegment.number}` : "",
    origin: firstSegment.departure?.iataCode || "",
    destination: lastSegment.arrival?.iataCode || "",
    departureTime: firstSegment.departure?.at || null,
    arrivalTime: lastSegment.arrival?.at || null,
    duration: isoDurationToMinutes(firstItinerary.duration),
    durationText: firstItinerary.duration || "",
    stops: Math.max(segments.length - 1, 0),
    fareFamily: fareFamilyFrom(offer),
    cabin: normalizeCabin(asArray(offer.travelerPricings).flatMap((pricing) => asArray(pricing.fareDetailsBySegment))[0]?.cabin || "economy"),
    price: priceAmount === null ? null : { amount: priceAmount, min: priceAmount, max: priceAmount, currency },
    currency,
    baggage: checkedBagsFrom(offer),
    changePolicy: offer.fareRules?.rules?.find?.((rule) => /exchange|change/i.test(rule.category))?.notApplicable ? "Not included in provider response" : "Confirm in fare rules before booking",
    refundPolicy: offer.fareRules?.rules?.find?.((rule) => /refund/i.test(rule.category))?.notApplicable ? "Not refundable according to fare rules" : "Confirm in fare rules before booking",
    retrievedAt,
    rawOfferAvailableForPricing: true,
    providerEvidence: {
      provider: AMADEUS_FLIGHT_PROVIDER_ID,
      dataState: DATA_STATES.VERIFIED_LIVE,
      endpoint: "v2/shopping/flight-offers",
      providerResponseIdentifier: offer.id || null,
      retrievedAt,
      environment,
      source: "Amadeus Flight Offers Search",
      priceFreshness: "retrieved_from_provider",
      limitations: [
        "Prices and availability may change until booking is completed.",
        "ONE does not issue tickets or reserve seats in this milestone."
      ]
    }
  };
}

export function normalizeAmadeusFlightResponse(payload = {}, { retrievedAt = nowIso(), environment = "test" } = {}) {
  const dictionaries = payload.dictionaries || {};
  return asArray(payload.data).map((offer) => normalizeAmadeusFlightOffer(offer, { dictionaries, retrievedAt, environment }));
}

function appendSearchParams(url, input = {}) {
  url.searchParams.set("originLocationCode", input.origin);
  url.searchParams.set("destinationLocationCode", input.destination);
  url.searchParams.set("departureDate", input.departure);
  if (input.return) url.searchParams.set("returnDate", input.return);
  url.searchParams.set("adults", String(input.passengers));
  url.searchParams.set("travelClass", input.cabin);
  url.searchParams.set("currencyCode", input.currency);
  url.searchParams.set("max", String(input.max));
  if (input.nonStop) url.searchParams.set("nonStop", "true");
  if (input.budget) url.searchParams.set("maxPrice", String(input.budget));
  if (input.includedAirlineCodes.length) url.searchParams.set("includedAirlineCodes", input.includedAirlineCodes.join(","));
  if (input.excludedAirlineCodes.length) url.searchParams.set("excludedAirlineCodes", input.excludedAirlineCodes.join(","));
}

export async function searchFlightsWithAmadeus(env = {}, request = {}) {
  if (!hasEnv(env, AMADEUS_REQUIRED_ENV)) return amadeusSetupRequired();
  const input = normalizeFlightSearchInput(request);
  const validation = validateFlightSearchInput(input);
  if (!validation.ok) {
    return providerError(AMADEUS_FLIGHT_PROVIDER_ID, {
      status: 400,
      code: "invalid_flight_search_input",
      message: `Flight search requires ${validation.missing.join(", ")}.`
    }, "invalid_flight_search_input");
  }
  try {
    const token = await getAmadeusAccessToken(env);
    if (token.setupRequired) return amadeusSetupRequired();
    if (!token.ok) {
      return providerError(AMADEUS_FLIGHT_PROVIDER_ID, { status: 401, code: "authentication_failed", message: "Amadeus did not return an access token." });
    }
    const retrievedAt = nowIso();
    const url = new URL(`${baseUrl(env)}/v2/shopping/flight-offers`);
    appendSearchParams(url, input);
    const payload = await fetchJsonWithTimeout(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token.token}`
      }
    }, { timeoutMs: Number(env.AMADEUS_PROVIDER_TIMEOUT_MS || env.FLIGHT_PROVIDER_TIMEOUT_MS || 8000) });
    const items = normalizeAmadeusFlightResponse(payload, { retrievedAt, environment: env.AMADEUS_ENV || "test" });
    return providerSuccess(AMADEUS_FLIGHT_PROVIDER_ID, items, {
      endpoint: "v2/shopping/flight-offers",
      retrievedAt,
      environment: env.AMADEUS_ENV || "test",
      searchInput: { ...input, budget: input.budget ? "configured" : null }
    });
  } catch (error) {
    return providerError(AMADEUS_FLIGHT_PROVIDER_ID, error);
  }
}

export async function getFareRulesWithAmadeus(env = {}, { flightOffer } = {}) {
  if (!hasEnv(env, AMADEUS_REQUIRED_ENV)) return amadeusSetupRequired();
  if (!flightOffer || typeof flightOffer !== "object") {
    return providerError(AMADEUS_FLIGHT_PROVIDER_ID, { status: 400, code: "missing_flight_offer", message: "Fare rules require the selected provider flight offer." }, "missing_flight_offer");
  }
  try {
    const token = await getAmadeusAccessToken(env);
    if (!token.ok) return providerError(AMADEUS_FLIGHT_PROVIDER_ID, { status: 401, code: "authentication_failed", message: "Amadeus did not return an access token." });
    const retrievedAt = nowIso();
    const payload = await fetchJsonWithTimeout(`${baseUrl(env)}/v1/shopping/flight-offers/pricing?include=detailed-fare-rules`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-HTTP-Method-Override": "GET",
        Authorization: `Bearer ${token.token}`
      },
      body: JSON.stringify({ data: { type: "flight-offers-pricing", flightOffers: [flightOffer] } })
    }, { timeoutMs: Number(env.AMADEUS_PROVIDER_TIMEOUT_MS || env.FLIGHT_PROVIDER_TIMEOUT_MS || 8000) });
    return providerSuccess(AMADEUS_FLIGHT_PROVIDER_ID, [payload.data].filter(Boolean), {
      endpoint: "v1/shopping/flight-offers/pricing?include=detailed-fare-rules",
      retrievedAt,
      environment: env.AMADEUS_ENV || "test"
    });
  } catch (error) {
    return providerError(AMADEUS_FLIGHT_PROVIDER_ID, error);
  }
}

export async function amadeusFlightHealthCheck(env = {}) {
  if (!hasEnv(env, AMADEUS_REQUIRED_ENV)) return amadeusSetupRequired();
  try {
    const token = await getAmadeusAccessToken(env);
    if (!token.ok) return providerError(AMADEUS_FLIGHT_PROVIDER_ID, { status: 401, code: "authentication_failed", message: "Amadeus token request failed." });
    return providerSuccess(AMADEUS_FLIGHT_PROVIDER_ID, [{ authenticated: true, environment: env.AMADEUS_ENV || "test", tokenExpiresIn: token.expiresIn }], {
      endpoint: "v1/security/oauth2/token",
      retrievedAt: nowIso(),
      environment: env.AMADEUS_ENV || "test"
    });
  } catch (error) {
    return providerError(AMADEUS_FLIGHT_PROVIDER_ID, error);
  }
}
