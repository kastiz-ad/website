export const HUMAN_REASONING_PIPELINE_SLOT = "human-reasoning";

const SUPPORTED_LANGUAGES = new Set(["en", "ko", "es"]);

const MISSION_LABELS = Object.freeze({
  en: {
    travel: "Travel",
    education: "Education",
    healthcare: "Healthcare",
    sports_wellness: "Sports & Wellness",
    sports: "Sports & Wellness",
    beauty: "Beauty",
    professionals: "Professional Services",
    legal: "Legal Services",
    finance: "Finance",
    career: "Career",
    foreigner_korea: "Foreigner in Korea",
    government: "Government",
    government_services: "Government",
    home_services: "Home Services",
    "home-services": "Home Services",
    restaurant: "Restaurant",
    accommodation: "Accommodation",
    transportation: "Transportation",
    shopping: "Shopping",
    repair: "Repair",
    lifestyle: "Lifestyle",
    "professional-service": "Professional Service",
    general_mission: "General Mission"
  },
  ko: {
    travel: "여행",
    education: "교육",
    healthcare: "의료",
    sports_wellness: "스포츠·웰니스",
    sports: "스포츠·웰니스",
    beauty: "뷰티",
    professionals: "전문가",
    legal: "법률",
    finance: "금융",
    career: "커리어",
    foreigner_korea: "외국인 한국 정착",
    government: "정부·민원",
    government_services: "정부·민원",
    home_services: "생활 서비스",
    "home-services": "생활 서비스",
    restaurant: "레스토랑",
    accommodation: "숙박",
    transportation: "교통",
    shopping: "쇼핑",
    repair: "수리",
    lifestyle: "라이프스타일",
    "professional-service": "전문 서비스",
    general_mission: "일반 미션"
  },
  es: {
    travel: "Viaje",
    education: "Educación",
    healthcare: "Salud",
    sports_wellness: "Deporte y bienestar",
    sports: "Deporte y bienestar",
    beauty: "Belleza",
    professionals: "Servicios profesionales",
    legal: "Servicios legales",
    finance: "Finanzas",
    career: "Carrera",
    foreigner_korea: "Extranjero en Corea",
    government: "Gobierno",
    government_services: "Gobierno",
    home_services: "Servicios del hogar",
    "home-services": "Servicios del hogar",
    restaurant: "Restaurante",
    accommodation: "Alojamiento",
    transportation: "Transporte",
    shopping: "Compras",
    repair: "Reparación",
    lifestyle: "Estilo de vida",
    "professional-service": "Servicio profesional",
    general_mission: "Misión general"
  }
});

const FIELD_LABELS = Object.freeze({
  en: {
    destination: "destination",
    location: "location",
    dateOrTime: "date or time",
    budget: "budget",
    service: "service type",
    urgency: "urgency",
    relationship: "relationship or audience",
    constraints: "important constraints"
  },
  ko: {
    destination: "목적지",
    location: "위치",
    dateOrTime: "날짜 또는 시간",
    budget: "예산",
    service: "서비스 종류",
    urgency: "긴급도",
    relationship: "관계 또는 대상",
    constraints: "중요 조건"
  },
  es: {
    destination: "destino",
    location: "ubicación",
    dateOrTime: "fecha u hora",
    budget: "presupuesto",
    service: "tipo de servicio",
    urgency: "urgencia",
    relationship: "relación o público",
    constraints: "condiciones importantes"
  }
});

const QUESTION_TEXT = Object.freeze({
  en: {
    destination: "Where should ONE prepare this?",
    location: "Which area should ONE use?",
    dateOrTime: "When do you need it?",
    budget: "How much can you spend?",
    service: "Which exact service do you want?",
    urgency: "Is this routine, urgent, or emergency?",
    relationship: "Who is this for?",
    constraints: "What matters most: price, time, quality, or convenience?"
  },
  ko: {
    destination: "어디로 준비할까요?",
    location: "어느 지역 기준으로 찾을까요?",
    dateOrTime: "언제 필요하신가요?",
    budget: "총 예산은 얼마인가요?",
    service: "정확히 어떤 서비스를 원하시나요?",
    urgency: "일반, 긴급, 응급 중 어떤 상황인가요?",
    relationship: "누구를 위한 미션인가요?",
    constraints: "가격, 시간, 품질, 편리함 중 무엇이 가장 중요한가요?"
  },
  es: {
    destination: "¿Dónde debe prepararlo ONE?",
    location: "¿Qué zona debe usar ONE?",
    dateOrTime: "¿Cuándo lo necesitas?",
    budget: "¿Cuánto puedes gastar?",
    service: "¿Qué servicio exacto quieres?",
    urgency: "¿Es rutinario, urgente o una emergencia?",
    relationship: "¿Para quién es esta misión?",
    constraints: "¿Qué importa más: precio, tiempo, calidad o comodidad?"
  }
});

