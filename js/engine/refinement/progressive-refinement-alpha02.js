export const ALPHA02_REFINEMENT_VERSION = "ALPHA-02";
export const MAX_VISIBLE_REFINEMENT_QUESTIONS = 2;

const PRIORITY_WEIGHT = {
  critical: 100,
  high: 75,
  helpful: 45,
  optional: 10
};

const PRIORITY_VISIBLE = new Set(["critical", "high"]);
const SKIPPED_STATES = new Set(["answered", "skipped", "later", "hidden"]);

const text = (value) => String(value ?? "").trim();
const lower = (value) => text(value).toLowerCase();
const containsAny = (value, patterns) => patterns.some((pattern) => pattern.test(text(value)));

const localText = (language, copy) => {
  if (language === "ko") return copy.ko || copy.en || "";
  if (language === "es") return copy.es || copy.en || "";
  return copy.en || "";
};

const resultIdentity = (result = {}) => [
  result.id,
  result.type,
  result.rawInput,
  result.originalMission,
  result.mission,
  result.destination?.city,
  result.destination?.country
].filter(Boolean).join("|") || "mission";

export const refinementStorageKey = (result = {}) =>
  `kastiz-one-alpha02-refinement:${encodeKey(resultIdentity(result))}`;

function encodeKey(value) {
  if (typeof btoa === "function") {
    return btoa(unescape(encodeURIComponent(value))).replace(/=+$/g, "").slice(0, 48);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64").replace(/=+$/g, "").slice(0, 48);
  }
  return encodeURIComponent(value).replace(/%/g, "").slice(0, 48);
}

export function createEmptyRefinementState() {
  return {
    version: ALPHA02_REFINEMENT_VERSION,
    answers: {},
    archived: {},
    updatedAt: ""
  };
}

export function normalizeRefinementState(state = {}) {
  return {
    version: ALPHA02_REFINEMENT_VERSION,
    answers: state.answers && typeof state.answers === "object" ? state.answers : {},
    archived: state.archived && typeof state.archived === "object" ? state.archived : {},
    updatedAt: state.updatedAt || ""
  };
}

function domainFor(result = {}, context = {}) {
  const mission = lower([result.rawInput, result.originalMission, result.mission, result.title?.en, result.title?.ko].filter(Boolean).join(" "));
  const resultDomain = lower(result.resolutionPlan?.domain || result.domain || result.type || "");
  if (result.type === "travel" || context.requiresInternationalTravel || /travel|trip|vacation|여행|출장|viaje|viajar/.test(mission)) return "travel";
  if (/health|clinic|hospital|dentist|pharmacy|doctor|pain|병원|치과|약국|아프|salud|cl[ií]nica|hospital/.test(`${mission} ${resultDomain}`)) return "healthcare";
  if (/academy|school|tutor|education|exam|학원|공부|내신|교육|escuela|academia|tutor/.test(`${mission} ${resultDomain}`)) return "education";
  if (/business|company|startup|registration|사업|회사|창업|negocio|empresa/.test(`${mission} ${resultDomain}`)) return "business";
  if (/job|career|resume|interview|hire|work|일자리|취업|이력서|면접|trabajo|carrera/.test(`${mission} ${resultDomain}`)) return "career";
  return "general";
}

