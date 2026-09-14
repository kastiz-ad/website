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

export const selectExactEntityMedia = (item = {}, pages = [], mission = {}) => {
  if (item.imageUrl) return { ...item, imageStatus: "exact_provider" };
  const name = String(item.label || "").trim();
  if (!name) return { ...item, imageStatus: "provider_missing" };
  const destinationLat = Number(mission?.destination?.latitude);
  const destinationLon = Number(mission?.destination?.longitude);
  const page = pages.find((candidate) => {
    if (!mediaTitleMatchesEntity(name, candidate?.title)) return false;
    const coordinates = candidate?.coordinates?.[0];
    const distance = distanceKm(destinationLat, destinationLon, coordinates?.lat, coordinates?.lon);
    return distance === null || distance <= 80;
  });
  const imageUrl = page?.original?.source || page?.thumbnail?.source || "";
  if (!imageUrl) return { ...item, imageStatus: pages.length ? "no_safe_candidate" : "provider_missing" };
  return {
    ...item,
    imageUrl,
    imageAlt: page.title || name,
    imageStatus: "exact_public_lookup",
    imageSource: "Wikipedia",
    imageSourceId: page.pageid,
    imageAttribution: `https://en.wikipedia.org/?curid=${page.pageid}`
  };
};

export const enrichNamedEntityMedia = async (items = [], mission = {}, lookup = async () => []) => {
  const output = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];
      if (item?.imageUrl) {
        output[index] = { ...item, imageStatus: "exact_provider" };
        continue;
      }
      try {
        output[index] = selectExactEntityMedia(item, await lookup(item, mission), mission);
      } catch {
        output[index] = { ...item, imageStatus: "lookup_failed" };
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
