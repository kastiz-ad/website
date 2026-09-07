import { ambiguousWorldDestinationMatches, normalizeResolvedDestination, resolveWorldDestination } from "./world-intelligence-engine.js";

const clean = (value) => String(value || "").normalize("NFKC").trim();
const slug = (value) => clean(value).toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
const coordinate = (value) => Number.isFinite(Number(value)) ? Number(value) : undefined;
const sourceConfidence = Object.freeze({ user_selected: 1, provider_geocoder: 0.96, verified_catalog: 0.92, geographic_lookup: 0.86, parsed_text: 0.72, fallback: 0.35 });
const sourceName = (source) => Object.hasOwn(sourceConfidence, source) ? source : "fallback";

export function destinationIdentityKey(value = {}) {
  const code = clean(value.countryCode || value.code).toUpperCase();
  const region = slug(value.region || value.state);
  const city = slug(value.city || value.name);
  const type = slug(value.destinationType || value.placeType || "city");
  if (city || code) return [type, code || "xx", region || "_", city || "_"].join(":");
  return "unresolved:xx:_:_";
}

export function createCanonicalDestinationIdentity(value = {}, options = {}) {
  const normalized = normalizeResolvedDestination(value, { ...options, allowSynthetic: false });
  const city = clean(normalized.city);
  const country = clean(normalized.country);
  const countryCode = clean(normalized.countryCode).toUpperCase();
  const destinationType = clean(value.destinationType || value.placeType || (city && city === country ? "country" : "city")) || "city";
  const source = sourceName(options.source || value.source || value.provenance?.source);
  const status = options.status || (destinationType === "country" ? "country_requires_anchor" : city ? "resolved" : "unresolved");
  const identity = {
    schemaVersion: 1,
    id: clean(value.id) || slug([city, normalized.state, countryCode || country].filter(Boolean).join("-")) || "destination-unresolved",
    key: "",
    displayName: clean(value.displayName) || [city, normalized.state, country].filter(Boolean).join(", "),
    city,
    region: clean(value.region || normalized.state),
    state: clean(normalized.state),
    country,
    countryCode,
    latitude: coordinate(normalized.latitude),
    longitude: coordinate(normalized.longitude),
    timezone: clean(value.timezone),
    destinationType,
    status,
    requiresLocalAnchor: status === "country_requires_anchor",
    confidence: Math.max(0, Math.min(1, Number(options.confidence ?? value.confidence ?? sourceConfidence[source]))),
    provenance: Object.freeze({ source, provider: clean(options.provider || value.provider), lookupId: clean(options.lookupId || value.lookupId) })
  };
  identity.key = destinationIdentityKey(identity);
  return Object.freeze(identity);
}

export function resolveCanonicalDestinationIdentity(input = "", options = {}) {
  if (options.selected) return Object.freeze({ identity: createCanonicalDestinationIdentity(options.selected, { ...options, source: "user_selected", status: "resolved", confidence: 1 }), status: "resolved", candidates: Object.freeze([]) });
  const ambiguous = ambiguousWorldDestinationMatches(input);
  if (ambiguous.length > 1) return Object.freeze({ identity: null, status: "ambiguous", candidates: Object.freeze(ambiguous.map((item) => createCanonicalDestinationIdentity(item, { source: "verified_catalog", status: "candidate" }))) });
  const resolved = options.resolved || resolveWorldDestination(input);
  if (!resolved) return Object.freeze({ identity: null, status: "unresolved", candidates: Object.freeze([]) });
  const identity = createCanonicalDestinationIdentity(resolved, { source: options.source || "verified_catalog", provider: options.provider, confidence: options.confidence });
  return Object.freeze({ identity, status: identity.status, candidates: Object.freeze([]) });
}

export function destinationIdentityFromMissionResult(result = {}) {
  if (result.destinationIdentity?.schemaVersion === 1) return createCanonicalDestinationIdentity(result.destinationIdentity, result.destinationIdentity.provenance || {});
  return createCanonicalDestinationIdentity(result.destination || {}, { source: result.destination?.source || "parsed_text", confidence: result.destination?.confidence });
}