const MISSION_REQUIREMENTS = Object.freeze({
  travel: ["destination", "dateOrTime", "budget"],
  education: ["service", "location", "dateOrTime"],
  healthcare: ["service", "location", "urgency"],
  sports_wellness: ["service", "location", "dateOrTime"],
  sports: ["service", "location", "dateOrTime"],
  beauty: ["service", "location", "dateOrTime"],
  professionals: ["service", "location", "dateOrTime"],
  legal: ["service", "location", "dateOrTime"],
  finance: ["service", "location", "constraints"],
  career: ["service", "location", "constraints"],
  foreigner_korea: ["service", "location", "dateOrTime"],
  government: ["service", "location", "dateOrTime"],
  government_services: ["service", "location", "dateOrTime"],
  home_services: ["service", "location", "dateOrTime"],
  "home-services": ["service", "location", "dateOrTime"],
  restaurant: ["location", "dateOrTime", "budget"],
  accommodation: ["destination", "dateOrTime", "budget"],
  transportation: ["destination", "dateOrTime", "constraints"],
  shopping: ["service", "budget", "constraints"],
  repair: ["service", "location", "dateOrTime"],
  lifestyle: ["relationship", "location", "dateOrTime"],
  "professional-service": ["service", "location", "constraints"],
  general_mission: ["service", "location", "constraints"]
});

const MISSION_SIGNALS = Object.freeze({
  travel: /trip|travel|vacation|flight|hotel|airport|여행|출장|휴가|항공|호텔|공항|viaje|viajar|vuelo|hotel|aeropuerto/i,
  education: /academy|tutor|lesson|school|math|english|coding|학원|과외|수업|영어|수학|코딩|academia|clase|escuela|inglés/i,
  healthcare: /doctor|hospital|dentist|clinic|pharmacy|pain|emergency|의사|병원|치과|약국|아픈|응급|médico|hospital|dentista|farmacia|urgente/i,
  sports_wellness: /gym|pilates|yoga|swimming|tennis|golf|헬스|필라테스|요가|수영|테니스|골프|gimnasio|pilates|yoga|natación/i,
  beauty: /hair|nail|skin|laser|beauty|미용실|네일|피부|레이저|뷰티|pelo|uñas|piel|belleza/i,
  professionals: /translator|interpreter|architect|accountant|lawyer|통역|번역|건축사|세무사|변호사|traductor|intérprete|arquitecto|contador|abogado/i,
  career: /job|career|resume|interview|hiring|일자리|취업|이력서|면접|채용|trabajo|empleo|currículum|entrevista/i,
  foreigner_korea: /move to korea|study in korea|work in korea|foreigner|한국 정착|한국 유학|한국 취업|외국인|vivir en corea|estudiar en corea/i,
  government: /passport|license|immigration|certificate|permit|여권|면허|출입국|증명서|민원|pasaporte|licencia|inmigración|certificado/i,
  home_services: /cleaning|moving|plumbing|locksmith|leak|repair|청소|이사|배관|열쇠|누수|수리|limpieza|mudanza|plomería|cerrajero/i,
  restaurant: /restaurant|dinner|lunch|food|맛집|식당|저녁|점심|comida|restaurante|cena|almuerzo/i,
  shopping: /buy|shop|compare|price|구매|쇼핑|비교|가격|comprar|tienda|precio/i,
  lifestyle: /date|girlfriend|boyfriend|couple|weekend|데이트|여친|남친|커플|주말|cita|novia|novio|pareja|fin de semana/i
});

