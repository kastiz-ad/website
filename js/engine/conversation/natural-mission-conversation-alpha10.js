export const ALPHA10_NATURAL_MISSION_CONVERSATION_VERSION = "ALPHA-10";
export const MAX_ALPHA10_VISIBLE_QUESTIONS = 2;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));

const normalize = (value = "") => String(value || "")
  .normalize("NFKC")
  .replace(/\s+/g, " ")
  .trim();

const lower = (value = "") => normalize(value).toLowerCase();

const uniq = (items = []) => [...new Set(items.filter(Boolean).map((item) => normalize(item)).filter(Boolean))];

const languageCopy = (language = "en", copy = {}) => copy[language] || copy.en || "";

const monthAliases = [
  ["january", "jan", "enero", "1월", "1"],
  ["february", "feb", "febrero", "2월", "2"],
  ["march", "mar", "marzo", "3월", "3"],
  ["april", "apr", "abril", "4월", "4"],
  ["may", "mayo", "5월", "5"],
  ["june", "jun", "junio", "6월", "6"],
  ["july", "jul", "julio", "7월", "7"],
  ["august", "aug", "agosto", "8월", "8"],
  ["september", "sep", "septiembre", "9월", "9"],
  ["october", "oct", "octubre", "10월", "10"],
  ["november", "nov", "noviembre", "11월", "11"],
  ["december", "dec", "diciembre", "12월", "12"]
];

const monthName = (index, language = "en") => {
  const names = {
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    ko: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
    es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
  };
  return names[language]?.[index] || names.en[index] || "";
};

const detectLanguage = (text = "", fallback = "en") => {
  if (/[가-힣]/.test(text)) return "ko";
  if (/\b(viaje|quiero|necesito|octubre|noviembre|presupuesto|familia|restaurante|trabajo)\b/i.test(text)) return "es";
  return fallback || "en";
};

