export const ALPHA12_LIFE_TIMELINE_VERSION = "ALPHA-12";

export const MISSION_RELATIONSHIPS = Object.freeze({
  PREVIOUS: "previous",
  NEXT: "next",
  RELATED: "related",
  DEPENDENT: "dependent",
  SUGGESTED: "suggested",
  OPTIONAL: "optional",
  FUTURE: "future"
});

export const LIFE_STAGES = Object.freeze({
  STUDENT: "student",
  YOUNG_PROFESSIONAL: "young_professional",
  BUSINESS_FOUNDER: "business_founder",
  PARENT: "parent",
  RETIREMENT: "retirement",
  FREQUENT_TRAVELER: "frequent_traveler",
  DIGITAL_NOMAD: "digital_nomad",
  UNKNOWN: "unknown"
});

const normalize = (value = "") => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
const safeId = (value = "") => normalize(value).replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "") || "mission";
const uniqBy = (items = [], keyFn) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const asArray = (value) => Array.isArray(value) ? value : value ? [value] : [];
const local = (language = "en", copy = {}) => copy[language] || copy.en || "";

const stageLabels = {
  [LIFE_STAGES.STUDENT]: { en: "Student", ko: "학생", es: "Estudiante" },
  [LIFE_STAGES.YOUNG_PROFESSIONAL]: { en: "Young Professional", ko: "사회 초년생", es: "Profesional joven" },
  [LIFE_STAGES.BUSINESS_FOUNDER]: { en: "Business Founder", ko: "창업자", es: "Fundador" },
  [LIFE_STAGES.PARENT]: { en: "Parent", ko: "부모", es: "Padre/madre" },
  [LIFE_STAGES.RETIREMENT]: { en: "Retirement", ko: "은퇴 준비", es: "Jubilación" },
  [LIFE_STAGES.FREQUENT_TRAVELER]: { en: "Frequent Traveler", ko: "자주 여행하는 사람", es: "Viajero frecuente" },
  [LIFE_STAGES.DIGITAL_NOMAD]: { en: "Digital Nomad", ko: "디지털 노마드", es: "Nómada digital" },
  [LIFE_STAGES.UNKNOWN]: { en: "Life stage not assumed", ko: "생활 단계 추정 안 함", es: "Etapa no asumida" }
};

const relationshipLabels = {
  [MISSION_RELATIONSHIPS.PREVIOUS]: { en: "Previous", ko: "이전", es: "Anterior" },
  [MISSION_RELATIONSHIPS.NEXT]: { en: "Next", ko: "다음", es: "Siguiente" },
  [MISSION_RELATIONSHIPS.RELATED]: { en: "Related", ko: "관련", es: "Relacionado" },
  [MISSION_RELATIONSHIPS.DEPENDENT]: { en: "Dependent", ko: "의존", es: "Dependiente" },
  [MISSION_RELATIONSHIPS.SUGGESTED]: { en: "Suggested", ko: "제안", es: "Sugerido" },
  [MISSION_RELATIONSHIPS.OPTIONAL]: { en: "Optional", ko: "선택", es: "Opcional" },
  [MISSION_RELATIONSHIPS.FUTURE]: { en: "Future", ko: "미래", es: "Futuro" }
};

export const relationshipLabel = (relationship, language = "en") => local(language, relationshipLabels[relationship] || { en: relationship });
export const lifeStageLabel = (stage, language = "en") => local(language, stageLabels[stage] || stageLabels.unknown);

