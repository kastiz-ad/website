export const TRUSTED_ACTION_GATEWAY_VERSION = "V18";

export const ACTION_TYPES = Object.freeze([
  "reserve",
  "book",
  "purchase",
  "pay",
  "contact",
  "requestQuote",
  "apply",
  "submit",
  "upload",
  "schedule",
  "cancel",
  "reschedule",
  "sign",
  "authenticate",
  "connectProvider"
]);

const SENSITIVE_FIELD_PATTERN = /(full.?card|card.?number|cvv|cvc|bank.?user|bank.?password|brokerage|provider.?password|password|otp|one.?time|resident.?registration|ssn|national.?id|raw.?identity|identity.?image|passport.?image|visa.?image|unrestricted.?token|secret|private.?key|credential)/i;
const FINANCIAL_ACTIONS = new Set(["pay", "purchase"]);
const COMMITMENT_ACTIONS = new Set(["reserve", "book", "purchase", "pay", "contact", "apply", "submit", "upload", "schedule", "cancel", "reschedule", "sign", "authenticate", "connectProvider"]);

const clean = (value) => String(value ?? "").normalize("NFKC").replace(/[<>]/g, "").trim().slice(0, 300);
const list = (value) => Array.isArray(value) ? value.map(clean).filter(Boolean) : value ? [clean(value)].filter(Boolean) : [];
const stable = (value) => clean(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 48) || "action";
const nowIso = (now) => {
  const date = now ? new Date(now) : new Date();
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
};

export function hasSensitiveInput(value) {
  if (value == null) return false;
  if (typeof value !== "object") return SENSITIVE_FIELD_PATTERN.test(String(value));
  return Object.entries(value).some(([key, next]) => SENSITIVE_FIELD_PATTERN.test(key) || hasSensitiveInput(next));
}

function assertSafePreparedInputs(preparedInputs = {}) {
  if (hasSensitiveInput(preparedInputs)) throw new Error("sensitive_input_rejected");
}

function normalizeActionType(actionType = "contact") {
  return ACTION_TYPES.includes(actionType) ? actionType : "contact";
}

function inferProviderType({ actionType, resolutionPlan = {}, providerType = "" }) {
  if (providerType) return clean(providerType);
  if (FINANCIAL_ACTIONS.has(actionType)) return "trusted-payment-provider";
  if (["apply", "submit", "upload", "sign", "authenticate"].includes(actionType) && ["government", "business"].includes(resolutionPlan.domain)) return "official-authentication-provider";
  if (resolutionPlan.domain === "healthcare") return "healthcare-provider";
  if (resolutionPlan.domain === "travel") return "travel-provider";
  if (resolutionPlan.domain === "career") return "job-platform";
  return `${resolutionPlan.domain || "service"}-provider`;
}

function authenticationMethodFor(actionType, providerType) {
  if (FINANCIAL_ACTIONS.has(actionType)) return "external_payment_authentication";
  if (["authenticate", "connectProvider"].includes(actionType)) return "provider_oauth_or_official_auth";
  if (["apply", "submit", "upload", "sign"].includes(actionType)) return providerType.includes("official") ? "official_external_authentication" : "provider_account_or_oauth";
  return "provider_redirect_or_user_confirmation";
}

function requiredInputsFor(actionType, resolutionPlan = {}) {
  const base = ["explicit approval", "exact consequence review"];
  const map = {
    reserve: ["reservation details", "provider selection"],
    book: ["booking details", "provider selection"],
    purchase: ["item/service details", "trusted payment provider"],
    pay: ["amount", "trusted payment provider"],
    contact: ["message summary", "provider selection"],
    requestQuote: ["quote request summary", "provider selection"],
    apply: ["application summary", "official/provider channel"],
    submit: ["submission summary", "official/provider channel"],
    upload: ["approved document metadata only", "trusted upload surface"],
    schedule: ["date/time preference", "provider selection"],
    cancel: ["existing reference", "cancellation consequence"],
    reschedule: ["existing reference", "new date/time preference"],
    sign: ["document summary", "trusted signing provider"],
    authenticate: ["trusted provider selection"],
    connectProvider: ["provider name", "consent scope"]
  };
  return Object.freeze([...base, ...(map[actionType] || []), ...list(resolutionPlan.missingEssentialInformation).map((item) => `essential info: ${item}`)]);
}

function sensitiveInputsFor(actionType) {
  if (FINANCIAL_ACTIONS.has(actionType)) return Object.freeze(["payment authentication handled externally"]);
  if (["authenticate", "connectProvider"].includes(actionType)) return Object.freeze(["provider authentication handled externally"]);
  if (["upload", "submit", "apply", "sign"].includes(actionType)) return Object.freeze(["identity or document verification handled externally when required"]);
  return Object.freeze([]);
}

