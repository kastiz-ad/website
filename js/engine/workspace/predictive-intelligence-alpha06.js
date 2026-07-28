import { generateFutureMissionSuggestions, shouldShowPrediction } from "../prediction/prediction-engine-v15.js";

export const ALPHA06_PREDICTIVE_INTELLIGENCE_VERSION = "ALPHA-06";
export const MAX_ALPHA06_PROACTIVE_CARDS = 3;

const PRIORITY_WEIGHT = Object.freeze({
  Critical: 400,
  Important: 300,
  Helpful: 180,
  Interesting: 60
});

const AUTO_PRIORITIES = new Set(["Critical", "Important"]);
const SUPPORTED_LANGUAGES = new Set(["en", "ko", "es"]);

const copy = Object.freeze({
  en: {
    title: "ONE noticed what may matter next",
    subtitle: "Quiet preparation only. Nothing executes without approval.",
    why: "Why this appeared",
    confidence: "Confidence",
    review: "Review",
    ignore: "Ignore",
    notRelevant: "Not relevant",
    learn: "Learn more",
    collapsed: "Helpful ideas kept quiet",
    prepare: "Prepare only",
    documentTitle: "Review passport or entry documents",
    documentWhy: "This looks like international travel, so entry documents may matter before booking.",
    weatherTitle: "Prepare the right weather backup",
    weatherWhy: "Destination, season, or weather context can affect clothing and indoor alternatives.",
    dateTitle: "Confirm time-sensitive items before departure",
    dateWhy: "The selected dates are close enough that availability and schedules may change.",
    hotelTitle: "Recheck accommodation availability",
    hotelWhy: "Accommodation data is prepared from prototype or public sources and should be refreshed before approval.",
    currencyTitle: "Prepare currency and spending range",
    currencyWhy: "The destination uses a different currency, so budget and exchange estimates matter.",
    businessTitle: "Prepare the next official document step",
    businessWhy: "Business missions usually depend on document order, office timing, and follow-up registrations.",
    healthcareTitle: "Prepare visit information before contacting providers",
    healthcareWhy: "Healthcare missions are smoother when intake details are ready, without diagnosing.",
    educationTitle: "Match choices to deadlines and learning goals",
    educationWhy: "Education missions often depend on exam dates, admissions windows, or class availability.",
    careerTitle: "Prepare the application package",
    careerWhy: "Career missions usually need resume, language, visa, timing, and salary context.",
    financeTitle: "Keep payment and financial steps external",
    financeWhy: "Sensitive financial actions must stay behind trusted provider authentication.",
    generalTitle: "Confirm the next approval boundary",
    generalWhy: "ONE can prepare the next step, but real-world actions still need explicit approval."
  },
  ko: {
    title: "ONE이 다음에 중요할 일을 감지했어요",
    subtitle: "조용히 준비만 합니다. 승인 없이 실행하지 않습니다.",
    why: "나타난 이유",
    confidence: "확신도",
    review: "검토",
    ignore: "무시",
    notRelevant: "관련 없음",
    learn: "더 보기",
    collapsed: "조용히 보관한 도움 아이디어",
    prepare: "준비만 하기",
    documentTitle: "여권 또는 입국 서류 확인",
    documentWhy: "해외 이동으로 보이기 때문에 예약 전 입국 서류가 중요할 수 있습니다.",
    weatherTitle: "날씨와 실내 대안 준비",
    weatherWhy: "목적지, 계절, 날씨 조건이 옷차림과 실내 대안에 영향을 줄 수 있습니다.",
    dateTitle: "출발 전 시간 민감 항목 확인",
    dateWhy: "선택한 날짜가 있어 가격, 가능 여부, 일정이 바뀔 수 있습니다.",
    hotelTitle: "숙소 가능 여부 재확인",
    hotelWhy: "숙소 정보는 프로토타입 또는 공개 자료 기반이므로 승인 전 다시 확인해야 합니다.",
    currencyTitle: "환전과 지출 범위 준비",
    currencyWhy: "목적지 통화가 다르면 예산과 환율 예상이 중요합니다.",
    businessTitle: "다음 공식 서류 단계 준비",
    businessWhy: "사업 미션은 서류 순서, 기관 일정, 후속 등록이 중요합니다.",
    healthcareTitle: "진료 전 접수 정보 준비",
    healthcareWhy: "의료 미션은 진단 없이 접수 정보만 정리해도 훨씬 수월합니다.",
    educationTitle: "마감일과 학습 목표에 맞추기",
    educationWhy: "교육 미션은 시험일, 접수 기간, 수업 가능 여부에 영향을 받습니다.",
    careerTitle: "지원 패키지 준비",
    careerWhy: "커리어 미션은 이력서, 언어, 비자, 일정, 희망 조건이 중요합니다.",
    financeTitle: "금융 단계는 외부 인증으로 보호",
    financeWhy: "민감한 금융 행동은 신뢰된 제공업체 인증 화면 뒤에 있어야 합니다.",
    generalTitle: "다음 승인 경계 확인",
    generalWhy: "ONE은 다음 단계를 준비할 수 있지만 실제 행동은 명확한 승인 후에만 가능합니다."
  },
  es: {
    title: "ONE detectó lo que puede importar después",
    subtitle: "Solo preparación tranquila. Nada se ejecuta sin aprobación.",
    why: "Por qué apareció",
    confidence: "Confianza",
    review: "Revisar",
    ignore: "Ignorar",
    notRelevant: "No relevante",
    learn: "Ver más",
    collapsed: "Ideas útiles guardadas en silencio",
    prepare: "Solo preparar",
    documentTitle: "Revisar pasaporte o documentos de entrada",
    documentWhy: "Parece un viaje internacional, así que los documentos de entrada pueden importar antes de reservar.",
    weatherTitle: "Preparar clima y alternativa interior",
    weatherWhy: "Destino, temporada o clima pueden afectar ropa y alternativas bajo techo.",
    dateTitle: "Confirmar puntos sensibles antes de salir",
    dateWhy: "Las fechas seleccionadas pueden afectar disponibilidad, precios y horarios.",
    hotelTitle: "Revisar disponibilidad de alojamiento",
    hotelWhy: "El alojamiento usa datos públicos o de prototipo y debe actualizarse antes de aprobar.",
    currencyTitle: "Preparar moneda y rango de gasto",
    currencyWhy: "La moneda del destino puede cambiar el presupuesto y las estimaciones.",
    businessTitle: "Preparar el siguiente documento oficial",
    businessWhy: "Las misiones de negocio dependen del orden de documentos, oficinas y registros posteriores.",
    healthcareTitle: "Preparar información antes de contactar proveedores",
    healthcareWhy: "La atención médica mejora con datos de ingreso preparados, sin diagnosticar.",
    educationTitle: "Alinear opciones con fechas y metas",
    educationWhy: "Educación suele depender de exámenes, admisiones o disponibilidad de clases.",
    careerTitle: "Preparar el paquete de solicitud",
    careerWhy: "Carrera suele necesitar CV, idioma, visa, fechas y salario.",
    financeTitle: "Mantener pagos y finanzas en proveedores externos",
    financeWhy: "Las acciones financieras sensibles deben usar autenticación externa confiable.",
    generalTitle: "Confirmar el próximo límite de aprobación",
    generalWhy: "ONE puede preparar el paso siguiente, pero toda acción real requiere aprobación."
  }
});

