export const APPROVAL_ENGINE_VERSION = "APPROVAL_ENGINE_V1";

export const MISSION_STATES = Object.freeze({
  DRAFT: "draft",
  PLANNING: "planning",
  NEEDS_CLARIFICATION: "needs_clarification",
  READY_FOR_APPROVAL: "ready_for_approval",
  APPROVED_FOR_SEARCH: "approved_for_search",
  SEARCHING: "searching",
  RESULTS_READY: "results_ready",
  SELECTION_PENDING: "selection_pending",
  READY_TO_EXECUTE: "ready_to_execute",
  EXECUTING: "executing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  FAILED: "failed"
});

export const APPROVAL_SCOPES = Object.freeze({
  SEARCH_FLIGHTS: "search_flights",
  SEARCH_HOTELS: "search_hotels",
  SEARCH_RESTAURANTS: "search_restaurants",
  SEARCH_EXPERIENCES: "search_experiences",
  SEARCH_TRANSPORTATION: "search_transportation",
  BOOK_FLIGHT: "book_flight_future",
  RESERVE_HOTEL: "reserve_hotel_future",
  PURCHASE_TICKETS: "purchase_tickets_future",
  PROVIDER_CONTACT: "provider_contact_future"
});

export const APPROVAL_STATUS = Object.freeze({
  ACTIVE: "active",
  INVALIDATED: "invalidated",
  EXPIRED: "expired",
  REVOKED: "revoked"
});

const EXECUTION_STATES = new Set([
  MISSION_STATES.SEARCHING,
  MISSION_STATES.READY_TO_EXECUTE,
  MISSION_STATES.EXECUTING
]);

const nowIso = (now = new Date()) => new Date(now).toISOString();
const minutesFrom = (now, minutes) => new Date(new Date(now).getTime() + minutes * 60 * 1000).toISOString();
const normalizeScope = (scope) => String(scope || "").trim();
const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

const audit = ({ missionVersion, action, provider = null, approvalId = null, error = null, timestamp }) => Object.freeze({
  timestamp,
  missionVersion,
  action,
  provider,
  approvalId,
  error,
  internalOnly: true
});

export function createMissionLifecycle(mission = {}, { now = new Date(), state } = {}) {
  const timestamp = nowIso(now);
  const version = Number.isFinite(Number(mission.version)) ? Number(mission.version) : 1;
  return Object.freeze({
    version: APPROVAL_ENGINE_VERSION,
    missionId: mission.missionId || mission.id || `mission-${timestamp}`,
    missionVersion: version,
    state: state || mission.lifecycle?.state || MISSION_STATES.DRAFT,
    approvals: Object.freeze(asArray(mission.lifecycle?.approvals)),
    conflicts: Object.freeze(asArray(mission.lifecycle?.conflicts)),
    auditLog: Object.freeze([
      ...asArray(mission.lifecycle?.auditLog),
      audit({ missionVersion: version, action: "lifecycle_created", timestamp })
    ]),
    userMessage: mission.lifecycle?.userMessage || null,
    bookingEnabled: false,
    paymentEnabled: false,
    providerContactEnabled: false
  });
}

export function transitionMissionState(lifecycle = {}, nextState, { now = new Date(), providerAction = null } = {}) {
  if (!Object.values(MISSION_STATES).includes(nextState)) {
    throw new Error(`unknown_mission_state:${nextState}`);
  }
  if (providerAction && !EXECUTION_STATES.has(nextState)) {
    throw new Error(`provider_action_blocked_by_state:${nextState}`);
  }
  const timestamp = nowIso(now);
  return Object.freeze({
    ...lifecycle,
    state: nextState,
    auditLog: Object.freeze([
      ...asArray(lifecycle.auditLog),
      audit({ missionVersion: lifecycle.missionVersion || 1, action: `state:${lifecycle.state || "unknown"}->${nextState}`, provider: providerAction, timestamp })
    ])
  });
}