const FIELD_DETECTORS = Object.freeze({
  destination: ({ text, input }) => Boolean(
    input.destination || input.destinationText || input.to ||
    /\b(to|in|for|near|en|a)\s+[A-ZÁÉÍÓÚÑa-záéíóúñ가-힣][\wÁÉÍÓÚÑáéíóúñ가-힣\s.-]{1,}/.test(text) ||
    /[가-힣A-Za-zÁÉÍÓÚÑáéíóúñ]+(로|으로|에|에서)\s*(여행|출장|가|갈|가기|viaje|trip)/i.test(text)
  ),
  location: ({ text, input }) => Boolean(
    input.location || input.currentLocation || input.destination?.city ||
    /\b(near|in|around|from|en|cerca de)\s+[A-ZÁÉÍÓÚÑa-záéíóúñ가-힣][\wÁÉÍÓÚÑáéíóúñ가-힣\s.-]{1,}/i.test(text) ||
    /[가-힣A-Za-zÁÉÍÓÚÑáéíóúñ]+(에서|근처|주변|동네)/i.test(text)
  ),
  dateOrTime: ({ text, input }) => Boolean(
    input.date || input.startDate || input.endDate || input.time ||
    /\b(today|tonight|tomorrow|weekend|this week|next week|morning|afternoon|evening|hoy|mañana|fin de semana|esta semana)\b/i.test(text) ||
    /(오늘|내일|이번 주|다음 주|주말|아침|오후|저녁|밤|월|화|수|목|금|토|일)/.test(text)
  ),
  budget: ({ text, input }) => Boolean(
    input.budget || input.maxBudget ||
    /(\d[\d,.\s]*(원|₩|usd|eur|달러|만원|천원|€|\$)|budget|cheap|luxury|예산|저렴|럭셔리|presupuesto|barato|lujo)/i.test(text)
  ),
  service: ({ text, classification }) => Boolean(
    classification?.providerType && classification.providerType !== "professional-service" && classification.providerType !== "general_mission" ||
    Object.values(MISSION_SIGNALS).some((rx) => rx.test(text))
  ),
  urgency: ({ text }) => /\b(today|tonight|urgent|emergency|pain|open now|hoy|urgente|emergencia)\b|오늘|오늘 밤|긴급|응급|아픈|통증/.test(text),
  relationship: ({ text }) => /\b(girlfriend|boyfriend|wife|husband|parents|kids|friend|solo|family|business|novia|novio|familia|amigo)\b|여친|여자친구|남친|남자친구|부모님|아이|친구|혼자|가족|비즈니스/.test(text),
  constraints: ({ text }) => /\b(cheap|fast|quality|best|quiet|near|safe|luxury|flexible|barato|rápido|calidad|seguro|lujo)\b|저렴|빠른|품질|가까운|안전|럭셔리|유연|조용/.test(text)
});

const confidenceFromClassifier = (value) => {
  const label = String(value || "").toLowerCase();
  if (label.includes("high")) return 0.86;
  if (label.includes("context")) return 0.9;
  if (label.includes("supported")) return 0.74;
  if (label.includes("rule")) return 0.72;
  if (label.includes("unknown")) return 0.35;
  return 0.58;
};

const clamp = (value, min = 0.05, max = 0.99) => Math.max(min, Math.min(max, value));

export function normalizeReasoningLanguage(language, text = "") {
  if (SUPPORTED_LANGUAGES.has(language)) return language;
  if (/[가-힣]/.test(text)) return "ko";
  if (/[¿¡áéíóúñü]/i.test(text) || /\b(viaje|necesito|busco|cerca|presupuesto)\b/i.test(text)) return "es";
  return "en";
}

export function inferMissionHypotheses({ mission = "", classification = {}, candidateMissions = [] } = {}) {
  const text = String(mission || classification.mission || "").normalize("NFKC");
  const directCandidates = Array.isArray(classification.candidates) ? classification.candidates : [];
  const signals = Object.entries(MISSION_SIGNALS)
    .filter(([, rx]) => rx.test(text))
    .map(([type], index) => ({
      type,
      confidence: clamp(0.78 - index * 0.04),
      source: "mission-signal"
    }));
  const classified = classification.providerType ? [{
    type: classification.providerType,
    confidence: confidenceFromClassifier(classification.confidence),
    source: "classifier"
  }] : [];
  const candidates = directCandidates.map((candidate) => ({
    type: candidate.id || candidate.providerType || candidate.type,
    confidence: clamp(0.72 + Math.min(Number(candidate.score || 0), 30) / 100),
    source: "classifier-candidate"
  }));
  const explicit = candidateMissions.map((candidate, index) => ({
    type: candidate.type || candidate.providerType || candidate.id || String(candidate),
    confidence: clamp(candidate.confidence ?? 0.68 - index * 0.04),
    source: "provided-candidate"
  }));

  const byType = new Map();
  for (const item of [...classified, ...candidates, ...signals, ...explicit]) {
    if (!item.type) continue;
    const current = byType.get(item.type);
    if (!current || current.confidence < item.confidence) byType.set(item.type, item);
  }

  return [...byType.values()]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
    .map((item) => Object.freeze(item));
}

