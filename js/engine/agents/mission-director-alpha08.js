export const ALPHA08_MULTI_AGENT_COLLABORATION_VERSION = "ALPHA-08";
export const MAX_ALPHA08_PROACTIVE_PREDICTIONS = 3;

const SUPPORTED_LANGUAGES = new Set(["en", "ko", "es"]);
const DEFAULT_DURATION_MS = 12;

const clean = (value, limit = 320) => String(value ?? "")
  .normalize("NFKC")
  .replace(/[<>]/g, "")
  .trim()
  .slice(0, limit);

const normalizeLanguage = (language = "en") => SUPPORTED_LANGUAGES.has(language) ? language : "en";
const lower = (value) => clean(value, 1000).toLowerCase();
const list = (value) => Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
const clamp = (value, min = 0, max = 0.99) => Math.max(min, Math.min(max, Number(value) || 0));
const uniq = (items) => [...new Set(items.map((item) => clean(item)).filter(Boolean))];

const local = (language, en, ko, es) => {
  const lang = normalizeLanguage(language);
  if (lang === "ko") return ko || en;
  if (lang === "es") return es || en;
  return en;
};

const stableId = (...parts) => parts
  .map((part) => clean(part, 120).toLowerCase())
  .join("-")
  .replace(/[^\p{L}\p{N}]+/gu, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 96) || "alpha08";

function destinationLabel(input = {}) {
  const result = input.result || input;
  return clean(
    result.destination?.city
    || result.destination?.name
    || result.destination?.country
    || result.countryProfile?.name
    || result.display?.destination
    || result.missionContext?.destination?.city
    || result.missionContext?.destination?.country
    || ""
  );
}

function countryLabel(input = {}) {
  const result = input.result || input;
  return clean(
    result.destination?.country
    || result.countryProfile?.name
    || result.missionContext?.destination?.country
    || result.country
    || ""
  );
}

function missionText(input = {}) {
  const result = input.result || input;
  return clean([
    result.rawInput,
    result.originalMission,
    result.mission,
    result.goal,
    result.title?.en,
    result.title?.ko,
    result.title?.es,
    result.resolutionPlan?.userProblem
  ].filter(Boolean).join(" "), 1200);
}

function domainFromInput(input = {}) {
  const result = input.result || input;
  const explicit = lower(result.resolutionPlan?.domain || result.domain || result.type || result.providerType || "");
  const text = lower(missionText(result));
  if (explicit) return explicit;
  if (result.destination || /trip|travel|vacation|flight|hotel|여행|출장|viaje|viajar/.test(text)) return "travel";
  if (/business|company|registration|사업|법인|회사|empresa|negocio/.test(text)) return "business";
  if (/health|clinic|hospital|dent|pharmacy|병원|치과|약국|salud|cl[ií]nica/.test(text)) return "healthcare";
  if (/study|school|academy|tutor|학원|학교|유학|estudi/.test(text)) return "education";
  if (/job|career|resume|interview|취업|일자리|trabajo|empleo/.test(text)) return "career";
  return "general";
}

function evidenceWeight(evidence = []) {
  return list(evidence).reduce((score, item) => {
    const text = lower(item);
    if (/verified|official|provider|world intelligence|v24|memory|approved/.test(text)) return score + 0.04;
    if (/estimated|prototype|mock|fallback/.test(text)) return score + 0.01;
    return score + 0.02;
  }, 0);
}

function scoreOutput(output = {}) {
  return clamp(output.confidence, 0, 0.99) + evidenceWeight(output.evidence);
}