export function createApprovalRecord({
  missionId,
  missionVersion = 1,
  approvedScope,
  approvedBy = "user",
  now = new Date(),
  ttlMinutes = 15
} = {}) {
  if (!missionId) throw new Error("approval_requires_mission_id");
  if (!approvedScope) throw new Error("approval_requires_scope");
  const timestamp = nowIso(now);
  const scope = normalizeScope(approvedScope);
  return Object.freeze({
    approvalId: `approval-${missionId}-${missionVersion}-${scope}-${new Date(timestamp).getTime()}`,
    missionId,
    missionVersion,
    timestamp,
    approvedScope: scope,
    approvedBy,
    status: APPROVAL_STATUS.ACTIVE,
    expiresAt: minutesFrom(timestamp, ttlMinutes),
    version: 1
  });
}

export function approveMissionScope(lifecycle = {}, approvedScope, { approvedBy = "user", now = new Date(), ttlMinutes = 15 } = {}) {
  const record = createApprovalRecord({
    missionId: lifecycle.missionId,
    missionVersion: lifecycle.missionVersion || 1,
    approvedScope,
    approvedBy,
    now,
    ttlMinutes
  });
  const nextState = String(approvedScope).startsWith("search_") ? MISSION_STATES.APPROVED_FOR_SEARCH : MISSION_STATES.READY_TO_EXECUTE;
  return Object.freeze({
    ...lifecycle,
    state: nextState,
    approvals: Object.freeze([...asArray(lifecycle.approvals), record]),
    userMessage: "ONE is ready to search live providers. Nothing will be booked without another confirmation.",
    auditLog: Object.freeze([
      ...asArray(lifecycle.auditLog),
      audit({ missionVersion: lifecycle.missionVersion || 1, action: `approval_created:${approvedScope}`, approvalId: record.approvalId, timestamp: record.timestamp })
    ])
  });
}

export function getCurrentApproval(lifecycle = {}, scope, { now = new Date() } = {}) {
  const timestamp = new Date(now).getTime();
  const currentVersion = lifecycle.missionVersion || 1;
  return [...asArray(lifecycle.approvals)].reverse().find((approval) => {
    if (approval.approvedScope !== normalizeScope(scope)) return false;
    if (approval.missionVersion !== currentVersion) return false;
    if (approval.status !== APPROVAL_STATUS.ACTIVE) return false;
    return new Date(approval.expiresAt).getTime() > timestamp;
  }) || null;
}

export function hasCurrentApproval(lifecycle = {}, scope, options = {}) {
  return Boolean(getCurrentApproval(lifecycle, scope, options));
}

export function expireApprovals(lifecycle = {}, { now = new Date() } = {}) {
  const timestamp = new Date(now).getTime();
  return Object.freeze({
    ...lifecycle,
    approvals: Object.freeze(asArray(lifecycle.approvals).map((approval) => (
      approval.status === APPROVAL_STATUS.ACTIVE && new Date(approval.expiresAt).getTime() <= timestamp
        ? Object.freeze({ ...approval, status: APPROVAL_STATUS.EXPIRED })
        : approval
    )))
  });
}

export function applyMissionVersionChange(lifecycle = {}, { changedFields = [], reason = "mission_changed", now = new Date() } = {}) {
  const nextVersion = (lifecycle.missionVersion || 1) + 1;
  const timestamp = nowIso(now);
  return Object.freeze({
    ...lifecycle,
    missionVersion: nextVersion,
    state: MISSION_STATES.READY_FOR_APPROVAL,
    approvals: Object.freeze(asArray(lifecycle.approvals).map((approval) => (
      approval.status === APPROVAL_STATUS.ACTIVE
        ? Object.freeze({ ...approval, status: APPROVAL_STATUS.INVALIDATED, invalidatedAt: timestamp, invalidatedBy: reason })
        : approval
    ))),
    userMessage: "Your trip has changed. Please review before continuing.",
    auditLog: Object.freeze([
      ...asArray(lifecycle.auditLog),
      audit({ missionVersion: nextVersion, action: `mission_changed:${asArray(changedFields).join(",") || reason}`, timestamp })
    ])
  });
}

