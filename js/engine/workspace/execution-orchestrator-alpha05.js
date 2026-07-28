import { prepareActionRequestsFromResolutionPlan } from "../action/trusted-action-gateway-v18.js";

export const ALPHA05_EXECUTION_ORCHESTRATOR_VERSION = "ALPHA-05";

export const ACTION_STATES = Object.freeze([
  "Not Started",
  "Ready",
  "Waiting",
  "Blocked",
  "Searching",
  "Comparing",
  "Awaiting Approval",
  "Executing",
  "Completed",
  "Failed",
  "Cancelled"
]);

const ALLOWED_STATES = new Set(ACTION_STATES);
const EXECUTION_SCOPES = Object.freeze({
  search: "search",
  compare: "compare",
  prepare: "prepare",
  booking: "booking",
  payment: "payment",
  submission: "submission",
  providerContact: "provider_contact"
});

const copy = {
  en: {
    board: "Mission Board",
    readyNow: "Ready Now",
    waitingForYou: "Waiting For You",
    waitingForOne: "Waiting For ONE",
    completed: "Completed",
    blocked: "Blocked",
    nextBestAction: "Next best action",
    actionGraph: "Action Graph",
    timeline: "Mission timeline",
    history: "Action history",
    safety: "Execution safety",
    none: "Nothing here right now.",
    approvalGuard: "Searching, comparing, booking, payment, and submission stay as separate approval scopes.",
    noExecution: "Demo only. No provider contact, booking, payment, or submission happens from this board.",
    prepared: "Execution coordination prepared",
    created: "Action graph created",
    approve: "Review approval scope",
    dates: "Choose travel dates",
    searchFlights: "Search flight options",
    hotels: "Compare hotels",
    restaurants: "Review restaurants",
    itinerary: "Confirm itinerary",
    booking: "Approve booking",
    confirmation: "Track confirmation",
    liveProvider: "Wait for provider-safe status",
    blockedHotel: "Hotel provider unavailable; fallback stays prepared.",
    missingDates: "Travel dates are required before time-sensitive searches.",
    approvalNeeded: "Booking and payment require a separate explicit approval.",
    whyApproval: "This action creates a real-world consequence if connected later."
  },
  ko: {
    board: "미션 보드",
    readyNow: "지금 가능",
    waitingForYou: "사용자 대기",
    waitingForOne: "ONE 대기",
    completed: "완료",
    blocked: "막힘",
    nextBestAction: "다음 최우선 행동",
    actionGraph: "액션 그래프",
    timeline: "미션 타임라인",
    history: "액션 기록",
    safety: "실행 안전",
    none: "지금은 없습니다.",
    approvalGuard: "검색, 비교, 준비, 예약, 결제, 제출은 각각 별도 승인 범위로 분리됩니다.",
    noExecution: "데모 전용입니다. 이 보드에서 제공업체 연락, 예약, 결제, 제출은 진행되지 않습니다.",
    prepared: "실행 조율 준비 완료",
    created: "액션 그래프 생성",
    approve: "승인 범위 검토",
    dates: "여행 날짜 선택",
    searchFlights: "항공편 검색",
    hotels: "호텔 비교",
    restaurants: "레스토랑 검토",
    itinerary: "일정 확인",
    booking: "예약 승인",
    confirmation: "확인 상태 추적",
    liveProvider: "제공업체 안전 상태 대기",
    blockedHotel: "호텔 제공업체가 불가하여 대안을 준비했습니다.",
    missingDates: "시간에 민감한 검색 전 여행 날짜가 필요합니다.",
    approvalNeeded: "예약과 결제는 별도의 명확한 승인이 필요합니다.",
    whyApproval: "향후 연결 시 실제 결과를 만들 수 있는 행동입니다."
  },
  es: {
    board: "Tablero de misión",
    readyNow: "Listo ahora",
    waitingForYou: "Esperando por ti",
    waitingForOne: "Esperando por ONE",
    completed: "Completado",
    blocked: "Bloqueado",
    nextBestAction: "Siguiente mejor acción",
    actionGraph: "Grafo de acciones",
    timeline: "Línea de tiempo",
    history: "Historial de acciones",
    safety: "Seguridad de ejecución",
    none: "Nada aquí ahora.",
    approvalGuard: "Buscar, comparar, preparar, reservar, pagar y enviar quedan como aprobaciones separadas.",
    noExecution: "Solo demo. Este tablero no contacta proveedores, reserva, paga ni envía nada.",
    prepared: "Coordinación de ejecución preparada",
    created: "Grafo de acciones creado",
    approve: "Revisar alcance de aprobación",
    dates: "Elegir fechas de viaje",
    searchFlights: "Buscar vuelos",
    hotels: "Comparar hoteles",
    restaurants: "Revisar restaurantes",
    itinerary: "Confirmar itinerario",
    booking: "Aprobar reserva",
    confirmation: "Seguir confirmación",
    liveProvider: "Esperar estado seguro del proveedor",
    blockedHotel: "Proveedor de hotel no disponible; alternativa preparada.",
    missingDates: "Se necesitan fechas antes de búsquedas sensibles al tiempo.",
    approvalNeeded: "Reserva y pago requieren aprobación explícita separada.",
    whyApproval: "Esta acción podría crear consecuencias reales cuando haya integración."
  }
};

