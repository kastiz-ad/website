const clean = (value) => String(value ?? "").trim();

const localized = (locale, en, ko, es) => locale === "ko" ? ko : locale === "es" ? es : en;

const absoluteSearchUrl = (base, query) => {
  const url = new URL(base);
  url.searchParams.set("q", query);
  return url.toString();
};

export function buildOneFreeProviderHandoff({ destination, origin = "", dates = {}, travelers = 1, selections = {}, locale = "en" } = {}) {
  const city = clean(destination?.city || destination?.name || destination?.country || destination);
  const startDate = clean(dates.startDate);
  const endDate = clean(dates.endDate);
  const party = Math.max(1, Number.parseInt(travelers, 10) || 1);
  if (!city) {
    return {
      state: "unavailable",
      message: localized(locale, "External links are unavailable until a destination is confirmed.", "목적지를 확인하기 전에는 외부 링크를 만들 수 없습니다.", "Los enlaces externos no están disponibles hasta confirmar el destino."),
      links: []
    };
  }

  const dateText = [startDate, endDate].filter(Boolean).join(" to ");
  const flightName = clean(selections.flight);
  const hotelName = clean(selections.hotel);
  const restaurants = Array.isArray(selections.restaurants) ? selections.restaurants.map(clean).filter(Boolean) : [];
  const places = Array.isArray(selections.places) ? selections.places.map((place) => clean(place?.name || place?.title || place)).filter(Boolean) : [];
  const flightQuery = [flightName, "flights", origin && `from ${origin}`, `to ${city}`, dateText, `${party} traveler${party === 1 ? "" : "s"}`].filter(Boolean).join(" ");
  const hotelQuery = [hotelName, "hotel", city, dateText, `${party} guest${party === 1 ? "" : "s"}`].filter(Boolean).join(" ");
  const diningQuery = [restaurants[0] || "restaurants", city].filter(Boolean).join(" ");
  const placesQuery = [places[0] || "things to do", city].filter(Boolean).join(" ");
  const broadFlightQuery = ["flights", origin && `from ${origin}`, `to ${city}`, dateText, `${party} traveler${party === 1 ? "" : "s"}`].filter(Boolean).join(" ");
  const broadHotelQuery = ["hotels", city, dateText, `${party} guest${party === 1 ? "" : "s"}`].filter(Boolean).join(" ");
  const link = (id, kind, label, detail, base, query, transferred) => ({ id, kind, label, detail, url: absoluteSearchUrl(base, query), transferred });

  return {
    state: "available",
    message: localized(locale, "Open a provider search and complete any booking yourself.", "외부 제공업체 검색을 열고 예약은 사용자가 직접 완료하세요.", "Abre la búsqueda del proveedor y completa cualquier reserva por tu cuenta."),
    links: [
      link("flight-selected", "flights", localized(locale, "Search this flight option", "이 항공편 후보 검색", "Buscar esta opción de vuelo"), flightName || localized(locale, "No exact flight selected", "정확한 항공편 미선택", "Sin vuelo exacto seleccionado"), "https://www.google.com/travel/flights", flightQuery, ["origin", "destination", "dates", "travelers", flightName && "selection"].filter(Boolean)),
      link("flights-all", "flights", localized(locale, "See all flights", "모든 항공편 보기", "Ver todos los vuelos"), localized(locale, "Provider may ask you to confirm route and dates", "제공업체에서 노선과 날짜를 다시 확인할 수 있습니다", "El proveedor puede pedir confirmar ruta y fechas"), "https://www.google.com/travel/flights", broadFlightQuery, ["origin", "destination", "dates", "travelers"]),
      link("hotel-selected", "hotels", localized(locale, "Search this hotel", "이 숙소 검색", "Buscar este hotel"), hotelName || localized(locale, "No exact hotel selected", "정확한 숙소 미선택", "Sin hotel exacto seleccionado"), "https://www.google.com/travel/hotels", hotelQuery, ["destination", "dates", "guests", hotelName && "selection"].filter(Boolean)),
      link("hotels-all", "hotels", localized(locale, "See all hotels", "모든 숙소 보기", "Ver todos los hoteles"), localized(locale, `Hotels in ${city}`, `${city} 숙소`, `Hoteles en ${city}`), "https://www.google.com/travel/hotels", broadHotelQuery, ["destination", "dates", "guests"]),
      restaurants[0] && link("restaurant-selected", "restaurants", localized(locale, "Search this restaurant option", "이 레스토랑 후보 검색", "Buscar esta opción de restaurante"), restaurants[0], "https://www.google.com/maps/search/", diningQuery, ["destination", "selection"]),
      link("restaurants-all", "restaurants", localized(locale, "See all restaurants", "모든 레스토랑 보기", "Ver todos los restaurantes"), localized(locale, `Restaurants in ${city}`, `${city} 레스토랑`, `Restaurantes en ${city}`), "https://www.google.com/maps/search/", `restaurants ${city}`, ["destination", "category"]),
      places[0] && link("place-selected", "places", localized(locale, "Search this place", "이 장소 검색", "Buscar este lugar"), places[0], "https://www.google.com/maps/search/", placesQuery, ["destination", "selection"]),
      link("places-all", "places", localized(locale, "See more places", "더 많은 장소 보기", "Ver más lugares"), localized(locale, `Things to do in ${city}`, `${city} 추천 장소`, `Qué hacer en ${city}`), "https://www.google.com/maps/search/", `things to do ${city}`, ["destination", "category"])
    ].filter(Boolean)
  };
}