export function markProviderResultsRetrieved(lifecycle = {}, { provider, scope, now = new Date(), ttlMinutes = 10 } = {}) {
  const timestamp = nowIso(now);
  return Object.freeze({
    ...lifecycle,
    state: MISSION_STATES.RESULTS_READY,
    providerResultMeta: Object.freeze({
      provider,
      scope,
      retrievedAt: timestamp,
      expiresAt: minutesFrom(timestamp, ttlMinutes)
    }),
    auditLog: Object.freeze([
      ...asArray(lifecycle.auditLog),
      audit({ missionVersion: lifecycle.missionVersion || 1, action: `provider_results:${scope}`, provider, timestamp })
    ])
  });
}

export function providerResultAgeLabel(retrievedAt, { now = new Date(), language = "en" } = {}) {
  if (!retrievedAt) return language === "ko" ? "검색 시간이 없습니다." : language === "es" ? "Sin hora de búsqueda." : "Retrieved time unavailable.";
  const minutes = Math.max(0, Math.floor((new Date(now).getTime() - new Date(retrievedAt).getTime()) / 60000));
  if (language === "ko") return `${minutes}분 전에 조회했습니다.`;
  if (language === "es") return `Recuperado hace ${minutes} minutos.`;
  return `Retrieved ${minutes} minutes ago.`;
}

export function providerResultsExpired(meta = {}, { now = new Date() } = {}) {
  return Boolean(meta.expiresAt && new Date(meta.expiresAt).getTime() <= new Date(now).getTime());
}

export function detectExecutionConflicts({
  providerStatuses = {},
  selectedItems = {},
  budget = {},
  itinerary = [],
  now = new Date()
} = {}) {
  const conflicts = [];
  Object.entries(providerStatuses || {}).forEach(([provider, status]) => {
    if (["unavailable", "retry", "rate_limited", "expired"].includes(status?.state)) {
      conflicts.push({
        type: status.state,
        provider,
        explanation: `${provider} is ${status.state}. ONE can retry, use another provider, or continue planning.`,
        recoveryActions: ["Retry", "Alternative provider", "Retry later", "Continue planning"]
      });
    }
  });
  Object.entries(selectedItems || {}).forEach(([kind, item]) => {
    if (item && item.available === false) {
      conflicts.push({
        type: "selection_unavailable",
        provider: item.provider || kind,
        explanation: `${kind} is no longer available.`,
        recoveryActions: ["Select alternative", "Refresh provider results", "Continue planning"]
      });
    }
    if (item?.expiresAt && new Date(item.expiresAt).getTime() <= new Date(now).getTime()) {
      conflicts.push({
        type: "price_expired",
        provider: item.provider || kind,
        explanation: `${kind} price or availability has expired. Refresh recommended.`,
        recoveryActions: ["Refresh live results", "Review updated price", "Continue planning"]
      });
    }
  });
  if (Number.isFinite(budget.max) && Number.isFinite(budget.estimatedTotal) && budget.estimatedTotal > budget.max) {
    conflicts.push({
      type: "budget_exceeded",
      provider: "mission",
      explanation: "The selected plan is over the stated budget.",
      recoveryActions: ["Lower cost", "Adjust budget", "Choose alternatives"]
    });
  }
  if (asArray(itinerary).some((item) => item.overlaps === true)) {
    conflicts.push({
      type: "overlapping_itinerary",
      provider: "mission",
      explanation: "Some itinerary items overlap.",
      recoveryActions: ["Reorder schedule", "Remove conflict", "Ask ONE to rebalance"]
    });
  }
  return Object.freeze(conflicts);
}

