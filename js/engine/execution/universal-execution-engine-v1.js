import { createActionRequest, reviewActionRequest, simulateProviderExecution } from "../action/trusted-action-gateway-v18.js";

export const UNIVERSAL_EXECUTION_ENGINE_VERSION = "UNIVERSAL_EXECUTION_ENGINE_V1";

export const EXECUTION_TYPES = Object.freeze([
  "search",
  "reserve",
  "book",
  "purchase",
  "register",
  "apply",
  "submit",
  "cancel",
  "modify",
  "reschedule",
  "check-in",
  "check-out",
  "download",
  "upload"
]);

export const EXECUTION_STATUS = Object.freeze({
  WAITING: "waiting",
  PREPARING: "preparing",
  EXECUTING: "executing",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  RETRYING: "retrying",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  BLOCKED: "blocked"
});

export const DOCUMENT_TYPES = Object.freeze([
  "reservation_pdf",
  "ticket_pdf",
  "qr_code",
  "boarding_pass",
  "voucher",
  "invoice",
  "hotel_confirmation"
]);

export const DEFAULT_PROVIDER_CAPABILITIES = Object.freeze({
  canSearch: false,
  canReserve: false,
  canBook: false,
  canCancel: false,
  canRefund: false,
  supportsOAuth: false,
  supportsQRCode: false,
  supportsCalendar: false,
  supportsDocuments: false,
  supportsIdentityVerification: false,
  supportsRealtimeAvailability: false,
  supportsWaitlist: false,
  supportsModification: false
});

const typeToCapability = Object.freeze({
  search: "canSearch",
  reserve: "canReserve",
  book: "canBook",
  purchase: "canBook",
  register: "canReserve",
  apply: "canReserve",
  submit: "canReserve",
  cancel: "canCancel",
  modify: "supportsModification",
  reschedule: "supportsModification",
  "check-in": "supportsDocuments",
  "check-out": "supportsDocuments",
  download: "supportsDocuments",
  upload: "supportsDocuments"
});

const gatewayActionMap = Object.freeze({
  search: "requestQuote",
  reserve: "reserve",
  book: "book",
  purchase: "purchase",
  register: "submit",
  apply: "apply",
  submit: "submit",
  cancel: "cancel",
  modify: "reschedule",
  reschedule: "reschedule",
  "check-in": "authenticate",
  "check-out": "authenticate",
  download: "authenticate",
  upload: "upload"
});

const clean = (value, fallback = "") => String(value ?? fallback).normalize("NFKC").replace(/[<>]/g, "").trim().slice(0, 500);
const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
const nowIso = (now = new Date()) => {
  const date = new Date(now);
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
};
const stable = (value) => clean(value, "item").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 50) || "item";
const safeType = (type) => EXECUTION_TYPES.includes(type) ? type : "search";

function immutableCapabilities(capabilities = {}) {
  return Object.freeze({ ...DEFAULT_PROVIDER_CAPABILITIES, ...Object.fromEntries(Object.entries(capabilities).map(([key, value]) => [key, value === true])) });
}

function audit({ action = "execution_event", provider = "", missionId = "", status = "", result = "", durationMs = null, error = "", now = new Date() } = {}) {
  return Object.freeze({
    timestamp: nowIso(now),
    provider: clean(provider),
    mission: clean(missionId),
    action: clean(action),
    status: clean(status),
    result: clean(result),
    durationMs,
    error: clean(error),
    internalOnly: true
  });
}

export function createProviderCapabilityProfile({ providerId, providerType = "provider", capabilities = {}, dataState = "mock_or_future" } = {}) {
  if (!providerId) throw new Error("provider_capability_requires_provider_id");
  return Object.freeze({
    providerId: clean(providerId),
    providerType: clean(providerType),
    capabilities: immutableCapabilities(capabilities),
    dataState: clean(dataState),
    liveIntegration: dataState === "live_verified"
  });
}

