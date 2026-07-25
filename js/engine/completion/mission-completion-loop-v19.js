export const MISSION_COMPLETION_LOOP_VERSION = "V19";

export const MISSION_STATES = Object.freeze([
  "understood",
  "planning",
  "waiting_for_information",
  "solution_prepared",
  "waiting_for_approval",
  "approved",
  "authentication_required",
  "submitted",
  "provider_pending",
  "accepted",
  "scheduled",
  "in_progress",
  "partially_completed",
  "completed_unverified",
  "completed_verified",
  "failed_recoverable",
  "failed_terminal",
  "cancelled",
  "expired"
]);

const TERMINAL_STATES = new Set(["completed_verified", "failed_terminal", "cancelled", "expired"]);
const clean = (value) => String(value ?? "").normalize("NFKC").replace(/[<>]/g, "").trim().slice(0, 500);
const list = (value) => Array.isArray(value) ? value.map(clean).filter(Boolean) : value ? [clean(value)].filter(Boolean) : [];
const nowIso = (now) => {
  const date = now ? new Date(now) : new Date();
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
};

function evidence(label, state, source = "prototype") {
  return Object.freeze({ label: clean(label), state: clean(state), source: clean(source) });
}

function providerStatusFromAction(action = {}) {
  const statusMap = {
    prepared_not_executed: "not_started",
    approved_waiting_external_auth: "authentication_required",
    provider_completed_mock: "accepted",
    provider_failed: "failed",
    blocked_duplicate: "duplicate_ignored",
    blocked_expired: "expired",
    blocked_approval_required: "blocked_approval_required",
    not_executed: "not_executed"
  };
  return Object.freeze({
    actionId: action.actionId || "action-unknown",
    providerId: action.providerId || "provider-unknown",
    actionType: action.actionType || "unknown",
    status: statusMap[action.executionStatus] || action.executionStatus || "unknown",
    executionStatus: action.executionStatus || "unknown",
    approvalStatus: action.approvalStatus || "pending_review",
    lastReference: action.providerResult?.reference || null,
    dataState: action.dataState || "mock"
  });
}

function baseSteps(resolutionPlan = {}, actionRequests = []) {
  const steps = [
    "mission understood",
    "resolution plan prepared",
    "approval boundaries visible"
  ];
  if (actionRequests.length) steps.push("action requests prepared");
  if (resolutionPlan.recommendedPath) steps.push("recommended path selected");
  return steps;
}

function inferState({ resolutionPlan = {}, actionRequests = [], events = [], now = null }) {
  const latest = events.at(-1) || {};
  const eventType = latest.type || latest.status || "";
  if (/cancel/i.test(eventType)) return "cancelled";
  if (/terminal/i.test(eventType)) return "failed_terminal";
  if (/verified/i.test(eventType)) return "completed_verified";
  if (/completed|success/i.test(eventType)) return "completed_unverified";
  if (/price_change|material_change/i.test(eventType)) return "waiting_for_approval";
  if (/missing_document|rejected|provider_rejection|payment_failure|job_expired|no_appointment|partial/i.test(eventType)) return "failed_recoverable";
  if (actionRequests.some((action) => new Date(action.expiration).getTime() <= new Date(now || Date.now()).getTime())) return "expired";
  if (actionRequests.some((action) => action.executionStatus === "provider_failed")) return "failed_recoverable";
  if (actionRequests.some((action) => action.executionStatus === "provider_completed_mock")) return "completed_unverified";
  if (actionRequests.some((action) => action.approvalStatus === "approved")) return "authentication_required";
  if (actionRequests.length) return "waiting_for_approval";
  if (resolutionPlan.currentStatus === "prepared_for_review") return "solution_prepared";
  return "understood";
}

function failureReasonFor(events = [], actionRequests = []) {
  const latest = events.at(-1) || {};
  if (latest.reason) return clean(latest.reason);
  const failed = actionRequests.find((action) => /failed|blocked|expired/i.test(action.executionStatus || ""));
  return failed ? `${failed.actionType} ${failed.executionStatus}` : "";
}

function recoveryFor({ state, events = [], resolutionPlan = {}, actionRequests = [] }) {
  const latest = events.at(-1) || {};
  const type = clean(latest.type || latest.status || "");
  const options = [];
  if (/payment_failure/i.test(type)) {
    options.push("Return to external payment authentication; never ask for raw card details.");
  }
  if (/price_change|material_change/i.test(type)) {
    options.push("Show material change and require renewed approval before continuing.");
  }
  if (/missing_document|government/i.test(type)) {
    options.push("Identify missing document and prepare correction package.");
  }
  if (/job_expired/i.test(type)) {
    options.push("Move to equivalent prepared job alternatives.");
  }
  if (/provider_rejection|no_appointment/i.test(type) || actionRequests.some((action) => action.executionStatus === "provider_failed")) {
    options.push("Use approved fallback provider if scope is unchanged.");
    options.push("Ask one selection if fallback materially changes constraints.");
  }
  if (/partial/i.test(type)) {
    options.push("Keep completed components and recover only the failed component.");
  }
  if (!options.length && state === "failed_recoverable") {
    options.push(resolutionPlan.recoveryPlan || "Use fallback path and request the minimum necessary decision.");
  }
  if (!options.length && state === "waiting_for_approval") {
    options.push("Request explicit approval or user modification.");
  }
  return Object.freeze(options.map((label, index) => Object.freeze({
    id: `recovery-${index + 1}`,
    label,
    retrySafe: !/payment|duplicate/i.test(label),
    requiresNewApproval: /approval|material|selection|payment|document/i.test(label),
    duplicateTransactionRisk: /payment/i.test(label) ? "high" : "low"
  })));
}