function missionSignals(result = {}, context = {}) {
  const mission = lower([result.rawInput, result.originalMission, result.mission, result.display?.title].filter(Boolean).join(" "));
  return {
    mission,
    domain: domainFor(result, context),
    family: containsAny(mission, [/family/, /parents?/, /kids?/, /children/, /가족/, /부모/, /아이/, /familia/, /padres/]),
    parents: containsAny(mission, [/parents?/, /elder/, /부모/, /어머니/, /아버지/, /padres/, /mayores/]),
    luxury: containsAny(mission, [/luxury/, /premium/, /best/, /high.?end/, /럭셔리/, /프리미엄/, /고급/, /lujo/, /premium/]),
    budget: containsAny(mission, [/budget/, /cheap/, /value/, /저렴/, /실속/, /가성비/, /econ[oó]mico/, /barato/]),
    food: containsAny(mission, [/food/, /restaurant/, /gourmet/, /맛집/, /음식/, /comida/, /gastronom/]),
    sightseeing: containsAny(mission, [/sightseeing/, /landmark/, /view/, /관광/, /명소/, /vista/, /turismo/]),
    knownBudget: Boolean(result.budget?.userBudget || result.budget?.total || result.budget?.preference || context.budget?.value),
    knownUrgency: Boolean(context.urgency?.value || result.resolutionPlan?.urgency),
    knownDestination: Boolean(result.destination?.city || result.destination?.country || context.destination?.city || context.destination?.value)
  };
}

function q(id, priority, impact, domain, title, explanation, choices, improvement, applies = true) {
  if (!applies) return null;
  return {
    id,
    priority,
    impact,
    domain,
    title,
    explanation,
    choices,
    improvement,
    score: (PRIORITY_WEIGHT[priority] || 0) + Math.round(Number(impact || 0) * 20),
    optional: priority === "optional",
    visibleEligible: PRIORITY_VISIBLE.has(priority),
    blocksMission: false
  };
}

