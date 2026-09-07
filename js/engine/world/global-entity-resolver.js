import { createCanonicalDestinationIdentity } from "./canonical-destination-identity.js";

const clean = (value) => String(value || "").normalize("NFKC").trim();
const normalized = (value) => clean(value).toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const coordinate = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const providerSources = /openstreetmap|nominatim|google places|provider/i;
const curatedSources = /verified[_ -]?curated|curated[_ -]?verified/i;

const distanceKm = (first, second) => {
  const values = [first?.latitude, first?.longitude, second?.latitude, second?.longitude].map(coordinate);
  if (values.some((value) => value === null)) return null;
  const [aLat, aLon, bLat, bLon] = values;
  const radians = (degrees) => degrees * Math.PI / 180;
  const deltaLat = radians(bLat - aLat);
  const deltaLon = radians(bLon - aLon);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const localeText = (locale, en, ko, es, fr) => locale === "ko" ? ko : locale === "es" ? es : locale === "fr" ? fr : en;
const categoryLabel = (kind, category, identity, locale) => {
  const city = identity.displayName || identity.city;
  if (kind === "restaurant") return localeText(locale, `Search for ${category || "restaurants"} in ${city}`, `${city}의 ${category || "레스토랑"} 검색`, `Buscar ${category || "restaurantes"} en ${city}`, `Rechercher ${category || "des restaurants"} à ${city}`);
  return localeText(locale, `Search for ${category || "local attractions"} in ${city}`, `${city}의 ${category || "현지 명소"} 검색`, `Buscar ${category || "atracciones locales"} en ${city}`, `Rechercher ${category || "des sites locaux"} à ${city}`);
};

export const ENTITY_TYPES = Object.freeze({ restaurant: "RESTAURANT", exactPoi: "EXACT_POI", neighborhood: "NEIGHBORHOOD", nearbyExcursion: "NEARBY_EXCURSION", genericActivity: "GENERIC_ACTIVITY" });

export function createEntitySearchFallback({ identity, kind = "place", category = "", locale = "en", reason = "provider_data_unavailable" } = {}) {
  const canonical = createCanonicalDestinationIdentity(identity || {}, identity?.provenance || {});
  if (canonical.status !== "resolved" || canonical.requiresLocalAnchor) return null;
  const name = categoryLabel(kind, clean(category), canonical, locale);
  return Object.freeze({
    id: `search:${canonical.key}:${kind}:${normalized(category || "general").replaceAll(" ", "-")}`,
    name, label: name, kind, entityType: ENTITY_TYPES.genericActivity, namedEntity: false,
    destinationIdentity: canonical, destinationKey: canonical.key,
    provenance: Object.freeze({ source: "generic_fallback", provider: "", reason }),
    sourceState: "generic_fallback", evidenceLevel: "category_only", confidence: 0.3,
    providerHandoff: Object.freeze({ type: "search", query: [category || (kind === "restaurant" ? "restaurants" : "attractions"), canonical.displayName].filter(Boolean).join(" ") }),
    image: null
  });
}

const localityStatus = (candidate, identity) => {
  const candidateCode = clean(candidate.countryCode || candidate.destination?.countryCode).toUpperCase();
  if (candidateCode && identity.countryCode && candidateCode !== identity.countryCode) return "conflict";
  const candidateCity = normalized(candidate.city || candidate.locality || candidate.destination?.city);
  if (candidateCity && identity.city && candidateCity !== normalized(identity.city)) return "conflict";
  const distance = distanceKm(candidate, identity);
  if (distance !== null) return distance <= 35 ? "exact" : distance <= 160 ? "nearby" : "conflict";
  if (candidate.geographicVerified && (candidateCity || candidateCode)) return "exact";
  return "unverified";
};

const evidence = (candidate, locality) => {
  const source = clean(candidate.source || candidate.provider || candidate.providerSource);
  if (providerSources.test(source) && locality === "exact") return { source: "provider", level: "provider_entity", confidence: 0.94 };
  if (providerSources.test(source) && locality === "nearby") return { source: "provider", level: "provider_nearby_entity", confidence: 0.82 };
  if (curatedSources.test(source) && locality === "exact") return { source: "verified_curated_override", level: "verified_curated", confidence: 0.9 };
  if (curatedSources.test(source) && locality === "nearby") return { source: "verified_curated_override", level: "verified_curated_nearby", confidence: 0.78 };
  if (locality === "exact" && candidate.geographicVerified) return { source: "geographic_lookup", level: "location_confirmed", confidence: 0.78 };
  return null;
};

const entityKey = (candidate) => {
  const providerId = clean(candidate.providerId || candidate.entityId || candidate.osmId);
  if (providerId) return `provider:${normalized(candidate.source || candidate.provider)}:${providerId}`;
  const lat = coordinate(candidate.latitude); const lon = coordinate(candidate.longitude);
  if (lat !== null && lon !== null) return `geo:${normalized(candidate.name || candidate.label)}:${lat.toFixed(4)}:${lon.toFixed(4)}`;
  return `name:${normalized(candidate.address || candidate.locality)}:${normalized(candidate.name || candidate.label)}`;
};

export function resolveDestinationEntities({ identity, candidates = [], kind = "place", category = "", locale = "en", includeFallback = true } = {}) {
  const canonical = createCanonicalDestinationIdentity(identity || {}, identity?.provenance || {});
  if (canonical.status !== "resolved" || canonical.requiresLocalAnchor) return Object.freeze({ status: canonical.status, identity: canonical, entities: Object.freeze([]), rejected: Object.freeze(candidates.map((candidate) => ({ candidate, reason: "destination_not_resolved" }))) });
  const rejected = [];
  const accepted = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const name = clean(candidate.name || candidate.label || candidate.venueName);
    if (!name) { rejected.push({ candidate, reason: "missing_name" }); continue; }
    const locality = localityStatus(candidate, canonical);
    const proof = evidence(candidate, locality);
    if (locality === "conflict" || !proof) { rejected.push({ candidate, reason: locality === "conflict" ? "destination_conflict" : "insufficient_entity_evidence" }); continue; }
    const key = entityKey(candidate);
    if (seen.has(key)) { rejected.push({ candidate, reason: "duplicate" }); continue; }
    seen.add(key);
    const nearby = locality === "nearby";
    accepted.push(Object.freeze({ ...candidate, id: clean(candidate.id) || key, name, label: name, kind, entityType: kind === "restaurant" ? ENTITY_TYPES.restaurant : nearby ? ENTITY_TYPES.nearbyExcursion : candidate.entityType || (/neighbou?rhood|district|quarter/i.test(candidate.value || candidate.category) ? ENTITY_TYPES.neighborhood : ENTITY_TYPES.exactPoi), namedEntity: true, destinationIdentity: canonical, destinationKey: canonical.key, actualLocality: clean(candidate.city || candidate.locality), relationshipToDestination: nearby ? "nearby_excursion" : "inside_destination", provenance: Object.freeze({ source: proof.source, provider: clean(candidate.source || candidate.provider), providerId: clean(candidate.providerId || candidate.entityId || candidate.osmId) }), sourceState: proof.source, evidenceLevel: proof.level, confidence: proof.confidence, image: candidate.image || (candidate.imageUrl ? { url: candidate.imageUrl, alt: candidate.imageAlt || name, evidence: "entity_source" } : null) }));
  }
  if (!accepted.length && includeFallback) {
    const fallback = createEntitySearchFallback({ identity: canonical, kind, category, locale });
    if (fallback) accepted.push(fallback);
  }
  return Object.freeze({ status: accepted.some((item) => item.namedEntity) ? "resolved" : "fallback", identity: canonical, entities: Object.freeze(accepted), rejected: Object.freeze(rejected) });
}
