const SOURCE_STATES = new Set(["verified_live", "cached_public", "estimated", "placeholder", "unavailable"]);

const clean = (value) => String(value || "").trim();
const lower = (value) => clean(value).toLowerCase();
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));

export const ALPHA01_INSIGHT_VERSION = "ALPHA-01";
export const MAX_VISIBLE_INSIGHTS = 3;

export const insightStorageKey = (result = {}) => {
  const id = clean(result.id || result.reference || result.rawInput || result.mission || "current");
  return `kastiz-one-alpha01-insights:${id.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80)}`;
};

export const normalizeInsightSourceState = (state) => SOURCE_STATES.has(state) ? state : "estimated";

const sourceStateFromWorld = (worldIntelligence, group, fallback = "estimated") => {
  const items = worldIntelligence?.models?.[group];
  if (!Array.isArray(items) || !items.length) return fallback;
  if (items.some((item) => item.sourceState === "verified_live")) return "verified_live";
  if (items.some((item) => item.sourceState === "cached_public")) return "cached_public";
  if (items.some((item) => item.sourceState === "estimated")) return "estimated";
  if (items.some((item) => item.sourceState === "placeholder")) return "placeholder";
  return "unavailable";
};

const local = (language, en, ko, es) => language === "ko" ? ko : language === "es" ? es : en;

const makeInsight = ({
  id,
  category,
  title,
  explanation,
  why,
  urgency = "medium",
  confidence = 0.7,
  sourceState = "estimated",
  actionRequired = false,
  priority = 50
}) => Object.freeze({
  id,
  category,
  title,
  explanation,
  why,
  urgency,
  confidence: clamp(confidence),
  sourceState: normalizeInsightSourceState(sourceState),
  actionRequired: actionRequired === true,
  priority: Number(priority) || 0,
  optional: true,
  blocksMission: false
});

const isWinterTrip = ({ result = {}, context = {}, mission = "" }) => {
  const month = Number(String(result.schedule?.startDate || "").slice(5, 7));
  return [12, 1, 2].includes(month)
    || /winter|snow|ski|festival|겨울|눈|스키|눈축제|invierno|nieve/i.test(mission)
    || /sapporo|hokkaido|삿포로|홋카이도/i.test(mission)
    || /sapporo|hokkaido/i.test(context?.destination?.city || result.destination?.city || "");
};

const hasFamilySignal = (mission = "", context = {}) => (
  /family|kids|children|parents|부모님|가족|아이|자녀|niños|familia|padres/i.test(mission)
  || ["family", "parents", "children"].includes(context?.relationship?.value)
);

const hasSoloSignal = (mission = "", context = {}) => (
  /solo|alone|혼자|혼행|solo|sola/i.test(mission)
  || context?.relationship?.value === "solo"
);

const destinationName = (result = {}, language = "en") => {
  const city = language === "ko" ? result.destination?.cityKo || result.destination?.city : result.destination?.city;
  const country = language === "ko" ? result.destination?.countryKo || result.destination?.country : result.destination?.country;
  return clean(city || country || result.countryProfile?.name || "destination");
};

