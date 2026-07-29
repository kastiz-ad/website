export const AI_TRAVEL_CONCIERGE_VERSION = "20260730-ai-travel-concierge-v1";

export const CONCIERGE_PRIORITIES = Object.freeze({
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low"
});

export const CONCIERGE_ACTIONS = Object.freeze({
  ACCEPT: "accept",
  DISMISS: "dismiss",
  REMIND_LATER: "remind_later",
  NEVER_ASK_AGAIN: "never_ask_again",
  UNDO: "undo"
});

const SOURCE_STATES = new Set(["verified_live", "cached_public", "estimated", "demo", "setup_required", "unavailable"]);
const PRIORITY_WEIGHT = Object.freeze({ critical: 400, high: 300, medium: 200, low: 100 });
const CATEGORY_WEIGHT = Object.freeze({
  safety: 80,
  weather: 68,
  transportation: 62,
  restaurants: 58,
  hotels: 54,
  schedule: 48,
  accessibility: 46,
  budget: 42,
  events: 34,
  general: 12
});

const clean = (value) => String(value ?? "").trim();
const lower = (value) => clean(value).toLowerCase();
const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const numberOrNull = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const normalizeSourceState = (value) => SOURCE_STATES.has(value) ? value : "estimated";
const local = (language, en, ko, es) => language === "ko" ? ko : language === "es" ? es : en;

export const conciergeStorageKey = (result = {}) => {
  const id = clean(result.id || result.reference || result.rawInput || result.mission || "current");
  return `kastiz-one-ai-concierge:${id.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80)}`;
};

export function createConciergeState(input = {}) {
  return Object.freeze({
    version: AI_TRAVEL_CONCIERGE_VERSION,
    accepted: Object.freeze(asArray(input.accepted)),
    dismissed: Object.freeze(asArray(input.dismissed)),
    remindLater: Object.freeze(asArray(input.remindLater)),
    neverAskAgain: Object.freeze(asArray(input.neverAskAgain)),
    undoStack: Object.freeze(asArray(input.undoStack)),
    learnedSignals: Object.freeze(asArray(input.learnedSignals)),
    updatedAt: input.updatedAt || new Date().toISOString()
  });
}

const evidenceFrom = (input = {}, fallback = "estimated") => Object.freeze({
  source: clean(input.source || input.provider || input.dataSource || "ONE mission data"),
  sourceState: normalizeSourceState(input.sourceState || fallback),
  retrievedAt: input.retrievedAt || input.timestamp || null,
  providerId: clean(input.providerId || input.provider || "")
});

const benefitFrom = (input = {}) => Object.freeze({
  timeSavedMinutes: numberOrNull(input.timeSavedMinutes),
  walkingReducedKm: numberOrNull(input.walkingReducedKm),
  moneySaved: numberOrNull(input.moneySaved),
  comfortImproved: numberOrNull(input.comfortImproved),
  accessibilityImproved: numberOrNull(input.accessibilityImproved),
  missionQuality: numberOrNull(input.missionQuality)
});

const measurableBenefitScore = (benefit = {}) => {
  let score = 0;
  if (benefit.timeSavedMinutes !== null) score += Math.min(50, benefit.timeSavedMinutes);
  if (benefit.walkingReducedKm !== null) score += Math.min(40, benefit.walkingReducedKm * 12);
  if (benefit.moneySaved !== null) score += Math.min(32, benefit.moneySaved / 10000);
  if (benefit.comfortImproved !== null) score += Math.min(24, benefit.comfortImproved);
  if (benefit.accessibilityImproved !== null) score += Math.min(24, benefit.accessibilityImproved);
  if (benefit.missionQuality !== null) score += Math.min(36, benefit.missionQuality);
  return score;
};

