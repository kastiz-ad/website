const clean = (value) => String(value || "").normalize("NFKC").trim();
const normalized = (value) => clean(value).toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\([^)]*\)/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const coordinate = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

export const IMAGE_SCOPES = Object.freeze({ exactEntity: "EXACT_ENTITY", localArea: "LOCAL_AREA", destination: "DESTINATION", categoryContext: "CATEGORY_CONTEXT", none: "NONE" });

const distanceKm = (first, second) => {
  const values = [first?.latitude, first?.longitude, second?.latitude, second?.longitude].map(coordinate);
  if (values.some((value) => value === null)) return null;
  const [aLat, aLon, bLat, bLon] = values; const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(bLat - aLat); const dLon = radians(bLon - aLon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const imageCacheKey = ({ destinationKey = "", entityKey = "", scope = IMAGE_SCOPES.none } = {}) => `image:${destinationKey || "unresolved"}:${entityKey || "context"}:${scope}`;

const geographicMatch = (candidate, entity, destination) => {
  if (candidate.destinationKey && destination.key && candidate.destinationKey !== destination.key) return false;
  const code = clean(candidate.countryCode).toUpperCase();
  if (code && destination.countryCode && code !== destination.countryCode) return false;
  const distance = distanceKm(candidate, entity) ?? distanceKm(candidate, destination);
  return distance === null || distance <= (entity.entityType === "NEARBY_EXCURSION" ? 35 : 45);
};

const exactEntityMatch = (candidate, entity) => {
  const candidateId = clean(candidate.entityId || candidate.providerEntityId);
  const entityId = clean(entity.providerId || entity.provenance?.providerId || entity.id);
  if (candidateId && entityId) return candidateId === entityId;
  const candidateName = normalized(candidate.entityName || candidate.matchedEntity || candidate.alt);
  const entityName = normalized(entity.name || entity.label);
  return Boolean(candidateName && entityName && candidateName === entityName);
};

const scopeFor = (candidate, entity, destination) => {
  if (!candidate?.url || !geographicMatch(candidate, entity, destination)) return IMAGE_SCOPES.none;
  if (exactEntityMatch(candidate, entity)) return IMAGE_SCOPES.exactEntity;
  if (entity.entityType === "NEIGHBORHOOD" && normalized(candidate.locality || candidate.areaName) === normalized(entity.name)) return IMAGE_SCOPES.localArea;
  if (!entity.namedEntity && candidate.destinationKey === destination.key && candidate.category && normalized(candidate.category) === normalized(entity.category || entity.kind)) return IMAGE_SCOPES.categoryContext;
  if (!entity.namedEntity && candidate.destinationKey === destination.key) return IMAGE_SCOPES.destination;
  return IMAGE_SCOPES.none;
};

export function resolveEntityImage({ entity = {}, destination = entity.destinationIdentity || {}, candidates = [], usedImageIds = [] } = {}) {
  const used = new Set(usedImageIds);
  const ranked = candidates.map((candidate) => {
    const scope = scopeFor(candidate, entity, destination);
    const score = { EXACT_ENTITY: 5, LOCAL_AREA: 4, DESTINATION: 3, CATEGORY_CONTEXT: 2, NONE: 0 }[scope];
    return { candidate, scope, score, used: used.has(candidate.id || candidate.url) };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || Number(a.used) - Number(b.used));
  const selected = ranked[0];
  if (!selected) return Object.freeze({ image: null, imageScope: IMAGE_SCOPES.none, confidence: 0, cacheKey: imageCacheKey({ destinationKey: destination.key, entityKey: entity.id, scope: IMAGE_SCOPES.none }), rejected: candidates.length });
  const image = Object.freeze({ url: selected.candidate.url, alt: clean(selected.candidate.alt || entity.name), id: clean(selected.candidate.id || selected.candidate.url), imageScope: selected.scope, confidence: { EXACT_ENTITY: .96, LOCAL_AREA: .85, DESTINATION: .7, CATEGORY_CONTEXT: .55 }[selected.scope], provenance: Object.freeze({ source: clean(selected.candidate.source), sourceId: clean(selected.candidate.sourceId || selected.candidate.id), query: clean(selected.candidate.query), attribution: clean(selected.candidate.attribution), license: clean(selected.candidate.license), matchedEntity: clean(selected.candidate.entityName || selected.candidate.matchedEntity), matchedDestination: clean(selected.candidate.destinationKey), geographicEvidence: Boolean(selected.candidate.destinationKey || coordinate(selected.candidate.latitude) !== null) }) });
  return Object.freeze({ image, imageScope: selected.scope, confidence: image.confidence, cacheKey: imageCacheKey({ destinationKey: destination.key, entityKey: entity.id, scope: selected.scope }), rejected: candidates.length - ranked.length });
}

export function preserveResolvedImage(entity = {}) {
  const image = entity.image;
  if (!image?.url || !image.imageScope || image.imageScope === IMAGE_SCOPES.none) return { ...entity, image: null, imageScope: IMAGE_SCOPES.none };
  return { ...entity, image: { ...image }, imageScope: image.imageScope, imageCacheKey: imageCacheKey({ destinationKey: entity.destinationKey, entityKey: entity.id, scope: image.imageScope }) };
}