const travelInsights = ({ result, context, language, worldIntelligence }) => {
  const mission = `${result?.rawInput || ""} ${result?.mission || ""} ${result?.originalMission || ""}`;
  const destination = destinationName(result, language);
  const insights = [];

  if (isWinterTrip({ result, context, mission })) {
    insights.push(makeInsight({
      id: "travel-winter-demand",
      category: "travel",
      title: local(language, `${destination} winter timing can affect stays`, `${destination} 겨울 일정은 숙소 가격에 영향을 줄 수 있어요`, `El invierno en ${destination} puede afectar hoteles`),
      explanation: local(language,
        "You may want to compare accommodation earlier if the trip overlaps snow or festival season.",
        "눈·축제 시즌과 겹치면 숙소 선택 폭과 가격이 빨리 바뀔 수 있어요.",
        "Conviene comparar alojamiento antes si coincide con nieve o temporada de festival."
      ),
      why: local(language,
        `Because this mission looks like a winter trip to ${destination}.`,
        `${destination} 겨울 여행으로 보이기 때문에 보여드려요.`,
        `Porque esta misión parece un viaje de invierno a ${destination}.`
      ),
      urgency: "high",
      confidence: 0.78,
      sourceState: sourceStateFromWorld(worldIntelligence, "hotels", "estimated"),
      actionRequired: false,
      priority: 94
    }));
  }

  if (hasFamilySignal(mission, context)) {
    insights.push(makeInsight({
      id: "travel-family-buffer",
      category: "travel",
      title: local(language, "Add a little more transfer buffer", "이동 시간 여유를 조금 더 두면 좋아요", "Deja más margen de traslado"),
      explanation: local(language,
        "Family trips usually feel smoother when airport, hotel, and meal transitions are not packed too tightly.",
        "가족 여행은 공항·숙소·식사 이동을 너무 빡빡하게 잡지 않을 때 훨씬 편해요.",
        "Los viajes en familia suelen ir mejor con traslados menos apretados."
      ),
      why: local(language, "Because this mission includes family or parents.", "가족 또는 부모님과 함께하는 일정으로 보이기 때문이에요.", "Porque la misión incluye familia o padres."),
      urgency: "medium",
      confidence: 0.74,
      sourceState: "estimated",
      actionRequired: false,
      priority: 82
    }));
  }

  if (hasSoloSignal(mission, context)) {
    insights.push(makeInsight({
      id: "travel-solo-safety",
      category: "travel",
      title: local(language, "Keep late-night movement simple", "늦은 시간 이동은 단순하게 잡는 게 좋아요", "Mantén simples los traslados nocturnos"),
      explanation: local(language,
        "ONE can keep the evening plan close to transit or the hotel so the trip feels easier and safer.",
        "저녁 일정은 교통이나 숙소 근처로 잡으면 더 편하고 안전하게 느껴질 수 있어요.",
        "ONE puede mantener la noche cerca del transporte o del hotel para mayor comodidad."
      ),
      why: local(language, "Because this looks like a solo trip.", "혼자 여행으로 보이기 때문에 보여드려요.", "Porque parece un viaje solo."),
      urgency: "medium",
      confidence: 0.72,
      sourceState: "estimated",
      actionRequired: false,
      priority: 78
    }));
  }

  const flightState = sourceStateFromWorld(worldIntelligence, "flights", "unavailable");
  if (result?.type === "travel" && flightState === "unavailable") {
    insights.push(makeInsight({
      id: "travel-live-flight-required",
      category: "travel",
      title: local(language, "Flight prices need live confirmation", "항공권 가격은 실시간 확인이 필요해요", "Los vuelos necesitan confirmación en vivo"),
      explanation: local(language,
        "ONE prepared the trip structure, but no live flight provider is connected in this prototype.",
        "ONE이 여행 구조는 준비했지만, 현재 프로토타입에는 실시간 항공권 제공업체가 연결되어 있지 않아요.",
        "ONE preparó la estructura, pero este prototipo no tiene proveedor de vuelos en vivo conectado."
      ),
      why: local(language, "Because V24 marks flight data as live-search required.", "V24가 항공 데이터를 실시간 검색 필요로 표시했기 때문이에요.", "Porque V24 marca los vuelos como búsqueda en vivo requerida."),
      urgency: "high",
      confidence: 0.96,
      sourceState: "unavailable",
      actionRequired: false,
      priority: 90
    }));
  }

  if (result?.schedule?.startDate && result?.schedule?.endDate) {
    insights.push(makeInsight({
      id: "travel-weather-window",
      category: "travel",
      title: local(language, "Weather should be checked near departure", "출발 전 날씨를 한 번 더 보면 좋아요", "Revisa el clima cerca de la salida"),
      explanation: local(language,
        "The plan can stay flexible until live weather is closer to the actual travel dates.",
        "실제 여행일이 가까워질수록 날씨가 더 정확해지니, 마지막에 한 번 더 확인하면 좋아요.",
        "El clima será más útil cerca de las fechas reales del viaje."
      ),
      why: local(language, "Because your mission includes selected travel dates.", "여행 날짜가 선택되어 있기 때문에 보여드려요.", "Porque la misión incluye fechas de viaje."),
      urgency: "low",
      confidence: 0.68,
      sourceState: sourceStateFromWorld(worldIntelligence, "weather", "estimated"),
      actionRequired: false,
      priority: 54
    }));
  }

  return insights;
};