function candidateQuestions(result = {}, context = {}, language = "en") {
  const signals = missionSignals(result, context);
  const questions = [];
  if (signals.domain === "travel") {
    questions.push(q(
      "travel-walking-preference",
      signals.parents || signals.family ? "critical" : "high",
      signals.parents || signals.family ? 0.94 : 0.76,
      "travel",
      {
        en: signals.parents ? "Should ONE reduce walking for your parents?" : "How much walking feels right?",
        ko: signals.parents ? "부모님이 덜 걷는 일정이 좋을까요?" : "걷는 양은 어느 정도가 좋을까요?",
        es: signals.parents ? "¿Reducimos caminatas para tus padres?" : "¿Cuánto caminar está bien?"
      },
      {
        en: "This changes hotels, transfers, activity order, and rest time.",
        ko: "숙소 위치, 이동수단, 활동 순서, 휴식 시간이 바로 달라집니다.",
        es: "Esto cambia hotel, transporte, orden de actividades y descansos."
      },
      [
        { value: "less_walking", label: { en: "Less walking", ko: "덜 걷기", es: "Caminar menos" } },
        { value: "normal_walking", label: { en: "Normal is fine", ko: "보통 괜찮음", es: "Normal está bien" } },
        { value: "walking_ok", label: { en: "Walking is okay", ko: "걷기 좋음", es: "Caminar está bien" } }
      ],
      {
        en: "ONE will favor station-area hotels, licensed transfers, and fewer long walks.",
        ko: "ONE이 역 근처 숙소, 허가된 이동수단, 짧은 동선을 우선합니다.",
        es: "ONE priorizará hoteles cerca de estaciones, traslados autorizados y menos caminatas."
      },
      !context.mobility?.value
    ));
    questions.push(q(
      "travel-food-vs-sightseeing",
      signals.food || signals.sightseeing ? "helpful" : "high",
      0.82,
      "travel",
      {
        en: "Should this trip lean more toward food or sightseeing?",
        ko: "이번 여행은 맛집 쪽이 좋나요, 관광 쪽이 좋나요?",
        es: "¿Prefieres comida o turismo?"
      },
      {
        en: "This changes the journey story and the order of reservations.",
        ko: "여정의 이야기와 예약 우선순위가 달라집니다.",
        es: "Esto cambia la historia del viaje y la prioridad de reservas."
      },
      [
        { value: "food_first", label: { en: "Food first", ko: "맛집 중심", es: "Comida primero" } },
        { value: "sightseeing_first", label: { en: "Sightseeing first", ko: "관광 중심", es: "Turismo primero" } },
        { value: "balanced", label: { en: "Balanced", ko: "둘 다 균형", es: "Equilibrado" } }
      ],
      {
        en: "ONE will rebalance meals, routes, and activity pacing.",
        ko: "ONE이 식사, 동선, 활동 속도를 다시 맞춥니다.",
        es: "ONE ajustará comida, rutas y ritmo."
      }
    ));
    questions.push(q(
      "travel-budget-style",
      signals.budget || signals.luxury ? "helpful" : "high",
      0.74,
      "travel",
      {
        en: "What matters more: comfort or lower cost?",
        ko: "편안함과 비용 중 무엇이 더 중요할까요?",
        es: "¿Qué importa más: comodidad o menor costo?"
      },
      {
        en: "This changes flight, hotel, and transportation tradeoffs.",
        ko: "항공, 숙소, 이동수단의 기준이 달라집니다.",
        es: "Esto cambia vuelos, hotel y transporte."
      },
      [
        { value: "comfort", label: { en: "Comfort", ko: "편안함", es: "Comodidad" } },
        { value: "value", label: { en: "Value", ko: "가성비", es: "Valor" } },
        { value: "luxury", label: { en: "Luxury", ko: "럭셔리", es: "Lujo" } }
      ],
      {
        en: "ONE will adjust the recommended journey and budget estimate.",
        ko: "ONE이 추천 여정과 예상 예산을 조정합니다.",
        es: "ONE ajustará la ruta recomendada y el presupuesto."
      },
      !signals.knownBudget
    ));
  }
  if (signals.domain === "healthcare") {
    questions.push(q(
      "healthcare-urgency",
      "critical",
      0.98,
      "healthcare",
      { en: "How urgent is this?", ko: "얼마나 급한 상황인가요?", es: "¿Qué tan urgente es?" },
      {
        en: "ONE separates emergency navigation from routine clinic search. It does not diagnose.",
        ko: "ONE은 응급 안내와 일반 병원 찾기를 분리합니다. 진단은 하지 않습니다.",
        es: "ONE separa urgencias de búsqueda normal. No diagnostica."
      },
      [
        { value: "emergency", label: { en: "Emergency", ko: "응급", es: "Emergencia" } },
        { value: "today", label: { en: "Today", ko: "오늘", es: "Hoy" } },
        { value: "routine", label: { en: "Routine", ko: "일반 진료", es: "Rutina" } }
      ],
      {
        en: "ONE will prioritize emergency facilities, same-day availability, or routine options.",
        ko: "ONE이 응급실, 당일 가능 여부, 일반 진료 중 맞는 경로를 우선합니다.",
        es: "ONE priorizará urgencias, disponibilidad hoy u opciones normales."
      },
      !signals.knownUrgency
    ));
    questions.push(q(
      "healthcare-insurance-documents",
      "high",
      0.76,
      "healthcare",
      { en: "Do you need help preparing insurance or documents?", ko: "보험이나 서류 준비도 도와드릴까요?", es: "¿Preparamos seguro o documentos?" },
      { en: "This prevents wasted visits.", ko: "헛걸음을 줄일 수 있습니다.", es: "Evita visitas inútiles." },
      [
        { value: "insurance", label: { en: "Insurance", ko: "보험", es: "Seguro" } },
        { value: "documents", label: { en: "Documents", ko: "서류", es: "Documentos" } },
        { value: "not_needed", label: { en: "Not now", ko: "지금은 아님", es: "Ahora no" } }
      ],
      { en: "ONE will add the right preparation checklist.", ko: "ONE이 필요한 준비 체크리스트를 추가합니다.", es: "ONE añadirá la lista correcta." }
    ));
  }
  if (signals.domain === "education") {
    questions.push(q(
      "education-student-stage",
      "critical",
      0.92,
      "education",
      { en: "Who is this for?", ko: "누구를 위한 학습인가요?", es: "¿Para quién es?" },
      { en: "Age and grade change the right provider and workload.", ko: "나이와 학년에 따라 학원과 숙제량 기준이 달라집니다.", es: "Edad y nivel cambian proveedor y carga." },
      [
        { value: "elementary", label: { en: "Elementary", ko: "초등", es: "Primaria" } },
        { value: "middle", label: { en: "Middle school", ko: "중등", es: "Secundaria" } },
        { value: "adult", label: { en: "Adult", ko: "성인", es: "Adulto" } }
      ],
      { en: "ONE will adjust academy type and workload.", ko: "ONE이 학원 유형과 숙제량 기준을 조정합니다.", es: "ONE ajustará academia y carga." }
    ));
    questions.push(q(
      "education-goal",
      "high",
      0.86,
      "education",
      { en: "What outcome matters most?", ko: "가장 중요한 목표는 무엇인가요?", es: "¿Qué resultado importa más?" },
      { en: "This prevents choosing a place for the wrong reason.", ko: "엉뚱한 기준으로 고르는 일을 막아줍니다.", es: "Evita elegir por el criterio incorrecto." },
      [
        { value: "grades", label: { en: "Grades", ko: "성적", es: "Notas" } },
        { value: "confidence", label: { en: "Confidence", ko: "자신감", es: "Confianza" } },
        { value: "exam", label: { en: "Exam", ko: "시험", es: "Examen" } }
      ],
      { en: "ONE will rank by learning fit, not just popularity.", ko: "ONE이 인기보다 학습 적합도를 우선합니다.", es: "ONE ordenará por ajuste, no popularidad." }
    ));
  }
  if (signals.domain === "business") {
    questions.push(q(
      "business-type",
      "critical",
      0.9,
      "business",
      { en: "What kind of business is this?", ko: "어떤 사업을 준비하시나요?", es: "¿Qué tipo de negocio es?" },
      { en: "Registration order and documents depend on the business type.", ko: "사업 유형에 따라 등록 순서와 서류가 달라집니다.", es: "Registro y documentos dependen del negocio." },
      [
        { value: "online", label: { en: "Online", ko: "온라인", es: "Online" } },
        { value: "restaurant", label: { en: "Food/restaurant", ko: "음식점", es: "Restaurante" } },
        { value: "service", label: { en: "Service", ko: "서비스", es: "Servicio" } }
      ],
      { en: "ONE will reorder licenses, documents, tax, and provider steps.", ko: "ONE이 인허가, 서류, 세무, 제공업체 단계를 다시 정리합니다.", es: "ONE reordenará licencias, documentos, impuestos y proveedores." }
    ));
    questions.push(q(
      "business-employees",
      "high",
      0.72,
      "business",
      { en: "Will you hire employees soon?", ko: "직원을 곧 채용할 예정인가요?", es: "¿Contratarás empleados pronto?" },
      { en: "This changes labor, payroll, and insurance preparation.", ko: "노무, 급여, 보험 준비가 달라집니다.", es: "Cambia trabajo, nómina y seguro." },
      [
        { value: "solo", label: { en: "Solo", ko: "혼자", es: "Solo" } },
        { value: "hiring", label: { en: "Hiring soon", ko: "채용 예정", es: "Contratar pronto" } }
      ],
      { en: "ONE will add the right employment preparation only if needed.", ko: "필요할 때만 채용 준비를 추가합니다.", es: "ONE añadirá preparación laboral solo si hace falta." }
    ));
  }
  if (signals.domain === "career") {
    questions.push(q(
      "career-industry",
      "critical",
      0.88,
      "career",
      { en: "Which field should ONE target?", ko: "어느 분야를 목표로 할까요?", es: "¿Qué sector buscamos?" },
      { en: "This changes job sources, resume language, and interview prep.", ko: "채용처, 이력서 표현, 면접 준비가 달라집니다.", es: "Cambia fuentes, CV y entrevista." },
      [
        { value: "office", label: { en: "Office", ko: "사무직", es: "Oficina" } },
        { value: "tech", label: { en: "Tech", ko: "기술/IT", es: "Tecnología" } },
        { value: "service", label: { en: "Service", ko: "서비스", es: "Servicio" } }
      ],
      { en: "ONE will rank opportunities by fit, language, and constraints.", ko: "ONE이 적합도, 언어, 조건을 기준으로 기회를 정리합니다.", es: "ONE ordenará por ajuste, idioma y condiciones." }
    ));
    questions.push(q(
      "career-visa-language",
      "high",
      0.78,
      "career",
      { en: "Should visa or language fit be prioritized?", ko: "비자나 언어 조건을 우선할까요?", es: "¿Priorizamos visa o idioma?" },
      { en: "This avoids roles the user cannot realistically pursue.", ko: "현실적으로 지원하기 어려운 일을 줄입니다.", es: "Evita opciones poco realistas." },
      [
        { value: "visa", label: { en: "Visa fit", ko: "비자 적합", es: "Visa" } },
        { value: "language", label: { en: "Language fit", ko: "언어 적합", es: "Idioma" } },
        { value: "salary", label: { en: "Salary", ko: "급여", es: "Salario" } }
      ],
      { en: "ONE will filter and explain job feasibility more clearly.", ko: "ONE이 지원 가능성을 더 명확히 걸러 설명합니다.", es: "ONE filtrará viabilidad con más claridad." }
    ));
  }
  return questions.filter(Boolean).map((question) => ({
    ...question,
    titleText: localText(language, question.title),
    explanationText: localText(language, question.explanation),
    improvementText: localText(language, question.improvement),
    choices: question.choices.map((choice) => ({
      ...choice,
      labelText: localText(language, choice.label)
    }))
  }));
}