function minimumReturnedDataFor(actionType) {
  const common = ["success/failure", "provider name", "timestamp", "status"];
  const map = {
    pay: ["transaction reference", "masked payment method"],
    purchase: ["transaction reference", "masked payment method"],
    reserve: ["appointment or reservation reference", "cancellation policy"],
    book: ["booking reference", "cancellation policy"],
    schedule: ["appointment reference"],
    contact: ["message reference"],
    requestQuote: ["quote request reference"],
    apply: ["application reference"],
    submit: ["submission reference"],
    upload: ["upload reference"],
    sign: ["signature reference"],
    authenticate: ["connection status"],
    connectProvider: ["connection status", "revocation status"],
    cancel: ["cancellation reference"],
    reschedule: ["updated appointment reference"]
  };
  return Object.freeze([...common, ...(map[actionType] || [])]);
}

function audit(event, details = {}, now) {
  return Object.freeze({
    at: nowIso(now),
    event,
    details: Object.freeze(Object.fromEntries(Object.entries(details).map(([key, value]) => [key, clean(value)])))
  });
}

export function createActionRequest({
  resolutionPlan = {},
  actionType = "contact",
  providerType = "",
  providerId = "",
  preparedInputs = {},
  requiredInputs = [],
  approvalStatus = "pending_review",
  expirationMinutes = 15,
  now = null
} = {}) {
  assertSafePreparedInputs(preparedInputs);
  const normalizedActionType = normalizeActionType(actionType);
  const normalizedProviderType = inferProviderType({ actionType: normalizedActionType, resolutionPlan, providerType });
  const resolutionId = clean(resolutionPlan.resolutionId || "resolution-unknown");
  const missionId = clean(resolutionPlan.missionId || "mission-unknown");
  const actionId = `action-${stable(resolutionId)}-${stable(normalizedActionType)}-${stable(providerId || normalizedProviderType)}`;
  const createdAt = nowIso(now);
  const expiration = new Date(new Date(createdAt).getTime() + expirationMinutes * 60_000).toISOString();

  return Object.freeze({
    version: TRUSTED_ACTION_GATEWAY_VERSION,
    actionId,
    resolutionId,
    missionId,
    actionType: normalizedActionType,
    providerType: normalizedProviderType,
    providerId: clean(providerId || `mock-${normalizedProviderType}`),
    requiredInputs: Object.freeze([...requiredInputsFor(normalizedActionType, resolutionPlan), ...list(requiredInputs)]),
    preparedInputs: Object.freeze(Object.fromEntries(Object.entries(preparedInputs).map(([key, value]) => [clean(key), clean(value)]))),
    sensitiveInputsRequired: sensitiveInputsFor(normalizedActionType),
    authenticationMethod: authenticationMethodFor(normalizedActionType, normalizedProviderType),
    userConsentRequired: COMMITMENT_ACTIONS.has(normalizedActionType),
    approvalStatus,
    executionStatus: "prepared_not_executed",
    expiration,
    idempotencyKey: `idem-${stable(resolutionId)}-${stable(missionId)}-${stable(normalizedActionType)}-${stable(providerId || normalizedProviderType)}`,
    retryPolicy: Object.freeze({ maxAttempts: 1, retryAfterFailureRequiresNewApproval: true, silentRetryAllowed: false }),
    fallbackProviders: Object.freeze(list(resolutionPlan.alternativePaths).slice(0, 3).map((path, index) => Object.freeze({
      providerId: `fallback-${index + 1}`,
      label: path.title || `Fallback ${index + 1}`,
      dataState: "fallback"
    }))),
    auditEvents: Object.freeze([audit("action_request_prepared", { actionType: normalizedActionType, approvalStatus }, createdAt)]),
    minimumReturnedData: minimumReturnedDataFor(normalizedActionType),
    providerRedirectState: Object.freeze({
      state: "mock_or_future_redirect",
      liveIntegration: false,
      carriesSensitiveCredentials: false,
      returnOnlyMinimumData: true
    }),
    completionCondition: "Trusted provider returns minimum success/failure status after explicit user approval.",
    dataState: "mock",
    liveIntegration: false,
    fakeConnectedProvider: false
  });
}

export function prepareActionRequestsFromResolutionPlan(resolutionPlan = {}, options = {}) {
  const actions = options.actions || resolutionPlan.approvalRequiredActions || ["contact"];
  return Object.freeze(list(actions).slice(0, 12).map((actionType) => createActionRequest({
    resolutionPlan,
    actionType,
    providerType: options.providerType,
    providerId: options.providerId,
    approvalStatus: "pending_review",
    now: options.now
  })));
}

function isExpired(actionRequest, now = null) {
  const date = new Date(actionRequest.expiration);
  const current = now ? new Date(now) : new Date();
  return Number.isFinite(date.getTime()) && Number.isFinite(current.getTime()) && date.getTime() <= current.getTime();
}

