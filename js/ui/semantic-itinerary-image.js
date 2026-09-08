const STOP_WORDS = new Set(["and", "the", "with", "from", "day", "walk", "route", "tokyo", "japan", "도쿄", "일본"]);

const tokens = (value = "") => String(value).normalize("NFKC").toLocaleLowerCase("en")
  .split(/[^\p{L}\p{N}]+/u)
  .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

const imageFor = (item) => item?.image?.url ? item.image : item?.imageUrl ? { url: item.imageUrl, alt: item.imageAlt || item.name } : null;
const imageIdentity = (image = {}) => {
  try {
    const parsed = new URL(image.url);
    ["w", "width", "h", "height", "q", "quality", "fit", "crop", "auto"].forEach((key) => parsed.searchParams.delete(key));
    return `${parsed.hostname.toLocaleLowerCase()}${parsed.pathname.replace(/\/+$/, "")}`;
  } catch { return String(image?.url || "").toLocaleLowerCase(); }
};

const imagesFor = (item) => {
  const primary = imageFor(item);
  const alternates = Array.isArray(item?.images) ? item.images : Array.isArray(item?.image?.alternates) ? item.image.alternates : [];
  return [primary, ...alternates].filter((image) => image?.url);
};

const requiredTokenMatch = (placeTokens) => Math.max(1, Math.ceil(new Set(placeTokens).size * 0.5));

export const resolveSemanticItineraryImages = (days = [], places = [], destinationFallback = null, options = {}) => {
  const used = new Set((options.usedImageUrls || []).map((value) => imageIdentity({ url: value })));
  const fallbacks = (Array.isArray(destinationFallback) ? destinationFallback : [destinationFallback]).filter((image) => image?.url);
  return days.map((day) => {
    const slotText = (day?.slots || []).map((slot) => Array.isArray(slot) ? slot.join(" ") : Object.values(slot || {}).join(" "));
    const dayTokens = new Set(tokens([day?.title, day?.theme, ...slotText].filter(Boolean).join(" ")));
    const ranked = places.flatMap((place) => {
      const placeTokens = tokens([place?.name, place?.title, ...(place?.semanticAliases || [])].filter(Boolean).join(" "));
      const score = placeTokens.reduce((total, token) => total + (dayTokens.has(token) ? 1 : 0), 0);
      return imagesFor(place).map((image) => ({ place, image, score, required: requiredTokenMatch(placeTokens), priority: place?.imageRole === "food" ? 0 : 1, used: used.has(imageIdentity(image)) }));
    }).filter((candidate) => candidate.image?.url && candidate.score >= candidate.required && !candidate.used)
      .sort((a, b) => b.priority - a.priority || b.score - a.score || Number(a.used) - Number(b.used));
    const best = ranked[0];
    if (best) {
      used.add(imageIdentity(best.image));
      return { ...best.image, match: "semantic", imageScope: best.place.imageScope || "EXACT_ENTITY", sourceName: best.place.name || best.place.title || "", provenance: best.image.provenance || { source: best.place.source || "curated", matchedEntity: best.place.name || best.place.title || "" } };
    }
    const fallback = fallbacks.find((image) => !used.has(imageIdentity(image)));
    if (fallback?.url) {
      used.add(imageIdentity(fallback));
      return { ...fallback, match: "destination_fallback", imageScope: "DESTINATION", provenance: fallback.provenance || { source: "destination_context" } };
    }
    return null;
  });
};
