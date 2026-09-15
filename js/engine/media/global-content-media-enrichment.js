const normalizeMediaName = (value = "") => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const meaningfulMediaTokens = (value = "") => normalizeMediaName(value)
  .split(/\s+/)
  .filter((token) => token.length > 2 && !["hotel", "hostel", "restaurant", "cafe", "the", "and"].includes(token));

export const mediaTitleMatchesEntity = (entityName = "", pageTitle = "") => {
  const entity = normalizeMediaName(entityName);
  const title = normalizeMediaName(pageTitle);
  if (!entity || !title) return false;
  if (entity === title || title.includes(entity) || entity.includes(title)) return true;
  const tokens = meaningfulMediaTokens(entityName);
  return Boolean(tokens.length) && tokens.filter((token) => title.includes(token)).length / tokens.length >= .75;
};

const distanceKm = (fromLat, fromLon, toLat, toLon) => {
  const values = [fromLat, fromLon, toLat, toLon].map(Number);
  if (!values.every(Number.isFinite)) return null;
  const [lat1, lon1, lat2, lon2] = values.map((value) => value * Math.PI / 180);
  const deltaLat = lat2 - lat1;
  const deltaLon = lon2 - lon1;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const candidateMatchesDestination = (candidate = {}, mission = {}, distance = null) => {
  if (distance !== null) return distance <= 80;
  const destination = mission?.destination || {};
  const destinationTokens = [destination.city, destination.region, destination.country]
    .flatMap((value) => meaningfulMediaTokens(value))
    .filter((token, index, tokens) => tokens.indexOf(token) === index);
  if (!destinationTokens.length) return false;
  const context = normalizeMediaName([
    candidate?.title,
    candidate?.description,
    candidate?.attribution
  ].filter(Boolean).join(" "));
  return destinationTokens.some((token) => context.includes(token));
};

const candidateMatchesEntityKind = (item = {}, candidate = {}) => {
  if (item?.kind !== "restaurant") return true;
  if (/disambiguation/i.test(String(candidate?.description || ""))) return false;
  const context = normalizeMediaName([
    candidate?.title,
    candidate?.description
  ].filter(Boolean).join(" "));
  return /\b(restaurant|restaurante|ristorante|cafe|café|bistro|brasserie|pizzeria|grill|dining|eatery|food|cuisine|kitchen|bar)\b/.test(context);
};

const pageImageCandidate = (page = {}) => {
  const imageInfo = page.imageinfo?.[0] || {};
  const url = page.original?.source || page.thumbnail?.source || imageInfo.thumburl || imageInfo.url || "";
  const mime = String(imageInfo.mime || "");
  if (!url || (mime && !mime.startsWith("image/"))) return null;
  try { if (new URL(url).protocol !== "https:") return null; } catch { return null; }
  return {
    url,
    alt: String(page.title || "").replace(/^File:/i, "").replace(/\.[a-z0-9]{2,5}$/i, ""),
    source: page.mediaSource || "Wikipedia",
    sourceId: page.pageid,
    attribution: page.attribution || `https://en.wikipedia.org/?curid=${page.pageid}`,
    imageScope: "ENTITY",
    entityLinked: Boolean(page.entityLinked),
    providerEntityId: page.providerEntityId || ""
  };
};

export const selectExactEntityMedia = (item = {}, pages = [], mission = {}) => {
  const name = String(item.label || "").trim();
  if (!name) return { ...item, imageStatus: "provider_missing" };
  const destinationLat = Number(mission?.destination?.latitude);
  const destinationLon = Number(mission?.destination?.longitude);
  const existingPages = [
    ...(item.imageUrl ? [{ title: name, original: { source: item.imageUrl }, mediaSource: item.imageSource || item.source, attribution: item.imageAttribution, entityLinked: true, providerEntityId: item.providerId }] : []),
    ...(item.images || []).map((image) => ({ title: image.alt || name, original: { source: image.url }, mediaSource: image.source || item.source, attribution: image.attribution, entityLinked: Boolean(image.entityLinked), providerEntityId: image.providerEntityId || item.providerId }))
  ];
  const diagnostics = [];
  const matches = [...existingPages, ...pages].filter((candidate) => {
    if (candidate?.entityLinked) { diagnostics.push({ title: candidate.title, accepted: true, reason: "entity_linked" }); return true; }
    if (!mediaTitleMatchesEntity(name, candidate?.title)) { diagnostics.push({ title: candidate?.title, accepted: false, reason: "entity_name_mismatch" }); return false; }
    if (!candidateMatchesEntityKind(item, candidate)) { diagnostics.push({ title: candidate?.title, accepted: false, reason: "entity_kind_mismatch" }); return false; }
    const coordinates = candidate?.coordinates?.[0];
    const distance = distanceKm(destinationLat, destinationLon, coordinates?.lat, coordinates?.lon);
    const accepted = candidateMatchesDestination(candidate, mission, distance);
    diagnostics.push({ title: candidate?.title, accepted, reason: accepted ? "validated_match" : "destination_mismatch" });
    return accepted;
  }).map(pageImageCandidate).filter(Boolean).filter((candidate, index, candidates) => candidates.findIndex((other) => other.url === candidate.url) === index);
  const image = matches[0];
  if (!image) return { ...item, images: [], imageStatus: "NO_SAFE_IMAGE", imageDiagnostics: { rawCandidates: existingPages.length + pages.length, candidates: diagnostics } };
  return {
    ...item,
    imageUrl: image.url,
    imageAlt: image.alt || name,
    images: matches,
    imageStatus: "EXACT_LOADED",
    imageSource: image.source,
    imageSourceId: image.sourceId,
    imageAttribution: image.attribution,
    imageDiagnostics: { rawCandidates: existingPages.length + pages.length, acceptedCandidates: matches.length, candidates: diagnostics }
  };
};

export const enrichNamedEntityMedia = async (items = [], mission = {}, lookup = async () => []) => {
  const output = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];
      try {
        output[index] = selectExactEntityMedia(item, await lookup(item, mission), mission);
      } catch {
        output[index] = { ...item, images: [], imageStatus: "SOURCE_BLOCKED" };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, items.length) }, () => worker()));
  return output;
};

export const summarizeMediaEnrichment = (items = []) => items.reduce((summary, item) => {
  const status = item.imageStatus || "not_attempted";
  summary[status] = (summary[status] || 0) + 1;
  return summary;
}, {});