export function canProviderPerform(providerProfile = {}, executionType = "search") {
  const capabilityKey = typeToCapability[safeType(executionType)];
  if (!capabilityKey) return false;
  return providerProfile.capabilities?.[capabilityKey] === true;
}

export function createExecutionStep({
  stepId,
  missionId,
  resolutionId,
  type = "search",
  providerId = "",
  providerType = "provider",
  title = "",
  category = "",
  consequence = "",
  requiredEvidence = [],
  dependsOn = [],
  rollback = {},
  now = new Date()
} = {}) {
  const executionType = safeType(type);
  const id = stepId || `exec-${stable(missionId)}-${stable(executionType)}-${stable(providerId || title)}`;
  return Object.freeze({
    stepId: id,
    missionId: clean(missionId),
    resolutionId: clean(resolutionId),
    type: executionType,
    providerId: clean(providerId),
    providerType: clean(providerType),
    title: clean(title || executionType),
    category: clean(category || providerType),
    consequence: clean(consequence || "Prepared provider action. No real-world commitment occurs unless a trusted provider returns evidence after approval."),
    requiredEvidence: Object.freeze(asArray(requiredEvidence).map(clean)),
    dependsOn: Object.freeze(asArray(dependsOn).map(clean)),
    rollback: Object.freeze({
      canRollback: rollback.canRollback === true,
      partialRollback: rollback.partialRollback === true,
      manualIntervention: rollback.manualIntervention === true,
      strategy: clean(rollback.strategy || (rollback.canRollback ? "Provider cancellation path" : "Manual review required"))
    }),
    status: EXECUTION_STATUS.WAITING,
    documents: Object.freeze([]),
    confirmation: null,
    timeline: Object.freeze([createTimelineEvent("preparing", "Execution step prepared", now)]),
    auditEvents: Object.freeze([audit({ action: `step_prepared:${executionType}`, provider: providerId, missionId, status: EXECUTION_STATUS.WAITING, now })])
  });
}

export function createTimelineEvent(stage = "preparing", label = "", now = new Date(), meta = {}) {
  return Object.freeze({
    stage: clean(stage),
    label: clean(label || stage),
    timestamp: nowIso(now),
    meta: Object.freeze(Object.fromEntries(Object.entries(meta).map(([key, value]) => [clean(key), clean(value)])))
  });
}

export function createExecutionPlan({ mission = {}, resolutionPlan = {}, steps = [], language = "en", now = new Date() } = {}) {
  const missionId = mission.missionId || mission.id || resolutionPlan.missionId || `mission-${stable(mission.rawInput || mission.type || "one")}`;
  const resolutionId = resolutionPlan.resolutionId || `resolution-${stable(missionId)}`;
  const normalizedSteps = asArray(steps).map((step, index) => createExecutionStep({
    missionId,
    resolutionId,
    stepId: step.stepId || `exec-${index + 1}-${stable(step.type || step.title)}`,
    ...step,
    now
  }));
  return Object.freeze({
    version: UNIVERSAL_EXECUTION_ENGINE_VERSION,
    missionId: clean(missionId),
    resolutionId: clean(resolutionId),
    language,
    visiblePlan: Object.freeze(normalizedSteps.map((step, index) => Object.freeze({
      number: index + 1,
      title: step.title,
      type: step.type,
      provider: step.providerId,
      status: step.status,
      consequence: step.consequence
    }))),
    steps: Object.freeze(normalizedSteps),
    nothingExecutesYet: true,
    bookingEnabled: false,
    paymentEnabled: false,
    auditEvents: Object.freeze([audit({ action: "execution_plan_created", missionId, status: EXECUTION_STATUS.PREPARING, result: `${normalizedSteps.length} steps`, now })])
  });
}