export const inferLifeStage = ({ missionText = "", memory = {}, context = {} } = {}) => {
  const text = normalize([
    missionText,
    context.missionType,
    context.purpose?.value,
    asArray(memory?.lifeStages).join(" "),
    asArray(memory?.preferences).join(" ")
  ].filter(Boolean).join(" "));
  const evidence = [];
  const match = (stage, pattern, reason) => {
    if (!pattern.test(text)) return null;
    evidence.push(reason);
    return stage;
  };
  return match(LIFE_STAGES.STUDENT, /student|university|study abroad|school|exam|학생|대학교|유학|학교|estudiante|universidad|estudiar/, "education-related mission")
    || match(LIFE_STAGES.BUSINESS_FOUNDER, /business|company|startup|founder|registration|사업|회사|창업|empresa|negocio|fundador/, "business-building mission")
    || match(LIFE_STAGES.PARENT, /child|kids|family|parent|school registration|아이|자녀|가족|부모|niños|familia|padres/, "family-related mission")
    || match(LIFE_STAGES.FREQUENT_TRAVELER, /travel|trip|flight|hotel|passport|visa|여행|출장|항공|호텔|비자|viaje|vuelo|hotel|visa/, "travel-related mission")
    || match(LIFE_STAGES.YOUNG_PROFESSIONAL, /job|career|resume|interview|salary|취업|일자리|이력서|면접|trabajo|carrera|entrevista/, "career-related mission")
    || match(LIFE_STAGES.RETIREMENT, /retire|pension|retirement|은퇴|연금|jubilaci/, "retirement-related mission")
    || match(LIFE_STAGES.DIGITAL_NOMAD, /remote work|digital nomad|work abroad|원격근무|디지털 노마드|nómada digital/, "remote-life mission")
    || LIFE_STAGES.UNKNOWN;
};

const missionDomain = (result = {}, context = {}) => normalize(result.type || result.domain || context.missionType || result.resolutionPlan?.domain || "general");

const currentMissionNode = (result = {}, context = {}, language = "en") => {
  const title = result.display?.title || result.originalMission || result.rawInput || result.mission || result.title?.[language] || result.title?.en || "Current mission";
  return {
    missionId: result.missionId || result.id || `mission-${safeId(title)}`,
    title,
    domain: missionDomain(result, context),
    status: result.missionProgress?.currentState || result.status || "active",
    relationship: "current",
    evidence: local(language, {
      en: "This is the mission currently being prepared.",
      ko: "현재 준비 중인 미션입니다.",
      es: "Esta es la misión que se está preparando."
    })
  };
};