const clean = (value, limit = 300) => String(value ?? "")
  .normalize("NFKC")
  .replace(/[<>]/g, "")
  .trim()
  .slice(0, limit);

const normalizeLanguage = (language) => SUPPORTED_LANGUAGES.has(language) ? language : "en";
const local = (language, key) => copy[normalizeLanguage(language)]?.[key] || copy.en[key] || key;
const list = (value) => Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));

const idFrom = (...parts) => parts
  .map((part) => clean(part, 80).toLowerCase())
  .join("-")
  .replace(/[^\p{L}\p{N}]+/gu, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 72) || "prediction";

const safeDate = (value) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const daysUntil = (value, now = new Date()) => {
  const date = safeDate(value);
  if (!date) return null;
  return Math.ceil((date.getTime() - now.getTime()) / 86400000);
};

const addDays = (now, days) => {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
};

const lower = (value) => clean(value, 500).toLowerCase();

const destinationLabel = (result = {}) => clean(
  result.destination?.city
  || result.destination?.name
  || result.destination?.country
  || result.countryProfile?.name
  || result.country
  || ""
);

const countryLabel = (result = {}) => clean(
  result.destination?.country
  || result.countryProfile?.name
  || result.country
  || ""
);

const isInternationalTravel = (result = {}, context = {}) => {
  const domain = lower(result.type || result.domain || result.resolutionPlan?.domain);
  if (domain !== "travel" && !result.destination) return false;
  const country = lower(countryLabel(result));
  const current = lower(context.currentLocation || context.location?.current?.country || context.location?.current?.city || "");
  if (!country) return false;
  if (/south korea|korea|republic of korea|대한민국|한국/.test(country)) return false;
  if (!current) return true;
  return !country.includes(current) && !current.includes(country);
};