const local = (language, key) => copy[language]?.[key] || copy.en[key] || key;
const normalizeLanguage = (language) => (language === "ko" || language === "es" ? language : "en");
const safe = (value, fallback = "") => String(value ?? fallback).normalize("NFKC").replace(/[<>]/g, "").trim().slice(0, 500);
const list = (value) => Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
const nowIso = (now) => {
  const date = now ? new Date(now) : new Date();
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
};

function stableId(value) {
  return safe(value, "action").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 56) || "action";
}

function makeHistory(type, reason, now) {
  return Object.freeze({
    type: safe(type),
    reason: safe(reason),
    timestamp: nowIso(now)
  });
}

function normalizeState(state) {
  return ALLOWED_STATES.has(state) ? state : "Not Started";
}

function action({
  id,
  title,
  description,
  category,
  status = "Not Started",
  priority = 3,
  dependsOn = [],
  blockedBy = [],
  approvalRequired = false,
  approvalScope = EXECUTION_SCOPES.prepare,
  executor = "ONE",
  estimatedDuration = "5 min",
  retryable = true,
  userVisible = true,
  sourceState = "prepared",
  reason = "",
  now = null
}) {
  const normalized = normalizeState(status);
  return Object.freeze({
    id: safe(id),
    title: safe(title),
    description: safe(description || reason || title),
    category: safe(category || "mission"),
    status: normalized,
    priority,
    dependsOn: Object.freeze(list(dependsOn).map(safe)),
    blockedBy: Object.freeze(list(blockedBy).map(safe)),
    approvalRequired: approvalRequired === true,
    approvalScope: safe(approvalScope),
    executor: safe(executor),
    estimatedDuration: safe(estimatedDuration),
    retryable: retryable !== false,
    userVisible: userVisible !== false,
    sourceState: safe(sourceState),
    lastUpdated: nowIso(now),
    explanation: Object.freeze({
      whyItExists: safe(reason || description || title),
      whyBlocked: blockedBy.length ? safe(blockedBy.join(", ")) : "",
      whatHappensNext: normalized === "Completed" ? "Next dependency can unlock." : "ONE waits for prerequisites or approval.",
      approvalRequired: approvalRequired === true ? safe(approvalScope) : "none"
    }),
    history: Object.freeze([makeHistory("Created", reason || title, now), makeHistory("Updated", `Status: ${normalized}`, now)])
  });
}

function inferMissionDomain(result = {}, resolutionPlan = {}) {
  if (resolutionPlan.domain) return safe(resolutionPlan.domain);
  if (result.type) return safe(result.type);
  if (result.destination || result.schedule || result.v23TravelExperience) return "travel";
  return "general";
}