function makeSpecialistOutput(id, input = {}, patch = {}) {
  const language = normalizeLanguage(input.language);
  const destination = destinationLabel(input);
  const country = countryLabel(input);
  const destinationText = destination || country || local(language, "the mission location", "미션 위치", "la ubicación de la misión");
  const recommendation = patch.recommendation || local(
    language,
    `${patch.focus || "Mission"} prepared for ${destinationText}.`,
    `${destinationText} 기준으로 ${patch.focusKo || patch.focus || "미션"}을 준비했습니다.`,
    `${patch.focusEs || patch.focus || "Misión"} preparada para ${destinationText}.`
  );
  return Object.freeze({
    specialistId: id,
    subproblem: clean(patch.subproblem || patch.focus || id, 120),
    recommendation: clean(recommendation, 420),
    confidence: clamp(patch.confidence ?? 0.76, 0, 0.99),
    evidence: Object.freeze(uniq([
      ...(patch.evidence || []),
      destination ? "destination resolved" : "",
      country ? "country resolved" : "",
      input.worldIntelligence ? "V24 World Intelligence available" : "",
      input.personalMissionMemory?.applied?.length ? "ALPHA-07 mission memory shared" : ""
    ])),
    dependencies: Object.freeze(uniq(patch.dependencies || ["explicit user approval before action"])),
    expiry: patch.expiry || input.result?.schedule?.startDate || "before execution approval",
    status: patch.status || "prepared",
    durationMs: Number(patch.durationMs || DEFAULT_DURATION_MS)
  });
}