export const ONE_TRUST_STATE_SCORES = Object.freeze({
  verified_live: 4.8,
  live: 4.8,
  verified: 4.5,
  curated: 4.2,
  cached_public: 3.8,
  public: 3.5,
  estimated: 3.4,
  fallback: 2.7,
  partial: 2.7,
  limited: 2.6,
  placeholder: 2.1,
  demo: 1.8,
  mock: 1.6,
  unavailable: null
});

const normalizeTrustState = (state) => {
  const value = clean(state).toLowerCase();
  if (!value) return "";
  if (value === "verified_live" || value === "live") return value;
  if (/verified/.test(value)) return "verified";
  if (/curated/.test(value)) return "curated";
  if (/cached_public|openstreetmap|public place|public_source/.test(value)) return "cached_public";
  if (value === "public") return "public";
  if (/estimated|requires_live_search/.test(value)) return "estimated";
  if (/fallback/.test(value)) return "fallback";
  if (/partial|limited/.test(value)) return "limited";
  if (/placeholder/.test(value)) return "placeholder";
  if (/demo|fixture/.test(value)) return "demo";
  if (/mock|simulated/.test(value)) return "mock";
  if (/unavailable|missing|error|setup_required/.test(value)) return "unavailable";
  return "";
};

const labelForScore = (score) => score === null
  ? "Unverified"
  : score >= 4.7 ? "Trusted" : score >= 4.1 ? "Reliable" : score >= 3.1 ? "Estimated" : score >= 2.1 ? "Limited" : "Experimental";

const explanationFor = (label) => {
  if (label === "Trusted") return { en: "Live provider data and destination match confirmed.", ko: "실시간 제공업체 정보와 목적지 일치를 확인했습니다.", es: "Datos en vivo del proveedor y destino confirmados." };
  if (label === "Reliable") return { en: "Based on verified or curated sources; some live details may still need confirmation.", ko: "검증되거나 엄선된 출처를 기반으로 하며 일부 실시간 정보는 추가 확인이 필요할 수 있습니다.", es: "Basado en fuentes verificadas o seleccionadas; algunos datos en vivo aún pueden requerir confirmación." };
  if (label === "Estimated") return { en: "Based on public or estimated data; live availability is not confirmed.", ko: "공개 또는 예상 정보를 기반으로 하며 실시간 가능 여부는 확인되지 않았습니다.", es: "Basado en datos públicos o estimados; la disponibilidad en vivo no está confirmada." };
  if (label === "Limited") return { en: "Some recommendations use limited or fallback data.", ko: "일부 추천은 제한적 정보 또는 대체 데이터를 사용합니다.", es: "Algunas recomendaciones usan datos limitados o de respaldo." };
  if (label === "Experimental") return { en: "This result relies on placeholder, demo, or unverified evidence.", ko: "이 결과는 자리표시자, 데모 또는 미검증 근거를 사용합니다.", es: "Este resultado depende de datos provisionales, de demostración o no verificados." };
  return { en: "There is not enough trustworthy evidence to calculate a score.", ko: "신뢰 점수를 계산할 충분한 근거가 없습니다.", es: "No hay evidencia confiable suficiente para calcular una puntuación." };
};