function baseResolutionPlan(result = {}, domain = "general") {
  const missionId = result.missionId || result.id || `mission-${stableId(result.rawInput || result.originalMission || result.display?.title || domain)}`;
  return {
    version: result.resolutionPlan?.version || "V17",
    resolutionId: result.resolutionPlan?.resolutionId || `resolution-${stableId(missionId)}`,
    missionId,
    domain,
    approvalRequiredActions: result.resolutionPlan?.approvalRequiredActions || (domain === "travel" ? ["book", "pay", "contact"] : ["contact", "schedule"]),
    alternativePaths: result.resolutionPlan?.alternativePaths || [{ title: "Fallback provider" }],
    completionCriteria: result.resolutionPlan?.completionCriteria || ["Outcome accepted by user", "Provider confirmation verified if connected"]
  };
}

function travelActions(result, language, scenario, now) {
  const schedule = result.schedule || {};
  const hasDates = Boolean(schedule.startDate && schedule.endDate) || Boolean(result.v23TravelScenario);
  const hotelBlocked = scenario === "travel-blocked-hotel";
  const awaitingApproval = scenario === "travel-awaiting-approval";
  const bookingCompleted = scenario === "travel-booking-completed";
  const awaitingDates = scenario === "travel-awaiting-dates" || !hasDates;

  const dateStatus = awaitingDates ? "Waiting" : "Completed";
  const searchStatus = awaitingDates ? "Blocked" : bookingCompleted || awaitingApproval ? "Completed" : "Searching";
  const hotelStatus = awaitingDates ? "Blocked" : hotelBlocked ? "Blocked" : bookingCompleted || awaitingApproval ? "Completed" : "Comparing";
  const restaurantStatus = awaitingDates ? "Blocked" : bookingCompleted || awaitingApproval ? "Completed" : "Ready";
  const itineraryStatus = awaitingDates ? "Blocked" : bookingCompleted || awaitingApproval ? "Completed" : "Ready";
  const approvalStatus = bookingCompleted ? "Completed" : awaitingApproval ? "Awaiting Approval" : "Blocked";
  const bookingStatus = bookingCompleted ? "Completed" : approvalStatus === "Awaiting Approval" ? "Blocked" : "Blocked";
  const confirmationStatus = bookingCompleted ? "Completed" : "Not Started";

  return [
    action({
      id: "travel-dates",
      title: local(language, "dates"),
      category: "schedule",
      status: dateStatus,
      priority: 1,
      executor: "User",
      approvalRequired: false,
      approvalScope: EXECUTION_SCOPES.prepare,
      reason: awaitingDates ? local(language, "missingDates") : "Dates are available for planning.",
      now
    }),
    action({
      id: "flight-search",
      title: local(language, "searchFlights"),
      category: "provider-search",
      status: searchStatus,
      priority: 2,
      dependsOn: ["travel-dates"],
      blockedBy: awaitingDates ? ["travel-dates"] : [],
      approvalRequired: true,
      approvalScope: EXECUTION_SCOPES.search,
      executor: "ONE",
      reason: "Flight options need provider-safe search before booking is even considered.",
      now
    }),
    action({
      id: "hotel-compare",
      title: local(language, "hotels"),
      category: "provider-comparison",
      status: hotelStatus,
      priority: 3,
      dependsOn: ["travel-dates"],
      blockedBy: awaitingDates ? ["travel-dates"] : hotelBlocked ? ["hotel-provider"] : [],
      approvalRequired: true,
      approvalScope: EXECUTION_SCOPES.compare,
      executor: "ONE",
      sourceState: hotelBlocked ? "fallback" : "prepared",
      reason: hotelBlocked ? local(language, "blockedHotel") : "Hotels must match dates, destination, and preferences.",
      now
    }),
    action({
      id: "restaurant-review",
      title: local(language, "restaurants"),
      category: "experience",
      status: restaurantStatus,
      priority: 4,
      dependsOn: ["travel-dates"],
      blockedBy: awaitingDates ? ["travel-dates"] : [],
      approvalRequired: false,
      approvalScope: EXECUTION_SCOPES.prepare,
      executor: "ONE",
      reason: "Restaurants support the trip story and can continue even if hotel search is blocked.",
      now
    }),
    action({
      id: "itinerary-confirm",
      title: local(language, "itinerary"),
      category: "review",
      status: itineraryStatus,
      priority: 5,
      dependsOn: ["flight-search", "hotel-compare", "restaurant-review"],
      blockedBy: awaitingDates ? ["travel-dates"] : [],
      approvalRequired: false,
      executor: "User",
      reason: "The user must see the full consequence before approving anything external.",
      now
    }),
    action({
      id: "booking-approval",
      title: local(language, "booking"),
      category: "approval",
      status: approvalStatus,
      priority: 6,
      dependsOn: ["itinerary-confirm"],
      blockedBy: approvalStatus === "Blocked" ? ["itinerary-confirm"] : [],
      approvalRequired: true,
      approvalScope: EXECUTION_SCOPES.booking,
      executor: "User",
      retryable: false,
      reason: local(language, "approvalNeeded"),
      now
    }),
    action({
      id: "provider-confirmation",
      title: local(language, "confirmation"),
      category: "confirmation",
      status: confirmationStatus,
      priority: 7,
      dependsOn: ["booking-approval"],
      blockedBy: bookingCompleted ? [] : ["booking-approval"],
      approvalRequired: true,
      approvalScope: EXECUTION_SCOPES.providerContact,
      executor: "Trusted provider",
      sourceState: "mock_or_future",
      reason: local(language, "liveProvider"),
      now
    })
  ];
}