const SPECIALIST_DEFINITIONS = Object.freeze([
  {
    id: "travel",
    label: "Travel Specialist",
    domains: ["travel", "relocation", "family-vacation"],
    triggers: [/trip|travel|vacation|itinerary|여행|출장|viaje|viajar/i],
    owns: ["overall itinerary", "destination fit", "journey coherence"],
    run(input) {
      return makeSpecialistOutput("travel", input, {
        subproblem: "overall itinerary",
        focus: "Travel flow",
        focusKo: "여행 흐름",
        focusEs: "flujo de viaje",
        recommendation: local(
          input.language,
          `Keep the mission centered on ${destinationLabel(input) || "the resolved destination"} and combine schedule, mobility, weather backup, and approval-ready next steps.`,
          `${destinationLabel(input) || "확인된 목적지"} 중심으로 일정, 이동, 날씨 대안, 승인 전 준비 단계를 하나로 묶습니다.`,
          `Mantener la misión centrada en ${destinationLabel(input) || "el destino resuelto"} y unir horario, movilidad, clima alternativo y próximos pasos aprobables.`
        ),
        confidence: 0.88,
        evidence: ["mission classified as travel or destination mission"]
      });
    }
  },
  {
    id: "flights",
    label: "Flight Specialist",
    domains: ["travel", "relocation", "study-abroad", "family-vacation"],
    triggers: [/flight|airline|airport|항공|비행|공항|vuelo|aerol/i],
    owns: ["flight reasoning", "airport fit", "routing risk"],
    run(input) {
      const count = input.result?.flights?.length || 0;
      return makeSpecialistOutput("flights", input, {
        subproblem: "flight reasoning",
        focus: "Flights",
        focusKo: "항공편",
        focusEs: "vuelos",
        recommendation: local(
          input.language,
          count ? `Compare ${count} prepared flight options by route simplicity, total price range, schedule flexibility, and approval freshness.` : "Prepare flight search only when the mission distance requires it.",
          count ? `준비된 항공편 ${count}개를 노선 단순성, 총 가격대, 일정 유연성, 승인 전 최신성 기준으로 비교합니다.` : "이동 거리가 항공편을 필요로 할 때만 항공 검색을 준비합니다.",
          count ? `Comparar ${count} opciones de vuelo por ruta, precio total, flexibilidad y actualización antes de aprobar.` : "Preparar vuelos solo cuando la distancia lo requiera."
        ),
        confidence: count ? 0.84 : 0.62,
        evidence: count ? ["flight options present in mission result"] : ["flight need inferred by distance only"]
      });
    }
  },
  {
    id: "hotels",
    label: "Hotel Specialist",
    domains: ["travel", "relocation", "study-abroad", "family-vacation"],
    triggers: [/hotel|stay|accommodation|숙소|호텔|alojamiento|hotel/i],
    owns: ["accommodation reasoning", "location fit", "stay constraints"],
    run(input) {
      const count = input.result?.hotels?.length || 0;
      return makeSpecialistOutput("hotels", input, {
        subproblem: "accommodation reasoning",
        focus: "Hotels",
        focusKo: "숙소",
        focusEs: "hoteles",
        recommendation: local(
          input.language,
          count ? `Rank prepared stays by location fit, nightly range, transit convenience, and user memory.` : "Use destination-level accommodation fallback if live hotel data is unavailable.",
          count ? `준비된 숙소를 위치 적합도, 1박 가격대, 이동 편의성, 사용자 기억 기준으로 정렬합니다.` : "실시간 숙소 데이터가 없으면 목적지 기반 숙소 대안을 사용합니다.",
          count ? `Ordenar alojamientos por ubicación, precio por noche, transporte y memoria del usuario.` : "Usar alternativa de alojamiento por destino si no hay datos en vivo."
        ),
        confidence: count ? 0.83 : 0.66,
        evidence: count ? ["hotel options present in mission result"] : ["fallback accommodation strategy"]
      });
    }
  },
  {
    id: "restaurants",
    label: "Restaurant Specialist",
    domains: ["travel", "date", "family-vacation", "local"],
    triggers: [/restaurant|food|dinner|lunch|meal|맛집|식당|음식|comida|restaurante/i],
    owns: ["food recommendations", "meal timing", "diet preference fit"],
    run(input) {
      const count = input.result?.restaurants?.length || 0;
      return makeSpecialistOutput("restaurants", input, {
        subproblem: "food recommendations",
        focus: "Restaurants",
        focusKo: "식사",
        focusEs: "restaurantes",
        recommendation: local(
          input.language,
          count ? `Use ${count} prepared food options and keep them aligned with destination, schedule, budget, and dietary memory.` : "Prepare food fallback by local cuisine, schedule timing, and user preferences.",
          count ? `준비된 식사 옵션 ${count}개를 목적지, 일정, 예산, 식성 기억에 맞춰 사용합니다.` : "현지 음식, 일정 시간대, 사용자 선호도에 맞춰 식사 대안을 준비합니다.",
          count ? `Usar ${count} opciones de comida alineadas con destino, horario, presupuesto y memoria alimentaria.` : "Preparar comidas por cocina local, horario y preferencias."
        ),
        confidence: count ? 0.82 : 0.64,
        evidence: count ? ["restaurant options present in mission result"] : ["restaurant fallback required"]
      });
    }
  },
  {
    id: "logistics",
    label: "Logistics Specialist",
    domains: ["travel", "relocation", "business", "healthcare", "education", "career", "home-services", "family-vacation"],
    triggers: [/transport|route|move|transfer|delivery|이동|교통|경로|traslado|ruta/i],
    owns: ["local movement", "timing dependencies", "handoff sequence"],
    run(input) {
      return makeSpecialistOutput("logistics", input, {
        subproblem: "movement and sequence",
        focus: "Logistics",
        focusKo: "이동과 순서",
        focusEs: "logística",
        recommendation: local(
          input.language,
          "Sequence the mission so the user avoids unnecessary movement, repeated forms, and duplicate provider contact.",
          "불필요한 이동, 반복 입력, 중복 제공업체 연락을 줄이도록 미션 순서를 정리합니다.",
          "Ordenar la misión para evitar traslados innecesarios, formularios repetidos y contactos duplicados."
        ),
        confidence: 0.79,
        evidence: ["shared mission sequence"]
      });
    }
  },
  {
    id: "visa",
    label: "Visa Specialist",
    domains: ["travel", "relocation", "study-abroad", "government"],
    triggers: [/visa|passport|immigration|entry|비자|여권|이민|입국|visado|pasaporte/i],
    owns: ["entry requirements", "document boundaries", "official-source reminder"],
    run(input) {
      return makeSpecialistOutput("visa", input, {
        subproblem: "entry and documents",
        focus: "Visa",
        focusKo: "비자",
        focusEs: "visado",
        recommendation: local(
          input.language,
          "Prepare entry-document checks, but refresh official government or embassy requirements before approval.",
          "입국 서류 확인을 준비하되 승인 전 정부 또는 대사관 기준으로 다시 확인합니다.",
          "Preparar revisión de entrada y actualizar requisitos oficiales antes de aprobar."
        ),
        confidence: countryLabel(input) ? 0.78 : 0.58,
        evidence: ["official-source refresh required before execution"],
        dependencies: ["passport/visa data only through approved secure review when needed"]
      });
    }
  },
  {
    id: "insurance",
    label: "Insurance Specialist",
    domains: ["travel", "healthcare", "relocation", "family-vacation"],
    triggers: [/insurance|coverage|health|travel risk|보험|보장|seguro/i],
    owns: ["coverage readiness", "risk transfer"],
    run(input) {
      return makeSpecialistOutput("insurance", input, {
        subproblem: "insurance readiness",
        focus: "Insurance",
        focusKo: "보험",
        focusEs: "seguro",
        recommendation: local(
          input.language,
          "Prepare coverage comparison and only request external authentication or purchase after explicit approval.",
          "보장 비교만 준비하고 외부 인증 또는 구매는 명확한 승인 후에만 진행합니다.",
          "Preparar comparación de cobertura; compra o autenticación externa solo tras aprobación explícita."
        ),
        confidence: 0.72,
        evidence: ["approval-first financial boundary"]
      });
    }
  },
  {
    id: "finance",
    label: "Finance Specialist",
    domains: ["travel", "business", "shopping", "finance", "relocation"],
    triggers: [/budget|price|payment|tax|cost|예산|가격|비용|결제|세금|presupuesto|precio|pago/i],
    owns: ["budget reasoning", "payment boundary", "cost risk"],
    run(input) {
      return makeSpecialistOutput("finance", input, {
        subproblem: "budget and payment boundary",
        focus: "Budget",
        focusKo: "예산",
        focusEs: "presupuesto",
        recommendation: local(
          input.language,
          "Keep cost ranges transparent and require renewed approval if a material price changes.",
          "비용 범위를 투명하게 유지하고 중요한 가격 변경 시 재승인을 요구합니다.",
          "Mantener rangos de costo claros y pedir nueva aprobación ante cambios materiales."
        ),
        confidence: input.result?.budget ? 0.82 : 0.68,
        evidence: input.result?.budget ? ["budget object present"] : ["budget fallback required"]
      });
    }
  },
  {
    id: "business",
    label: "Business Specialist",
    domains: ["business", "government", "relocation"],
    triggers: [/business|company|registration|사업|회사|법인|empresa|negocio/i],
    owns: ["business setup", "registration sequence", "operations readiness"],
    run(input) {
      return makeSpecialistOutput("business", input, {
        subproblem: "business setup sequence",
        focus: "Business setup",
        focusKo: "사업 준비",
        focusEs: "preparación empresarial",
        recommendation: "Prepare company setup as documents, office/channel, tax/accounting, banking, and approval-safe submissions.",
        confidence: 0.8,
        evidence: ["business mission routing"]
      });
    }
  },
  {
    id: "healthcare",
    label: "Healthcare Specialist",
    domains: ["healthcare"],
    triggers: [/health|clinic|hospital|dentist|pharmacy|pain|병원|치과|약국|아픔|salud|cl[ií]nica|farmacia/i],
    owns: ["care navigation", "urgency separation", "no diagnosis"],
    run(input) {
      return makeSpecialistOutput("healthcare", input, {
        subproblem: "care navigation",
        focus: "Healthcare",
        focusKo: "의료 안내",
        focusEs: "salud",
        recommendation: "Separate emergency, urgent, and routine care; prepare provider navigation without diagnosis or invented ranking.",
        confidence: 0.84,
        evidence: ["medical safety boundary", "no diagnosis"]
      });
    }
  },
  {
    id: "legal",
    label: "Legal Specialist",
    domains: ["legal", "business", "government", "relocation"],
    triggers: [/law|legal|attorney|visa|contract|변호사|법률|계약|abogado|legal/i],
    owns: ["legal route", "document caution", "non-advice boundary"],
    run(input) {
      return makeSpecialistOutput("legal", input, {
        subproblem: "legal readiness",
        focus: "Legal",
        focusKo: "법률",
        focusEs: "legal",
        recommendation: "Prepare legal-provider shortlist criteria and document questions, but do not provide legal advice or submit without approval.",
        confidence: 0.77,
        evidence: ["legal-advice boundary"]
      });
    }
  },
  {
    id: "education",
    label: "Education Specialist",
    domains: ["education", "study-abroad"],
    triggers: [/school|academy|tutor|study|education|학원|학교|유학|과외|escuela|estudio/i],
    owns: ["learning fit", "school/provider criteria"],
    run(input) {
      return makeSpecialistOutput("education", input, {
        subproblem: "education fit",
        focus: "Education",
        focusKo: "교육",
        focusEs: "educación",
        recommendation: "Match options to learning goal, schedule, language, workload, location, and family constraints.",
        confidence: 0.8,
        evidence: ["education mission fit"]
      });
    }
  },
  {
    id: "career",
    label: "Career Specialist",
    domains: ["career"],
    triggers: [/job|career|resume|hiring|interview|일자리|취업|이력서|채용|trabajo|empleo/i],
    owns: ["job path", "candidate fit", "application readiness"],
    run(input) {
      return makeSpecialistOutput("career", input, {
        subproblem: "career path",
        focus: "Career",
        focusKo: "커리어",
        focusEs: "carrera",
        recommendation: "Prepare role fit, visa/language constraints, resume package, interview steps, and approval-safe applications.",
        confidence: 0.8,
        evidence: ["career mission fit"]
      });
    }
  },
  {
    id: "shopping",
    label: "Shopping Specialist",
    domains: ["shopping"],
    triggers: [/shop|buy|compare|product|shopping|구매|쇼핑|추천|comprar|compras/i],
    owns: ["product comparison", "purchase boundary"],
    run(input) {
      return makeSpecialistOutput("shopping", input, {
        subproblem: "shopping comparison",
        focus: "Shopping",
        focusKo: "쇼핑",
        focusEs: "compras",
        recommendation: "Compare fit, price, seller trust, delivery, return terms, and require approval before purchase.",
        confidence: 0.78,
        evidence: ["purchase approval boundary"]
      });
    }
  },
  {
    id: "translation",
    label: "Translation Specialist",
    domains: ["travel", "business", "healthcare", "education", "career", "government", "relocation"],
    triggers: [/translate|interpreter|language|foreign|영어|통역|번역|외국인|traduc|int[eé]rprete/i],
    owns: ["language bridge", "localized phrasing"],
    run(input) {
      return makeSpecialistOutput("translation", input, {
        subproblem: "language support",
        focus: "Translation",
        focusKo: "언어 지원",
        focusEs: "idioma",
        recommendation: "Keep mission wording and provider handoff clear across Korean, English, and Spanish.",
        confidence: 0.74,
        evidence: ["official language support: en/ko/es"]
      });
    }
  }
]);