export function buildExecutionChecklist({
  mission = {},
  lifecycle = createMissionLifecycle(mission),
  scope,
  requiredFields = [],
  providerStatuses = {},
  selectedItems = {},
  providerResultMeta = lifecycle.providerResultMeta,
  now = new Date()
} = {}) {
  const missingFields = asArray(requiredFields).filter((field) => !hasValue(field.split(".").reduce((value, key) => value?.[key], mission)));
  const conflicts = detectExecutionConflicts({ providerStatuses, selectedItems, budget: mission.budget || {}, itinerary: mission.itinerary || mission.dailyPlan || [], now });
  const currentApproval = getCurrentApproval(lifecycle, scope, { now });
  const expired = providerResultsExpired(providerResultMeta, { now });
  const checks = Object.freeze({
    missionComplete: missingFields.length === 0,
    requiredFieldsPresent: missingFields.length === 0,
    providerAvailable: Object.values(providerStatuses || {}).every((status) => !["unavailable", "rate_limited"].includes(status?.state)),
    selectionsValid: conflicts.every((conflict) => conflict.type !== "selection_unavailable"),
    pricesNotExpired: !expired && conflicts.every((conflict) => conflict.type !== "price_expired"),
    noConflicts: conflicts.length === 0,
    approvalCurrent: Boolean(currentApproval)
  });
  return Object.freeze({
    version: APPROVAL_ENGINE_VERSION,
    scope,
    checks,
    ready: Object.values(checks).every(Boolean),
    missingFields: Object.freeze(missingFields),
    conflicts: Object.freeze(conflicts),
    approval: currentApproval,
    providerResultAge: providerResultAgeLabel(providerResultMeta?.retrievedAt, { now }),
    refreshRecommended: expired
  });
}

export function assertProviderActionAllowed(lifecycle = {}, scope, { now = new Date(), providerAction = "provider_search" } = {}) {
  const refreshed = expireApprovals(lifecycle, { now });
  if (!hasCurrentApproval(refreshed, scope, { now })) {
    return Object.freeze({
      allowed: false,
      reason: "approval_required",
      providerAction,
      userMessage: "ONE is ready to search live providers. Nothing will be booked without another confirmation."
    });
  }
  if (![MISSION_STATES.APPROVED_FOR_SEARCH, MISSION_STATES.SEARCHING, MISSION_STATES.RESULTS_READY, MISSION_STATES.SELECTION_PENDING, MISSION_STATES.READY_TO_EXECUTE].includes(refreshed.state)) {
    return Object.freeze({
      allowed: false,
      reason: "mission_state_not_ready",
      providerAction,
      userMessage: "Please review the mission before continuing."
    });
  }
  return Object.freeze({ allowed: true, reason: "approval_current", providerAction });
}

export function createExecutionPreview(scopes = [], { language = "en" } = {}) {
  const uniqueScopes = [...new Set(asArray(scopes).map(normalizeScope))];
  const copy = {
    en: {
      title: "ONE is ready to search live providers.",
      reassurance: "No reservations will be created. No payments will be made.",
      search: "Searching"
    },
    ko: {
      title: "ONE이 실시간 제공업체를 조회할 준비가 됐습니다.",
      reassurance: "예약이나 결제는 진행되지 않습니다.",
      search: "조회 항목"
    },
    es: {
      title: "ONE está listo para buscar proveedores en vivo.",
      reassurance: "No se crearán reservas ni pagos.",
      search: "Buscar"
    }
  };
  const labels = copy[language] || copy.en;
  return Object.freeze({
    title: labels.title,
    scopes: Object.freeze(uniqueScopes),
    consequence: labels.reassurance,
    displayLines: Object.freeze([labels.title, labels.search, ...uniqueScopes, labels.reassurance])
  });
}

export function createApprovalDemo(mission = {}, { now = "2026-07-30T00:00:00.000Z" } = {}) {
  const lifecycle = createMissionLifecycle(mission, { now, state: MISSION_STATES.READY_FOR_APPROVAL });
  const approved = approveMissionScope(lifecycle, APPROVAL_SCOPES.SEARCH_FLIGHTS, { now, approvedBy: "founder-demo" });
  const searching = transitionMissionState(approved, MISSION_STATES.SEARCHING, { now, providerAction: "flight-provider" });
  const results = markProviderResultsRetrieved(searching, { provider: "flight-provider", scope: APPROVAL_SCOPES.SEARCH_FLIGHTS, now });
  return Object.freeze({
    version: APPROVAL_ENGINE_VERSION,
    lifecycle: results,
    preview: createExecutionPreview([APPROVAL_SCOPES.SEARCH_FLIGHTS, APPROVAL_SCOPES.SEARCH_HOTELS]),
    bookingEnabled: false,
    paymentEnabled: false,
    story: Object.freeze(["Trip generated", "Approval requested", "Approval granted", "Providers searched", "Results returned", "Nothing booked", "Mission ready"])
  });
}