function generalActions(result, language, scenario, now) {
  const awaitingApproval = scenario === "awaiting-approval";
  return [
    action({
      id: "goal-understanding",
      title: language === "ko" ? "목표 이해" : language === "es" ? "Entender objetivo" : "Understand goal",
      category: "mission",
      status: "Completed",
      priority: 1,
      reason: "ONE has enough context to coordinate the mission safely.",
      now
    }),
    action({
      id: "provider-shortlist",
      title: language === "ko" ? "후보 비교" : language === "es" ? "Comparar opciones" : "Compare options",
      category: "comparison",
      status: "Ready",
      priority: 2,
      dependsOn: ["goal-understanding"],
      approvalRequired: true,
      approvalScope: EXECUTION_SCOPES.compare,
      reason: "Provider candidates can be prepared without external commitment.",
      now
    }),
    action({
      id: "approval-review",
      title: local(language, "approve"),
      category: "approval",
      status: awaitingApproval ? "Awaiting Approval" : "Blocked",
      priority: 3,
      dependsOn: ["provider-shortlist"],
      blockedBy: awaitingApproval ? [] : ["provider-shortlist"],
      approvalRequired: true,
      approvalScope: EXECUTION_SCOPES.providerContact,
      executor: "User",
      reason: local(language, "whyApproval"),
      now
    }),
    action({
      id: "provider-handoff",
      title: language === "ko" ? "제공업체 전달 준비" : language === "es" ? "Preparar traspaso" : "Prepare provider handoff",
      category: "execution",
      status: "Blocked",
      priority: 4,
      dependsOn: ["approval-review"],
      blockedBy: ["approval-review"],
      approvalRequired: true,
      approvalScope: EXECUTION_SCOPES.providerContact,
      executor: "Trusted provider",
      sourceState: "mock_or_future",
      reason: "Future provider handoff remains blocked until approval.",
      now
    })
  ];
}