export function normalizeProviderDocument(document = {}) {
  const type = DOCUMENT_TYPES.includes(document.type) ? document.type : null;
  const providerReference = clean(document.providerReference || document.reference);
  if (!type || !providerReference) {
    return Object.freeze({
      accepted: false,
      reason: "provider_document_evidence_required",
      fakeDocumentGenerated: false
    });
  }
  return Object.freeze({
    accepted: true,
    documentId: clean(document.documentId || `doc-${stable(providerReference)}-${stable(type)}`),
    type,
    provider: clean(document.provider),
    providerReference,
    label: clean(document.label || type.replace(/_/g, " ")),
    url: clean(document.url),
    retrievedAt: nowIso(document.retrievedAt || new Date()),
    fakeDocumentGenerated: false
  });
}

export function createUniversalConfirmation({
  missionId,
  provider,
  providerReference,
  category,
  travellers = [],
  status = "confirmed",
  confirmationTime = new Date(),
  documents = []
} = {}) {
  if (!providerReference) return null;
  const normalizedDocs = asArray(documents).map((document) => normalizeProviderDocument({ ...document, provider, providerReference })).filter((document) => document.accepted);
  return Object.freeze({
    confirmationId: `confirmation-${stable(provider)}-${stable(providerReference)}`,
    provider: clean(provider),
    providerReference: clean(providerReference),
    category: clean(category),
    travellers: Object.freeze(asArray(travellers).map(clean)),
    status: clean(status),
    confirmationTime: nowIso(confirmationTime),
    documents: Object.freeze(normalizedDocs)
  });
}

export function validateExecutionRequest({ plan = {}, providerRegistry = {}, approved = false } = {}) {
  const failures = [];
  if (plan.version !== UNIVERSAL_EXECUTION_ENGINE_VERSION) failures.push("wrong_plan_version");
  if (!asArray(plan.steps).length) failures.push("empty_execution_plan");
  for (const step of asArray(plan.steps)) {
    const provider = providerRegistry[step.providerId];
    if (!provider) failures.push(`missing_provider:${step.providerId || step.stepId}`);
    else if (!canProviderPerform(provider, step.type)) failures.push(`unsupported_capability:${step.providerId}:${step.type}`);
  }
  if (!approved) failures.push("approval_required");
  return Object.freeze({
    ok: failures.length === 0,
    failures: Object.freeze(failures),
    userMessage: failures.includes("approval_required")
      ? "Please approve the exact plan before ONE asks any trusted provider to act."
      : failures.length ? "ONE found an execution issue and prepared recovery options." : "ONE is ready to continue safely."
  });
}

function nextStatusFromProviderResult(providerResult = {}) {
  if (providerResult.status === "success") return EXECUTION_STATUS.SUCCEEDED;
  if (providerResult.status === "expired") return EXECUTION_STATUS.EXPIRED;
  if (providerResult.status === "cancelled") return EXECUTION_STATUS.CANCELLED;
  if (providerResult.status === "blocked") return EXECUTION_STATUS.BLOCKED;
  return EXECUTION_STATUS.FAILED;
}

function recoveryForFailure(reason = "provider_unavailable") {
  const map = {
    provider_unavailable: ["Retry", "Alternative provider", "Retry later"],
    price_changed: ["Review updated price", "Alternative provider", "Alternative date"],
    sold_out: ["Alternative date", "Alternative location", "Waitlist if supported"],
    duplicate_booking: ["Stop duplicate", "Review existing confirmation", "Manual support"],
    timeout: ["Retry", "Retry later", "Alternative provider"],
    authentication_expired: ["Reconnect provider", "Refresh authentication", "Try again"]
  };
  return Object.freeze(map[reason] || ["Retry", "Alternative provider", "Continue planning"]);
}

export class ExecutionManager {
  constructor({ providerRegistry = {}, consumedIdempotencyKeys = new Set(), now = () => new Date() } = {}) {
    this.version = UNIVERSAL_EXECUTION_ENGINE_VERSION;
    this.providerRegistry = { ...providerRegistry };
    this.consumedIdempotencyKeys = consumedIdempotencyKeys;
    this.now = now;
  }