const sourceStateFromWorld = (worldIntelligence, group) => {
  const items = worldIntelligence?.models?.[group];
  if (!Array.isArray(items) || !items.length) return "estimated";
  if (items.some((item) => item.sourceState === "verified_live")) return "verified_live";
  if (items.some((item) => item.sourceState === "cached_public")) return "cached_public";
  if (items.some((item) => item.sourceState === "estimated")) return "estimated";
  if (items.some((item) => item.sourceState === "placeholder")) return "placeholder";
  return "unavailable";
};

function makePrediction({
  id,
  type,
  domain,
  title,
  explanation,
  reason,
  sourceSignals,
  priority = "Important",
  confidence = 0.75,
  expiry = null,
  actionLabel = null,
  missionImpact = {},
  source = "alpha06"
}) {
  const predictionId = `alpha06-${idFrom(id || type || title)}`;
  return Object.freeze({
    predictionId,
    id: predictionId,
    version: ALPHA06_PREDICTIVE_INTELLIGENCE_VERSION,
    type: clean(type || "future-need"),
    domain: clean(domain || "general"),
    title: clean(title, 120),
    explanation: clean(explanation, 220),
    reason: clean(reason, 220),
    source: clean(source),
    sourceSignals: Object.freeze(list(sourceSignals).map((item) => clean(item, 80)).filter(Boolean)),
    priority: PRIORITY_WEIGHT[priority] ? priority : "Helpful",
    confidence: clamp(confidence, 0, 0.99),
    expiry,
    actionLabel: clean(actionLabel || ""),
    missionImpact: Object.freeze({
      potentialBenefit: clean(missionImpact.potentialBenefit || ""),
      potentialSavings: clean(missionImpact.potentialSavings || ""),
      potentialTimeSaved: clean(missionImpact.potentialTimeSaved || ""),
      potentialRiskAvoided: clean(missionImpact.potentialRiskAvoided || ""),
      potentialConvenienceGained: clean(missionImpact.potentialConvenienceGained || "")
    }),
    lifecycle: "validated",
    status: "suggestion_prepared",
    userControl: Object.freeze(["dismiss", "not_relevant", "hide_for_mission", "remember_preference"]),
    approvalRequiredBeforeAction: true,
    executionEnabled: false,
    externalCallsEnabled: false
  });
}

function domainFromResult(result = {}) {
  return clean(result.resolutionPlan?.domain || result.domain || result.type || (result.destination ? "travel" : "general")).toLowerCase();
}

