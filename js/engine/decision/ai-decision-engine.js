export const AI_DECISION_ENGINE_VERSION = "AI_DECISION_ENGINE_V1";

const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const textOf = (value) => String(value || "").trim();
const lower = (value) => textOf(value).toLowerCase();
const uniqueById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const local = (language, en, ko, es) => language === "ko" ? ko : language === "es" ? es : en;

export const decisionMemoryKey = (result = {}) => {
  const id = result.missionId || result.id || result.reference || result.rawInput || result.mission || "mission";
  return `kastiz-one-ai-decision-memory:${id}`;
};

export const readDecisionMemory = (storage, key) => {
  try {
    return JSON.parse(storage?.getItem(key) || "{}");
  } catch {
    return {};
  }
};

export const recordDecisionFeedback = (storage, key, recommendationId, decision = "dismissed") => {
  if (!storage || !recommendationId) return {};
  const current = readDecisionMemory(storage, key);
  const records = { ...(current.records || {}) };
  records[recommendationId] = {
    decision,
    count: Number(records[recommendationId]?.count || 0) + 1,
    updatedAt: new Date().toISOString()
  };
  const next = { ...current, records };
  storage.setItem(key, JSON.stringify(next));
  return next;
};

const destinationLabel = (result = {}) => (
  result.destination?.city ||
  result.destination?.country ||
  result.countryProfile?.name ||
  result.display?.destination ||
  "destination"
);

const destinationKey = (result = {}) => lower(`${destinationLabel(result)} ${result.destination?.countryCode || result.countryProfile?.code || ""} ${result.rawInput || result.mission || ""}`);

const tripDays = (result = {}) => {
  const start = result.schedule?.startDate ? new Date(`${result.schedule.startDate}T00:00:00`) : null;
  const end = result.schedule?.endDate ? new Date(`${result.schedule.endDate}T00:00:00`) : null;
  if (start && end && !Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf())) {
    return Math.max(1, Math.round((end - start) / 86400000) + 1);
  }
  return Number(result.tripDays || result.duration || 0) || null;
};

const hasAny = (items = [], pattern) => asArray(items).some((item) => pattern.test(`${item.name || item.title || item.value || item} ${(item.tags || []).join(" ")}`));

const missionText = (result = {}) => lower([
  result.rawInput,
  result.mission,
  result.originalMission,
  ...(result.missionState?.hardConstraints || []),
  ...(result.missionState?.softPreferences || []),
  ...(result.missionState?.foodPreferences || []),
  ...(result.missionState?.mobilityRequirements || []),
  ...(result.revisionHistory || []).map((item) => item.command)
].join(" "));

export const analyzeMission = (result = {}) => {
  const text = missionText(result);
  const destination = destinationKey(result);
  const days = tripDays(result);
  const restaurants = asArray(result.restaurants || result.missionState?.restaurants);
  const places = asArray(result.places || result.missionState?.places);
  const hotels = asArray(result.hotels);
  const hasDisney = /disney|디즈니|ディズニー/.test(`${text} ${places.map((item) => item.name).join(" ")}`) || /japan|tokyo|osaka|kyoto|jp|일본|도쿄|오사카|교토/.test(destination);
  const hasMatcha = /matcha|말차|green tea/.test(`${text} ${restaurants.map((item) => item.name).join(" ")}`);
  const hasMobilityNeed = /no stairs|wheelchair|accessible|계단|휠체어|silla de ruedas/.test(text);
  const hasIndoor = hasAny(places, /aquarium|shopping|mall|teamlab|museum|indoor|수족관|쇼핑|실내/i);
  return {
    destination: destinationLabel(result),
    destinationKey: destination,
    tripDays: days,
    signals: {
      japan: /japan|tokyo|osaka|kyoto|jp|일본|도쿄|오사카|교토/.test(destination),
      international: Boolean(result.missionContext?.requiresInternationalTravel || result.type === "travel"),
      hasDisney,
      hasMatcha,
      hasMobilityNeed,
      hasIndoor,
      hotelCount: hotels.length,
      restaurantCount: restaurants.length,
      placeCount: places.length,
      hasSchedule: Boolean(result.schedule?.startDate && result.schedule?.endDate)
    }
  };
};