  registerProvider(profile) {
    this.providerRegistry[profile.providerId] = profile;
    return profile;
  }

  validate(request) {
    return validateExecutionRequest({ ...request, providerRegistry: this.providerRegistry });
  }

  createPlan(input) {
    return createExecutionPlan(input);
  }

  executeStep(step, { resolutionPlan = {}, approved = false, providerResult = {}, travellers = [], now = this.now() } = {}) {
    const provider = this.providerRegistry[step.providerId];
    const validation = validateExecutionRequest({ plan: { version: UNIVERSAL_EXECUTION_ENGINE_VERSION, steps: [step] }, providerRegistry: this.providerRegistry, approved });
    if (!validation.ok) {
      return Object.freeze({
        ...step,
        status: EXECUTION_STATUS.BLOCKED,
        timeline: Object.freeze([...step.timeline, createTimelineEvent("blocked", validation.userMessage, now)]),
        recoveryOptions: Object.freeze(["Review approval", "Alternative provider", "Continue planning"]),
        auditEvents: Object.freeze([...step.auditEvents, audit({ action: "execution_blocked", provider: step.providerId, missionId: step.missionId, status: EXECUTION_STATUS.BLOCKED, error: validation.failures.join(","), now })])
      });
    }

    const gatewayAction = reviewActionRequest(createActionRequest({
      resolutionPlan: { ...resolutionPlan, missionId: step.missionId, resolutionId: step.resolutionId },
      actionType: gatewayActionMap[step.type] || "contact",
      providerType: step.providerType,
      providerId: step.providerId,
      now
    }), "approve", { now });
    const simulated = simulateProviderExecution(gatewayAction, {
      providerResult: providerResult.status === "success" ? "success" : "failure",
      reference: providerResult.providerReference || providerResult.reference || "",
      now,
      consumedKeys: this.consumedIdempotencyKeys
    });
    const status = nextStatusFromProviderResult(providerResult);
    const confirmation = status === EXECUTION_STATUS.SUCCEEDED ? createUniversalConfirmation({
      missionId: step.missionId,
      provider: step.providerId,
      providerReference: providerResult.providerReference || providerResult.reference,
      category: step.category,
      travellers,
      status: "confirmed",
      confirmationTime: now,
      documents: asArray(providerResult.documents)
    }) : null;
    const documents = confirmation?.documents || Object.freeze([]);
    return Object.freeze({
      ...step,
      status,
      providerCapabilities: provider.capabilities,
      confirmation,
      documents,
      providerExecutionStatus: simulated.executionStatus,
      recoveryOptions: status === EXECUTION_STATUS.SUCCEEDED ? Object.freeze([]) : recoveryForFailure(providerResult.reason || "provider_unavailable"),
      timeline: Object.freeze([
        ...step.timeline,
        createTimelineEvent("searching", "Provider action started", now),
        createTimelineEvent(status === EXECUTION_STATUS.SUCCEEDED ? "confirmed" : "waiting", status === EXECUTION_STATUS.SUCCEEDED ? "Provider evidence received" : "Provider did not complete the action", now),
        ...(documents.length ? [createTimelineEvent("downloaded", "Provider document received", now)] : []),
        createTimelineEvent(status === EXECUTION_STATUS.SUCCEEDED ? "completed" : "failed", status, now)
      ]),
      auditEvents: Object.freeze([...step.auditEvents, audit({ action: `execute:${step.type}`, provider: step.providerId, missionId: step.missionId, status, result: providerResult.providerReference || providerResult.reason || status, now })])
    });
  }