export function createConciergeRecommendation(input = {}) {
  const priority = Object.values(CONCIERGE_PRIORITIES).includes(input.priority) ? input.priority : CONCIERGE_PRIORITIES.MEDIUM;
  const category = clean(input.category || "general");
  const benefit = benefitFrom(input.benefit || input);
  const evidence = evidenceFrom(input.evidence || input, input.sourceState);
  const confidence = clamp(input.confidence ?? (evidence.sourceState === "verified_live" ? 92 : evidence.sourceState === "cached_public" ? 76 : evidence.sourceState === "demo" ? 70 : 58), 0, 100);
  const rankingScore = Math.round(
    (PRIORITY_WEIGHT[priority] || 0)
    + (CATEGORY_WEIGHT[category] || CATEGORY_WEIGHT.general)
    + measurableBenefitScore(benefit)
    + confidence
  );
  return Object.freeze({
    id: clean(input.id || `${category}-${rankingScore}`),
    category,
    priority,
    title: clean(input.title),
    reason: clean(input.reason),
    expectedBenefit: clean(input.expectedBenefit),
    affectedComponents: Object.freeze(asArray(input.affectedComponents || input.components)),
    confidence,
    dataSource: evidence.source,
    sourceState: evidence.sourceState,
    retrievedAt: evidence.retrievedAt,
    providerId: evidence.providerId,
    benefit,
    recommendation: clean(input.recommendation || input.title),
    patch: Object.freeze(input.patch || {}),
    requiresApproval: true,
    neverAutoExecute: true,
    rankingScore,
    generatedAt: input.generatedAt || new Date().toISOString()
  });
}

const missionText = (result = {}) => `${result.rawInput || ""} ${result.mission || ""} ${result.originalMission || ""}`;

const destinationLabel = (result = {}, language = "en") => {
  const city = language === "ko" ? result.destination?.cityKo || result.destination?.city : result.destination?.city;
  const country = language === "ko" ? result.destination?.countryKo || result.destination?.country : result.destination?.country;
  return clean(city || country || result.countryProfile?.name || "destination");
};

const hasInternationalTravel = (result = {}) => {
  const code = clean(result.destination?.countryCode || result.countryProfile?.code || result.country).toUpperCase();
  return result.type === "travel" && code && !["KR", "KOR", "SOUTH KOREA"].includes(code);
};

const providerItemState = (item = {}) => normalizeSourceState(item.sourceState || item.liveStatus || item.dataState || item.providerEvidence?.sourceState || "estimated");

const collectProviderEvidence = (result = {}) => {
  const world = result.worldIntelligence?.models || {};
  const hotels = [...asArray(result.hotels), ...asArray(world.hotels)];
  const restaurants = [...asArray(result.restaurants), ...asArray(world.restaurants)];
  const transport = [...asArray(result.transportation), ...asArray(world.routes), ...asArray(world.transport)];
  const weather = asArray(world.weather || result.weather ? [result.weather] : []);
  return { hotels, restaurants, transport, weather };
};

const scheduleDays = (result = {}) => {
  const start = result.schedule?.startDate ? new Date(`${result.schedule.startDate}T00:00:00`) : null;
  const end = result.schedule?.endDate ? new Date(`${result.schedule.endDate}T00:00:00`) : null;
  if (!start || !end || Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) return null;
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
};