function travelPredictions({ result, context, worldIntelligence, language, now }) {
  const destination = destinationLabel(result);
  const country = countryLabel(result);
  const startDate = result.schedule?.startDate;
  const days = daysUntil(startDate, now);
  const sourceSignals = ["mission:travel", destination ? "destination" : "", country ? "country" : ""].filter(Boolean);
  const predictions = [];

  if (isInternationalTravel(result, context)) {
    predictions.push(makePrediction({
      id: "travel-documents",
      type: "document-readiness",
      domain: "travel",
      title: local(language, "documentTitle"),
      explanation: destination ? `${destination}: ${local(language, "documentWhy")}` : local(language, "documentWhy"),
      reason: local(language, "documentWhy"),
      sourceSignals,
      priority: "Critical",
      confidence: country ? 0.94 : 0.82,
      expiry: startDate || addDays(now, 30),
      actionLabel: local(language, "review"),
      missionImpact: { potentialRiskAvoided: "Entry or airline check-in issue avoided" }
    }));
  }

  if (startDate && days !== null && days >= 0 && days <= 21) {
    predictions.push(makePrediction({
      id: "travel-date-sensitive",
      type: "date-sensitive-check",
      domain: "travel",
      title: local(language, "dateTitle"),
      explanation: local(language, "dateWhy"),
      reason: `${local(language, "dateWhy")} (${startDate})`,
      sourceSignals: [...sourceSignals, "schedule.startDate"],
      priority: days <= 7 ? "Critical" : "Important",
      confidence: 0.9,
      expiry: startDate,
      actionLabel: local(language, "review"),
      missionImpact: { potentialRiskAvoided: "Availability or price surprise reduced" }
    }));
  }

  const missionText = lower(`${result.rawInput || ""} ${result.mission || ""} ${destination} ${country}`);
  const month = Number(String(startDate || "").slice(5, 7));
  if ([12, 1, 2].includes(month) || /sapporo|hokkaido|reykjavik|iceland|snow|winter|ski|삿포로|홋카이도|겨울|눈|invierno|nieve/.test(missionText)) {
    predictions.push(makePrediction({
      id: "travel-weather-prep",
      type: "weather-preparation",
      domain: "travel",
      title: local(language, "weatherTitle"),
      explanation: local(language, "weatherWhy"),
      reason: local(language, "weatherWhy"),
      sourceSignals: [...sourceSignals, "season/weather"],
      priority: "Important",
      confidence: 0.83,
      expiry: startDate || addDays(now, 14),
      actionLabel: local(language, "prepare"),
      missionImpact: { potentialConvenienceGained: "Packing and indoor backup prepared" }
    }));
  }

  const hotelState = sourceStateFromWorld(worldIntelligence || result.worldIntelligence, "hotels");
  if (["estimated", "placeholder", "unavailable"].includes(hotelState)) {
    predictions.push(makePrediction({
      id: "travel-hotel-recheck",
      type: "availability-refresh",
      domain: "travel",
      title: local(language, "hotelTitle"),
      explanation: local(language, "hotelWhy"),
      reason: local(language, "hotelWhy"),
      sourceSignals: [...sourceSignals, `world.hotels:${hotelState}`],
      priority: "Important",
      confidence: hotelState === "unavailable" ? 0.88 : 0.76,
      expiry: startDate || addDays(now, 14),
      actionLabel: local(language, "review"),
      missionImpact: { potentialRiskAvoided: "Unavailable hotel or stale price caught before approval" }
    }));
  }

  const currency = clean(result.countryProfile?.currency || result.destination?.currency || "");
  if (currency && currency !== "KRW") {
    predictions.push(makePrediction({
      id: `travel-currency-${currency}`,
      type: "currency-preparation",
      domain: "finance",
      title: local(language, "currencyTitle"),
      explanation: `${currency}: ${local(language, "currencyWhy")}`,
      reason: local(language, "currencyWhy"),
      sourceSignals: [...sourceSignals, "country.currency"],
      priority: "Helpful",
      confidence: 0.74,
      expiry: addDays(now, 10),
      actionLabel: local(language, "learn"),
      missionImpact: { potentialConvenienceGained: "Budget range prepared in local currency" }
    }));
  }

  return predictions;
}