function unlockDependencies(actions) {
  const byId = new Map(actions.map((item) => [item.id, item]));
  return Object.freeze(actions.map((item) => {
    if (!item.dependsOn.length || ["Completed", "Failed", "Cancelled"].includes(item.status)) return item;
    const blockers = item.dependsOn.filter((dependencyId) => byId.get(dependencyId)?.status !== "Completed");
    const externalBlockers = item.blockedBy.filter((blocker) => !item.dependsOn.includes(blocker));
    if (!blockers.length && !externalBlockers.length && item.status === "Blocked") {
      return Object.freeze({
        ...item,
        status: "Ready",
        blockedBy: Object.freeze([]),
        lastUpdated: nowIso(),
        history: Object.freeze([...item.history, makeHistory("Updated", "Dependency unlocked")])
      });
    }
    if ((blockers.length || externalBlockers.length) && item.status !== "Blocked") {
      const combinedBlockers = [...new Set([...blockers, ...externalBlockers])];
      return Object.freeze({
        ...item,
        status: "Blocked",
        blockedBy: Object.freeze(combinedBlockers),
        lastUpdated: nowIso(),
        history: Object.freeze([...item.history, makeHistory("Updated", `Blocked by ${combinedBlockers.join(", ")}`)])
      });
    }
    return item;
  }));
}

function createEdges(actions) {
  return Object.freeze(actions.flatMap((item) => item.dependsOn.map((dependencyId) => Object.freeze({
    from: safe(dependencyId),
    to: item.id,
    state: item.blockedBy.includes(dependencyId) ? "blocked" : "linked"
  }))));
}

function boardSections(actions, language) {
  const isReady = (item) => ["Ready", "Searching", "Comparing"].includes(item.status);
  const isWaitingUser = (item) => item.status === "Waiting" || (item.status === "Awaiting Approval" && item.executor === "User");
  const isWaitingOne = (item) => item.status === "Awaiting Approval" && item.executor !== "User";
  const isCompleted = (item) => item.status === "Completed";
  const isBlocked = (item) => item.status === "Blocked" || item.status === "Failed";
  const section = (id, label, filter) => Object.freeze({
    id,
    label: local(language, label),
    actions: Object.freeze(actions.filter(filter).map((item) => item.id))
  });
  return Object.freeze([
    section("readyNow", "readyNow", isReady),
    section("waitingForYou", "waitingForYou", isWaitingUser),
    section("waitingForOne", "waitingForOne", isWaitingOne),
    section("completed", "completed", isCompleted),
    section("blocked", "blocked", isBlocked)
  ]);
}

function pickNextBestAction(actions, language) {
  const candidates = actions
    .filter((item) => item.userVisible && !["Completed", "Cancelled"].includes(item.status))
    .sort((a, b) => {
      const weight = (item) => item.status === "Awaiting Approval" ? 0 : item.status === "Waiting" && item.executor === "User" ? 1 : item.status === "Ready" ? 2 : item.status === "Searching" || item.status === "Comparing" ? 3 : 5;
      return weight(a) - weight(b) || a.priority - b.priority;
    });
  const actionItem = candidates[0];
  if (!actionItem) {
    return Object.freeze({
      actionId: null,
      title: language === "ko" ? "미션 상태 확인" : language === "es" ? "Revisar estado" : "Review mission status",
      reason: "All visible actions are completed or waiting for provider evidence."
    });
  }
  return Object.freeze({
    actionId: actionItem.id,
    title: actionItem.title,
    reason: actionItem.explanation.whyItExists
  });
}

function deriveActionRequests(resolutionPlan, actions, now) {
  const actionTypes = actions
    .filter((item) => item.approvalRequired)
    .map((item) => item.approvalScope === EXECUTION_SCOPES.payment ? "pay" : item.approvalScope === EXECUTION_SCOPES.booking ? "book" : item.approvalScope === EXECUTION_SCOPES.submission ? "submit" : item.approvalScope === EXECUTION_SCOPES.providerContact ? "contact" : "requestQuote");
  return prepareActionRequestsFromResolutionPlan(resolutionPlan, { actions: [...new Set(actionTypes)], now });
}