const templates = {
  travel: [
    ["passport-renewal", "Passport readiness", "여권 준비", "Pasaporte listo", MISSION_RELATIONSHIPS.DEPENDENT],
    ["travel-insurance", "Travel insurance", "여행 보험", "Seguro de viaje", MISSION_RELATIONSHIPS.SUGGESTED],
    ["airport-transfer", "Airport transfer", "공항 이동", "Traslado al aeropuerto", MISSION_RELATIONSHIPS.NEXT],
    ["currency-exchange", "Currency exchange", "환전", "Cambio de moneda", MISSION_RELATIONSHIPS.RELATED],
    ["restaurant-booking", "Restaurant shortlist", "레스토랑 후보", "Restaurantes", MISSION_RELATIONSHIPS.OPTIONAL],
    ["photo-storage", "Travel photo organization", "여행 사진 정리", "Organizar fotos", MISSION_RELATIONSHIPS.FUTURE],
    ["expense-summary", "Expense summary", "여행 경비 정리", "Resumen de gastos", MISSION_RELATIONSHIPS.FUTURE]
  ],
  business: [
    ["business-bank", "Business bank account", "사업자 은행 계좌", "Cuenta bancaria empresarial", MISSION_RELATIONSHIPS.NEXT],
    ["accounting", "Accounting setup", "회계 준비", "Contabilidad", MISSION_RELATIONSHIPS.DEPENDENT],
    ["payroll", "Payroll preparation", "급여 준비", "Nómina", MISSION_RELATIONSHIPS.FUTURE],
    ["business-insurance", "Business insurance", "사업 보험", "Seguro empresarial", MISSION_RELATIONSHIPS.SUGGESTED],
    ["hiring", "Hiring preparation", "채용 준비", "Contratación", MISSION_RELATIONSHIPS.FUTURE]
  ],
  education: [
    ["exam-plan", "Language or entrance exam plan", "어학/입학 시험 계획", "Plan de examen", MISSION_RELATIONSHIPS.NEXT],
    ["visa", "Student visa preparation", "학생 비자 준비", "Visa de estudiante", MISSION_RELATIONSHIPS.DEPENDENT],
    ["housing", "Student housing", "학생 주거", "Vivienda estudiantil", MISSION_RELATIONSHIPS.NEXT],
    ["bank-account", "Bank account", "은행 계좌", "Cuenta bancaria", MISSION_RELATIONSHIPS.RELATED],
    ["phone-plan", "Phone plan", "휴대폰 요금제", "Plan móvil", MISSION_RELATIONSHIPS.OPTIONAL],
    ["transport-card", "Transportation card", "교통카드", "Tarjeta de transporte", MISSION_RELATIONSHIPS.OPTIONAL]
  ],
  career: [
    ["resume", "Resume / CV preparation", "이력서 준비", "CV", MISSION_RELATIONSHIPS.NEXT],
    ["interview", "Interview preparation", "면접 준비", "Entrevista", MISSION_RELATIONSHIPS.NEXT],
    ["job-matching", "Job matching", "일자리 매칭", "Búsqueda de empleo", MISSION_RELATIONSHIPS.RELATED],
    ["visa-status", "Visa or work eligibility check", "비자/취업 자격 확인", "Elegibilidad laboral", MISSION_RELATIONSHIPS.DEPENDENT]
  ],
  housing: [
    ["moving", "Moving preparation", "이사 준비", "Mudanza", MISSION_RELATIONSHIPS.NEXT],
    ["internet", "Internet setup", "인터넷 설치", "Internet", MISSION_RELATIONSHIPS.RELATED],
    ["utilities", "Utilities", "공과금/전기/수도", "Servicios", MISSION_RELATIONSHIPS.DEPENDENT],
    ["furniture", "Furniture", "가구", "Muebles", MISSION_RELATIONSHIPS.OPTIONAL],
    ["insurance", "Home insurance", "주거 보험", "Seguro de vivienda", MISSION_RELATIONSHIPS.SUGGESTED],
    ["address-update", "Address update", "주소 변경", "Cambio de dirección", MISSION_RELATIONSHIPS.DEPENDENT]
  ],
  family: [
    ["school", "School planning", "학교 준비", "Escuela", MISSION_RELATIONSHIPS.FUTURE],
    ["health-check", "Family health check", "가족 건강검진", "Chequeo familiar", MISSION_RELATIONSHIPS.SUGGESTED],
    ["travel", "Family travel", "가족 여행", "Viaje familiar", MISSION_RELATIONSHIPS.OPTIONAL],
    ["care", "Care coordination", "돌봄 준비", "Cuidado", MISSION_RELATIONSHIPS.RELATED]
  ],
  general: [
    ["documents", "Document checklist", "서류 체크리스트", "Lista de documentos", MISSION_RELATIONSHIPS.NEXT],
    ["provider-shortlist", "Provider shortlist", "제공업체 후보", "Proveedores", MISSION_RELATIONSHIPS.RELATED],
    ["follow-up", "Follow-up mission", "후속 미션", "Misión siguiente", MISSION_RELATIONSHIPS.FUTURE]
  ]
};

const domainTemplateKey = (domain = "") => {
  if (/travel|trip|restaurant/.test(domain)) return "travel";
  if (/business|company|startup|finance|tax/.test(domain)) return "business";
  if (/education|student|academy|tutor|school/.test(domain)) return "education";
  if (/career|job|hiring|work/.test(domain)) return "career";
  if (/housing|home|real-estate|moving/.test(domain)) return "housing";
  if (/family|child|parent|care/.test(domain)) return "family";
  return "general";
};

const makeRelatedMission = ([id, en, ko, es, relationship], base = {}, language = "en") => ({
  missionId: `future-${id}`,
  title: local(language, { en, ko, es }),
  canonicalTitle: en,
  domain: id,
  relationship,
  status: "prepared_opportunity",
  evidence: local(language, {
    en: "This can naturally follow the current mission.",
    ko: "현재 미션 이후 자연스럽게 이어질 수 있습니다.",
    es: "Puede seguir naturalmente a la misión actual."
  })
});

export const buildMissionRelationships = ({ result = {}, context = {}, previousMissions = [], language = "en" } = {}) => {
  const current = currentMissionNode(result, context, language);
  const domainKey = domainTemplateKey(current.domain);
  const related = (templates[domainKey] || templates.general).map((template) => makeRelatedMission(template, current, language));
  const previous = previousMissions.slice(-4).map((mission) => ({
    missionId: mission.missionId || mission.id || `previous-${safeId(mission.title || mission.rawInput || "mission")}`,
    title: mission.title || mission.rawInput || mission.mission || "Previous mission",
    domain: mission.domain || mission.type || "general",
    relationship: MISSION_RELATIONSHIPS.PREVIOUS,
    status: mission.status || "completed",
    evidence: local(language, { en: "User-owned previous mission record.", ko: "사용자 소유 이전 미션 기록입니다.", es: "Registro previo del usuario." })
  }));
  return uniqBy([current, ...previous, ...related], (mission) => `${mission.relationship}:${safeId(mission.title)}`);
};

