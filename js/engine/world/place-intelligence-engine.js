const normalize = (value) => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

const countryTokens = (item) => [item.country, item.countryKo, item.countryEs, item.code]
  .filter(Boolean)
  .map(normalize);

const placeTokens = (item) => [item.city, item.name, ...(item.aliases || [])]
  .filter(Boolean)
  .map(normalize);

const exactToken = (query, values) => values.some((value) => value === query);
const containsToken = (query, values) => values.some((value) => query.includes(value) || value.includes(query));

const flagFor = (code) => String(code || "").toUpperCase().replace(/./g, (letter) =>
  String.fromCodePoint(127397 + letter.charCodeAt(0))
);

const radians = (value) => Number(value) * Math.PI / 180;
export const distanceKm = (from, to) => {
  if (![from?.latitude, from?.longitude, to?.latitude, to?.longitude].every((value) => Number.isFinite(Number(value)))) return null;
  const dLat = radians(to.latitude - from.latitude);
  const dLon = radians(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const typeLabel = (item) => {
  const kind = normalize(item.placeType || item.type || item.addresstype || item.category);
  if (/country/.test(kind)) return "Country";
  if (/state|province|region|county/.test(kind)) return "State / region";
  if (/island/.test(kind)) return "Island";
  if (/mountain|peak/.test(kind)) return "Mountain";
  if (/lake|reservoir/.test(kind)) return "Lake";
  if (/beach|coast/.test(kind)) return "Beach";
  if (/park|protected/.test(kind)) return "National park / protected area";
  if (/airport|aerodrome/.test(kind)) return "Airport";
  if (/district|borough|quarter|neighbourhood|neighborhood|suburb/.test(kind)) return "District / neighborhood";
  if (/attraction|landmark|monument|museum/.test(kind)) return "Landmark";
  if (/town|village|hamlet/.test(kind)) return "Town";
  return item.capital ? "Capital" : "City";
};

export const scorePlaceCandidate = (rawQuery, item) => {
  const query = normalize(rawQuery);
  const places = placeTokens(item);
  const countries = countryTokens(item);
  const placeExact = exactToken(query, places);
  const countryQualified = countries.some((country) => country && query.includes(country));
  const placeContained = containsToken(query, places);
  const importance = Math.max(0, Math.min(1, Number(item.importance) || 0));
  let score = placeExact ? 0.90 : placeContained ? 0.74 : 0.56;
  if (countryQualified) score += 0.18;
  if (item.capital) score += 0.02;
  score += importance * 0.035;
  return Math.max(0, Math.min(0.995, Number(score.toFixed(3))));
};

export const rankPlaceCandidates = (query, candidates, currentLocation = null) => candidates
  .map((item) => {
    const confidence = scorePlaceCandidate(query, item);
    const distance = distanceKm(currentLocation, item);
    return Object.freeze({
      ...item,
      confidence,
      flag: flagFor(item.code),
      placeType: typeLabel(item),
      distanceKm: distance,
      popularity: Number(item.importance) >= 0.65 ? "High" : Number(item.importance) >= 0.35 ? "Medium" : "Local",
      description: item.description || [typeLabel(item), item.state, item.country].filter(Boolean).join(" · ")
    });
  })
  .sort((a, b) => b.confidence - a.confidence || Number(b.importance || 0) - Number(a.importance || 0));

export const decidePlaceResolution = (query, candidates, currentLocation = null) => {
  const ranked = rankPlaceCandidates(query, candidates, currentLocation);
  const top = ranked[0] || null;
  const second = ranked[1] || null;
  const confidenceGap = top && second ? top.confidence - second.confidence : 1;
  const autoSelect = Boolean(top) && top.confidence >= 0.80 && confidenceGap >= 0.08;
  const requiresSelection = Boolean(top) && !autoSelect && (top.confidence < 0.80 || Boolean(second && confidenceGap < 0.08) || ranked.length > 1);
  return Object.freeze({
    selected: autoSelect ? top : null,
    candidates: Object.freeze(ranked),
    confidence: top?.confidence || 0,
    confidenceGap,
    autoSelect,
    requiresSelection,
    reason: !top ? "NO_MATCH" : autoSelect ? "HIGH_CONFIDENCE_UNIQUE" : "AMBIGUOUS_OR_LOW_CONFIDENCE"
  });
};

export const validatePlaceMission = ({ destination, language, recommendations = [], sections = [] } = {}) => {
  const normalizedCity = normalize(destination?.city);
  const normalizedCountry = normalize(destination?.country);
  const foreign = recommendations.filter((item) => {
    const city = normalize(item?.city || item?.destination?.city);
    const country = normalize(item?.country || item?.destination?.country);
    const code = String(item?.countryCode || item?.destination?.countryCode || "").toUpperCase();
    if (code && destination?.code && code !== String(destination.code).toUpperCase()) return true;
    if (city && normalizedCity && city !== normalizedCity) return true;
    return Boolean(country && normalizedCountry && country !== normalizedCountry);
  });
  const checks = Object.freeze({
    destinationResolved: Boolean(destination?.city && destination?.country),
    countryResolved: Boolean(destination?.country || destination?.code),
    languageUnderstood: ["en", "ko", "es"].includes(language),
    recommendationsBelongToDestination: foreign.length === 0,
    noBlankSections: sections.every((section) => section && (section.items?.length || section.value || section.status)),
    noPlaceholderContent: !sections.some((section) => /to confirm|placeholder|확인 필요|por confirmar/i.test(JSON.stringify(section)))
  });
  return Object.freeze({ passed: Object.values(checks).every(Boolean), checks, rejected: Object.freeze(foreign) });
};

export const PLACE_FALLBACK_ORDER = Object.freeze([
  "DESTINATION_SPECIFIC_DATA",
  "COUNTRY_LEVEL_DATA",
  "REGIONAL_RECOMMENDATIONS",
  "INTELLIGENT_WEB_SEARCH",
  "AI_REASONING"
]);

export const placeFallbackPlan = (availability = {}) => {
  const selected = PLACE_FALLBACK_ORDER.find((level) => availability[level] !== false) || "AI_REASONING";
  return Object.freeze({ selected, order: PLACE_FALLBACK_ORDER, blankResultsAllowed: false });
};