export const calculateMissionHealth = (analysis = {}) => {
  let score = 84;
  if (!analysis.signals?.hasSchedule) score -= 8;
  if (analysis.signals?.restaurantCount < Math.min(6, Math.max(3, analysis.tripDays || 4))) score -= 7;
  if (analysis.signals?.placeCount < Math.min(8, Math.max(4, analysis.tripDays || 5))) score -= 7;
  if (analysis.signals?.hasMobilityNeed) score -= 4;
  if (!analysis.signals?.hasIndoor) score -= 5;
  const label = score >= 88 ? "excellent" : score >= 76 ? "very_good" : "needs_attention";
  return { score, label };
};

const healthLabel = (language, label) => ({
  excellent: local(language, "Excellent", "훌륭함", "Excelente"),
  very_good: local(language, "Very Good", "아주 좋음", "Muy bien"),
  needs_attention: local(language, "Needs Attention", "확인 필요", "Requiere atención")
}[label] || local(language, "Very Good", "아주 좋음", "Muy bien"));

const makeRecommendation = ({ id, type, language, suggestion, reason, benefit, command, evidence = [], weight = 0.7 }) => ({
  id,
  type,
  suggestion: local(language, suggestion.en, suggestion.ko, suggestion.es),
  reason: local(language, reason.en, reason.ko, reason.es),
  expectedBenefit: local(language, benefit.en, benefit.ko, benefit.es),
  command,
  evidence,
  weight,
  consequence: "recommendation_only",
  approvalRequired: true
});