const domainInsights = ({ result, context, language }) => {
  const plan = result?.resolutionPlan || {};
  const mission = `${result?.rawInput || ""} ${result?.mission || ""} ${plan.userProblem || ""}`;
  const domain = lower(plan.domain || result?.domain || result?.type || "");
  const missionType = lower(plan.missionType || result?.missionType || "");
  const insights = [];

  if (/health|care|clinic|hospital|dental|medical|약국|치과|병원|암|진료|salud|clínica/.test(`${domain} ${missionType} ${mission}`)) {
    insights.push(makeInsight({
      id: "healthcare-urgency-route",
      category: "healthcare",
      title: local(language, "Separate urgent from routine care", "긴급과 일반 진료를 먼저 나누면 좋아요", "Separa urgencia y atención normal"),
      explanation: local(language,
        "ONE can prepare same-day options, but emergency symptoms should go through emergency services instead of provider ranking.",
        "ONE이 당일 진료 후보를 준비할 수 있지만, 응급 증상은 병원 순위가 아니라 응급 경로로 봐야 해요.",
        "ONE puede preparar opciones para hoy, pero síntomas de emergencia requieren una ruta de emergencia."
      ),
      why: local(language, "Because this mission involves healthcare navigation.", "의료기관을 찾는 미션이기 때문이에요.", "Porque esta misión trata de atención médica."),
      urgency: "high",
      confidence: 0.86,
      sourceState: "estimated",
      actionRequired: false,
      priority: 92
    }));
    insights.push(makeInsight({
      id: "healthcare-documents",
      category: "healthcare",
      title: local(language, "Prepare basic visit information", "진료 전 기본 정보를 준비하면 빨라요", "Prepara información básica"),
      explanation: local(language,
        "Insurance details, symptoms, medication list, and prior test images often reduce friction at reception.",
        "보험 정보, 증상, 복용약, 기존 검사 자료가 있으면 접수와 상담이 더 수월해요.",
        "Seguro, síntomas, medicamentos y pruebas previas reducen fricción."
      ),
      why: local(language, "Because clinics often need basic intake information.", "진료 접수에 기본 정보가 필요한 경우가 많기 때문이에요.", "Porque las clínicas suelen pedir información inicial."),
      urgency: "medium",
      confidence: 0.72,
      sourceState: "estimated",
      actionRequired: false,
      priority: 72
    }));
  }

  if (/education|academy|school|tutor|학원|과외|내신|수학|영어|educación|academia/.test(`${domain} ${missionType} ${mission}`)) {
    insights.push(makeInsight({
      id: "education-exam-calendar",
      category: "education",
      title: local(language, "Match the plan to exam timing", "시험 일정에 맞춰 비교하면 좋아요", "Alinea el plan con exámenes"),
      explanation: local(language,
        "The best academy fit depends on how soon the next exam or evaluation is.",
        "좋은 학원 선택은 다음 시험이나 평가가 얼마나 남았는지에 따라 달라져요.",
        "La mejor opción depende de cuánto falta para el próximo examen."
      ),
      why: local(language, "Because this mission is about learning support.", "학습 지원 미션으로 보이기 때문이에요.", "Porque la misión trata de apoyo educativo."),
      urgency: "medium",
      confidence: 0.76,
      sourceState: "estimated",
      actionRequired: false,
      priority: 76
    }));
  }

  if (/business|company|registration|사업|법인|창업|registro|empresa/.test(`${domain} ${missionType} ${mission}`)) {
    insights.push(makeInsight({
      id: "business-order",
      category: "business",
      title: local(language, "Order matters for registration steps", "사업 등록은 순서가 중요해요", "El orden de registro importa"),
      explanation: local(language,
        "ONE should prepare documents, official channel checks, and expert review before any filing.",
        "서류, 공식 채널 확인, 전문가 검토를 먼저 준비한 뒤 제출 여부를 승인받는 흐름이 안전해요.",
        "Conviene preparar documentos, canales oficiales y revisión antes de presentar."
      ),
      why: local(language, "Because this mission may involve official registration.", "공식 등록 절차가 포함될 수 있기 때문이에요.", "Porque puede incluir trámites oficiales."),
      urgency: "high",
      confidence: 0.82,
      sourceState: "estimated",
      actionRequired: false,
      priority: 88
    }));
  }

  if (/career|job|resume|cv|interview|일자리|취업|이력서|면접|trabajo|empleo/.test(`${domain} ${missionType} ${mission}`)) {
    insights.push(makeInsight({
      id: "career-application-readiness",
      category: "career",
      title: local(language, "Prepare the application package first", "지원 패키지를 먼저 준비하면 좋아요", "Prepara primero el paquete de solicitud"),
      explanation: local(language,
        "Resume, language ability, visa status, salary target, and availability affect which roles are worth pursuing.",
        "이력서, 언어, 비자 상태, 희망 연봉, 가능 일정이 맞아야 좋은 일자리를 고를 수 있어요.",
        "CV, idioma, visa, salario y disponibilidad cambian qué empleos convienen."
      ),
      why: local(language, "Because this mission is about job or application preparation.", "취업 또는 지원 준비 미션으로 보이기 때문이에요.", "Porque la misión trata de empleo o solicitud."),
      urgency: "medium",
      confidence: 0.78,
      sourceState: "estimated",
      actionRequired: false,
      priority: 78
    }));
  }

  return insights;
};