const buildSignalRecommendations = ({ result = {}, language = "en", signals = {} }) => {
  const destination = destinationLabel(result, language);
  const recs = [];
  const weather = signals.weather || result.conciergeSignals?.weather;
  if (weather?.issue && weather?.sourceState && weather.sourceState !== "unavailable") {
    recs.push(createConciergeRecommendation({
      id: "weather-swap-indoor-outdoor",
      category: "weather",
      priority: weather.priority || CONCIERGE_PRIORITIES.HIGH,
      title: local(language, "Swap the rainy window", "비 오는 시간대만 바꾸기", "Cambiar el bloque de lluvia"),
      reason: clean(weather.reason) || local(language,
        `${destination} weather may affect one outdoor block.`,
        `${destination} 일정 중 야외 일정 하나가 날씨 영향을 받을 수 있어요.`,
        `El clima en ${destination} puede afectar una parte al aire libre.`
      ),
      expectedBenefit: clean(weather.expectedBenefit) || local(language,
        "Keeps the same trip, but moves indoor time into the weather-risk window.",
        "전체 일정은 유지하고, 비가 올 가능성이 있는 시간대에 실내 일정을 배치합니다.",
        "Mantiene el viaje, moviendo actividades interiores al bloque de riesgo."
      ),
      affectedComponents: ["weather", "schedule", "places"],
      confidence: weather.confidence || 76,
      evidence: evidenceFrom(weather, weather.sourceState),
      benefit: { comfortImproved: weather.comfortImproved ?? 12, missionQuality: weather.missionQuality ?? 10 },
      patch: { target: "schedule", operation: "swap_weather_sensitive_blocks" }
    }));
  }
  const restaurant = signals.restaurant || result.conciergeSignals?.restaurant;
  if (restaurant?.closed === true && restaurant.sourceState && restaurant.sourceState !== "unavailable") {
    recs.push(createConciergeRecommendation({
      id: "restaurant-hours-conflict",
      category: "restaurants",
      priority: CONCIERGE_PRIORITIES.HIGH,
      title: local(language, "Replace the closed restaurant", "문 닫는 식당 바꾸기", "Cambiar restaurante cerrado"),
      reason: clean(restaurant.reason) || local(language,
        `${restaurant.name || "A selected restaurant"} appears closed during the planned time.`,
        `${restaurant.name || "선택한 식당"}이 예정 시간에 영업하지 않는 것으로 보여요.`,
        `${restaurant.name || "Un restaurante elegido"} parece cerrado a esa hora.`
      ),
      expectedBenefit: local(language, "Avoids arriving at a closed place.", "문 닫은 곳에 도착하는 상황을 피합니다.", "Evita llegar a un sitio cerrado."),
      affectedComponents: ["restaurants", "schedule"],
      confidence: restaurant.confidence || 88,
      evidence: evidenceFrom(restaurant, restaurant.sourceState),
      benefit: { missionQuality: 18, comfortImproved: 8 },
      patch: { target: "restaurants", operation: "replace_unavailable_restaurant", restaurantId: restaurant.id || restaurant.name || "" }
    }));
  }
  const transport = signals.transport || result.conciergeSignals?.transport;
  if (numberOrNull(transport?.timeSavedMinutes) !== null && transport.sourceState && transport.sourceState !== "unavailable") {
    recs.push(createConciergeRecommendation({
      id: "transport-time-saver",
      category: "transportation",
      priority: transport.priority || CONCIERGE_PRIORITIES.MEDIUM,
      title: local(language, "Use the faster route", "더 빠른 이동으로 바꾸기", "Usar la ruta más rápida"),
      reason: clean(transport.reason) || local(language,
        `A provider-backed route can save about ${transport.timeSavedMinutes} minutes.`,
        `제공업체 경로 기준 약 ${transport.timeSavedMinutes}분 줄일 수 있어요.`,
        `Una ruta con datos de proveedor puede ahorrar unos ${transport.timeSavedMinutes} minutos.`
      ),
      expectedBenefit: local(language, "Less transit friction without changing the destination.", "목적지는 유지하고 이동 부담만 줄입니다.", "Menos fricción sin cambiar destino."),
      affectedComponents: ["transportation", "schedule"],
      confidence: transport.confidence || 82,
      evidence: evidenceFrom(transport, transport.sourceState),
      benefit: { timeSavedMinutes: transport.timeSavedMinutes, comfortImproved: transport.comfortImproved ?? 6 },
      patch: { target: "transportation", operation: "select_faster_route", routeId: transport.routeId || "" }
    }));
  }
  const hotel = signals.hotel || result.conciergeSignals?.hotel;
  if (numberOrNull(hotel?.walkingReducedKm) !== null && hotel.sourceState && hotel.sourceState !== "unavailable") {
    recs.push(createConciergeRecommendation({
      id: "hotel-walking-reduction",
      category: "hotels",
      priority: hotel.priority || CONCIERGE_PRIORITIES.MEDIUM,
      title: local(language, "Compare the closer hotel", "덜 걷는 숙소 비교하기", "Comparar hotel más cercano"),
      reason: clean(hotel.reason) || local(language,
        `Changing hotels can reduce walking by about ${hotel.walkingReducedKm} km per day.`,
        `숙소를 바꾸면 하루 도보를 약 ${hotel.walkingReducedKm}km 줄일 수 있어요.`,
        `Cambiar hotel puede reducir caminata unos ${hotel.walkingReducedKm} km al día.`
      ),
      expectedBenefit: local(language, "Reduces daily fatigue before approval.", "승인 전 하루 피로도를 줄이는 선택지입니다.", "Reduce fatiga diaria antes de aprobar."),
      affectedComponents: ["hotels", "walking", "schedule"],
      confidence: hotel.confidence || 79,
      evidence: evidenceFrom(hotel, hotel.sourceState),
      benefit: { walkingReducedKm: hotel.walkingReducedKm, comfortImproved: hotel.comfortImproved ?? 10 },
      patch: { target: "hotels", operation: "compare_lower_walking_hotel", hotelId: hotel.hotelId || "" }
    }));
  }
  return recs;
};