function domainPredictions({ result, language, now }) {
  const domain = domainFromResult(result);
  const mission = lower(`${result.rawInput || ""} ${result.mission || ""} ${result.resolutionPlan?.userProblem || ""} ${result.resolutionPlan?.missionType || ""}`);
  const byDomain = [];

  if (/business|company|registration|사업|법인|empresa|negocio/.test(`${domain} ${mission}`)) {
    byDomain.push(makePrediction({
      id: "business-documents",
      type: "official-document-sequence",
      domain: "business",
      title: local(language, "businessTitle"),
      explanation: local(language, "businessWhy"),
      reason: local(language, "businessWhy"),
      sourceSignals: ["domain:business", "approval:required"],
      priority: "Important",
      confidence: 0.82,
      expiry: addDays(now, 21),
      actionLabel: local(language, "review")
    }));
  }

  if (/health|hospital|clinic|dent|pharmacy|의료|병원|치과|약국|salud|cl[ií]nica/.test(`${domain} ${mission}`)) {
    byDomain.push(makePrediction({
      id: "healthcare-intake",
      type: "care-intake-readiness",
      domain: "healthcare",
      title: local(language, "healthcareTitle"),
      explanation: local(language, "healthcareWhy"),
      reason: local(language, "healthcareWhy"),
      sourceSignals: ["domain:healthcare", "safety:no-diagnosis"],
      priority: /urgent|emergency|today|오늘|응급/.test(mission) ? "Critical" : "Important",
      confidence: 0.84,
      expiry: addDays(now, 3),
      actionLabel: local(language, "prepare")
    }));
  }

  if (/education|academy|school|tutor|학원|학교|과외|educaci[oó]n|academia/.test(`${domain} ${mission}`)) {
    byDomain.push(makePrediction({
      id: "education-deadline-fit",
      type: "education-timing-fit",
      domain: "education",
      title: local(language, "educationTitle"),
      explanation: local(language, "educationWhy"),
      reason: local(language, "educationWhy"),
      sourceSignals: ["domain:education", "mission:learning"],
      priority: "Important",
      confidence: 0.78,
      expiry: addDays(now, 14),
      actionLabel: local(language, "review")
    }));
  }

  if (/career|job|resume|interview|일자리|취업|이력서|trabajo|empleo/.test(`${domain} ${mission}`)) {
    byDomain.push(makePrediction({
      id: "career-package",
      type: "application-readiness",
      domain: "career",
      title: local(language, "careerTitle"),
      explanation: local(language, "careerWhy"),
      reason: local(language, "careerWhy"),
      sourceSignals: ["domain:career", "mission:application"],
      priority: "Important",
      confidence: 0.8,
      expiry: addDays(now, 10),
      actionLabel: local(language, "prepare")
    }));
  }

  if (/finance|payment|bank|card|pay|결제|은행|카드|pago|banco/.test(`${domain} ${mission}`)) {
    byDomain.push(makePrediction({
      id: "finance-external-auth",
      type: "financial-safety",
      domain: "finance",
      title: local(language, "financeTitle"),
      explanation: local(language, "financeWhy"),
      reason: local(language, "financeWhy"),
      sourceSignals: ["domain:finance", "trusted-action-gateway"],
      priority: "Critical",
      confidence: 0.9,
      expiry: addDays(now, 7),
      actionLabel: local(language, "review")
    }));
  }

  if (!byDomain.length && domain !== "travel") {
    byDomain.push(makePrediction({
      id: "general-approval-boundary",
      type: "approval-boundary",
      domain: domain || "general",
      title: local(language, "generalTitle"),
      explanation: local(language, "generalWhy"),
      reason: local(language, "generalWhy"),
      sourceSignals: ["approval:first", `domain:${domain || "general"}`],
      priority: "Helpful",
      confidence: 0.7,
      expiry: addDays(now, 10),
      actionLabel: local(language, "review")
    }));
  }

  return byDomain;
}

function fromV15(input = {}, language = "en") {
  const generated = generateFutureMissionSuggestions({
    ...input,
    language
  });
  return generated.suggestions
    .filter((item) => shouldShowPrediction(item, { minimumConfidence: 0.72 }))
    .map((item) => makePrediction({
      id: `v15-${item.type}`,
      type: item.type,
      domain: item.nextMissionDraft?.missionType || item.type,
      title: item.title,
      explanation: item.why,
      reason: item.why,
      sourceSignals: item.sourceSignals,
      priority: item.confidence >= 0.82 ? "Important" : "Helpful",
      confidence: item.confidence,
      expiry: item.dueDate || null,
      actionLabel: local(language, "review"),
      source: "v15"
    }));
}

function activePreferencePenalty(prediction, preferenceMemory = {}) {
  const record = preferenceMemory[prediction.type] || preferenceMemory[prediction.domain] || {};
  const dismissals = Number(record.dismissed || record.notRelevant || 0);
  const accepted = Number(record.accepted || 0);
  return accepted * 0.04 - dismissals * 0.12;
}

function isExpired(prediction, now) {
  if (!prediction.expiry) return false;
  const expiry = safeDate(prediction.expiry);
  if (!expiry) return false;
  return expiry.getTime() < now.getTime();
}