function notificationFor(progress) {
  if (!progress.userDecisionRequired && !["completed_unverified", "completed_verified", "failed_recoverable", "failed_terminal", "expired"].includes(progress.currentState)) return null;
  const changed = progress.failureReason || progress.currentState;
  const decision = progress.userDecisionRequired ? progress.nextBestAction : "No decision required now.";
  return Object.freeze({
    notify: true,
    whatChanged: changed,
    whatOneAlreadyDid: progress.completedSteps.join("; "),
    decisionRequired: decision,
    recommendedNextAction: progress.nextBestAction
  });
}

function confidenceFor(state, evidenceItems = []) {
  if (state === "completed_verified") return 0.98;
  if (state === "completed_unverified") return 0.72;
  if (TERMINAL_STATES.has(state)) return 0.9;
  if (evidenceItems.some((item) => item.state === "provider_receipt")) return 0.86;
  return 0.58;
}

export function buildMissionProgress({
  resolutionPlan = {},
  trustedActionGateway = {},
  actionRequests = null,
  events = [],
  now = null
} = {}) {
  const requests = Object.freeze(actionRequests || trustedActionGateway.actionRequests || []);
  const currentState = inferState({ resolutionPlan, actionRequests: requests, events, now });
  const failed = failureReasonFor(events, requests);
  const providerStatuses = Object.freeze(requests.map(providerStatusFromAction));
  const evidenceItems = Object.freeze([
    evidence("ResolutionPlan", resolutionPlan.resolutionId ? "prepared" : "unavailable", resolutionPlan.version || "V17"),
    evidence("ActionRequests", requests.length ? "prepared" : "unavailable", trustedActionGateway.version || "V18"),
    ...events.slice(-5).map((event) => evidence(event.type || event.status || "status_update", event.evidenceState || "manual_or_provider_status", event.source || "provided"))
  ]);
  const recoveryOptions = recoveryFor({ state: currentState, events, resolutionPlan, actionRequests: requests });
  const userDecisionRequired = ["waiting_for_information", "waiting_for_approval", "authentication_required", "failed_recoverable", "completed_unverified", "expired"].includes(currentState);
  const pendingSteps = [];
  if (currentState === "waiting_for_approval") pendingSteps.push("explicit approval");
  if (currentState === "authentication_required") pendingSteps.push("external provider authentication");
  if (currentState === "provider_pending") pendingSteps.push("provider status update");
  if (currentState === "completed_unverified") pendingSteps.push("user or provider completion verification");
  if (currentState === "failed_recoverable") pendingSteps.push("select recovery path");
  const blockedSteps = currentState.startsWith("failed") || currentState === "expired" ? [failed || currentState] : [];

  const progress = Object.freeze({
    version: MISSION_COMPLETION_LOOP_VERSION,
    missionId: clean(resolutionPlan.missionId || "mission-unknown"),
    resolutionId: clean(resolutionPlan.resolutionId || "resolution-unknown"),
    currentState,
    completedSteps: Object.freeze(baseSteps(resolutionPlan, requests)),
    pendingSteps: Object.freeze(pendingSteps),
    blockedSteps: Object.freeze(blockedSteps),
    providerStatuses,
    deadlines: Object.freeze(requests.map((action) => Object.freeze({ actionId: action.actionId, expiration: action.expiration })).filter((item) => item.expiration)),
    expectedNextEvent: pendingSteps[0] || (currentState === "completed_verified" ? "mission closed" : "status update"),
    lastVerifiedAt: events.findLast?.((event) => /verified|receipt|success/i.test(event.type || event.status || ""))?.at || null,
    evidence: evidenceItems,
    failureReason: failed,
    recoveryOptions,
    recommendedRecovery: recoveryOptions[0] || null,
    userDecisionRequired,
    completionCriteria: Object.freeze(list(resolutionPlan.completionCriteria)),
    completionConfidence: confidenceFor(currentState, evidenceItems),
    finalOutcome: currentState === "completed_verified"
      ? "User intended outcome verified."
      : currentState === "cancelled"
        ? "Mission closed by user."
        : null,
    nextBestAction: recoveryOptions[0]?.label || (userDecisionRequired ? "Review and decide the next step." : "Continue monitoring without messaging the user.")
  });
  return Object.freeze({ ...progress, notification: notificationFor(progress) });
}

export function ingestMissionStatus(progress = {}, event = {}) {
  if (progress.seenEventIds?.includes(event.id)) {
    return Object.freeze({
      ...progress,
      evidence: Object.freeze([...(progress.evidence || []), evidence("duplicate callback", "ignored", event.id || "unknown")]),
      duplicateIgnored: true
    });
  }
  const next = buildMissionProgress({
    resolutionPlan: {
      missionId: progress.missionId,
      resolutionId: progress.resolutionId,
      completionCriteria: progress.completionCriteria,
      currentStatus: progress.currentState
    },
    actionRequests: [],
    events: [event],
    now: event.now
  });
  return Object.freeze({
    ...next,
    seenEventIds: Object.freeze([...(progress.seenEventIds || []), event.id].filter(Boolean))
  });
}

export function isMissionComplete(progress = {}) {
  return progress.currentState === "completed_verified" || progress.currentState === "cancelled";
}

export function buildMonitoringAdapterDescriptor({ provider = "mock", supportsWebhooks = false, supportsPolling = false, supportsManual = true } = {}) {
  return Object.freeze({
    provider: clean(provider),
    realtimeClaimed: supportsWebhooks === true || supportsPolling === true ? false : false,
    webhookReady: supportsWebhooks === true,
    pollingReady: supportsPolling === true,
    manualConfirmationReady: supportsManual !== false,
    providerReceiptIngestionReady: true,
    dataState: supportsWebhooks || supportsPolling ? "future-ready" : "mock"
  });
}
