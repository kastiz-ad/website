export const ALPHA04_LIVING_MISSION_VERSION = "ALPHA-04";

const STATUS_LABELS = {
  ready: {
    en: "Everything is ready for review",
    ko: "검토할 준비가 끝났습니다",
    es: "Todo está listo para revisar"
  },
  waiting_dates: {
    en: "Waiting for travel dates",
    ko: "여행 날짜를 기다리는 중",
    es: "Esperando fechas de viaje"
  },
  waiting_approval: {
    en: "Waiting for approval",
    ko: "승인을 기다리는 중",
    es: "Esperando aprobación"
  },
  waiting_live_search: {
    en: "Waiting for live provider check",
    ko: "실시간 제공업체 확인 대기 중",
    es: "Esperando verificación en vivo"
  },
  provider_unavailable: {
    en: "Provider unavailable — fallback prepared",
    ko: "제공업체 불가 — 대안 준비됨",
    es: "Proveedor no disponible — alternativa preparada"
  },
  completed: {
    en: "Completed and ready to resume",
    ko: "완료됨 — 다시 열 수 있습니다",
    es: "Completado y listo para retomar"
  }
};

const STAGE_LABELS = [
  { key: "understanding", en: "Understanding", ko: "이해", es: "Entender" },
  { key: "preparing", en: "Preparing", ko: "준비", es: "Preparar" },
  { key: "refining", en: "Refining", ko: "개선", es: "Refinar" },
  { key: "searching", en: "Searching", ko: "검색", es: "Buscar" },
  { key: "awaitingApproval", en: "Awaiting approval", ko: "승인 대기", es: "Esperando aprobación" },
  { key: "ready", en: "Ready", ko: "준비 완료", es: "Listo" },
  { key: "completed", en: "Completed", ko: "완료", es: "Completado" }
];

const SECTION_LABELS = {
  journey: { en: "Journey", ko: "여정", es: "Viaje" },
  restaurants: { en: "Restaurants", ko: "맛집", es: "Restaurantes" },
  places: { en: "Places", ko: "장소", es: "Lugares" },
  timeline: { en: "Timeline", ko: "일정", es: "Horario" },
  flights: { en: "Flights", ko: "항공", es: "Vuelos" },
  hotels: { en: "Hotels", ko: "숙소", es: "Hoteles" },
  preparation: { en: "Preparation", ko: "준비", es: "Preparación" },
  insights: { en: "Insights", ko: "인사이트", es: "Ideas" },
  approval: { en: "Approval", ko: "승인", es: "Aprobación" }
};