function validatePrediction(prediction = {}, now = new Date()) {
  const problems = [];
  if (!prediction.title) problems.push("missing-title");
  if (!prediction.reason) problems.push("missing-reason");
  if (!prediction.sourceSignals?.length) problems.push("missing-evidence");
  if (prediction.executionEnabled !== false) problems.push("execution-enabled");
  if (prediction.externalCallsEnabled !== false) problems.push("external-calls-enabled");
  if (prediction.confidence < 0.62) problems.push("low-confidence");
  if (isExpired(prediction, now)) problems.push("expired");
  if (/expires in \d+ months/i.test(`${prediction.title} ${prediction.explanation} ${prediction.reason}`)) problems.push("fabricated-passport-expiry");
  return Object.freeze({
    ok: problems.length === 0,
    problems: Object.freeze(problems)
  });
}

function rankPredictions(predictions = [], { dismissed = {}, preferenceMemory = {}, now = new Date() } = {}) {
  const seen = new Map();
  for (const prediction of predictions) {
    if (!prediction) continue;
    if (dismissed[prediction.id] === "dismissed" || dismissed[prediction.id] === "hidden" || dismissed[prediction.id] === "not_relevant") continue;
    const validation = validatePrediction(prediction, now);
    if (!validation.ok) continue;
    const adjustedConfidence = clamp(prediction.confidence + activePreferencePenalty(prediction, preferenceMemory), 0, 0.99);
    if (adjustedConfidence < 0.62) continue;
    const scored = Object.freeze({
      ...prediction,
      confidence: adjustedConfidence,
      rankScore: Math.round(((PRIORITY_WEIGHT[prediction.priority] || 0) + adjustedConfidence * 100) * 100) / 100
    });
    const duplicateKey = `${scored.type}:${scored.domain}`;
    const current = seen.get(duplicateKey);
    if (!current || current.rankScore < scored.rankScore) seen.set(duplicateKey, scored);
  }
  return Object.freeze([...seen.values()].sort((a, b) => b.rankScore - a.rankScore || b.confidence - a.confidence));
}

export function splitVisiblePredictions(predictions = [], state = {}, options = {}) {
  const now = safeDate(options.now) || new Date();
  const ranked = rankPredictions(predictions, {
    dismissed: state.dismissed || {},
    preferenceMemory: state.preferenceMemory || {},
    now
  });
  const visibleCandidates = ranked.filter((item) => AUTO_PRIORITIES.has(item.priority));
  const visible = visibleCandidates.slice(0, MAX_ALPHA06_PROACTIVE_CARDS);
  const visibleIds = new Set(visible.map((item) => item.id));
  return Object.freeze({
    visible: Object.freeze(visible),
    collapsed: Object.freeze(ranked.filter((item) => !visibleIds.has(item.id))),
    hiddenLowConfidence: Object.freeze(predictions.filter((item) => !ranked.some((rankedItem) => rankedItem.id === item.id)).map((item) => item.id))
  });
}

export function predictionStorageKey(result = {}) {
  const basis = clean(result.id || result.reference || result.rawInput || result.mission || result.originalMission || "current", 100);
  return `kastiz-one-alpha06-predictions:${basis.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80)}`;
}

export function applyPredictionFeedback(state = {}, prediction = {}, feedback = "dismissed") {
  const type = clean(prediction.type || "unknown");
  const domain = clean(prediction.domain || "general");
  const nextState = {
    dismissed: { ...(state.dismissed || {}) },
    preferenceMemory: { ...(state.preferenceMemory || {}) },
    history: [...(state.history || [])]
  };
  if (prediction.id && ["dismissed", "hidden", "not_relevant"].includes(feedback)) {
    nextState.dismissed[prediction.id] = feedback;
  }
  const key = feedback === "accepted" ? "accepted" : feedback === "not_relevant" ? "notRelevant" : "dismissed";
  for (const bucket of [type, domain]) {
    nextState.preferenceMemory[bucket] = {
      ...(nextState.preferenceMemory[bucket] || {}),
      [key]: Number(nextState.preferenceMemory[bucket]?.[key] || 0) + 1
    };
  }
  nextState.history.push({
    predictionId: prediction.id || "",
    type,
    domain,
    feedback,
    timestamp: new Date().toISOString()
  });
  return Object.freeze(nextState);
}