export function buildProgressiveRefinement(result = {}, context = {}, state = {}, options = {}) {
  const language = options.language || "en";
  const normalized = normalizeRefinementState(state);
  const knownAnswers = normalized.answers || {};
  const archived = normalized.archived || {};
  const candidates = candidateQuestions(result, context, language)
    .filter((question) => !knownAnswers[question.id] && !SKIPPED_STATES.has(archived[question.id]?.status))
    .sort((a, b) => b.score - a.score);
  const visible = candidates.filter((question) => question.visibleEligible).slice(0, MAX_VISIBLE_REFINEMENT_QUESTIONS);
  const visibleIds = new Set(visible.map((question) => question.id));
  const collapsed = candidates.filter((question) => !visibleIds.has(question.id) && question.priority === "helpful");
  return {
    version: ALPHA02_REFINEMENT_VERSION,
    domain: domainFor(result, context),
    visible,
    collapsed,
    all: candidates,
    maxVisible: MAX_VISIBLE_REFINEMENT_QUESTIONS,
    alreadyAnswered: Object.keys(knownAnswers),
    state: normalized
  };
}

export function applyRefinementAnswer(result = {}, answer = {}, options = {}) {
  const language = options.language || "en";
  const next = typeof structuredClone === "function" ? structuredClone(result) : JSON.parse(JSON.stringify(result));
  const questionId = answer.questionId;
  const value = answer.value;
  next.alpha02Refinements = next.alpha02Refinements || { answers: {}, archived: {} };
  next.alpha02Refinements.answers[questionId] = value;
  next.alpha02Refinements.archived[questionId] = {
    status: "answered",
    value,
    answeredAt: new Date().toISOString()
  };
  next.alpha02Refinements.updatedAt = new Date().toISOString();
  next.alpha02LastUpdate = explainRefinementUpdate(questionId, value, language);
  if (next.type === "travel") {
    next.v23TravelPreference = {
      ...(next.v23TravelPreference || {}),
      [questionId]: value
    };
    if (questionId === "travel-walking-preference") {
      next.travelPreferenceNote = value === "less_walking"
        ? localText(language, {
            en: "Because you selected less walking, ONE now favors station-area hotels, licensed transfers, and shorter routes.",
            ko: "덜 걷기를 선택해서 ONE이 역 근처 숙소, 허가된 이동수단, 짧은 동선을 우선합니다.",
            es: "Como elegiste caminar menos, ONE prioriza hoteles cerca de estaciones, traslados autorizados y rutas cortas."
          })
        : localText(language, {
            en: "ONE kept walking flexible and preserved more activity options.",
            ko: "ONE이 걷는 동선을 유연하게 두고 활동 선택지를 넓게 유지했습니다.",
            es: "ONE mantiene caminatas flexibles y más actividades."
          });
    }
    if (questionId === "travel-food-vs-sightseeing") {
      next.travelPreferenceNote = localText(language, {
        en: value === "food_first" ? "Because food matters most, ONE moves markets, restaurants, and café timing higher in the plan." : value === "sightseeing_first" ? "Because sightseeing matters most, ONE moves landmarks and scenic routes earlier." : "ONE keeps food and sightseeing balanced.",
        ko: value === "food_first" ? "맛집 중심을 선택해서 ONE이 시장, 식당, 카페 시간을 더 앞에 둡니다." : value === "sightseeing_first" ? "관광 중심을 선택해서 ONE이 명소와 경치 좋은 동선을 앞에 둡니다." : "ONE이 맛집과 관광을 균형 있게 유지합니다.",
        es: value === "food_first" ? "Como importa la comida, ONE sube mercados, restaurantes y cafés." : value === "sightseeing_first" ? "Como importa el turismo, ONE adelanta lugares icónicos y rutas escénicas." : "ONE mantiene comida y turismo equilibrados."
      });
    }
    if (questionId === "travel-budget-style") {
      next.travelPreferenceNote = localText(language, {
        en: `ONE adjusted the recommendation toward ${value}.`,
        ko: `ONE이 추천 기준을 ${value === "comfort" ? "편안함" : value === "luxury" ? "럭셔리" : "가성비"} 쪽으로 조정했습니다.`,
        es: `ONE ajustó la recomendación hacia ${value}.`
      });
      next.budget = {
        ...(next.budget || {}),
        preference: value
      };
    }
  }
  return next;
}