const SCENARIO_DEFINITIONS = {
  "budget-changed": {
    status: "ready",
    affectedSections: ["journey", "hotels", "flights"],
    event: {
      type: "preference_update",
      en: "Budget preference changed; flights and hotels were recalculated.",
      ko: "예산 선호가 바뀌어 항공과 숙소를 다시 계산했습니다.",
      es: "El presupuesto cambió; vuelos y hoteles se recalcularon."
    },
    notification: {
      level: "info",
      en: "Budget changed. ONE updated only pricing-sensitive sections.",
      ko: "예산이 바뀌었습니다. ONE이 가격과 관련된 부분만 업데이트했습니다.",
      es: "El presupuesto cambió. ONE actualizó solo las secciones sensibles al precio."
    }
  },
  "parents-added": {
    status: "ready",
    affectedSections: ["journey", "timeline", "preparation"],
    event: {
      type: "traveler_update",
      en: "Parents were added; comfort, pacing, and preparation were adjusted.",
      ko: "부모님이 추가되어 편안함, 속도, 준비 항목을 조정했습니다.",
      es: "Se agregaron padres; se ajustaron comodidad, ritmo y preparación."
    },
    notification: {
      level: "info",
      en: "Companion context changed. ONE softened the itinerary pace.",
      ko: "동행자 조건이 바뀌었습니다. ONE이 일정 속도를 더 편하게 조정했습니다.",
      es: "Cambió el contexto de acompañantes. ONE suavizó el ritmo."
    }
  },
  "travel-dates-updated": {
    status: "ready",
    affectedSections: ["timeline", "flights", "hotels"],
    event: {
      type: "date_update",
      en: "Travel dates changed; timeline, flight, and hotel sections were refreshed.",
      ko: "여행 날짜가 바뀌어 일정, 항공, 숙소를 새로 정리했습니다.",
      es: "Las fechas cambiaron; se actualizaron horario, vuelos y hoteles."
    },
    notification: {
      level: "important",
      en: "Dates changed. Live availability must be checked again before approval.",
      ko: "날짜가 바뀌었습니다. 승인 전 실시간 가능 여부를 다시 확인해야 합니다.",
      es: "Las fechas cambiaron. Se debe verificar disponibilidad antes de aprobar."
    }
  },
  "weather-changed": {
    status: "ready",
    affectedSections: ["journey", "places", "timeline", "insights"],
    event: {
      type: "weather_update",
      en: "Weather changed; indoor alternatives and timing were updated.",
      ko: "날씨가 바뀌어 실내 대안과 시간을 조정했습니다.",
      es: "Cambió el clima; se actualizaron alternativas bajo techo y horarios."
    },
    notification: {
      level: "info",
      en: "Weather changed. ONE refreshed the affected experience sections only.",
      ko: "날씨가 바뀌었습니다. ONE이 영향을 받는 경험 섹션만 새로 고쳤습니다.",
      es: "Cambió el clima. ONE actualizó solo las secciones afectadas."
    }
  },
  "provider-unavailable": {
    status: "provider_unavailable",
    affectedSections: ["flights", "hotels", "approval"],
    event: {
      type: "provider_update",
      en: "A provider became unavailable; fallback options are ready.",
      ko: "제공업체 하나가 불가 상태가 되어 대안을 준비했습니다.",
      es: "Un proveedor no está disponible; hay alternativas listas."
    },
    notification: {
      level: "important",
      en: "Provider unavailable. ONE prepared fallback options without executing anything.",
      ko: "제공업체가 불가합니다. ONE은 실행 없이 대안만 준비했습니다.",
      es: "Proveedor no disponible. ONE preparó alternativas sin ejecutar nada."
    }
  },
  "approval-completed": {
    status: "completed",
    affectedSections: ["approval"],
    event: {
      type: "approval_update",
      en: "Approval was completed for preparation only.",
      ko: "준비 범위에 대한 승인이 완료되었습니다.",
      es: "La aprobación se completó solo para preparación."
    },
    approval: {
      scope: "search_preparation",
      en: "Approved preparation and comparison. Booking/payment still not approved.",
      ko: "준비와 비교가 승인되었습니다. 예약/결제는 아직 승인되지 않았습니다.",
      es: "Se aprobó preparación y comparación. Reserva/pago aún no aprobados."
    },
    notification: {
      level: "success",
      en: "Approval recorded. No booking, payment, or provider contact happened.",
      ko: "승인이 기록되었습니다. 예약, 결제, 제공업체 연락은 진행되지 않았습니다.",
      es: "Aprobación registrada. No hubo reserva, pago ni contacto."
    }
  },
  "mission-resumed-next-day": {
    status: "ready",
    affectedSections: ["insights", "preparation"],
    event: {
      type: "resume_update",
      en: "Mission resumed; ONE restored workspace state and refreshed time-sensitive notes.",
      ko: "미션을 다시 열었습니다. ONE이 작업 상태를 복원하고 시간 관련 메모를 갱신했습니다.",
      es: "Misión retomada; ONE restauró el estado y actualizó notas sensibles al tiempo."
    },
    notification: {
      level: "info",
      en: "Welcome back. Your selections and open sections were restored.",
      ko: "다시 오신 것을 환영합니다. 선택과 열어둔 섹션을 복원했습니다.",
      es: "Bienvenido de nuevo. Se restauraron selecciones y secciones abiertas."
    }
  }
};

const choose = (value, language = "en") => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || value.ko || value.es || "";
};

const normalizeLanguage = (language) => (language === "ko" || language === "es" ? language : "en");

const missionLabel = (result) => {
  return result?.display?.title || result?.originalMission || result?.rawInput || result?.mission || "Mission";
};

export const livingMissionStorageKey = (result) => {
  const raw = `${missionLabel(result)}:${result?.destination?.city || ""}:${result?.destination?.country || ""}`;
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = ((hash << 5) - hash + raw.charCodeAt(index)) | 0;
  }
  return `kastiz-one-alpha04-living-mission:${Math.abs(hash)}`;
};