function createRegistryRecord(definition) {
  return Object.freeze({
    ...definition,
    domains: Object.freeze(definition.domains || []),
    triggers: Object.freeze(definition.triggers || []),
    owns: Object.freeze(definition.owns || []),
    run: definition.run
  });
}

export function createSpecialistRegistry(overrides = {}) {
  const records = new Map();
  for (const definition of SPECIALIST_DEFINITIONS) records.set(definition.id, createRegistryRecord(definition));
  for (const definition of overrides.specialists || []) records.set(definition.id, createRegistryRecord(definition));
  return Object.freeze({
    get(id) {
      return records.get(id) || null;
    },
    register(definition) {
      if (!definition?.id || typeof definition.run !== "function") throw new Error("alpha08_invalid_specialist");
      records.set(definition.id, createRegistryRecord(definition));
      return records.get(definition.id);
    },
    list() {
      return [...records.values()];
    }
  });
}

export function selectSpecialistsForMission(input = {}, registry = createSpecialistRegistry()) {
  const domain = domainFromInput(input);
  const text = lower(missionText(input.result || input));
  const selected = new Set();
  const requiredReasons = new Map();
  const add = (id, reason) => {
    if (registry.get(id)) {
      selected.add(id);
      requiredReasons.set(id, reason);
    }
  };

  if (domain.includes("travel") || domain.includes("relocation") || domain.includes("family-vacation") || input.result?.destination) {
    ["travel", "logistics", "finance", "translation"].forEach((id) => add(id, "travel baseline"));
    if (input.result?.flights?.length || /flight|airline|airport|항공|공항|vuelo/.test(text)) add("flights", "flight reasoning needed");
    if (input.result?.hotels?.length || /hotel|stay|숙소|호텔|alojamiento/.test(text)) add("hotels", "accommodation reasoning needed");
    if (input.result?.restaurants?.length || /food|restaurant|맛집|식당|comida/.test(text)) add("restaurants", "food recommendations needed");
    if (/visa|passport|entry|immigration|비자|여권|입국|visado/.test(text) || countryLabel(input)) add("visa", "entry check may matter");
    add("insurance", "risk preparation");
  }

  if (/business|company|registration|사업|법인|empresa/.test(`${domain} ${text}`)) {
    ["business", "legal", "finance", "logistics", "translation"].forEach((id) => add(id, "business setup"));
  }
  if (/health|clinic|hospital|dent|pharmacy|병원|치과|약국|salud/.test(`${domain} ${text}`)) {
    ["healthcare", "logistics", "translation"].forEach((id) => add(id, "healthcare navigation"));
  }
  if (/study|school|academy|education|학원|학교|유학|estudio/.test(`${domain} ${text}`)) {
    ["education", "logistics", "translation"].forEach((id) => add(id, "education pathway"));
  }
  if (/job|career|resume|hiring|취업|일자리|trabajo/.test(`${domain} ${text}`)) {
    ["career", "translation", "logistics"].forEach((id) => add(id, "career pathway"));
  }
  if (/shop|buy|product|shopping|구매|쇼핑|compr/.test(`${domain} ${text}`)) {
    ["shopping", "finance", "logistics"].forEach((id) => add(id, "shopping comparison"));
  }
  if (/law|legal|attorney|government|passport|driver|immigration|변호사|법률|정부|여권|inmigraci/.test(`${domain} ${text}`)) {
    ["legal", "logistics", "translation"].forEach((id) => add(id, "legal or government navigation"));
  }

  if (!selected.size) ["logistics", "finance", "translation"].forEach((id) => add(id, "general mission baseline"));

  return Object.freeze({
    domain,
    selected: Object.freeze([...selected]),
    skipped: Object.freeze(registry.list().map((item) => item.id).filter((id) => !selected.has(id))),
    reasons: Object.freeze(Object.fromEntries(requiredReasons))
  });
}

