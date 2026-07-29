import { createProviderResult, unavailableProviderResult } from "./provider-result.js";

export const UNIVERSAL_RESERVATION_ENGINE_VERSION = "20260730-universal-reservation-engine-v1";

export const RESERVATION_CATEGORIES = Object.freeze([
  "flight",
  "hotel",
  "restaurant",
  "attraction",
  "museum",
  "tour",
  "transportation",
  "government_appointment",
  "future_provider"
]);

export const RESERVATION_STATES = Object.freeze({
  SETUP_REQUIRED: "setup_required",
  AWAITING_USER_APPROVAL: "awaiting_user_approval",
  APPROVED: "approved",
  CONFIRMED: "confirmed",
  FAILED: "failed",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  MODIFICATION_PREPARED: "modification_prepared",
  CANCELLATION_PREPARED: "cancellation_prepared",
  CANCELLED: "cancelled"
});

export const RESERVATION_ACTIONS = Object.freeze({
  PREPARE: "prepare",
  CONFIRM: "confirm",
  MODIFY: "modify",
  CANCEL: "cancel"
});

const clean = (value) => String(value ?? "").trim();
const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const nowIso = () => new Date().toISOString();

export function normalizeReservationRequest(input = {}) {
  const category = RESERVATION_CATEGORIES.includes(input.category) ? input.category : "future_provider";
  return Object.freeze({
    reservationId: clean(input.reservationId),
    missionId: clean(input.missionId || input.mission?.id),
    category,
    providerId: clean(input.providerId || input.provider),
    providerType: clean(input.providerType || category),
    action: input.action || RESERVATION_ACTIONS.PREPARE,
    item: Object.freeze(input.item || {}),
    schedule: Object.freeze(input.schedule || {}),
    party: Object.freeze(input.party || {}),
    price: Object.freeze(input.price || {}),
    cancellationPolicy: Object.freeze(input.cancellationPolicy || {}),
    requiredInputs: Object.freeze(asArray(input.requiredInputs)),
    preparedInputs: Object.freeze(input.preparedInputs || {}),
    sensitiveInputsRequired: Object.freeze(asArray(input.sensitiveInputsRequired)),
    approval: Object.freeze(input.approval || {}),
    idempotencyKey: clean(input.idempotencyKey || `${input.missionId || "mission"}:${category}:${input.providerId || "provider"}:${input.action || "prepare"}`),
    createdAt: input.createdAt || nowIso()
  });
}

export function createReservationAuditEvent({ action, state, providerId, reservationId = "", result = "", metadata = {} } = {}) {
  return Object.freeze({
    at: nowIso(),
    action,
    state,
    providerId: clean(providerId),
    reservationId: clean(reservationId),
    result: clean(result),
    metadata: Object.freeze(metadata)
  });
}

export function normalizeReservationResult(input = {}) {
  return Object.freeze({
    ok: input.ok === true,
    reservationId: clean(input.reservationId),
    providerReservationId: clean(input.providerReservationId),
    providerConfirmationNumber: clean(input.providerConfirmationNumber),
    state: input.state || RESERVATION_STATES.SETUP_REQUIRED,
    providerId: clean(input.providerId || input.provider),
    category: RESERVATION_CATEGORIES.includes(input.category) ? input.category : "future_provider",
    message: clean(input.message),
    confirmationDetails: Object.freeze(input.confirmationDetails || {}),
    canModify: input.canModify === true,
    canCancel: input.canCancel === true,
    rollbackAvailable: input.rollbackAvailable === true,
    auditLog: Object.freeze(asArray(input.auditLog)),
    error: input.error ? Object.freeze({ code: input.error.code || "reservation_error", message: input.error.message || "Reservation failed." }) : null,
    retrievedAt: input.retrievedAt || nowIso()
  });
}