  executePlan(plan, { approved = false, providerResults = {}, travellers = [], now = this.now() } = {}) {
    const executedSteps = plan.steps.map((step) => {
      const result = providerResults[step.stepId] || providerResults[step.providerId] || { status: "blocked", reason: "provider_unavailable" };
      return this.executeStep(step, { resolutionPlan: { missionId: plan.missionId, resolutionId: plan.resolutionId, domain: step.category }, approved, providerResult: result, travellers, now });
    });
    const succeeded = executedSteps.filter((step) => step.status === EXECUTION_STATUS.SUCCEEDED);
    const failed = executedSteps.filter((step) => step.status === EXECUTION_STATUS.FAILED || step.status === EXECUTION_STATUS.BLOCKED || step.status === EXECUTION_STATUS.EXPIRED);
    return Object.freeze({
      ...plan,
      nothingExecutesYet: false,
      status: failed.length && succeeded.length ? "partial_success" : failed.length ? "failed" : "succeeded",
      steps: Object.freeze(executedSteps),
      confirmations: Object.freeze(succeeded.map((step) => step.confirmation).filter(Boolean)),
      documents: Object.freeze(succeeded.flatMap((step) => [...step.documents])),
      partialSuccess: failed.length > 0 && succeeded.length > 0,
      failedSteps: Object.freeze(failed.map((step) => step.stepId)),
      recoveryOptions: Object.freeze([...new Set(failed.flatMap((step) => [...(step.recoveryOptions || [])]))]),
      auditEvents: Object.freeze([...plan.auditEvents, audit({ action: "execution_plan_completed", missionId: plan.missionId, status: failed.length ? "partial_or_failed" : "succeeded", result: `${succeeded.length}/${executedSteps.length}`, now })])
    });
  }

  monitor(executionResult = {}, { now = this.now() } = {}) {
    return Object.freeze({
      status: executionResult.status || "waiting",
      timeline: Object.freeze(asArray(executionResult.steps).flatMap((step) => [...asArray(step.timeline)])),
      waiting: Object.freeze(asArray(executionResult.steps).filter((step) => [EXECUTION_STATUS.WAITING, EXECUTION_STATUS.EXECUTING, EXECUTION_STATUS.RETRYING].includes(step.status)).map((step) => step.stepId)),
      failed: Object.freeze(asArray(executionResult.steps).filter((step) => [EXECUTION_STATUS.FAILED, EXECUTION_STATUS.BLOCKED, EXECUTION_STATUS.EXPIRED].includes(step.status)).map((step) => step.stepId)),
      lastCheckedAt: nowIso(now)
    });
  }

  retry(step, { reason = "timeout", now = this.now() } = {}) {
    return Object.freeze({
      ...step,
      status: EXECUTION_STATUS.RETRYING,
      retryReason: clean(reason),
      timeline: Object.freeze([...asArray(step.timeline), createTimelineEvent("retrying", `Retry prepared: ${reason}`, now)]),
      auditEvents: Object.freeze([...asArray(step.auditEvents), audit({ action: "retry_prepared", provider: step.providerId, missionId: step.missionId, status: EXECUTION_STATUS.RETRYING, error: reason, now })])
    });
  }

  rollback(step, { now = this.now() } = {}) {
    const rollbackStatus = step.rollback?.canRollback ? EXECUTION_STATUS.CANCELLED : EXECUTION_STATUS.BLOCKED;
    return Object.freeze({
      ...step,
      rollbackStatus,
      manualInterventionRequired: step.rollback?.manualIntervention === true || !step.rollback?.canRollback,
      timeline: Object.freeze([...asArray(step.timeline), createTimelineEvent("rollback", step.rollback?.strategy || "Rollback evaluated", now)]),
      auditEvents: Object.freeze([...asArray(step.auditEvents), audit({ action: "rollback_evaluated", provider: step.providerId, missionId: step.missionId, status: rollbackStatus, result: step.rollback?.strategy, now })])
    });
  }