export function decomposeMissionForDirector(input = {}) {
  const domain = domainFromInput(input);
  const result = input.result || input;
  const base = [];
  if (domain.includes("travel") || result.destination) {
    base.push("destination fit", "itinerary coherence", "mobility", "weather backup", "budget", "approval-ready next steps");
    if (result.flights?.length) base.push("flights");
    if (result.hotels?.length) base.push("hotels");
    if (result.restaurants?.length) base.push("restaurants");
    if (countryLabel(input)) base.push("entry requirements", "insurance");
  } else if (/business/.test(domain)) {
    base.push("registration path", "documents", "legal/accounting", "banking", "deadlines", "approval boundary");
  } else if (/health/.test(domain)) {
    base.push("urgency", "provider type", "location", "documents", "no-diagnosis safety");
  } else if (/education|study/.test(domain)) {
    base.push("learning goal", "location", "schedule", "provider fit", "family constraints");
  } else if (/career/.test(domain)) {
    base.push("role fit", "visa/language", "resume", "interview", "application boundary");
  } else {
    base.push("goal", "location", "options", "constraints", "next action", "approval boundary");
  }
  return Object.freeze(uniq(base));
}

export function resolveSpecialistConflicts(outputs = [], context = {}) {
  const bySubproblem = new Map();
  const conflicts = [];
  for (const output of outputs.filter((item) => item?.status !== "failed")) {
    const key = lower(output.subproblem || output.specialistId);
    const existing = bySubproblem.get(key);
    if (!existing) {
      bySubproblem.set(key, output);
      continue;
    }
    const existingScore = scoreOutput(existing);
    const nextScore = scoreOutput(output);
    const winner = nextScore > existingScore ? output : existing;
    const loser = winner === output ? existing : output;
    bySubproblem.set(key, winner);
    conflicts.push(Object.freeze({
      subproblem: key,
      winner: winner.specialistId,
      loser: loser.specialistId,
      basis: "confidence + evidence + shared memory/world intelligence",
      exposedToUser: false
    }));
  }
  return Object.freeze({
    winners: Object.freeze([...bySubproblem.values()]),
    conflicts: Object.freeze(conflicts),
    contextUsed: Object.freeze({
      hasWorldIntelligence: Boolean(context.worldIntelligence),
      hasMemory: Boolean(context.personalMissionMemory?.applied?.length)
    })
  });
}