export function createReservationPreparation(requestInput = {}) {
  const request = normalizeReservationRequest(requestInput);
  return normalizeReservationResult({
    ok: true,
    reservationId: request.reservationId || `reservation-prep-${request.idempotencyKey.replace(/[^a-z0-9_-]/gi, "_").slice(0, 60)}`,
    state: RESERVATION_STATES.AWAITING_USER_APPROVAL,
    providerId: request.providerId,
    category: request.category,
    message: "Reservation prepared. User approval required before provider execution.",
    canModify: true,
    canCancel: true,
    rollbackAvailable: false,
    auditLog: [createReservationAuditEvent({ action: RESERVATION_ACTIONS.PREPARE, state: RESERVATION_STATES.AWAITING_USER_APPROVAL, providerId: request.providerId, result: "prepared_only" })]
  });
}

export function approvalAllowsReservation(approval = {}) {
  return Boolean(
    approval.status === "approved"
    && approval.exactAction === "reservation"
    && approval.payloadHash
    && (!approval.expiresAt || new Date(approval.expiresAt).getTime() > Date.now())
  );
}

export class ReservationProvider {
  constructor({ providerId = "reservation-provider", label = "Reservation provider", enabled = false, capabilities = [] } = {}) {
    this.providerId = providerId;
    this.label = label;
    this.providerType = "reservation";
    this.enabled = Boolean(enabled);
    this.capabilities = new Set(capabilities);
    this.executedIdempotencyKeys = new Set();
  }

  async searchAvailability(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "searchAvailability");
  }

  async prepareReservation(request = {}) {
    if (!this.enabled || !this.capabilities.has(RESERVATION_ACTIONS.PREPARE)) {
      return createProviderResult({
        ok: false,
        provider: this.providerId,
        sourceState: "unavailable",
        error: { code: "setup_required", message: "Reservation provider setup required." },
        data: normalizeReservationResult({ providerId: this.providerId, state: RESERVATION_STATES.SETUP_REQUIRED, message: "Reservation provider setup required." })
      });
    }
    return createProviderResult({
      ok: true,
      provider: this.providerId,
      sourceState: "verified_live",
      data: createReservationPreparation({ ...request, providerId: this.providerId })
    });
  }

  async confirmReservation(request = {}) {
    const normalized = normalizeReservationRequest({ ...request, action: RESERVATION_ACTIONS.CONFIRM, providerId: this.providerId });
    if (!approvalAllowsReservation(normalized.approval)) {
      return normalizeReservationResult({
        providerId: this.providerId,
        category: normalized.category,
        state: RESERVATION_STATES.AWAITING_USER_APPROVAL,
        message: "Explicit user approval is required before reservation execution.",
        error: { code: "approval_required", message: "Explicit user approval is required." },
        auditLog: [createReservationAuditEvent({ action: RESERVATION_ACTIONS.CONFIRM, state: RESERVATION_STATES.AWAITING_USER_APPROVAL, providerId: this.providerId, result: "blocked" })]
      });
    }
    if (!this.enabled || !this.capabilities.has(RESERVATION_ACTIONS.CONFIRM)) {
      return normalizeReservationResult({
        providerId: this.providerId,
        category: normalized.category,
        state: RESERVATION_STATES.SETUP_REQUIRED,
        message: "Provider cannot confirm reservations until configured.",
        error: { code: "setup_required", message: "Reservation provider setup required." },
        auditLog: [createReservationAuditEvent({ action: RESERVATION_ACTIONS.CONFIRM, state: RESERVATION_STATES.SETUP_REQUIRED, providerId: this.providerId, result: "blocked" })]
      });
    }
    if (this.executedIdempotencyKeys.has(normalized.idempotencyKey)) {
      return normalizeReservationResult({
        providerId: this.providerId,
        category: normalized.category,
        state: RESERVATION_STATES.FAILED,
        message: "Duplicate reservation execution prevented.",
        error: { code: "duplicate_execution_prevented", message: "Duplicate reservation execution prevented." },
        auditLog: [createReservationAuditEvent({ action: RESERVATION_ACTIONS.CONFIRM, state: RESERVATION_STATES.FAILED, providerId: this.providerId, result: "duplicate_prevented" })]
      });
    }
    this.executedIdempotencyKeys.add(normalized.idempotencyKey);
    return normalizeReservationResult({
      providerId: this.providerId,
      category: normalized.category,
      state: RESERVATION_STATES.PROVIDER_UNAVAILABLE,
      message: "No live reservation execution adapter is connected for this provider.",
      error: { code: "provider_unavailable", message: "No live reservation execution adapter is connected." },
      auditLog: [createReservationAuditEvent({ action: RESERVATION_ACTIONS.CONFIRM, state: RESERVATION_STATES.PROVIDER_UNAVAILABLE, providerId: this.providerId, result: "no_live_adapter" })]
    });
  }

  async modifyReservation(request = {}) {
    const normalized = normalizeReservationRequest({ ...request, action: RESERVATION_ACTIONS.MODIFY, providerId: this.providerId });
    return normalizeReservationResult({
      providerId: this.providerId,
      category: normalized.category,
      state: RESERVATION_STATES.MODIFICATION_PREPARED,
      message: "Modification prepared. Provider support and renewed approval required before execution.",
      auditLog: [createReservationAuditEvent({ action: RESERVATION_ACTIONS.MODIFY, state: RESERVATION_STATES.MODIFICATION_PREPARED, providerId: this.providerId, result: "prepared_only" })]
    });
  }

  async cancelReservation(request = {}) {
    const normalized = normalizeReservationRequest({ ...request, action: RESERVATION_ACTIONS.CANCEL, providerId: this.providerId });
    return normalizeReservationResult({
      providerId: this.providerId,
      category: normalized.category,
      state: RESERVATION_STATES.CANCELLATION_PREPARED,
      message: "Cancellation prepared. Provider support and user approval required before cancellation.",
      auditLog: [createReservationAuditEvent({ action: RESERVATION_ACTIONS.CANCEL, state: RESERVATION_STATES.CANCELLATION_PREPARED, providerId: this.providerId, result: "prepared_only" })]
    });
  }
}