export function archiveRefinementQuestion(state = {}, questionId, status = "skipped") {
  const next = normalizeRefinementState(state);
  next.archived[questionId] = { status, updatedAt: new Date().toISOString() };
  next.updatedAt = new Date().toISOString();
  return next;
}

export function explainRefinementUpdate(questionId, value, language = "en") {
  const messages = {
    "travel-walking-preference": {
      en: value === "less_walking" ? "Because you selected less walking, ONE tightened hotels, transfers, and activities around easier movement." : "ONE kept the route flexible while preserving more activity choices.",
      ko: value === "less_walking" ? "덜 걷기를 선택해서 ONE이 숙소, 이동수단, 활동을 더 편한 동선으로 조정했습니다." : "ONE이 이동은 유연하게 두고 활동 선택지를 넓게 유지했습니다.",
      es: value === "less_walking" ? "Como elegiste caminar menos, ONE ajustó hotel, transporte y actividades para moverse mejor." : "ONE mantiene la ruta flexible con más opciones."
    },
    "travel-food-vs-sightseeing": {
      en: "ONE updated the journey story around your chosen travel focus.",
      ko: "ONE이 선택한 여행 중심에 맞춰 여정의 흐름을 조정했습니다.",
      es: "ONE actualizó la historia del viaje según tu enfoque."
    },
    "travel-budget-style": {
      en: "ONE updated tradeoffs and approval summary around your budget style.",
      ko: "ONE이 예산 스타일에 맞춰 비교 기준과 승인 요약을 조정했습니다.",
      es: "ONE actualizó criterios y aprobación según tu presupuesto."
    }
  };
  return localText(language, messages[questionId] || {
    en: "ONE updated the mission using your answer.",
    ko: "ONE이 답변을 반영해 미션을 조정했습니다.",
    es: "ONE actualizó la misión con tu respuesta."
  });
}
