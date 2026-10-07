const clean = (value) => String(value || "").normalize("NFKC").trim();
const normalized = (value) => clean(value).toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const numeric = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

const distanceKm = (first, second) => {
  const values = [first?.latitude ?? first?.lat, first?.longitude ?? first?.lng, second?.latitude ?? second?.lat, second?.longitude ?? second?.lng].map(numeric);
  if (values.some((value) => value === null)) return null;
  const [aLat, aLon, bLat, bLon] = values;
  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(bLat - aLat); const dLon = radians(bLon - aLon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const componentText = (place, type) => (place.addressComponents || [])
  .filter((component) => (component.types || []).includes(type))
  .flatMap((component) => [component.longText, component.shortText])
  .map(normalized).filter(Boolean);

export function validateGooglePlaceForDestination(place = {}, identity = {}, kind = "restaurant") {
  const placeId = clean(place.providerPlaceId || place.id);
  if (!placeId || !clean(place.name) || !place.coordinates) return { accepted: false, reason: "missing_identity_evidence" };
  const types = new Set((place.categories || []).map(normalized));
  const allowedTypes = kind === "hotel" ? ["lodging", "hotel", "resort hotel", "motel", "hostel"] : ["restaurant", "cafe", "meal takeaway", "meal delivery"];
  if (!allowedTypes.some((type) => types.has(type))) return { accepted: false, reason: "entity_type_conflict" };
  const distance = distanceKm(place.coordinates, identity);
  if (distance === null || distance > 35) return { accepted: false, reason: "destination_coordinate_conflict" };
  const expectedCountry = normalized(identity.countryCode);
  const countryEvidence = [...componentText(place, "country"), normalized(place.address)];
  if (expectedCountry && countryEvidence.length && !countryEvidence.some((value) => value === expectedCountry || value.includes(expectedCountry))) {
    const address = normalized(place.address);
    const countryName = normalized(identity.country);
    if (countryName && !address.includes(countryName)) return { accepted: false, reason: "destination_country_conflict" };
  }
  return { accepted: true, distanceKm: distance };
}

export function googlePlaceToDestinationEntity(place = {}, identity = {}, kind = "restaurant") {
  const validation = validateGooglePlaceForDestination(place, identity, kind);
  if (!validation.accepted) return { entity: null, rejection: validation.reason };
  const placeId = clean(place.providerPlaceId || place.id);
  const photo = (place.photos || [])[0];
  const imageUrl = photo?.name ? `/api/v1/providers/google/photo?name=${encodeURIComponent(photo.name)}&maxWidthPx=1200` : "";
  return {
    entity: {
      id: `google:${placeId}`, providerId: placeId, providerPlaceId: placeId,
      name: clean(place.name), label: clean(place.name), kind,
      address: clean(place.address), latitude: numeric(place.coordinates?.lat), longitude: numeric(place.coordinates?.lng),
      city: identity.city, countryCode: identity.countryCode, geographicVerified: true,
      source: "Google Places", provider: "google-places", sourceState: "verified_live",
      customerRating: numeric(place.rating), customerRatingCount: numeric(place.ratingCount),
      rating: numeric(place.rating), ratingCount: numeric(place.ratingCount), categories: place.categories || [],
      imageUrl, imageAlt: imageUrl ? clean(place.name) : "", imageSource: imageUrl ? "Google Places" : "",
      photoReference: photo?.name || "",
      providerEvidence: place.providerEvidence || { provider: "google-places", placeId, dataState: "verified_live" }
    },
    rejection: null
  };
}

const missionRequests = new Map();
const requestKey = (identity, language) => `${identity.key || identity.destinationKey}:${language}`;
const identityKey = (value = {}) => {
  const city = normalized(value.city || value.name).replaceAll(" ", "-") || "_";
  const code = clean(value.countryCode).toUpperCase() || "XX";
  return `city:${code}:_:${city}`;
};
const countryCodeFromPlace = (place = {}) => clean((place.addressComponents || []).find((component) => (component.types || []).includes("country"))?.shortText).toUpperCase();

export async function fetchGoogleTravelEntityEnrichment(identity = {}, { language = "en", fetcher = fetch, maxPerKind = 8 } = {}) {
  if (!identity?.key && !identity?.city && !identity?.displayName) return { status: "skipped", restaurants: [], hotels: [], rejected: [] };
  const key = requestKey(identity, language);
  if (missionRequests.has(key)) return missionRequests.get(key);
  const run = (async () => {
    let resolvedIdentity = { ...identity };
    if (!Number.isFinite(Number(resolvedIdentity.latitude)) || !Number.isFinite(Number(resolvedIdentity.longitude))) {
      const destinationResponse = await fetcher("/api/v1/providers/google/places", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textQuery: clean(identity.displayName || identity.city), includedType: "locality", strictTypeFiltering: true, languageCode: language, maxResultCount: 1 })
      });
      if (!destinationResponse.ok) throw new Error(`google_destination_http_${destinationResponse.status}`);
      const destinationPayload = await destinationResponse.json();
      const destination = destinationPayload.ok ? destinationPayload.items?.[0] : null;
      if (!destination?.coordinates || !clean(destination.name)) return { status: "unresolved", provider: "google-places", restaurants: [], hotels: [], rejected: [{ kind: "destination", reason: "canonical_destination_unresolved" }] };
      resolvedIdentity = {
        ...resolvedIdentity,
        city: clean(destination.name), displayName: clean(destination.address || destination.name),
        countryCode: countryCodeFromPlace(destination) || resolvedIdentity.countryCode,
        latitude: numeric(destination.coordinates.lat), longitude: numeric(destination.coordinates.lng),
        provenance: { source: "provider_geocoder", provider: "google-places", lookupId: destination.providerPlaceId || destination.id || "" }
      };
      resolvedIdentity.key = identityKey(resolvedIdentity);
    }
    const search = async (kind) => {
      const response = await fetcher("/api/v1/providers/google/places", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textQuery: `${kind === "hotel" ? "hotels" : "restaurants"} in ${resolvedIdentity.displayName || resolvedIdentity.city}`,
          includedType: kind === "hotel" ? "lodging" : "restaurant", strictTypeFiltering: true,
          languageCode: language, maxResultCount: Math.min(Math.max(maxPerKind, 1), 8),
          locationBias: { lat: resolvedIdentity.latitude, lng: resolvedIdentity.longitude, radiusMeters: 18000 }
        })
      });
      if (!response.ok) throw new Error(`google_places_http_${response.status}`);
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.error?.code || "google_places_request_failed");
      return payload.items || [];
    };
    const [restaurantPlaces, hotelPlaces] = await Promise.all([search("restaurant"), search("hotel")]);
    const rejected = [];
    const convert = (items, kind) => items.map((item) => googlePlaceToDestinationEntity(item, resolvedIdentity, kind)).flatMap((result) => {
      if (result.entity) return [result.entity];
      rejected.push({ providerPlaceId: item.providerPlaceId || item.id || "", kind, reason: result.rejection });
      return [];
    });
    return { status: "verified_live", provider: "google-places", identity: resolvedIdentity, restaurants: convert(restaurantPlaces, "restaurant"), hotels: convert(hotelPlaces, "hotel"), rejected };
  })().catch((error) => ({ status: "unavailable", error: String(error?.message || error), restaurants: [], hotels: [], rejected: [] }));
  missionRequests.set(key, run);
  return run;
}

export function clearGoogleTravelEntityRequestCache() { missionRequests.clear(); }