  notify(executionResult = {}) {
    const failed = asArray(executionResult.steps).filter((step) => [EXECUTION_STATUS.FAILED, EXECUTION_STATUS.BLOCKED, EXECUTION_STATUS.EXPIRED].includes(step.status));
    return Object.freeze({
      shouldNotify: failed.length > 0 || executionResult.status === "succeeded",
      message: failed.length
        ? `ONE completed what it could and prepared ${executionResult.recoveryOptions?.length || 0} recovery options.`
        : "ONE handled the approved provider steps and prepared the confirmation summary.",
      decisionRequired: failed.length > 0,
      visibleOnly: true
    });
  }
}

export function createFounderExecutionDemo() {
  const hotel = createProviderCapabilityProfile({
    providerId: "demo-hotel-provider",
    providerType: "hotel",
    capabilities: { canSearch: true, canReserve: true, canCancel: true, supportsDocuments: true, supportsQRCode: true, supportsRealtimeAvailability: true },
    dataState: "mock_or_future"
  });
  const tickets = createProviderCapabilityProfile({
    providerId: "demo-ticket-provider",
    providerType: "experience",
    capabilities: { canSearch: true, canReserve: true, supportsDocuments: true, supportsQRCode: true, supportsRealtimeAvailability: true },
    dataState: "mock_or_future"
  });
  const train = createProviderCapabilityProfile({
    providerId: "demo-train-provider",
    providerType: "transport",
    capabilities: { canSearch: true, canReserve: true, canCancel: false, supportsQRCode: true, supportsDocuments: true },
    dataState: "mock_or_future"
  });
  const manager = new ExecutionManager({ providerRegistry: { [hotel.providerId]: hotel, [tickets.providerId]: tickets, [train.providerId]: train }, now: () => new Date("2026-07-30T00:00:00Z") });
  const plan = manager.createPlan({
    mission: { missionId: "founder-demo-trip", type: "travel" },
    resolutionPlan: { resolutionId: "founder-demo-resolution", domain: "travel" },
    steps: [
      { title: "Reserve Hotel", type: "reserve", providerId: hotel.providerId, providerType: "hotel", category: "hotel", rollback: { canRollback: true, strategy: "Cancel through provider policy" } },
      { title: "Reserve Disney Tickets", type: "reserve", providerId: tickets.providerId, providerType: "experience", category: "experience", rollback: { partialRollback: true, manualIntervention: true, strategy: "Ticket provider rules must be reviewed" } },
      { title: "Reserve Airport Train", type: "reserve", providerId: train.providerId, providerType: "transport", category: "transport", rollback: { canRollback: false, manualIntervention: true, strategy: "Manual provider review" } },
      { title: "Generate Final Itinerary", type: "download", providerId: hotel.providerId, providerType: "document", category: "itinerary", rollback: { canRollback: false, strategy: "Regenerate document" } }
    ]
  });
  const result = manager.executePlan(plan, {
    approved: true,
    travellers: ["Founder"],
    providerResults: {
      "exec-1-reserve": { status: "success", providerReference: "HOTEL-EVIDENCE-1", documents: [{ type: "hotel_confirmation", providerReference: "HOTEL-EVIDENCE-1", label: "Hotel confirmation" }] },
      "exec-2-reserve": { status: "success", providerReference: "TICKET-EVIDENCE-1", documents: [{ type: "qr_code", providerReference: "TICKET-EVIDENCE-1", label: "Ticket QR" }] },
      "exec-3-reserve": { status: "failure", reason: "provider_unavailable" },
      "exec-4-download": { status: "success", providerReference: "ITINERARY-EVIDENCE-1", documents: [{ type: "voucher", providerReference: "ITINERARY-EVIDENCE-1", label: "Final itinerary" }] }
    },
    now: "2026-07-30T00:05:00Z"
  });
  return Object.freeze({
    version: UNIVERSAL_EXECUTION_ENGINE_VERSION,
    manager,
    plan,
    result,
    notification: manager.notify(result),
    realBookingClaimed: false,
    paymentConnected: false,
    fakeProviderDocumentsGenerated: false
  });
}