export class UniversalReservationEngine {
  constructor({ providers = [] } = {}) {
    this.providers = new Map(asArray(providers).map((provider) => [provider.providerId, provider]));
  }

  registerProvider(provider) {
    if (provider?.providerId) this.providers.set(provider.providerId, provider);
    return this;
  }

  providerFor(providerId) {
    return this.providers.get(providerId) || new ReservationProvider({ providerId: providerId || "reservation-provider" });
  }

  supportMatrix() {
    return Object.freeze([...this.providers.values()].map((provider) => Object.freeze({
      providerId: provider.providerId,
      enabled: provider.enabled,
      categories: Object.freeze(RESERVATION_CATEGORIES),
      capabilities: Object.freeze([...provider.capabilities]),
      truthfulStatus: provider.enabled ? "adapter_registered" : "setup_required"
    })));
  }

  prepare(request = {}) {
    return createReservationPreparation(request);
  }

  async confirm(request = {}) {
    return this.providerFor(request.providerId).confirmReservation(request);
  }

  async modify(request = {}) {
    return this.providerFor(request.providerId).modifyReservation(request);
  }

  async cancel(request = {}) {
    return this.providerFor(request.providerId).cancelReservation(request);
  }
}

export function createReservationFounderDemo() {
  const engine = new UniversalReservationEngine({
    providers: [new ReservationProvider({ providerId: "demo-setup-required-provider", enabled: false })]
  });
  const request = normalizeReservationRequest({
    missionId: "demo-mission",
    category: "restaurant",
    providerId: "demo-setup-required-provider",
    item: { name: "Dinner reservation" },
    approval: { status: "approved", exactAction: "reservation", payloadHash: "demo-hash", expiresAt: "2099-01-01T00:00:00Z" }
  });
  return Object.freeze({
    version: UNIVERSAL_RESERVATION_ENGINE_VERSION,
    approvalRequired: true,
    fakeBookingImplemented: false,
    preparation: engine.prepare(request),
    supportMatrix: engine.supportMatrix()
  });
}