export function mergeSpecialistOutputs(outputs = [], context = {}) {
  const successful = outputs.filter((output) => output && output.status !== "failed");
  const { winners, conflicts } = resolveSpecialistConflicts(successful, context);
  const seen = new Set();
  const merged = [];
  for (const output of [...winners].sort((a, b) => scoreOutput(b) - scoreOutput(a))) {
    const key = lower(output.recommendation || output.subproblem);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(output);
  }
  return Object.freeze({
    unifiedRecommendations: Object.freeze(merged),
    conflictsResolved: conflicts,
    averageConfidence: merged.length
      ? Number((merged.reduce((sum, item) => sum + clamp(item.confidence), 0) / merged.length).toFixed(3))
      : 0,
    duplicateRecommendationsRemoved: successful.length - merged.length
  });
}

function normalizePredictions(layer = {}) {
  const visible = list(layer.visible || layer.predictions)
    .slice(0, MAX_ALPHA08_PROACTIVE_PREDICTIONS)
    .map((prediction) => Object.freeze({
      id: clean(prediction.id || prediction.predictionId || prediction.title, 120),
      title: clean(prediction.title, 140),
      reason: clean(prediction.reason || prediction.explanation, 220),
      confidence: clamp(prediction.confidence)
    }));
  return Object.freeze(visible);
}