export function createExecutionOrchestrator(result = {}, options = {}) {
  const language = normalizeLanguage(options.language || result.interfaceLanguage || result.language);
  const scenario = options.scenario || result.alpha05Scenario || "";
  const domain = inferMissionDomain(result, result.resolutionPlan);
  const resolutionPlan = { ...baseResolutionPlan(result, domain), ...(result.resolutionPlan || {}) };
  const now = options.now || null;
  const initialActions = domain === "travel"
    ? travelActions(result, language, scenario, now)
    : generalActions(result, language, scenario, now);
  const actions = unlockDependencies(initialActions);
  const actionRequests = deriveActionRequests(resolutionPlan, actions, now);
  const board = boardSections(actions, language);
  const nextBestAction = pickNextBestAction(actions, language);
  const timeline = Object.freeze(actions.map((item) => Object.freeze({
    actionId: item.id,
    label: item.title,
    status: item.status,
    marker: item.status === "Completed" ? "✓" : item.status === "Blocked" ? "○" : "●"
  })));
  const history = Object.freeze(actions.flatMap((item) => item.history.map((event) => Object.freeze({
    actionId: item.id,
    actionTitle: item.title,
    ...event
  }))));

  return Object.freeze({
    version: ALPHA05_EXECUTION_ORCHESTRATOR_VERSION,
    missionId: resolutionPlan.missionId,
    resolutionId: resolutionPlan.resolutionId,
    domain,
    language,
    orchestrationStatus: actions.every((item) => item.status === "Completed") ? "completed_preparation" : "active_coordination",
    actionGraph: Object.freeze({
      nodes: actions,
      edges: createEdges(actions)
    }),
    board,
    nextBestAction,
    timeline,
    history,
    actionRequests,
    executionSafety: Object.freeze({
      searchingSeparateFromBooking: true,
      bookingSeparateFromPayment: true,
      submissionSeparateFromApproval: true,
      noExecutionWithoutApprovedScope: true,
      executionEnabled: false,
      liveProviderClaimed: false,
      note: local(language, "approvalGuard")
    }),
    missionWorkspaceSync: Object.freeze({
      livingMissionCompatible: true,
      affectedSectionsOnly: true,
      actionGraphDrivesBoard: true
    }),
    previewScenarios: Object.freeze(ALPHA05_PREVIEW_SCENARIOS)
  });
}

export function validateExecutionOrchestrator(orchestrator = {}) {
  const actions = orchestrator.actionGraph?.nodes || [];
  const invalidState = actions.find((item) => !ALLOWED_STATES.has(item.status));
  const unsafeApproval = actions.find((item) => ["Executing", "Completed"].includes(item.status) && item.approvalRequired && !["search", "compare", "prepare"].includes(item.approvalScope) && item.sourceState !== "mock_or_future");
  const mergedScope = actions.find((item) => /booking.*payment|payment.*booking/i.test(item.approvalScope));
  return Object.freeze({
    valid: !invalidState && !unsafeApproval && !mergedScope && orchestrator.executionSafety?.executionEnabled === false,
    invalidState: invalidState?.id || null,
    unsafeApproval: unsafeApproval?.id || null,
    mergedScope: mergedScope?.id || null,
    actionCount: actions.length,
    boardSections: orchestrator.board?.length || 0
  });
}

export function advanceActionGraph(orchestrator = {}, event = {}) {
  const targetId = safe(event.actionId);
  const status = normalizeState(event.status || "Ready");
  const actions = (orchestrator.actionGraph?.nodes || []).map((item) => {
    if (item.id !== targetId) return item;
    return Object.freeze({
      ...item,
      status,
      lastUpdated: nowIso(event.now),
      history: Object.freeze([...item.history, makeHistory(status, event.reason || "Manual status update", event.now)])
    });
  });
  return Object.freeze({
    ...orchestrator,
    actionGraph: Object.freeze({ nodes: unlockDependencies(actions), edges: createEdges(actions) }),
    history: Object.freeze([...orchestrator.history, makeHistory("Updated", event.reason || `${targetId} -> ${status}`, event.now)])
  });
}

export const ALPHA05_PREVIEW_SCENARIOS = Object.freeze([
  "travel",
  "travel-blocked-hotel",
  "travel-awaiting-dates",
  "travel-awaiting-approval",
  "travel-booking-completed",
  "healthcare",
  "business-registration",
  "multi-domain-relocation"
]);