const buildDerivedRecommendations = ({ result = {}, language = "en" }) => {
  const recs = [];
  const evidence = collectProviderEvidence(result);
  const destination = destinationLabel(result, language);
  const tripDays = scheduleDays(result);

  const hotelEvidence = evidence.hotels.find((hotel) => providerItemState(hotel) === "verified_live" || providerItemState(hotel) === "cached_public");
  if (hotelEvidence?.missionImpact?.estimatedDailyWalkingKm !== undefined && Number(hotelEvidence.missionImpact.estimatedDailyWalkingKm) > 5) {
    recs.push(createConciergeRecommendation({
      id: "hotel-high-walking-load",
      category: "hotels",
      priority: CONCIERGE_PRIORITIES.MEDIUM,
      title: local(language, "Check a lower-walking hotel", "도보 부담 낮은 숙소 확인", "Revisar hotel con menos caminata"),
      reason: local(language,
        `The current hotel candidate may create about ${hotelEvidence.missionImpact.estimatedDailyWalkingKm} km of daily walking.`,
        `현재 숙소 후보는 하루 약 ${hotelEvidence.missionImpact.estimatedDailyWalkingKm}km 도보 부담이 생길 수 있어요.`,
        `El hotel actual puede generar unos ${hotelEvidence.missionImpact.estimatedDailyWalkingKm} km diarios de caminata.`
      ),
      expectedBenefit: local(language, "ONE can compare only the hotel section without rebuilding the trip.", "여행 전체를 다시 만들지 않고 숙소만 비교할 수 있습니다.", "ONE puede comparar solo hoteles sin rehacer el viaje."),
      affectedComponents: ["hotels", "walking"],
      confidence: hotelEvidence.missionScore || 74,
      evidence: evidenceFrom(hotelEvidence.providerEvidence || hotelEvidence, providerItemState(hotelEvidence)),
      benefit: { walkingReducedKm: Math.max(1, Math.round(Number(hotelEvidence.missionImpact.estimatedDailyWalkingKm) * 0.3 * 10) / 10), comfortImproved: 8 },
      patch: { target: "hotels", operation: "compare_by_walking_distance" }
    }));
  }

  const restaurantWithHours = evidence.restaurants.find((restaurant) => restaurant.openingHours || restaurant.hours || restaurant.closed === true);
  if (restaurantWithHours?.closed === true) {
    recs.push(createConciergeRecommendation({
      id: "restaurant-closed-derived",
      category: "restaurants",
      priority: CONCIERGE_PRIORITIES.HIGH,
      title: local(language, "One food stop needs checking", "식사 장소 하나 확인 필요", "Revisar una parada de comida"),
      reason: local(language, "A selected restaurant is marked closed in available data.", "선택한 식당 하나가 사용 가능한 데이터에서 영업 종료로 표시됩니다.", "Un restaurante aparece cerrado en los datos disponibles."),
      expectedBenefit: local(language, "Avoids a dead stop in the daily schedule.", "하루 일정 중 헛걸음을 줄입니다.", "Evita una parada fallida."),
      affectedComponents: ["restaurants", "schedule"],
      confidence: 84,
      evidence: evidenceFrom(restaurantWithHours.providerEvidence || restaurantWithHours, providerItemState(restaurantWithHours)),
      benefit: { missionQuality: 18 },
      patch: { target: "restaurants", operation: "replace_unavailable_restaurant" }
    }));
  }

  if (hasInternationalTravel(result) && tripDays && tripDays >= 6 && !evidence.transport.some((item) => providerItemState(item) === "verified_live")) {
    recs.push(createConciergeRecommendation({
      id: "transport-live-route-setup-required",
      category: "transportation",
      priority: CONCIERGE_PRIORITIES.LOW,
      title: local(language, "Live routes can improve this trip later", "실시간 경로가 연결되면 더 좋아져요", "Rutas en vivo pueden mejorar luego"),
      reason: local(language,
        `${destination} is a multi-day trip, but no live route evidence is connected yet.`,
        `${destination}은 여러 날 일정이지만 아직 실시간 경로 근거가 연결되지 않았어요.`,
        `${destination} es un viaje de varios días, pero no hay rutas en vivo conectadas.`
      ),
      expectedBenefit: local(language,
        "ONE will keep this as setup-required, not a fake route recommendation.",
        "ONE은 가짜 경로 추천이 아니라 설정 필요 상태로만 표시합니다.",
        "ONE lo mantiene como configuración pendiente, no como ruta falsa."
      ),
      affectedComponents: ["transportation"],
      confidence: 96,
      evidence: { source: "Provider registry", sourceState: "setup_required" },
      benefit: {},
      patch: { target: "transportation", operation: "provider_setup_required" }
    }));
  }
  return recs;
};