function runSpecialists(selection, registry, input, failedSpecialists = []) {
  const failed = new Set(failedSpecialists);
  const outputs = [];
  const failures = [];
  for (const specialistId of selection.selected) {
    const specialist = registry.get(specialistId);
    if (!specialist) continue;
    if (failed.has(specialistId)) {
      const failure = Object.freeze({
        specialistId,
        status: "failed",
        recommendation: "",
        confidence: 0,
        evidence: Object.freeze([]),
        dependencies: Object.freeze([]),
        expiry: null,
        durationMs: 2,
        failureReason: "simulated_unavailable"
      });
      outputs.push(failure);
      failures.push(failure);
      continue;
    }
    try {
      outputs.push(Object.freeze({
        ...specialist.run(input),
        owns: Object.freeze(specialist.owns)
      }));
    } catch (error) {
      const failure = Object.freeze({
        specialistId,
        status: "failed",
        recommendation: "",
        confidence: 0,
        evidence: Object.freeze([]),
        dependencies: Object.freeze([]),
        expiry: null,
        durationMs: 2,
        failureReason: clean(error?.message || "specialist_failed", 120)
      });
      outputs.push(failure);
      failures.push(failure);
    }
  }
  return Object.freeze({ outputs: Object.freeze(outputs), failures: Object.freeze(failures) });
}