export function oneFreeTrustIndex({ sourceStates = [], signals = {}, missingImages = 0, missingProviders = 0, localizedContent = true } = {}) {
  const states = sourceStates.map(normalizeTrustState).filter(Boolean);
  const scoredStates = states.map((state) => ONE_TRUST_STATE_SCORES[state]).filter(Number.isFinite);
  if (!scoredStates.length) return { score: null, label: "Unverified", explanation: explanationFor("Unverified"), states };

  let score = scoredStates.reduce((total, value) => total + value, 0) / scoredStates.length;
  const signalValues = Object.values(signals).filter((value) => typeof value === "boolean");
  score += signalValues.filter(Boolean).length * 0.08;
  score -= signalValues.filter((value) => !value).length * 0.14;
  score -= Math.min(1.2, Math.max(0, missingImages) * 0.15 + Math.max(0, missingProviders) * 0.35);
  if (!localizedContent) score -= 0.25;

  const hasEstimated = states.some((state) => ["cached_public", "public", "estimated"].includes(state));
  const hasFallback = states.some((state) => ["fallback", "partial", "limited", "placeholder"].includes(state));
  const hasPrototype = states.some((state) => ["demo", "mock"].includes(state));
  if (hasEstimated) score = Math.min(score, 4);
  if (hasFallback) score = Math.min(score, 3);
  if (hasPrototype) score = Math.min(score, 2);
  score = Math.max(1, Math.min(5, Math.round(score * 10) / 10));
  const label = labelForScore(score);
  return { score, label, explanation: explanationFor(label), states };
}

export function oneFreeTrustProfile(sections = {}, options = {}) {
  const localizedContent = options.localizedContent !== false;
  const itineraryEvidence = sections.itinerary || null;
  const directSections = Object.fromEntries(Object.entries(sections).filter(([key]) => key !== "itinerary"));
  const entries = Object.entries(directSections).map(([key, evidence = {}]) => [key, oneFreeTrustIndex({ ...evidence, localizedContent: evidence.localizedContent ?? localizedContent })]);
  const profile = Object.fromEntries(entries);
  if (itineraryEvidence) {
    const componentKeys = itineraryEvidence.components || ["destination", "places", "restaurants", "transport"];
    const componentScores = componentKeys.map((key) => profile[key]?.score).filter(Number.isFinite);
    if (componentScores.length) {
      let itineraryScore = componentScores.reduce((total, score) => total + score, 0) / componentScores.length;
      itineraryScore = Math.min(itineraryScore, Math.min(...componentScores) + 0.8);
      if (itineraryEvidence.scheduleFeasible === true) itineraryScore += 0.1;
      if (itineraryEvidence.scheduleFeasible === false) itineraryScore -= 0.4;
      if (componentScores.length < componentKeys.length) itineraryScore -= 0.35;
      itineraryScore = Math.max(1, Math.min(5, Math.round(itineraryScore * 10) / 10));
      const label = labelForScore(itineraryScore);
      profile.itinerary = { score: itineraryScore, label, explanation: explanationFor(label), states: ["derived"] };
    } else profile.itinerary = oneFreeTrustIndex({ sourceStates: [] });
  }
  const visible = Object.values(profile).map((trust) => trust.score).filter(Number.isFinite);
  if (!visible.length) profile.final = oneFreeTrustIndex({ sourceStates: [] });
  else {
    let finalScore = visible.reduce((total, score) => total + score, 0) / visible.length;
    finalScore = Math.min(finalScore, Math.min(...visible) + 1);
    finalScore = Math.max(1, Math.min(5, Math.round(finalScore * 10) / 10));
    const label = labelForScore(finalScore);
    profile.final = { score: finalScore, label, explanation: explanationFor(label), states: ["derived"] };
  }
  return profile;
}

export function createDeviceTripRecord({ reference, result, savedAt = new Date().toISOString() } = {}) {
  if (!clean(reference) || !result || typeof result !== "object") throw new TypeError("reference and result are required");
  return { reference: clean(reference), savedAt, storage: "device", result };
}