const buildFounderDemoRecommendations = ({ result = {}, language = "en" }) => buildSignalRecommendations({
  result,
  language,
  signals: {
    weather: { issue: "rain", sourceState: "demo", source: "Founder demo weather fixture", priority: "high", comfortImproved: 14, missionQuality: 10 },
    restaurant: { closed: true, name: "Selected sushi counter", sourceState: "demo", source: "Founder demo opening-hours fixture", confidence: 86 },
    transport: { timeSavedMinutes: 38, sourceState: "demo", source: "Founder demo route fixture", confidence: 82 },
    hotel: { walkingReducedKm: 2, sourceState: "demo", source: "Founder demo hotel-distance fixture", confidence: 79 }
  }
});

const notHiddenByState = (recommendation, state = createConciergeState()) => {
  const hidden = new Set([...state.dismissed, ...state.neverAskAgain]);
  return !hidden.has(recommendation.id);
};

export function scoreMissionForConcierge({ result = {}, recommendations = [] } = {}) {
  const base = result.type === "travel" ? 72 : 60;
  const riskPenalty = recommendations.reduce((sum, rec) => {
    if (rec.priority === "critical") return sum + 26;
    if (rec.priority === "high") return sum + 16;
    if (rec.priority === "medium") return sum + 8;
    return sum + 2;
  }, 0);
  const evidenceBonus = recommendations.some((rec) => rec.sourceState === "verified_live") ? 6 : 0;
  return clamp(base - riskPenalty + evidenceBonus, 0, 100);
}