const detectDates = (text = "", language = "en") => {
  const normalized = lower(text);
  const dates = [];
  const isoMatches = [...normalized.matchAll(/\b(20\d{2})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/g)];
  isoMatches.forEach((match) => dates.push(`${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`));
  monthAliases.forEach((aliases, index) => {
    if (aliases.some((alias) => new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|\\s|[.,!?]|에|쯤|부터|까지)`, "i").test(normalized))) {
      dates.push(monthName(index, language));
    }
  });
  if (/weekend|주말|fin de semana/i.test(text)) dates.push(languageCopy(language, { en: "weekend", ko: "주말", es: "fin de semana" }));
  if (/today|오늘|hoy/i.test(text)) dates.push(languageCopy(language, { en: "today", ko: "오늘", es: "hoy" }));
  if (/tomorrow|내일|mañana/i.test(text)) dates.push(languageCopy(language, { en: "tomorrow", ko: "내일", es: "mañana" }));
  return uniq(dates);
};

const detectPeople = (text = "", language = "en") => {
  const value = lower(text);
  const people = [];
  if (/parents|parent|mom|dad|부모|엄마|아빠|padres|madre|padre/.test(value)) people.push(languageCopy(language, { en: "parents", ko: "부모님", es: "padres" }));
  if (/girlfriend|여친| 여자친구|novia/.test(value)) people.push(languageCopy(language, { en: "girlfriend", ko: "여자친구", es: "novia" }));
  if (/boyfriend|남친| 남자친구|novio/.test(value)) people.push(languageCopy(language, { en: "boyfriend", ko: "남자친구", es: "novio" }));
  if (/family|kids|children|가족|아이|niños|familia/.test(value)) people.push(languageCopy(language, { en: "family", ko: "가족", es: "familia" }));
  if (/friend|friends|친구|amigos/.test(value)) people.push(languageCopy(language, { en: "friends", ko: "친구", es: "amigos" }));
  const count = value.match(/(\d+)\s*(people|persons|명|personas)/);
  if (count) people.push(languageCopy(language, { en: `${count[1]} people`, ko: `${count[1]}명`, es: `${count[1]} personas` }));
  return uniq(people);
};

const detectBudget = (text = "", language = "en") => {
  const match = lower(text).match(/(?:₩|krw|원|\$|usd|€|eur)?\s*(\d[\d,.\s]{2,})(?:\s*(만원|만|천|k|m|million|mil|원|usd|dollars|달러|eur|euros))?/i);
  if (!match) {
    if (/budget|cheap|affordable|저렴|가성비|알뜰|barato|económico/.test(lower(text))) return languageCopy(language, { en: "budget-conscious", ko: "가성비", es: "económico" });
    if (/luxury|premium|럭셔리|고급|lujo|premium/.test(lower(text))) return languageCopy(language, { en: "premium", ko: "고급", es: "premium" });
    return "";
  }
  return normalize(match[0]);
};

const detectPreferences = (text = "", language = "en") => {
  const value = lower(text);
  const prefs = [];
  [
    [/seafood|sushi|회|해산물|스시|mariscos|sushi/, { en: "seafood", ko: "해산물", es: "mariscos" }],
    [/less walking|not walk|walking too much|걷기 싫|많이 걷|menos caminar|caminar mucho/, { en: "less walking", ko: "덜 걷기", es: "caminar menos" }],
    [/taxi|cab|택시|taxi/, { en: "taxi-friendly", ko: "택시 선호", es: "preferir taxi" }],
    [/subway|metro|지하철|metro/, { en: "subway/metro", ko: "지하철", es: "metro" }],
    [/romantic|date|데이트|로맨틱|romántic|cita/, { en: "romantic", ko: "로맨틱", es: "romántico" }],
    [/food|restaurant|맛집|음식|comida|restaurante/, { en: "food-focused", ko: "음식 중심", es: "comida" }],
    [/quiet|calm|조용|tranquilo/, { en: "quiet", ko: "조용한 분위기", es: "tranquilo" }],
    [/shopping|쇼핑|compras/, { en: "shopping", ko: "쇼핑", es: "compras" }],
    [/museum|gallery|미술관|박물관|museo|galería/, { en: "museums/galleries", ko: "박물관/미술관", es: "museos/galerías" }]
  ].forEach(([pattern, copy]) => {
    if (pattern.test(value)) prefs.push(languageCopy(language, copy));
  });
  return uniq(prefs);
};

const detectConstraints = (text = "", language = "en") => {
  const value = lower(text);
  const constraints = [];
  if (/no museums|don't like museums|박물관 싫|museos no|no museo/.test(value)) constraints.push(languageCopy(language, { en: "avoid museums", ko: "박물관 제외", es: "evitar museos" }));
  if (/wheelchair|accessib|휠체어|접근성|accesible/.test(value)) constraints.push(languageCopy(language, { en: "accessibility needed", ko: "접근성 필요", es: "accesibilidad necesaria" }));
  if (/deadline|by tomorrow|until tomorrow|마감|내일까지|fecha límite/.test(value)) constraints.push(languageCopy(language, { en: "deadline-sensitive", ko: "마감 중요", es: "con fecha límite" }));
  if (/vegetarian|vegan|비건|채식|vegetariano|vegano/.test(value)) constraints.push(languageCopy(language, { en: "vegetarian/vegan", ko: "채식/비건", es: "vegetariano/vegano" }));
  return uniq(constraints);
};

const detectMissionIntent = (text = "", language = "en") => {
  const value = lower(text);
  if (/doctor|hospital|dentist|clinic|pharmacy|치과|병원|약국|의사|clínica|médico|dentista|farmacia/.test(value)) return languageCopy(language, { en: "healthcare navigation", ko: "의료 탐색", es: "navegación médica" });
  if (/academy|tutor|school|class|학원|튜터|과외|수업|academia|tutoría|clase/.test(value)) return languageCopy(language, { en: "education support", ko: "교육 지원", es: "apoyo educativo" });
  if (/business|company|startup|registration|사업|회사|창업|empresa|negocio/.test(value)) return languageCopy(language, { en: "business preparation", ko: "사업 준비", es: "preparación de negocio" });
  if (/job|career|resume|hire|일자리|취업|이력서|trabajo|empleo|currículum/.test(value)) return languageCopy(language, { en: "career planning", ko: "커리어 준비", es: "plan de carrera" });
  if (/buy|shopping|find me|product|구매|쇼핑|제품|comprar|producto/.test(value)) return languageCopy(language, { en: "shopping decision", ko: "구매 선택", es: "decisión de compra" });
  if (/date|girlfriend|boyfriend|데이트|여친|남친|cita|novia|novio/.test(value)) return languageCopy(language, { en: "personal experience", ko: "개인 경험", es: "experiencia personal" });
  if (/trip|travel|vacation|take .{0,40} to |go .{0,40} to |visit|여행|출장|데려가|가고 싶|viaje|vacaciones|llevar .{0,40} a |visitar/.test(value)) return languageCopy(language, { en: "travel planning", ko: "여행 준비", es: "plan de viaje" });
  return languageCopy(language, { en: "general mission", ko: "일반 미션", es: "misión general" });
};

const detectLocations = (text = "", result = {}, context = {}, language = "en") => {
  const locations = [];
  const destination = result.destination || context.destination || {};
  if (destination.city || destination.country) {
    locations.push(language === "ko"
      ? [destination.cityKo || destination.city, destination.countryKo || destination.country].filter(Boolean).join(", ")
      : [destination.city, destination.country].filter(Boolean).join(", "));
  }
  const raw = normalize(text);
  const simpleLocation = raw.match(/\b(?:to|in|for|near|from)\s+([A-Z][A-Za-zÀ-ÿ.\s]{2,30})(?:\s|$|,|\.)/);
  if (simpleLocation) locations.push(simpleLocation[1].trim());
  const koreanLocation = raw.match(/([가-힣]{2,12})(?:에서|으로|에|여행|출장|근처)/);
  if (koreanLocation) locations.push(koreanLocation[1]);
  return uniq(locations);
};

export const extractConversationUnderstanding = ({ messages = [], result = {}, context = {}, language = "en" } = {}) => {
  const text = normalize(messages.map((message) => typeof message === "string" ? message : message?.content || "").join(" "));
  const inferredLanguage = detectLanguage(text, language);
  const activeLanguage = language || inferredLanguage;
  const sourceText = text || result.rawInput || result.originalMission || result.mission || "";
  return {
    version: ALPHA10_NATURAL_MISSION_CONVERSATION_VERSION,
    source: "conversation_understanding_layer",
    language: activeLanguage,
    goal: normalize(result.originalMission || result.rawInput || result.mission || sourceText),
    missionIntent: detectMissionIntent(sourceText, activeLanguage),
    locations: detectLocations(sourceText, result, context, activeLanguage),
    dates: detectDates(sourceText, activeLanguage),
    people: detectPeople(sourceText, activeLanguage),
    budget: detectBudget(sourceText, activeLanguage),
    preferences: detectPreferences(sourceText, activeLanguage),
    constraints: detectConstraints(sourceText, activeLanguage),
    extractedAt: new Date().toISOString()
  };
};

export const buildConversationConfidence = (understanding = {}) => {
  const fields = [
    Boolean(understanding.goal),
    Boolean(understanding.missionIntent && !/general/.test(understanding.missionIntent)),
    Boolean(understanding.locations?.length),
    Boolean(understanding.dates?.length),
    Boolean(understanding.people?.length),
    Boolean(understanding.preferences?.length || understanding.constraints?.length || understanding.budget)
  ];
  const score = clamp(fields.filter(Boolean).length / fields.length);
  const lowConfidenceReasons = [];
  if (!understanding.goal) lowConfidenceReasons.push("goal_missing");
  if (!understanding.locations?.length && /travel|trip|여행|viaje/i.test(`${understanding.missionIntent} ${understanding.goal}`)) lowConfidenceReasons.push("destination_missing");
  if (!understanding.dates?.length && /travel|date|appointment|health|여행|데이트|의료|viaje|cita/i.test(`${understanding.missionIntent} ${understanding.goal}`)) lowConfidenceReasons.push("date_missing");
  return {
    score,
    level: score >= 0.78 ? "high" : score >= 0.5 ? "medium" : "low",
    lowConfidenceReasons
  };
};

export const buildNaturalFollowUpQuestions = (understanding = {}, refinement = null, options = {}) => {
  const language = options.language || understanding.language || "en";
  const questions = [];
  const ask = (id, copy, materiallyImproves = true) => {
    if (questions.some((question) => question.id === id)) return;
    questions.push({
      id,
      text: languageCopy(language, copy),
      materiallyImproves
    });
  };
  const missionText = `${understanding.missionIntent || ""} ${understanding.goal || ""}`;
  if (!understanding.locations?.length && /travel|trip|healthcare|education|career|business|shopping|여행|의료|교육|커리어|사업|구매|viaje|salud|educación|carrera|negocio/.test(missionText)) {
    ask("natural-location", {
      en: "Where should ONE focus this mission?",
      ko: "ONE이 어느 지역을 중심으로 준비하면 될까요?",
      es: "¿En qué lugar debe enfocarse ONE?"
    });
  }
  if (!understanding.dates?.length && /travel|trip|date|appointment|healthcare|deadline|여행|데이트|예약|의료|마감|viaje|cita|salud/.test(missionText)) {
    ask("natural-date", {
      en: "Do you already know roughly when you want this to happen?",
      ko: "대략 언제 진행하고 싶으세요?",
      es: "¿Ya sabes más o menos cuándo quieres hacerlo?"
    });
  }
  if (!understanding.preferences?.length && /travel|experience|date|education|shopping|여행|경험|데이트|교육|구매|viaje|experiencia|cita|educación|compra/.test(missionText)) {
    ask("natural-priority", {
      en: "What matters most for this — comfort, budget, speed, or experience?",
      ko: "이번 미션에서 가장 중요한 건 편안함, 예산, 속도, 경험 중 무엇인가요?",
      es: "¿Qué importa más: comodidad, presupuesto, rapidez o experiencia?"
    }, false);
  }
  if (refinement?.visible?.length) {
    refinement.visible.slice(0, MAX_ALPHA10_VISIBLE_QUESTIONS).forEach((question) => ask(`alpha02-${question.id}`, {
      en: question.titleText || question.title?.en,
      ko: question.titleText || question.title?.ko,
      es: question.titleText || question.title?.es
    }));
  }
  return questions.filter((question) => question.text).slice(0, MAX_ALPHA10_VISIBLE_QUESTIONS);
};

export const applyConversationCorrection = (understanding = {}, correctionText = "", options = {}) => {
  const language = options.language || understanding.language || "en";
  const correction = extractConversationUnderstanding({ messages: [correctionText], result: { rawInput: correctionText }, language });
  const next = {
    ...understanding,
    dates: correction.dates.length ? correction.dates : understanding.dates || [],
    locations: correction.locations.length ? correction.locations : understanding.locations || [],
    people: correction.people.length ? correction.people : understanding.people || [],
    budget: correction.budget || understanding.budget,
    preferences: uniq([...(understanding.preferences || []), ...correction.preferences]),
    constraints: uniq([...(understanding.constraints || []), ...correction.constraints])
  };
  const changes = [];
  if (correction.dates.length && correction.dates.join("|") !== (understanding.dates || []).join("|")) changes.push("dates");
  if (correction.locations.length && correction.locations.join("|") !== (understanding.locations || []).join("|")) changes.push("locations");
  if (correction.people.length && correction.people.join("|") !== (understanding.people || []).join("|")) changes.push("people");
  if (correction.budget && correction.budget !== understanding.budget) changes.push("budget");
  if (correction.preferences.length) changes.push("preferences");
  return {
    understanding: next,
    changes: uniq(changes),
    explanation: changes.length
      ? languageCopy(language, {
          en: `Updated because you changed ${changes.join(", ")}.`,
          ko: `${changes.join(", ")} 정보가 바뀌어서 해당 부분만 업데이트했습니다.`,
          es: `Actualizado porque cambiaste ${changes.join(", ")}.`
        })
      : languageCopy(language, {
          en: "No major mission fields changed.",
          ko: "크게 바뀐 미션 정보는 없습니다.",
          es: "No cambió ningún dato principal."
        })
  };
};

export const buildConversationUnderstandingLayer = ({
  messages = [],
  result = {},
  context = {},
  refinement = null,
  predictions = null,
  memory = null,
  language = "en"
} = {}) => {
  const understanding = extractConversationUnderstanding({ messages, result, context, language });
  const confidence = buildConversationConfidence(understanding);
  const questions = confidence.level === "high" ? [] : buildNaturalFollowUpQuestions(understanding, refinement, { language });
  return {
    version: ALPHA10_NATURAL_MISSION_CONVERSATION_VERSION,
    mode: "natural_conversation_not_form",
    voiceReady: true,
    understanding,
    confidence,
    visibleQuestions: questions,
    maxVisibleQuestions: MAX_ALPHA10_VISIBLE_QUESTIONS,
    systemsReused: {
      progressiveRefinement: Boolean(refinement),
      predictiveIntelligence: Boolean(predictions),
      personalMissionMemory: Boolean(memory),
      livingMission: true,
      worldIntelligence: Boolean(result.worldIntelligence),
      providerTrustNetwork: Boolean(result.alpha09ProviderTrust)
    },
    shouldConfirm: confidence.level === "low",
    silenceRecommended: confidence.level === "high" && questions.length === 0,
    workspaceUpdate: {
      updateOnlyAffectedAreas: true,
      noRegenerateButtonRequired: true,
      neverExecute: true
    }
  };
};

export const validateConversationUnderstandingLayer = (layer = {}) => {
  const failures = [];
  if (layer.version !== ALPHA10_NATURAL_MISSION_CONVERSATION_VERSION) failures.push("wrong_version");
  if (layer.mode !== "natural_conversation_not_form") failures.push("mode_not_natural");
  if ((layer.visibleQuestions || []).length > MAX_ALPHA10_VISIBLE_QUESTIONS) failures.push("too_many_questions");
  if (!layer.workspaceUpdate?.neverExecute) failures.push("execution_boundary_missing");
  if (!layer.voiceReady) failures.push("voice_ready_missing");
  if (!layer.understanding) failures.push("understanding_missing");
  return { ok: failures.length === 0, failures };
};
