const clean = (value) => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

const destination = (id, city, country, countryCode, continent, currency, aliases, transport = ["public transit", "walk", "taxi"], hierarchy = {}) => Object.freeze({
  id, city, country, countryCode, continent, currency, aliases: Object.freeze(aliases.map(clean)),
  transport: Object.freeze(transport), state: hierarchy.state || "", district: hierarchy.district || "", neighborhood: hierarchy.neighborhood || ""
});

// Curated aliases cover the highest-volume destinations offline. The homepage's
// worldwide resolver remains additive and can enrich this registry through OSM.
export const WORLD_DESTINATIONS = Object.freeze([
  destination("seoul", "Seoul", "South Korea", "KR", "Asia", "KRW", ["Seoul", "서울", "서울시", "Seúl"], ["subway", "bus", "walk", "taxi"]),
  destination("busan", "Busan", "South Korea", "KR", "Asia", "KRW", ["Busan", "부산", "부산시", "Busán"], ["KTX", "SRT", "subway", "bus"]),
  destination("tokyo", "Tokyo", "Japan", "JP", "Asia", "JPY", ["Tokyo", "東京", "도쿄", "Tokio"], ["rail", "subway", "walk"]),
  destination("osaka", "Osaka", "Japan", "JP", "Asia", "JPY", ["Osaka", "大阪", "오사카"], ["rail", "subway", "walk"]),
  destination("kyoto", "Kyoto", "Japan", "JP", "Asia", "JPY", ["Kyoto", "京都", "교토", "Kioto"], ["rail", "bus", "walk"]),
  destination("ho-chi-minh-city", "Ho Chi Minh City", "Vietnam", "VN", "Asia", "VND", ["Ho Chi Minh", "Ho Chi Min", "Ho Chi Minh City", "Saigon", "HCMC", "호치민", "호찌민", "Ciudad Ho Chi Minh"], ["metro", "bus", "walk", "taxi"]),
  destination("singapore", "Singapore", "Singapore", "SG", "Asia", "SGD", ["Singapore", "싱가포르", "Singapur"], ["MRT", "bus", "walk", "taxi"]),
  destination("new-york", "New York City", "United States", "US", "North America", "USD", ["New York", "New York City", "NYC", "뉴욕", "Nueva York"], ["subway", "walk", "taxi"]),
  destination("los-angeles", "Los Angeles", "United States", "US", "North America", "USD", ["Los Angeles", "LA", "L.A.", "로스앤젤레스", "엘에이"], ["metro", "bus", "rideshare", "car"]),
  destination("mexico-city", "Mexico City", "Mexico", "MX", "North America", "MXN", ["Mexico City", "Ciudad de Mexico", "Ciudad de México", "CDMX", "멕시코시티", "멕시코 시티"], ["metro", "bus", "walk", "taxi"]),
  destination("lima", "Lima", "Peru", "PE", "South America", "PEN", ["Lima", "Lima Peru", "리마", "리마 페루"], ["bus", "walk", "taxi"]),
  destination("sao-paulo", "São Paulo", "Brazil", "BR", "South America", "BRL", ["Sao Paulo", "São Paulo", "상파울루", "상파울로", "San Pablo"], ["metro", "bus", "walk", "taxi"]),
  destination("santiago", "Santiago", "Chile", "CL", "South America", "CLP", ["Santiago", "Santiago Chile", "산티아고"], ["metro", "bus", "walk", "taxi"]),
  destination("bogota", "Bogotá", "Colombia", "CO", "South America", "COP", ["Bogota", "Bogotá", "보고타"], ["TransMilenio", "bus", "walk", "taxi"]),
  destination("paris", "Paris", "France", "FR", "Europe", "EUR", ["Paris", "파리", "París"], ["metro", "walk", "bus"]),
  destination("madrid", "Madrid", "Spain", "ES", "Europe", "EUR", ["Madrid", "마드리드"], ["metro", "walk", "bus"]),
  destination("barcelona", "Barcelona", "Spain", "ES", "Europe", "EUR", ["Barcelona", "바르셀로나"], ["metro", "walk", "bus"]),
  destination("lisbon", "Lisbon", "Portugal", "PT", "Europe", "EUR", ["Lisbon", "Lisboa", "리스본", "리스보아"], ["metro", "tram", "walk"]),
  destination("london", "London", "United Kingdom", "GB", "Europe", "GBP", ["London", "런던", "Londres"], ["tube", "walk", "bus"]),
  destination("rome", "Rome", "Italy", "IT", "Europe", "EUR", ["Rome", "Roma", "로마"], ["metro", "walk", "bus"]),
  destination("stockholm", "Stockholm", "Sweden", "SE", "Europe", "SEK", ["Stockholm", "스톡홀름", "Estocolmo"], ["metro", "tram", "walk"]),
  destination("sydney", "Sydney", "Australia", "AU", "Oceania", "AUD", ["Sydney", "시드니", "Sídney"], ["train", "ferry", "walk", "bus"]),
  destination("cape-town", "Cape Town", "South Africa", "ZA", "Africa", "ZAR", ["Cape Town", "케이프타운", "Ciudad del Cabo"], ["bus", "walk", "taxi"]),
  destination("cairo", "Cairo", "Egypt", "EG", "Africa", "EGP", ["Cairo", "카이로", "El Cairo"], ["metro", "walk", "taxi"]),
  destination("dubai", "Dubai", "United Arab Emirates", "AE", "Middle East", "AED", ["Dubai", "두바이", "Dubái"], ["metro", "walk", "taxi"])
]);