export function createAITravelConcierge({ result = {}, language = "en", state = {}, scenario = "", now = new Date().toISOString() } = {}) {
  const normalizedState = createConciergeState(state);
  const signalRecommendations = buildSignalRecommendations({ result, language });
  const derivedRecommendations = buildDerivedRecommendations({ result, language });
  const demoRecommendations = scenario === "founder-demo" || result.conciergeScenario === "founder-demo"
    ? buildFounderDemoRecommendations({ result, language })
    : [];
  const unique = new Map([...signalRecommendations, ...derivedRecommendations, ...demoRecommendations].map((rec) => [rec.id, rec]));
  const recommendations = [...unique.values()]
    .filter((rec) => notHiddenByState(rec, normalizedState))
    .sort((a, b) => b.rankingScore - a.rankingScore)
    .slice(0, 6);
  const missionScore = scoreMissionForConcierge({ result, recommendations });
  const accepted = new Set(normalizedState.accepted);
  const acceptedRecommendations = [...unique.values()].filter((rec) => accepted.has(rec.id));
  const limited = !recommendations.length;
  return Object.freeze({
    version: AI_TRAVEL_CONCIERGE_VERSION,
    missionId: clean(result.id || result.reference || "current"),
    status: limited ? "limited" : "ready",
    missionScore,
    missionScoreLabel: missionScore >= 82 ? "strong" : missionScore >= 64 ? "good" : "needs_attention",
    recommendations: Object.freeze(recommendations),
    acceptedRecommendations: Object.freeze(acceptedRecommendations),
    limitations: Object.freeze(limited ? [
      local(language,
        "Concierge recommendations are limited because no measurable provider update is available.",
        "측정 가능한 제공업체 업데이트가 없어 컨시어지 추천이 제한됩니다.",
        "Las recomendaciones son limitadas porque no hay datos medibles del proveedor."
      )
    ] : []),
    controls: Object.freeze(["accept", "dismiss", "remind_later", "never_ask_again"]),
    generatedAt: now,
    userControl: Object.freeze({
      neverExecutesAutomatically: true,
      confirmedMissionProtected: true,
      requiresApprovalForMissionChange: true
    })
  });
}

export function applyConciergeRecommendation(stateInput = {}, recommendation = {}, action = CONCIERGE_ACTIONS.ACCEPT) {
  const state = createConciergeState(stateInput);
  const id = clean(recommendation.id);
  if (!id) return state;
  const removeId = (items) => asArray(items).filter((item) => item !== id);
  const withId = (items) => Object.freeze([...new Set([...removeId(items), id])]);
  const updated = { ...state, accepted: removeId(state.accepted), dismissed: removeId(state.dismissed), remindLater: removeId(state.remindLater), neverAskAgain: removeId(state.neverAskAgain), updatedAt: new Date().toISOString() };
  if (action === CONCIERGE_ACTIONS.ACCEPT) {
    updated.accepted = withId(state.accepted);
    updated.undoStack = Object.freeze([...state.undoStack, Object.freeze({ id, action, patch: recommendation.patch || {}, at: updated.updatedAt })].slice(-10));
  } else if (action === CONCIERGE_ACTIONS.DISMISS) {
    updated.dismissed = withId(state.dismissed);
  } else if (action === CONCIERGE_ACTIONS.REMIND_LATER) {
    updated.remindLater = withId(state.remindLater);
  } else if (action === CONCIERGE_ACTIONS.NEVER_ASK_AGAIN) {
    updated.neverAskAgain = withId(state.neverAskAgain);
  } else if (action === CONCIERGE_ACTIONS.UNDO) {
    updated.accepted = removeId(state.accepted);
    updated.undoStack = Object.freeze(state.undoStack.filter((item) => item.id !== id));
  }
  return createConciergeState(updated);
}

export function shouldSuggestMemoryFromConcierge(stateInput = {}, recommendation = {}) {
  const state = createConciergeState(stateInput);
  const acceptedCount = state.accepted.filter((id) => id === recommendation.id || id.startsWith(recommendation.category)).length;
  return Object.freeze({
    shouldAsk: acceptedCount >= 2,
    requiresExplicitConfirmation: true,
    suggestedMemory: acceptedCount >= 2 ? {
      category: recommendation.category,
      value: recommendation.recommendation,
      reason: "Repeated accepted concierge recommendation"
    } : null
  });
}