export const buildGoalSystem = ({ result = {}, context = {}, goals = [], language = "en" } = {}) => {
  const domain = missionDomain(result, context);
  const inferredGoalTitle = /travel|trip/.test(domain)
    ? local(language, { en: "Travel smoothly", ko: "여행을 편하게 완성하기", es: "Viajar sin fricción" })
    : /business/.test(domain)
      ? local(language, { en: "Build a company", ko: "회사 만들기", es: "Crear empresa" })
      : /education|student/.test(domain)
        ? local(language, { en: "Study successfully", ko: "공부/유학 성공", es: "Estudiar con éxito" })
        : /career|job/.test(domain)
          ? local(language, { en: "Advance career", ko: "커리어 발전", es: "Avanzar carrera" })
          : local(language, { en: "Complete this life step", ko: "이번 삶의 단계를 완성하기", es: "Completar este paso" });
  const sourceGoals = goals.length ? goals : [{ goalId: `goal-${safeId(inferredGoalTitle)}`, title: inferredGoalTitle, status: "active" }];
  return sourceGoals.map((goal) => {
    const completed = asArray(goal.completed).slice(0, 6);
    const remaining = asArray(goal.remaining).length ? asArray(goal.remaining) : (templates[domainTemplateKey(domain)] || templates.general).slice(0, 4).map(([id, en, ko, es]) => local(language, { en, ko, es }));
    return {
      goalId: goal.goalId || `goal-${safeId(goal.title)}`,
      title: goal.title,
      status: goal.status || "active",
      supportsCurrentMission: true,
      completed,
      remaining,
      progressNarrative: local(language, {
        en: `${completed.length} completed; ${remaining.length} meaningful steps remain.`,
        ko: `${completed.length}개 완료, 의미 있는 다음 단계 ${remaining.length}개가 남았습니다.`,
        es: `${completed.length} completadas; quedan ${remaining.length} pasos importantes.`
      })
    };
  });
};

export const suggestFutureMissions = ({ relationships = [], predictions = {}, monitoring = {}, language = "en" } = {}) => {
  const relationshipSuggestions = relationships
    .filter((mission) => [MISSION_RELATIONSHIPS.NEXT, MISSION_RELATIONSHIPS.SUGGESTED, MISSION_RELATIONSHIPS.FUTURE].includes(mission.relationship))
    .map((mission) => ({
      missionId: mission.missionId,
      title: mission.title,
      relationship: mission.relationship,
      reason: mission.evidence,
      source: "life_timeline_relationship"
    }));
  const predictionSuggestions = asArray(predictions.visible || predictions.predictions).slice(0, 3).map((prediction) => ({
    missionId: `prediction-${safeId(prediction.id || prediction.title)}`,
    title: prediction.title || prediction.label,
    relationship: MISSION_RELATIONSHIPS.FUTURE,
    reason: prediction.why || prediction.reason || local(language, { en: "Prediction may affect a future mission.", ko: "예측이 향후 미션에 영향을 줄 수 있습니다.", es: "La predicción puede afectar una misión futura." }),
    source: "predictive_intelligence"
  }));
  const monitoringSuggestions = asArray(monitoring.notifications).slice(0, 2).map((event) => ({
    missionId: `monitoring-${safeId(event.eventId)}`,
    title: event.nextRecommendedAction,
    relationship: MISSION_RELATIONSHIPS.SUGGESTED,
    reason: event.evidence,
    source: "mission_monitoring"
  }));
  return uniqBy([...monitoringSuggestions, ...predictionSuggestions, ...relationshipSuggestions], (mission) => safeId(mission.title)).slice(0, 8);
};