const experienceInsights = ({ result, context, language }) => {
  const mission = `${result?.rawInput || ""} ${result?.mission || ""} ${result?.originalMission || ""}`;
  if (!/date|데이트|girlfriend|boyfriend|여친|남친|anniversary|기념일|cita|romántica/i.test(mission)) return [];
  return [
    makeInsight({
      id: "experience-memory-arc",
      category: "experience",
      title: local(language, "End with one memorable moment", "마지막에 기억에 남는 순간을 넣으면 좋아요", "Termina con un momento memorable"),
      explanation: local(language,
        "For a date, ONE should not just list places—it should create a beginning, highlight, and soft ending.",
        "데이트는 장소 나열보다 시작, 하이라이트, 마무리가 이어질 때 더 기억에 남아요.",
        "Una cita funciona mejor con inicio, punto fuerte y cierre tranquilo."
      ),
      why: local(language, "Because this mission is relationship-focused.", "관계 중심의 미션으로 보이기 때문이에요.", "Porque la misión está centrada en una relación."),
      urgency: "medium",
      confidence: 0.8,
      sourceState: "estimated",
      actionRequired: false,
      priority: 84
    }),
    makeInsight({
      id: "experience-weather-backup",
      category: "experience",
      title: local(language, "Keep one indoor backup", "실내 대안 하나는 준비해둘게요", "Guarda una alternativa interior"),
      explanation: local(language,
        "A calm indoor backup keeps the plan from collapsing if weather or crowds change.",
        "날씨나 사람이 많을 때를 대비해 실내 대안을 하나 준비하면 일정이 무너지지 않아요.",
        "Una opción interior evita que el plan falle por clima o multitudes."
      ),
      why: local(language, "Because experience plans are sensitive to weather and crowd changes.", "경험 일정은 날씨와 혼잡도에 영향을 받기 때문이에요.", "Porque los planes de experiencia dependen del clima y aforo."),
      urgency: "low",
      confidence: 0.7,
      sourceState: "estimated",
      actionRequired: false,
      priority: 60
    })
  ];
};

const isGenericInsight = (insight) => {
  const joined = lower(`${insight.title} ${insight.explanation} ${insight.why}`);
  return !joined || ["plan ahead", "be careful", "check details", "prepare documents"].includes(joined);
};

export const prioritizeMissionInsights = (insights = []) => {
  const urgencyScore = { high: 30, medium: 18, low: 8 };
  const unique = new Map();
  insights.filter(Boolean).forEach((insight) => {
    if (isGenericInsight(insight)) return;
    if (unique.has(insight.id)) return;
    unique.set(insight.id, insight);
  });
  return [...unique.values()].sort((a, b) => (
    (b.priority + (urgencyScore[b.urgency] || 0) + b.confidence * 10)
    - (a.priority + (urgencyScore[a.urgency] || 0) + a.confidence * 10)
  ));
};

export const splitVisibleMissionInsights = (insights = [], dismissed = {}) => {
  const filtered = prioritizeMissionInsights(insights).filter((insight) => {
    const state = dismissed?.[insight.id];
    return state !== "dismissed" && state !== "hidden";
  });
  return Object.freeze({
    visible: filtered.slice(0, MAX_VISIBLE_INSIGHTS),
    collapsed: filtered.slice(MAX_VISIBLE_INSIGHTS)
  });
};

export const generateMissionInsights = ({
  result = {},
  context = {},
  language = "en",
  worldIntelligence = null
} = {}) => {
  const type = lower(result.type || result.resolutionPlan?.domain || result.domain);
  const insights = [];
  if (type === "travel" || result.worldIntelligence || result.destination) {
    insights.push(...travelInsights({ result, context, language, worldIntelligence: worldIntelligence || result.worldIntelligence }));
  }
  insights.push(...domainInsights({ result, context, language }));
  insights.push(...experienceInsights({ result, context, language }));
  return prioritizeMissionInsights(insights);
};