const boundaryIncludes = (source, alias) => {
  const normalized = ` ${clean(source)} `;
  return normalized.includes(` ${alias} `);
};

const COUNTRY_DEFAULT_DESTINATIONS = Object.freeze([
  Object.freeze({ aliases: Object.freeze(["japan", "japon"]), destinationId: "tokyo" })
]);

export function detectMissionLanguage(value) {
  const source = String(value || "");
  if (/[가-힣]/u.test(source)) return Object.freeze({ value: "ko", confidence: 0.99 });
  if (/[¿¡ñáéíóúü]/iu.test(source) || /\b(?:viaje|viajar|fin de semana|novia|novio|pareja|luna de miel|negocios|dias|días)\b/i.test(source)) {
    return Object.freeze({ value: "es", confidence: 0.96 });
  }
  return Object.freeze({ value: "en", confidence: /[a-z]/i.test(source) ? 0.91 : 0.55 });
}

export function resolveWorldDestination(value) {
  const normalizedSource = ` ${clean(value)} `;
  const matches = WORLD_DESTINATIONS
    .map((item) => ({ item, score: Math.max(0, ...item.aliases.map((alias) => {
      const index = normalizedSource.lastIndexOf(` ${alias} `);
      return index >= 0 ? (index * 100) + alias.length : 0;
    })) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  if (matches[0]?.item) return matches[0].item;
  const countryDefault = COUNTRY_DEFAULT_DESTINATIONS.find((entry) => entry.aliases.some((alias) => boundaryIncludes(value, alias)));
  return countryDefault ? WORLD_DESTINATIONS.find((item) => item.id === countryDefault.destinationId) || null : null;
}

export function normalizeResolvedDestination(item, fallback = {}) {
  const source = item || fallback;
  const city = String(source.city || source.name || fallback.city || "").trim();
  const country = String(source.country || fallback.country || "").trim();
  return Object.freeze({
    id: source.id || clean(city).replaceAll(" ", "-") || "unspecified",
    city, country,
    countryCode: String(source.countryCode || source.code || fallback.countryCode || "").toUpperCase(),
    continent: source.continent || fallback.continent || "",
    currency: source.currency || fallback.currency || "",
    state: source.state || fallback.state || "",
    district: source.district || fallback.district || "",
    neighborhood: source.neighborhood || fallback.neighborhood || "",
    latitude: Number.isFinite(Number(source.latitude)) ? Number(source.latitude) : undefined,
    longitude: Number.isFinite(Number(source.longitude)) ? Number(source.longitude) : undefined,
    transport: Object.freeze([...(source.transport || fallback.transport || ["public transit", "walk", "taxi"])])
  });
}

export function destinationMatchesRecommendation(item, destinationValue) {
  if (!destinationValue?.city) return false;
  const itemCity = clean(item?.city || item?.destination?.city);
  const itemCountry = clean(item?.country || item?.destination?.country);
  const city = clean(destinationValue.city);
  const country = clean(destinationValue.country);
  const code = String(item?.countryCode || item?.destination?.countryCode || "").toUpperCase();
  if (code && destinationValue.countryCode && code !== destinationValue.countryCode) return false;
  if (itemCity && itemCity !== city) return false;
  if (itemCountry && country && itemCountry !== country) return false;
  return Boolean(itemCity || code || itemCountry);
}

export function validateWorldMission(context, recommendations = []) {
  const destinationValue = context?.destination;
  const explicit = Boolean(destinationValue?.specified);
  const invalid = explicit ? recommendations.filter((item) => !destinationMatchesRecommendation(item, destinationValue)) : [];
  const checks = Object.freeze({
    languageDetected: Boolean(context?.missionLanguage?.value || context?.language),
    destinationResolved: !explicit || Boolean(destinationValue?.city && destinationValue?.country),
    explicitDestinationPreserved: !explicit || context?.origin?.id !== destinationValue?.id,
    recommendationsInDestination: invalid.length === 0
  });
  return Object.freeze({ passed: Object.values(checks).every(Boolean), checks, invalid: Object.freeze(invalid) });
}