export function reviewActionRequest(actionRequest, decision = "modify", { now = null, reason = "" } = {}) {
  const allowed = ["approve", "reject", "modify", "selectAlternative", "cancel"];
  const safeDecision = allowed.includes(decision) ? decision : "modify";
  if (isExpired(actionRequest, now)) {
    return Object.freeze({
      ...actionRequest,
      approvalStatus: "expired",
      executionStatus: "blocked_expired",
      auditEvents: Object.freeze([...actionRequest.auditEvents, audit("approval_expired", { reason: reason || "Action request expired" }, now)])
    });
  }
  const statusMap = {
    approve: "approved",
    reject: "rejected",
    modify: "needs_modification",
    selectAlternative: "alternative_selected",
    cancel: "cancelled"
  };
  return Object.freeze({
    ...actionRequest,
    approvalStatus: statusMap[safeDecision],
    executionStatus: safeDecision === "approve" ? "approved_waiting_external_auth" : "not_executed",
    auditEvents: Object.freeze([...actionRequest.auditEvents, audit(`user_${safeDecision}`, { reason }, now)])
  });
}

export function simulateProviderExecution(actionRequest, {
  providerResult = "success",
  reference = "MOCK-REFERENCE",
  maskedPaymentMethod = "",
  now = null,
  consumedKeys = new Set()
} = {}) {
  if (actionRequest.approvalStatus !== "approved") {
    return Object.freeze({
      ...actionRequest,
      executionStatus: "blocked_approval_required",
      auditEvents: Object.freeze([...actionRequest.auditEvents, audit("execution_blocked", { reason: "approval_required" }, now)])
    });
  }
  if (isExpired(actionRequest, now)) {
    return Object.freeze({
      ...actionRequest,
      approvalStatus: "expired",
      executionStatus: "blocked_expired",
      auditEvents: Object.freeze([...actionRequest.auditEvents, audit("execution_blocked", { reason: "expired" }, now)])
    });
  }
  if (consumedKeys.has(actionRequest.idempotencyKey)) {
    return Object.freeze({
      ...actionRequest,
      executionStatus: "blocked_duplicate",
      auditEvents: Object.freeze([...actionRequest.auditEvents, audit("execution_blocked", { reason: "duplicate_idempotency_key" }, now)])
    });
  }
  consumedKeys.add(actionRequest.idempotencyKey);
  if (providerResult !== "success") {
    return Object.freeze({
      ...actionRequest,
      executionStatus: "provider_failed",
      providerResult: Object.freeze({ status: "failure", providerName: actionRequest.providerId, timestamp: nowIso(now), reference: clean(reference) }),
      auditEvents: Object.freeze([...actionRequest.auditEvents, audit("provider_failed", { reference }, now)])
    });
  }
  return Object.freeze({
    ...actionRequest,
    executionStatus: "provider_completed_mock",
    providerResult: Object.freeze({
      status: "success",
      providerName: actionRequest.providerId,
      timestamp: nowIso(now),
      reference: clean(reference),
      maskedPaymentMethod: clean(maskedPaymentMethod),
      minimumDataOnly: true
    }),
    auditEvents: Object.freeze([...actionRequest.auditEvents, audit("provider_completed_mock", { reference }, now)])
  });
}

export function selectFallbackProvider(actionRequest, fallbackProviderId) {
  const fallback = actionRequest.fallbackProviders.find((provider) => provider.providerId === fallbackProviderId) || actionRequest.fallbackProviders[0];
  return Object.freeze({
    ...actionRequest,
    providerId: fallback?.providerId || actionRequest.providerId,
    approvalStatus: "pending_review",
    executionStatus: "prepared_not_executed",
    auditEvents: Object.freeze([...actionRequest.auditEvents, audit("fallback_provider_selected", { providerId: fallback?.providerId || "" })])
  });
}

export function buildTrustedActionGatewayPackage({ resolutionPlan = {}, actions = null, now = null } = {}) {
  const actionRequests = prepareActionRequestsFromResolutionPlan(resolutionPlan, { actions: actions || resolutionPlan.approvalRequiredActions, now });
  return Object.freeze({
    version: TRUSTED_ACTION_GATEWAY_VERSION,
    resolutionId: resolutionPlan.resolutionId || null,
    actionRequests,
    securityBoundaries: Object.freeze({
      rawFinancialCredentialsStored: false,
      rawIdentityDocumentsStoredByDefault: false,
      providerPasswordsStored: false,
      otpStored: false,
      externalAuthenticationRequired: true,
      liveIntegrationsClaimed: false
    }),
    visibleStatus: "prepared_for_review",
    auditEvents: Object.freeze([audit("trusted_action_gateway_prepared", { requestCount: actionRequests.length }, now)]),
    approvalRequired: true,
    executionEnabled: false
  });
}