export function createMissionDirectorBrief(input = {}) {
  const language = normalizeLanguage(input.language || input.result?.language);
  const registry = input.registry || createSpecialistRegistry();
  const directorInput = Object.freeze({
    ...input,
    language,
    result: input.result || {},
    personalMissionMemory: input.personalMissionMemory || input.result?.alpha07PersonalMissionMemory,
    predictiveIntelligence: input.predictiveIntelligence || input.result?.alpha06PredictiveIntelligence,
    worldIntelligence: input.worldIntelligence || input.result?.worldIntelligence
  });
  const started = Date.now();
  const decomposition = decomposeMissionForDirector(directorInput);
  const selection = selectSpecialistsForMission(directorInput, registry);
  const { outputs, failures } = runSpecialists(selection, registry, directorInput, input.failedSpecialists || []);
  const merged = mergeSpecialistOutputs(outputs, directorInput);
  const predictions = normalizePredictions(directorInput.predictiveIntelligence);
  const durationMs = Math.max(1, Date.now() - started + outputs.reduce((sum, item) => sum + Number(item.durationMs || 0), 0));

  return Object.freeze({
    version: ALPHA08_MULTI_AGENT_COLLABORATION_VERSION,
    role: "Mission Director",
    userFacingMode: "single-one-response",
    missionId: clean(directorInput.result?.id || directorInput.result?.missionId || stableId(missionText(directorInput.result)), 120),
    domain: selection.domain,
    language,
    destination: Object.freeze({
      label: destinationLabel(directorInput),
      country: countryLabel(directorInput)
    }),
    decomposition,
    specialistSelection: Object.freeze({
      selected: selection.selected,
      skipped: selection.skipped,
      reasons: selection.reasons
    }),
    specialistOutputs: outputs,
    unifiedResponse: Object.freeze({
      recommendations: merged.unifiedRecommendations,
      averageConfidence: merged.averageConfidence,
      duplicateRecommendationsRemoved: merged.duplicateRecommendationsRemoved,
      predictions: Object.freeze(predictions),
      summary: clean(local(
        language,
        "ONE combined the required specialist work into one approval-safe mission plan.",
        "ONE이 필요한 전문가 작업을 하나의 승인 안전 미션 계획으로 합쳤습니다.",
        "ONE combinó el trabajo experto necesario en un solo plan seguro para aprobación."
      ))
    }),
    conflictResolution: Object.freeze({
      model: "confidence + evidence + World Intelligence + Personal Mission Memory + user constraints",
      conflictsResolved: merged.conflictsResolved,
      exposedToUser: false
    }),
    observability: Object.freeze({
      participants: selection.selected.length,
      participantIds: selection.selected,
      skippedSpecialists: selection.skipped,
      failures: failures.map((item) => ({ specialistId: item.specialistId, reason: item.failureReason })),
      durationMs,
      averageConfidence: merged.averageConfidence
    }),
    safety: Object.freeze({
      userSeesOneInterface: true,
      specialistsCanExecute: false,
      executionControlledByApprovalGateway: true,
      usesUnifiedPersonalMissionMemory: true,
      privateSpecialistMemory: false,
      proactivePredictionLimit: MAX_ALPHA08_PROACTIVE_PREDICTIONS,
      noExternalProviderCalls: true
    }),
    gracefulDegradation: Object.freeze({
      active: failures.length > 0,
      failedSpecialists: failures.map((item) => item.specialistId),
      missionCanContinue: true
    })
  });
}

export function validateMissionDirectorBrief(brief = {}) {
  const problems = [];
  if (brief.version !== ALPHA08_MULTI_AGENT_COLLABORATION_VERSION) problems.push("wrong-version");
  if (brief.userFacingMode !== "single-one-response") problems.push("multiple-visible-agents");
  if (!Array.isArray(brief.decomposition) || !brief.decomposition.length) problems.push("missing-decomposition");
  if (!brief.specialistSelection?.selected?.length) problems.push("no-specialists-selected");
  if (!brief.unifiedResponse?.recommendations?.length) problems.push("no-unified-recommendations");
  if (brief.safety?.specialistsCanExecute !== false) problems.push("specialist-execution-enabled");
  if (brief.safety?.privateSpecialistMemory !== false) problems.push("private-specialist-memory");
  if ((brief.unifiedResponse?.predictions?.length || 0) > MAX_ALPHA08_PROACTIVE_PREDICTIONS) problems.push("too-many-predictions");
  const duplicateText = new Set();
  for (const recommendation of brief.unifiedResponse?.recommendations || []) {
    const key = lower(recommendation.recommendation);
    if (duplicateText.has(key)) problems.push(`duplicate-recommendation:${recommendation.specialistId}`);
    duplicateText.add(key);
  }
  return Object.freeze({
    ok: problems.length === 0,
    problems: Object.freeze(problems),
    participantCount: brief.specialistSelection?.selected?.length || 0,
    visibleAgentCount: 0
  });
}

export const ALPHA08_FOUNDER_PREVIEW_SCENARIOS = Object.freeze([
  "travel-sapporo-parents",
  "business-registration-korea",
  "healthcare-navigation",
  "study-abroad",
  "international-relocation",
  "family-vacation"
]);
