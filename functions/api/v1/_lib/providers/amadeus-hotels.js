import {
  DATA_STATES,
  fetchJsonWithTimeout,
  hasEnv,
  providerError,
  providerSuccess,
  setupRequired
} from "./provider-contracts.js";

export const AMADEUS_HOTEL_PROVIDER_ID = "amadeus-hotel-offers";
export const AMADEUS_HOTEL_SEARCH_VERSION = "20260730-live-hotel-intelligence-v1";
export const AMADEUS_HOTEL_REQUIRED_ENV = Object.freeze(["AMADEUS_CLIENT_ID", "AMADEUS_CLIENT_SECRET"]);

const text = (value) => String(value ?? "").trim();
const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const numberOrNull = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const nowIso = () => new Date().toISOString();
const baseUrl = (env = {}) => String(env.AMADEUS_ENV || env.HOTEL_PROVIDER_ENV || "test").toLowerCase() === "production"
  ? "https://api.amadeus.com"
  : "https://test.api.amadeus.com";

const hotelSetupRequired = () => setupRequired(
  AMADEUS_HOTEL_PROVIDER_ID,
  AMADEUS_HOTEL_REQUIRED_ENV,
  "Amadeus hotel credentials are required before ONE can search live hotel inventory."
);

async function getAmadeusAccessToken(env = {}) {
  if (!hasEnv(env, AMADEUS_HOTEL_REQUIRED_ENV)) return { ok: false, setupRequired: true };
  const payload = new URLSearchParams();
  payload.set("grant_type", "client_credentials");
  payload.set("client_id", env.AMADEUS_CLIENT_ID);
  payload.set("client_secret", env.AMADEUS_CLIENT_SECRET);
  const data = await fetchJsonWithTimeout(`${baseUrl(env)}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString()
  }, { timeoutMs: Number(env.AMADEUS_PROVIDER_TIMEOUT_MS || env.HOTEL_PROVIDER_TIMEOUT_MS || 8000) });
  return { ok: Boolean(data?.access_token), token: data?.access_token || "", expiresIn: data?.expires_in || null };
}

export function normalizeHotelSearchInput(request = {}) {
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
    radiusUnit: text(request.radiusUnit || "KM").toUpperCase(),
    amenities: asArray(request.amenities).map((item) => text(item).toUpperCase()).filter(Boolean),
    ratings: asArray(request.ratings || request.stars).map((item) => String(item).replace(/\D/g, "")).filter(Boolean),
    hotelSource: text(request.hotelSource || "ALL").toUpperCase(),
    max: Math.min(Math.max(Number.parseInt(request.max || request.limit || 20, 10) || 20, 1), 50),
    filters: request.filters || {},
    missionContext: request.missionContext || {}
  };
}

export function validateHotelSearchInput(input = {}) {
  const missing = [];
  if (!input.hotelIds.length && !/^[A-Z]{3}$/.test(input.cityCode || "") && !(input.latitude !== null && input.longitude !== null)) {
    missing.push("city_code_or_coordinates_or_hotel_ids");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.checkInDate || "")) missing.push("check_in_date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.checkOutDate || "")) missing.push("check_out_date");
  return { ok: missing.length === 0, missing };
}

export function normalizeAmadeusHotelListItem(item = {}, { retrievedAt = nowIso(), environment = "test" } = {}) {
  return {
    provider: AMADEUS_HOTEL_PROVIDER_ID,
    providerHotelId: item.hotelId || item.hotelIds || item.iataCode || "",
    name: item.name || "",
    property: item.name || "",
    cityCode: item.iataCode || item.address?.cityCode || "",
    chainCode: item.chainCode || "",
    brandCode: item.brandCode || "",
    coordinates: item.geoCode ? { lat: numberOrNull(item.geoCode.latitude), lng: numberOrNull(item.geoCode.longitude) } : null,
    address: [item.address?.lines?.join(" "), item.address?.postalCode, item.address?.cityName, item.address?.countryCode].filter(Boolean).join(", "),
    timeZone: item.timeZoneName || null,
    sourceRetrievedAt: retrievedAt,
    providerEvidence: {
      provider: AMADEUS_HOTEL_PROVIDER_ID,
      dataState: DATA_STATES.VERIFIED_LIVE,
      endpoint: "v1/reference-data/locations/hotels",
      providerResponseIdentifier: item.hotelId || null,
      retrievedAt,
      environment,
      source: "Amadeus Hotel List"
    }
  };
}

const nightsBetween = (checkInDate, checkOutDate) => {
  const start = new Date(`${checkInDate}T00:00:00Z`).getTime();
  const end = new Date(`${checkOutDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.round((end - start) / 86400000);
};

const normalizeTaxes = (taxes = []) => asArray(taxes).map((tax) => ({
  code: tax.code || "",
  pricingFrequency: tax.pricingFrequency || null,
  pricingMode: tax.pricingMode || null,
  amount: numberOrNull(tax.amount),
  currency: tax.currency || null,
  included: typeof tax.included === "boolean" ? tax.included : null
}));

const cancellationFrom = (offer = {}) => {
  const cancellation = offer.policies?.cancellations?.[0] || offer.policies?.cancellation || null;
  if (!cancellation) return { status: "unknown", description: "Cancellation policy unavailable from provider response." };
  return {
    status: cancellation.type || "provider_policy",
    deadline: cancellation.deadline || null,
    amount: cancellation.amount || null,
    description: cancellation.description?.text || cancellation.description || "Provider cancellation policy returned."
  };
};

const roomTypeFrom = (offer = {}) => {
  const description = `${offer.room?.typeEstimated?.category || ""} ${offer.room?.typeEstimated?.bedType || ""} ${offer.room?.description?.text || ""}`.toLowerCase();
  if (/suite/.test(description)) return "suite";
  if (/family|quad/.test(description)) return "family";
  if (/twin/.test(description)) return "twin";
  if (/double|queen|king/.test(description)) return "double";
  if (/single/.test(description)) return "single";
  return "unknown";
};

export function normalizeAmadeusHotelOffer(item = {}, { retrievedAt = nowIso(), environment = "test" } = {}) {
  const hotel = item.hotel || {};
  const offer = asArray(item.offers)[0] || {};
  const price = offer.price || {};
  const currency = price.currency || "KRW";
  const total = numberOrNull(price.total || price.sellingTotal);
  const base = numberOrNull(price.base);
  const taxes = normalizeTaxes(price.taxes);
  const nights = nightsBetween(offer.checkInDate, offer.checkOutDate);
  const nightly = total !== null && nights ? Math.round((total / nights) * 100) / 100 : null;
  const availability = offer.id ? "available" : "unknown";
  return {
    provider: AMADEUS_HOTEL_PROVIDER_ID,
    providerHotelId: hotel.hotelId || "",
    providerOfferId: offer.id || "",
    name: hotel.name || "Unnamed property",
    property: hotel.name || "Unnamed property",
    cityCode: hotel.cityCode || "",
    coordinates: hotel.geoCode ? { lat: numberOrNull(hotel.geoCode.latitude), lng: numberOrNull(hotel.geoCode.longitude) } : null,
    checkInDate: offer.checkInDate || null,
    checkOutDate: offer.checkOutDate || null,
    roomType: roomTypeFrom(offer),
    roomDescription: offer.room?.description?.text || "",
    roomQuantity: offer.roomQuantity ?? null,
    adults: offer.guests?.adults ?? null,
    boardType: offer.boardType || null,
    availability,
    available: availability === "available",
    price: {
      currency,
      nightly,
      total,
      base,
      taxes,
      fees: asArray(price.fees).map((fee) => ({ type: fee.type || "", amount: numberOrNull(fee.amount), currency: fee.currency || currency })),
      variations: price.variations || null
    },
    cancellation: cancellationFrom(offer),
    paymentPolicy: offer.policies?.paymentType || offer.policies?.guarantee?.acceptedPayments || null,
    lastProviderCheck: retrievedAt,
    sourceRetrievedAt: retrievedAt,
    providerEvidence: {
      provider: AMADEUS_HOTEL_PROVIDER_ID,
      dataState: DATA_STATES.VERIFIED_LIVE,
      endpoint: "v3/shopping/hotel-offers",
      providerResponseIdentifier: offer.id || hotel.hotelId || null,
      retrievedAt,
      environment,
      source: "Amadeus Hotel Search V3",
      limitations: [
        "Availability and prices may change before booking.",
        "ONE does not create hotel reservations in this milestone."
      ]
    }
  };
}

export function normalizeAmadeusHotelListResponse(payload = {}, options = {}) {
  return asArray(payload.data).map((item) => normalizeAmadeusHotelListItem(item, options));
}

export function normalizeAmadeusHotelOfferResponse(payload = {}, options = {}) {
  return asArray(payload.data).map((item) => normalizeAmadeusHotelOffer(item, options));
}

async function amadeusGet(env = {}, path, params = {}) {
  const token = await getAmadeusAccessToken(env);
  if (token.setupRequired) return { setupRequired: true };
  if (!token.ok) throw Object.assign(new Error("Amadeus authentication failed."), { status: 401, code: "authentication_failed" });
  const url = new URL(`${baseUrl(env)}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") url.searchParams.set(key, String(value));
  });
  return fetchJsonWithTimeout(url.toString(), {
    headers: { Accept: "application/json", Authorization: `Bearer ${token.token}` }
  }, { timeoutMs: Number(env.AMADEUS_PROVIDER_TIMEOUT_MS || env.HOTEL_PROVIDER_TIMEOUT_MS || 8000) });
}

export async function listHotelsWithAmadeus(env = {}, request = {}) {
  if (!hasEnv(env, AMADEUS_HOTEL_REQUIRED_ENV)) return hotelSetupRequired();
  const input = normalizeHotelSearchInput(request);
  try {
    const retrievedAt = nowIso();
    const params = {
      radius: input.radius,
      radiusUnit: input.radiusUnit,
      amenities: input.amenities.join(","),
      ratings: input.ratings.join(","),
      hotelSource: input.hotelSource
    };
    let payload;
    let endpoint;
    if (input.hotelIds.length) {
      endpoint = "/v1/reference-data/locations/hotels/by-hotels";
      payload = await amadeusGet(env, endpoint, { hotelIds: input.hotelIds.join(",") });
    } else if (input.latitude !== null && input.longitude !== null) {
      endpoint = "/v1/reference-data/locations/hotels/by-geocode";
      payload = await amadeusGet(env, endpoint, { latitude: input.latitude, longitude: input.longitude, ...params });
    } else {
      endpoint = "/v1/reference-data/locations/hotels/by-city";
      payload = await amadeusGet(env, endpoint, { cityCode: input.cityCode, ...params });
    }
    if (payload.setupRequired) return hotelSetupRequired();
    const items = normalizeAmadeusHotelListResponse(payload, { retrievedAt, environment: env.AMADEUS_ENV || "test" }).slice(0, input.max);
    return providerSuccess(AMADEUS_HOTEL_PROVIDER_ID, items, { endpoint, retrievedAt, environment: env.AMADEUS_ENV || "test" });
  } catch (error) {
    return providerError(AMADEUS_HOTEL_PROVIDER_ID, error);
  }
}

export async function searchHotelOffersWithAmadeus(env = {}, request = {}) {
  if (!hasEnv(env, AMADEUS_HOTEL_REQUIRED_ENV)) return hotelSetupRequired();
  const input = normalizeHotelSearchInput(request);
  const validation = validateHotelSearchInput(input);
  if (!validation.ok) {
    return providerError(AMADEUS_HOTEL_PROVIDER_ID, {
      status: 400,
      code: "invalid_hotel_search_input",
      message: `Hotel search requires ${validation.missing.join(", ")}.`
    }, "invalid_hotel_search_input");
  }
  try {
    const retrievedAt = nowIso();
    let hotelIds = input.hotelIds;
    if (!hotelIds.length) {
      const list = await listHotelsWithAmadeus(env, input);
      if (!list.ok) return list;
      hotelIds = asArray(list.items).map((item) => item.providerHotelId).filter(Boolean).slice(0, input.max);
      if (!hotelIds.length) return providerSuccess(AMADEUS_HOTEL_PROVIDER_ID, [], { endpoint: "v1/reference-data/locations/hotels", retrievedAt, environment: env.AMADEUS_ENV || "test" });
    }
    const payload = await amadeusGet(env, "/v3/shopping/hotel-offers", {
      hotelIds: hotelIds.join(","),
      adults: input.adults,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      roomQuantity: input.roomQuantity,
      currency: input.currency
    });
    if (payload.setupRequired) return hotelSetupRequired();
    const items = normalizeAmadeusHotelOfferResponse(payload, { retrievedAt, environment: env.AMADEUS_ENV || "test" });
    return providerSuccess(AMADEUS_HOTEL_PROVIDER_ID, items, {
      endpoint: "v3/shopping/hotel-offers",
      retrievedAt,
      environment: env.AMADEUS_ENV || "test",
      requestedHotelCount: hotelIds.length
    });
  } catch (error) {
    return providerError(AMADEUS_HOTEL_PROVIDER_ID, error);
  }
}

export async function getHotelOfferWithAmadeus(env = {}, { offerId } = {}) {
  if (!hasEnv(env, AMADEUS_HOTEL_REQUIRED_ENV)) return hotelSetupRequired();
  const id = text(offerId);
  if (!id) return providerError(AMADEUS_HOTEL_PROVIDER_ID, { status: 400, code: "missing_offer_id", message: "Offer ID is required." }, "missing_offer_id");
  try {
    const retrievedAt = nowIso();
    const payload = await amadeusGet(env, `/v3/shopping/hotel-offers/${encodeURIComponent(id)}`);
    if (payload.setupRequired) return hotelSetupRequired();
    const items = normalizeAmadeusHotelOfferResponse({ data: [payload.data].filter(Boolean) }, { retrievedAt, environment: env.AMADEUS_ENV || "test" });
    return providerSuccess(AMADEUS_HOTEL_PROVIDER_ID, items, { endpoint: "v3/shopping/hotel-offers/{offerId}", retrievedAt, environment: env.AMADEUS_ENV || "test" });
  } catch (error) {
    return providerError(AMADEUS_HOTEL_PROVIDER_ID, error);
  }
}

export async function amadeusHotelHealthCheck(env = {}) {
  if (!hasEnv(env, AMADEUS_HOTEL_REQUIRED_ENV)) return hotelSetupRequired();
  try {
    const token = await getAmadeusAccessToken(env);
    if (!token.ok) return providerError(AMADEUS_HOTEL_PROVIDER_ID, { status: 401, code: "authentication_failed", message: "Amadeus token request failed." });
    return providerSuccess(AMADEUS_HOTEL_PROVIDER_ID, [{ authenticated: true, environment: env.AMADEUS_ENV || "test", tokenExpiresIn: token.expiresIn }], {
      endpoint: "v1/security/oauth2/token",
      retrievedAt: nowIso(),
      environment: env.AMADEUS_ENV || "test"
    });
  } catch (error) {
    return providerError(AMADEUS_HOTEL_PROVIDER_ID, error);
  }
}