export const generateDecisionRecommendations = (result = {}, { language = "en", memory = {} } = {}) => {
  const analysis = analyzeMission(result);
  const recommendations = [];
  const add = (item) => recommendations.push(makeRecommendation({ language, ...item }));

  if (analysis.signals.hasDisney) {
    add({
      id: "move-disney-lower-crowd",
      type: "schedule",
      weight: 0.92,
      command: "Move Disney to Day 3.",
      suggestion: {
        en: "Move Disney away from the busiest day.",
        ko: "디즈니는 가장 붐비는 날을 피해서 배치해볼게요.",
        es: "Mover Disney fuera del día más congestionado."
      },
      reason: {
        en: "Theme parks usually need more buffer than normal sightseeing, especially on weekends.",
        ko: "테마파크는 일반 관광보다 대기와 이동 여유가 더 필요합니다.",
        es: "Un parque temático necesita más margen que una visita normal."
      },
      benefit: {
        en: "Likely smoother pacing; exact waits are checked live before approval.",
        ko: "일정이 더 여유로워질 가능성이 큽니다. 대기 시간은 승인 전 실시간으로 확인합니다.",
        es: "Ritmo más fluido; esperas exactas se verifican antes de aprobar."
      },
      evidence: ["mission_destination", "theme_park_pacing"]
    });
  }

  if (analysis.signals.japan && !analysis.signals.hasMatcha) {
    add({
      id: "add-matcha-route-stop",
      type: "food",
      weight: 0.86,
      command: "Add matcha ice cream.",
      suggestion: {
        en: "Add a matcha dessert stop between activities.",
        ko: "동선 중간에 말차 디저트 한 곳을 넣어볼게요.",
        es: "Agregar una parada de matcha entre actividades."
      },
      reason: {
        en: "It fits Japan naturally without changing flights, hotel, or the whole itinerary.",
        ko: "항공·숙소·전체 일정은 바꾸지 않고 일본 여행 감성만 살릴 수 있습니다.",
        es: "Encaja con Japón sin cambiar vuelos, hotel ni todo el itinerario."
      },
      benefit: {
        en: "Adds a memorable food moment with only food, route, map, and timeline affected.",
        ko: "음식·동선·지도·일정만 가볍게 업데이트됩니다.",
        es: "Añade un momento memorable tocando solo comida, ruta, mapa e itinerario."
      },
      evidence: ["destination_food_fit", "mission_orchestration_scope"]
    });
  }

  if (analysis.signals.hasMobilityNeed || /mother|mom|부모|어머니|엄마|madre/.test(missionText(result))) {
    add({
      id: "reduce-stairs-walking",
      type: "accessibility",
      weight: 0.84,
      command: "My mother cannot use stairs.",
      suggestion: {
        en: "Use easier transfers and fewer stairs.",
        ko: "환승과 계단이 적은 동선으로 바꿔볼게요.",
        es: "Usar traslados más fáciles y menos escaleras."
      },
      reason: {
        en: "Comfort matters more than squeezing in one extra stop when a companion may have mobility limits.",
        ko: "동행자 이동 부담이 있으면 장소 하나를 더 넣는 것보다 편한 동선이 중요합니다.",
        es: "Si alguien camina menos, la ruta cómoda importa más que añadir otra parada."
      },
      benefit: {
        en: "Improves accessibility; ONE refreshes routes, transport, restaurants, and timeline only.",
        ko: "접근성이 좋아지고 동선·이동·식당·일정만 업데이트됩니다.",
        es: "Mejora accesibilidad y actualiza solo ruta, transporte, comida e itinerario."
      },
      evidence: ["traveller_context", "accessibility_dependency"]
    });
  }

  if (analysis.signals.japan) {
    add({
      id: "hotel-hub-efficiency",
      type: "hotel",
      weight: 0.8,
      command: "Stay near Tokyo Station.",
      suggestion: {
        en: "Compare staying near a major transit hub.",
        ko: "주요 역 근처 숙소도 비교해볼게요.",
        es: "Comparar alojamiento cerca de una estación principal."
      },
      reason: {
        en: "A better hotel location can reduce repeated transfers across several days.",
        ko: "숙소 위치가 좋아지면 여러 날 반복되는 이동 부담이 줄어듭니다.",
        es: "Una mejor zona de hotel puede reducir traslados repetidos."
      },
      benefit: {
        en: "Potentially simpler daily routes; live prices are checked only after approval.",
        ko: "일별 동선이 단순해질 수 있습니다. 실제 가격은 승인 후 확인합니다.",
        es: "Rutas diarias más simples; precios se verifican tras aprobar."
      },
      evidence: ["hotel_location_dependency", "route_efficiency"]
    });
  }

  if (!analysis.signals.hasIndoor) {
    add({
      id: "rain-indoor-backup",
      type: "weather",
      weight: 0.78,
      command: "Add rain-friendly indoor options.",
      suggestion: {
        en: "Prepare one indoor backup for bad weather.",
        ko: "비가 올 때 갈 실내 대안을 하나 준비해둘게요.",
        es: "Preparar una alternativa interior por si llueve."
      },
      reason: {
        en: "Outdoor-heavy trips feel weaker if rain changes the day.",
        ko: "야외 일정이 많으면 비가 올 때 만족도가 떨어질 수 있습니다.",
        es: "Un viaje muy exterior sufre si cambia el clima."
      },
      benefit: {
        en: "Keeps the day usable without changing confirmed choices automatically.",
        ko: "확정 선택은 그대로 두고 날씨 대안만 준비합니다.",
        es: "Mantiene el día útil sin cambiar decisiones confirmadas."
      },
      evidence: ["weather_risk", "fallback_needed"]
    });
  }

  if (analysis.signals.restaurantCount > 0) {
    add({
      id: "restaurant-timing",
      type: "food",
      weight: 0.72,
      command: "Add restaurant timing.",
      suggestion: {
        en: "Place popular meals at better times.",
        ko: "인기 식당은 더 좋은 시간대로 배치해볼게요.",
        es: "Ubicar comidas populares en mejores horarios."
      },
      reason: {
        en: "Meal timing affects waiting, route flow, and how tired the day feels.",
        ko: "식사 시간은 대기, 동선, 피로도에 직접 영향을 줍니다.",
        es: "El horario de comida afecta espera, ruta y cansancio."
      },
      benefit: {
        en: "Improves flow; exact opening hours still require provider verification.",
        ko: "동선이 자연스러워집니다. 영업시간은 제공업체 확인이 필요합니다.",
        es: "Mejora el flujo; horarios exactos requieren verificación."
      },
      evidence: ["meal_timing", "route_flow"]
    });
  }

  const dismissed = memory.records || {};
  return uniqueById(recommendations)
    .filter((item) => dismissed[item.id]?.decision !== "dismissed" || dismissed[item.id]?.count < 2)
    .sort((a, b) => b.weight - a.weight);
};

export const createAIDecisionLayer = (result = {}, { language = "en", memory = {} } = {}) => {
  const analysis = analyzeMission(result);
  const health = calculateMissionHealth(analysis);
  const recommendations = generateDecisionRecommendations(result, { language, memory });
  const visibleRecommendations = health.label === "excellent" && recommendations.length < 2 ? [] : recommendations.slice(0, 3);
  return {
    version: AI_DECISION_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    statusLabel: healthLabel(language, health.label),
    healthLabel: health.label,
    internalHealthScore: health.score,
    analysis,
    recommendations,
    visibleRecommendations,
    maxVisible: 3,
    sourceState: "mission_data",
    execution: "recommendation_only"
  };
};