export const createLivingMissionWorkspace = (result = {}, options = {}) => {
  const language = normalizeLanguage(options.language || result.interfaceLanguage || result.language);
  const scenario = options.scenario || result.alpha04Scenario || "";
  const definition = SCENARIO_DEFINITIONS[scenario] || null;
  const schedule = result.schedule || {};
  const missingDates = result.type === "travel" && (!schedule.startDate || !schedule.endDate) && !result.v23TravelScenario;
  const statusCode = definition?.status || (missingDates ? "waiting_dates" : "ready");
  const status = {
    code: statusCode,
    label: choose(STATUS_LABELS[statusCode] || STATUS_LABELS.ready, language),
    explanation: definition
      ? choose(definition.event, language)
      : choose({
          en: "ONE has a prepared workspace. Nothing executes until approval.",
          ko: "ONE이 작업 공간을 준비했습니다. 승인 전에는 실행되지 않습니다.",
          es: "ONE preparó el espacio de trabajo. Nada se ejecuta sin aprobación."
        }, language)
  };
  const affectedSections = new Set(definition?.affectedSections || ["journey"]);
  const sectionStates = Object.keys(SECTION_LABELS).map((key) => ({
    key,
    label: choose(SECTION_LABELS[key], language),
    recentlyUpdated: affectedSections.has(key),
    updateReason: affectedSections.has(key) ? status.explanation : ""
  }));
  const completedStages = statusCode === "completed" ? 7 : statusCode === "waiting_approval" ? 5 : missingDates ? 1 : 6;
  const stages = STAGE_LABELS.map((stage, index) => ({
    ...stage,
    label: choose(stage, language),
    state: index < completedStages ? "done" : index === completedStages ? "current" : "pending"
  }));
  const tasks = [
    {
      id: "dates",
      done: !missingDates,
      label: choose({ en: "Confirm mission dates", ko: "미션 날짜 확인", es: "Confirmar fechas" }, language)
    },
    {
      id: "live-check",
      done: statusCode !== "waiting_live_search",
      label: choose({ en: "Refresh live provider data", ko: "실시간 제공업체 데이터 갱신", es: "Actualizar datos en vivo" }, language)
    },
    {
      id: "approval",
      done: statusCode === "completed",
      label: choose({ en: "Review approval scope", ko: "승인 범위 검토", es: "Revisar alcance de aprobación" }, language)
    }
  ].filter((task) => !task.done);
  const history = [
    {
      id: "created",
      type: "created",
      label: choose({ en: "Mission workspace created", ko: "미션 작업 공간 생성", es: "Espacio de misión creado" }, language),
      at: result.createdAt || new Date().toISOString(),
      sections: ["journey"]
    },
    ...(definition ? [{
      id: scenario,
      type: definition.event.type,
      label: choose(definition.event, language),
      at: new Date().toISOString(),
      sections: [...affectedSections]
    }] : []),
    ...((result.alpha02Refinements?.history || []).slice(-3).map((event, index) => ({
      id: `refinement-${index}`,
      type: "refinement",
      label: event.label || choose({ en: "Preference refinement saved", ko: "선호 개선 내용 저장", es: "Refinamiento guardado" }, language),
      at: event.at || result.alpha02Refinements?.updatedAt || new Date().toISOString(),
      sections: ["journey", "insights"]
    })))
  ];
  const approvalHistory = [
    ...(definition?.approval ? [{
      id: "approval-demo",
      scope: definition.approval.scope,
      label: choose(definition.approval, language),
      at: new Date().toISOString(),
      executionApproved: false
    }] : []),
    ...((result.approvalHistory || []).map((approval, index) => ({
      id: approval.id || `approval-${index}`,
      scope: approval.scope || "preparation",
      label: approval.label || approval.summary || choose({ en: "Approval recorded", ko: "승인 기록됨", es: "Aprobación registrada" }, language),
      at: approval.at || approval.timestamp || new Date().toISOString(),
      executionApproved: approval.executionApproved === true
    })))
  ];
  const notifications = [
    ...(definition?.notification ? [{
      id: scenario || "workspace-update",
      level: definition.notification.level,
      label: choose(definition.notification, language)
    }] : []),
    ...(statusCode === "waiting_dates" ? [{
      id: "dates-required",
      level: "important",
      label: choose({ en: "Dates are still needed before ONE can verify time-sensitive options.", ko: "시간에 민감한 옵션 확인을 위해 날짜가 필요합니다.", es: "Se necesitan fechas para verificar opciones sensibles al tiempo." }, language)
    }] : [])
  ];
  const progress = Math.round((stages.filter((stage) => stage.state === "done").length / stages.length) * 100);
  return {
    version: ALPHA04_LIVING_MISSION_VERSION,
    mission: missionLabel(result),
    language,
    status,
    progress,
    nextAction: tasks[0]?.label || choose({ en: "Review and approve when ready", ko: "준비되면 검토하고 승인", es: "Revisar y aprobar cuando esté listo" }, language),
    lastUpdated: history.at(-1)?.at || new Date().toISOString(),
    stages,
    tasks,
    notifications,
    history,
    approvalHistory,
    sectionStates
  };
};

export const sectionWasRecentlyUpdated = (workspace, sectionKey) => {
  return Boolean(workspace?.sectionStates?.find((section) => section.key === sectionKey && section.recentlyUpdated));
};

export const getSectionUpdateReason = (workspace, sectionKey) => {
  return workspace?.sectionStates?.find((section) => section.key === sectionKey)?.updateReason || "";
};

export const ALPHA04_PREVIEW_SCENARIOS = Object.keys(SCENARIO_DEFINITIONS);
