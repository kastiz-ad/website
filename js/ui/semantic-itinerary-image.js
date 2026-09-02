const STOP_WORDS = new Set(["and", "the", "with", "from", "day", "walk", "route", "tokyo", "japan", "도쿄", "일본"]);

const tokens = (value = "") => String(value).normalize("NFKC").toLocaleLowerCase("en")
  .split(/[^\p{L}\p{N}]+/u)
  .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

const imageFor = (item) => item?.image?.url ? item.image : item?.imageUrl ? { url: item.imageUrl, alt: item.imageAlt || item.name } : null;

export const resolveSemanticItineraryImages = (days = [], places = [], destinationFallback = null) => {
  const used = new Set();
  return days.map((day) => {
    const dayTokens = new Set(tokens([day?.title, day?.theme, ...(day?.slots || []).map((slot) => slot?.[2])].filter(Boolean).join(" ")));
    const ranked = places.map((place) => {
      const image = imageFor(place);
      const placeTokens = tokens([place?.name, place?.title, ...(place?.semanticAliases || [])].filter(Boolean).join(" "));
      const score = placeTokens.reduce((total, token) => total + (dayTokens.has(token) ? 1 : 0), 0);
      return { place, image, score, used: image?.url ? used.has(image.url) : true };
    }).filter((candidate) => candidate.image?.url && candidate.score > 0)
      .sort((a, b) => b.score - a.score || Number(a.used) - Number(b.used));
    const best = ranked[0];
    if (best) {
      used.add(best.image.url);
      return { ...best.image, match: "semantic", sourceName: best.place.name || best.place.title || "" };
    }
    if (destinationFallback?.url) return { ...destinationFallback, match: "destination_fallback" };
    return null;
  });
};