export function detectMissingInformation({ mission = "", classification = {}, input = {} } = {}) {
  const type = classification.providerType || "general_mission";
  const required = MISSION_REQUIREMENTS[type] || MISSION_REQUIREMENTS.general_mission;
  const text = String(mission || classification.mission || input.mission || "").normalize("NFKC");
  return required.filter((field) => {
    const detector = FIELD_DETECTORS[field];
    return detector ? !detector({ text, input, classification }) : true;
  });
}

export function buildRecommendedFollowUpQuestions({ missingInformation = [], language = "en", confidence = 0 } = {}) {
  if (confidence >= 0.86 && missingInformation.length <= 1) return [];
  return missingInformation.slice(0, 2).map((field) => ({
    field,
    question: QUESTION_TEXT[language]?.[field] || QUESTION_TEXT.en[field],
    valueRequiredBeforePlanning: ["destination", "service"].includes(field)
  }));
}

export function buildHumanReasoningObject(input = {}) {
  const mission = String(input.mission || input.classification?.mission || input.goal || "").normalize("NFKC").trim().replace(/\s+/g, " ");
  const language = normalizeReasoningLanguage(input.language, mission);
  const classification = input.classification || {};
  const selectedType = classification.providerType || "general_mission";
  const possibleInterpretations = inferMissionHypotheses({
    mission,
    classification,
    candidateMissions: input.candidateMissions
  });
  const missingInformation = detectMissingInformation({
    mission,
    classification: { ...classification, providerType: selectedType },
    input
  });
  const top = possibleInterpretations[0] || {
    type: selectedType,
    confidence: confidenceFromClassifier(classification.confidence),
    source: "classifier"
  };
  const second = possibleInterpretations[1];
  const vagueGoal = !mission || /^(help|help me|do it|추천|도와줘|해줘|ayuda|hazlo)$/i.test(mission);
  const ambiguousByScore = Boolean(second && Math.abs(top.confidence - second.confidence) < 0.12);
  const ambiguityDetected = vagueGoal || ambiguousByScore || (top.confidence < 0.8 && possibleInterpretations.length > 1);
  const confidence = clamp(
    (top.confidence || 0.55) +
    (missingInformation.length === 0 ? 0.08 : 0) -
    missingInformation.length * 0.07 -
    (ambiguityDetected ? 0.14 : 0) -
    (vagueGoal ? 0.18 : 0)
  );
  const recommendedFollowUpQuestions = buildRecommendedFollowUpQuestions({
    missingInformation,
    language,
    confidence
  });
  const label = MISSION_LABELS[language]?.[selectedType] || MISSION_LABELS.en[selectedType] || selectedType;
  const fieldLabels = FIELD_LABELS[language] || FIELD_LABELS.en;
  const readableMissing = missingInformation.map((field) => fieldLabels[field] || field);
  const summary = {
    en: `${label} mission understood with ${Math.round(confidence * 100)}% confidence. ${readableMissing.length ? `ONE should confirm ${readableMissing.join(", ")} before final planning.` : "No extra question is needed before planning."}`,
    ko: `${label} 미션을 ${Math.round(confidence * 100)}% 신뢰도로 이해했습니다. ${readableMissing.length ? `최종 준비 전에 ${readableMissing.join(", ")} 확인이 좋습니다.` : "계획 전 추가 질문은 필요하지 않습니다."}`,
    es: `Misión de ${label} entendida con ${Math.round(confidence * 100)}% de confianza. ${readableMissing.length ? `ONE debe confirmar ${readableMissing.join(", ")} antes de planificar.` : "No hace falta otra pregunta antes de planificar."}`
  }[language];

  return Object.freeze({
    version: "V12",
    pipelineSlot: HUMAN_REASONING_PIPELINE_SLOT,
    userGoal: mission,
    confidence,
    missingInformation: Object.freeze(missingInformation),
    possibleInterpretations: Object.freeze(possibleInterpretations),
    recommendedFollowUpQuestions: Object.freeze(recommendedFollowUpQuestions),
    selectedMission: Object.freeze({
      type: selectedType,
      label,
      source: classification.providerType ? "classifier" : "fallback",
      confidence: top.confidence || confidence
    }),
    reasoningSummary: summary,
    ambiguityDetected,
    approvalRequired: true,
    executionEnabled: false
  });
}