export function createPredictiveIntelligenceLayer({
  result = {},
  context = {},
  worldIntelligence = null,
  orchestrator = null,
  language = "en",
  state = {},
  now = null
} = {}) {
  const normalizedLanguage = normalizeLanguage(language || result.language || result.interfaceLanguage);
  const currentTime = safeDate(now) || new Date();
  const domain = domainFromResult(result);
  const baseInput = {
    mission: result.rawInput || result.mission || result.originalMission || result.resolutionPlan?.userProblem || "",
    currentLocation: context.currentLocation || context.location?.current?.city || "",
    contextObject: context.contextObject,
    lifeMemory: context.lifeMemory,
    calendarEvents: context.calendarEvents || [],
    previousMissions: context.previousMissions || [],
    vehicle: context.vehicle,
    business: context.business,
    home: context.home,
    now: currentTime.toISOString()
  };

  const rawPredictions = [
    ...fromV15(baseInput, normalizedLanguage),
    ...(domain === "travel" || result.destination ? travelPredictions({ result, context, worldIntelligence, language: normalizedLanguage, now: currentTime }) : []),
    ...domainPredictions({ result, language: normalizedLanguage, now: currentTime })
  ];

  const split = splitVisiblePredictions(rawPredictions, state, { now: currentTime });
  const actionIds = new Set(orchestrator?.actionGraph?.nodes?.map((action) => action.id) || []);
  return Object.freeze({
    version: ALPHA06_PREDICTIVE_INTELLIGENCE_VERSION,
    domain,
    language: normalizedLanguage,
    generatedAt: currentTime.toISOString(),
    predictions: Object.freeze(rankPredictions(rawPredictions, {
      dismissed: state.dismissed || {},
      preferenceMemory: state.preferenceMemory || {},
      now: currentTime
    })),
    visible: split.visible,
    collapsed: split.collapsed,
    hiddenLowConfidence: split.hiddenLowConfidence,
    missionWorkspaceIntegration: Object.freeze({
      livingMissionCompatible: true,
      usesAlpha05ActionGraph: Boolean(orchestrator),
      knownActionIds: Object.freeze([...actionIds].slice(0, 20)),
      createsNewPage: false
    }),
    safety: Object.freeze({
      predictionsOnly: true,
      noExecution: true,
      noExternalProviderCalls: true,
      approvalRequiredBeforeAction: true,
      maximumProactiveCards: MAX_ALPHA06_PROACTIVE_CARDS
    }),
    lifecycle: Object.freeze(["detected", "validated", "displayed", "accepted_or_dismissed_or_expired"]),
    controls: Object.freeze(["dismiss", "not_relevant", "hide_for_mission", "remember_preference"])
  });
}

export function validatePredictiveIntelligence(layer = {}) {
  const problems = [];
  if (layer.version !== ALPHA06_PREDICTIVE_INTELLIGENCE_VERSION) problems.push("wrong-version");
  if (layer.visible?.length > MAX_ALPHA06_PROACTIVE_CARDS) problems.push("too-many-visible");
  if (layer.safety?.noExecution !== true || layer.safety?.noExternalProviderCalls !== true) problems.push("unsafe-execution");
  const duplicateIds = new Set();
  for (const prediction of layer.predictions || []) {
    if (duplicateIds.has(prediction.id)) problems.push(`duplicate:${prediction.id}`);
    duplicateIds.add(prediction.id);
    const validation = validatePrediction(prediction, safeDate(layer.generatedAt) || new Date());
    if (!validation.ok) problems.push(`${prediction.id}:${validation.problems.join(",")}`);
  }
  return Object.freeze({
    ok: problems.length === 0,
    problems: Object.freeze(problems),
    visibleCount: layer.visible?.length || 0,
    totalCount: layer.predictions?.length || 0
  });
}

export const ALPHA06_PREVIEW_SCENARIOS = Object.freeze([
  "travel-sapporo-winter",
  "travel-date-change",
  "business-registration",
  "healthcare-visit",
  "education-deadline",
  "career-application",
  "finance-external-auth"
]);