export const createLifeTimelineLayer = ({
  result = {},
  context = {},
  memory = {},
  predictions = {},
  monitoring = {},
  previousMissions = [],
  goals = [],
  state = {},
  language = "en"
} = {}) => {
  const stage = state.stage || inferLifeStage({ missionText: result.rawInput || result.originalMission || result.mission, memory, context });
  const relationships = buildMissionRelationships({ result, context, previousMissions, language });
  const goalSystem = buildGoalSystem({ result, context, goals, language });
  const futureMissions = state.suggestionsDisabled ? [] : suggestFutureMissions({ relationships, predictions, monitoring, language });
  const current = relationships.find((mission) => mission.relationship === "current");
  return {
    version: ALPHA12_LIFE_TIMELINE_VERSION,
    mode: "life_journey_not_calendar_todo_or_crm",
    userControlled: true,
    paused: Boolean(state.paused),
    hidden: Boolean(state.hidden),
    suggestionsDisabled: Boolean(state.suggestionsDisabled),
    lifeStage: stage,
    lifeStageLabel: lifeStageLabel(stage, language),
    evidence: stage === LIFE_STAGES.UNKNOWN
      ? local(language, { en: "No life stage assumed without evidence.", ko: "근거 없이 생활 단계를 추정하지 않았습니다.", es: "No se asumió etapa sin evidencia." })
      : local(language, { en: "Inferred only from current mission evidence.", ko: "현재 미션 근거로만 추정했습니다.", es: "Inferido solo con evidencia de la misión." }),
    currentMission: current,
    relationships,
    goals: goalSystem,
    futureMissions,
    missionMap: {
      completed: relationships.filter((mission) => mission.relationship === MISSION_RELATIONSHIPS.PREVIOUS),
      current: current ? [current] : [],
      upcoming: relationships.filter((mission) => [MISSION_RELATIONSHIPS.NEXT, MISSION_RELATIONSHIPS.DEPENDENT].includes(mission.relationship)).slice(0, 4),
      related: relationships.filter((mission) => [MISSION_RELATIONSHIPS.RELATED, MISSION_RELATIONSHIPS.OPTIONAL].includes(mission.relationship)).slice(0, 4),
      future: futureMissions.slice(0, 4)
    },
    controls: {
      pause: true,
      hide: true,
      delete: true,
      export: true,
      disableSuggestions: true
    },
    sourceReuse: {
      personalMissionMemory: Boolean(memory),
      predictiveIntelligence: Boolean(predictions),
      missionMonitoring: Boolean(monitoring),
      multiAgentDirector: Boolean(result.alpha08MissionDirector),
      worldIntelligence: Boolean(result.worldIntelligence)
    },
    privacy: "user_owned_exportable_deletable_no_duplicate_memory"
  };
};

export const pauseLifeTimeline = (state = {}) => ({ ...state, paused: true });
export const hideLifeTimeline = (state = {}) => ({ ...state, hidden: true });
export const disableLifeMissionSuggestions = (state = {}) => ({ ...state, suggestionsDisabled: true });
export const deleteLifeTimeline = () => ({ deleted: true, hidden: true, suggestionsDisabled: true });

export const exportLifeTimeline = (layer = {}) => ({
  version: layer.version,
  exportedAt: new Date().toISOString(),
  lifeStage: layer.lifeStage,
  relationships: layer.relationships || [],
  goals: layer.goals || [],
  futureMissions: layer.futureMissions || []
});

export const validateLifeTimelineLayer = (layer = {}) => {
  const failures = [];
  if (layer.version !== ALPHA12_LIFE_TIMELINE_VERSION) failures.push("wrong_version");
  if (layer.mode !== "life_journey_not_calendar_todo_or_crm") failures.push("wrong_mode");
  if (!layer.userControlled) failures.push("user_control_missing");
  if (!layer.privacy) failures.push("privacy_boundary_missing");
  if (!layer.currentMission) failures.push("current_mission_missing");
  if (!Array.isArray(layer.relationships) || !layer.relationships.length) failures.push("relationships_missing");
  if ((layer.futureMissions || []).length !== uniqBy(layer.futureMissions || [], (mission) => safeId(mission.title)).length) failures.push("duplicate_future_missions");
  if ((layer.goals || []).some((goal) => /\d+%/.test(goal.progressNarrative || ""))) failures.push("arbitrary_percentage_progress");
  return { ok: failures.length === 0, failures };
};
