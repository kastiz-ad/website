import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  DEFAULT_PROVIDER_CAPABILITIES,
  DOCUMENT_TYPES,
  EXECUTION_STATUS,
  EXECUTION_TYPES,
  ExecutionManager,
  UNIVERSAL_EXECUTION_ENGINE_VERSION,
  canProviderPerform,
  createExecutionPlan,
  createFounderExecutionDemo,
  createProviderCapabilityProfile,
  createUniversalConfirmation,
  normalizeProviderDocument,
  validateExecutionRequest
} from "../js/engine/execution/universal-execution-engine-v1.js";

const hotelProvider = () => createProviderCapabilityProfile({
  providerId: "hotel-provider",
  providerType: "hotel",
  capabilities: {
    canSearch: true,
    canReserve: true,
    canBook: true,
    canCancel: true,
    supportsDocuments: true,
    supportsQRCode: true,
    supportsRealtimeAvailability: true,
    supportsModification: true
  },
  dataState: "mock_or_future"
});

const ticketProvider = () => createProviderCapabilityProfile({
  providerId: "ticket-provider",
  providerType: "experience",
  capabilities: {
    canSearch: true,
    canReserve: true,
    canCancel: false,
    supportsDocuments: true,
    supportsQRCode: true
  },
  dataState: "mock_or_future"
});

const transportProvider = () => createProviderCapabilityProfile({
  providerId: "transport-provider",
  providerType: "transport",
  capabilities: {
    canSearch: true,
    canReserve: false,
    supportsQRCode: true
  },
  dataState: "mock_or_future"
});

const registry = () => ({
  "hotel-provider": hotelProvider(),
  "ticket-provider": ticketProvider(),
  "transport-provider": transportProvider()
});

const plan = () => createExecutionPlan({
  mission: { missionId: "mission-japan", type: "travel" },
  resolutionPlan: { resolutionId: "resolution-japan", domain: "travel" },
  steps: [
    { title: "Reserve Hotel", type: "reserve", providerId: "hotel-provider", providerType: "hotel", category: "hotel", rollback: { canRollback: true } },
    { title: "Reserve Disney Tickets", type: "reserve", providerId: "ticket-provider", providerType: "experience", category: "experience", rollback: { partialRollback: true, manualIntervention: true } },
    { title: "Reserve Airport Train", type: "reserve", providerId: "transport-provider", providerType: "transport", category: "transport", rollback: { canRollback: false, manualIntervention: true } },
    { title: "Generate Final Itinerary", type: "download", providerId: "hotel-provider", providerType: "document", category: "itinerary" }
  ],
  now: "2026-07-30T00:00:00Z"
});

test("Universal Execution Engine exposes generic execution types and statuses", () => {
  assert.equal(typeof ExecutionManager, "function");
  assert.ok(EXECUTION_TYPES.includes("reserve"));
  assert.ok(EXECUTION_TYPES.includes("check-in"));
  assert.ok(Object.values(EXECUTION_STATUS).includes("retrying"));
  assert.ok(DOCUMENT_TYPES.includes("qr_code"));
  assert.equal(DEFAULT_PROVIDER_CAPABILITIES.canBook, false);
});

test("provider capabilities are explicit and never assumed", () => {
  const hotel = hotelProvider();
  const transport = transportProvider();
  assert.equal(canProviderPerform(hotel, "reserve"), true);
  assert.equal(canProviderPerform(hotel, "download"), true);
  assert.equal(canProviderPerform(transport, "reserve"), false);
  assert.equal(canProviderPerform(transport, "download"), false);
});

test("visible execution plan is generated before anything executes", () => {
  const executionPlan = plan();
  assert.equal(executionPlan.version, UNIVERSAL_EXECUTION_ENGINE_VERSION);
  assert.equal(executionPlan.nothingExecutesYet, true);
  assert.equal(executionPlan.bookingEnabled, false);
  assert.equal(executionPlan.paymentEnabled, false);
  assert.deepEqual(executionPlan.visiblePlan.map((step) => step.title), ["Reserve Hotel", "Reserve Disney Tickets", "Reserve Airport Train", "Generate Final Itinerary"]);
  assert.ok(executionPlan.visiblePlan.every((step) => step.status === EXECUTION_STATUS.WAITING));
});

test("execution validation blocks missing approval and unsupported provider capabilities", () => {
  const executionPlan = plan();
  const noApproval = validateExecutionRequest({ plan: executionPlan, providerRegistry: registry(), approved: false });
  assert.equal(noApproval.ok, false);
  assert.ok(noApproval.failures.includes("approval_required"));

  const approved = validateExecutionRequest({ plan: executionPlan, providerRegistry: registry(), approved: true });
  assert.equal(approved.ok, false);
  assert.ok(approved.failures.includes("unsupported_capability:transport-provider:reserve"));
});

test("ExecutionManager runs only approved provider-safe actions and supports partial success", () => {
  const manager = new ExecutionManager({ providerRegistry: registry(), now: () => new Date("2026-07-30T00:00:00Z") });
  const executionPlan = plan();
  const blocked = manager.executePlan(executionPlan, { approved: false });
  assert.equal(blocked.status, "failed");
  assert.ok(blocked.steps.every((step) => step.status === EXECUTION_STATUS.BLOCKED));

  const result = manager.executePlan(executionPlan, {
    approved: true,
    travellers: ["Kook"],
    providerResults: {
      "exec-1-reserve": { status: "success", providerReference: "HOTEL-123", documents: [{ type: "hotel_confirmation", providerReference: "HOTEL-123" }] },
      "exec-2-reserve": { status: "success", providerReference: "TICKET-123", documents: [{ type: "qr_code", providerReference: "TICKET-123" }] },
      "exec-3-reserve": { status: "failure", reason: "provider_unavailable" },
      "exec-4-download": { status: "success", providerReference: "ITIN-123", documents: [{ type: "voucher", providerReference: "ITIN-123" }] }
    },
    now: "2026-07-30T00:10:00Z"
  });
  assert.equal(result.status, "partial_success");
  assert.equal(result.partialSuccess, true);
  assert.equal(result.confirmations.length, 3);
  assert.ok(result.failedSteps.includes("exec-3-reserve"));
  assert.ok(result.recoveryOptions.includes("Alternative provider"));
});

test("rollback strategy distinguishes cancellation, partial rollback and manual intervention", () => {
  const manager = new ExecutionManager({ providerRegistry: registry() });
  const [hotel, ticket, transport] = plan().steps;
  assert.equal(manager.rollback(hotel).rollbackStatus, EXECUTION_STATUS.CANCELLED);
  assert.equal(manager.rollback(ticket).manualInterventionRequired, true);
  assert.equal(manager.rollback(transport).manualInterventionRequired, true);
});

test("provider documents and confirmations require real provider evidence", () => {
  const rejected = normalizeProviderDocument({ type: "qr_code" });
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.fakeDocumentGenerated, false);

  const confirmation = createUniversalConfirmation({
    missionId: "mission-japan",
    provider: "hotel-provider",
    providerReference: "HOTEL-123",
    category: "hotel",
    travellers: ["Kook"],
    documents: [{ type: "hotel_confirmation", providerReference: "HOTEL-123", label: "Hotel confirmation" }]
  });
  assert.equal(confirmation.confirmationId, "confirmation-hotel-provider-hotel-123");
  assert.equal(confirmation.documents[0].fakeDocumentGenerated, false);
});

test("monitor retry and notify keep user experience consistent without exposing technical logs", () => {
  const manager = new ExecutionManager({ providerRegistry: registry(), now: () => new Date("2026-07-30T00:00:00Z") });
  const result = manager.executePlan(plan(), {
    approved: true,
    providerResults: {
      "exec-1-reserve": { status: "success", providerReference: "HOTEL-123" },
      "exec-2-reserve": { status: "failure", reason: "sold_out" },
      "exec-3-reserve": { status: "failure", reason: "timeout" },
      "exec-4-download": { status: "success", providerReference: "ITIN-123" }
    }
  });
  const monitor = manager.monitor(result);
  assert.ok(monitor.failed.length >= 2);
  const retried = manager.retry(result.steps.find((step) => step.status === EXECUTION_STATUS.FAILED), { reason: "timeout" });
  assert.equal(retried.status, EXECUTION_STATUS.RETRYING);
  const notice = manager.notify(result);
  assert.equal(notice.shouldNotify, true);
  assert.equal(notice.decisionRequired, true);
  assert.ok(result.auditEvents.every((entry) => entry.internalOnly));
});

test("founder demo shows safe simulated execution without claiming live booking", () => {
  const demo = createFounderExecutionDemo();
  assert.equal(demo.version, UNIVERSAL_EXECUTION_ENGINE_VERSION);
  assert.equal(demo.realBookingClaimed, false);
  assert.equal(demo.paymentConnected, false);
  assert.equal(demo.fakeProviderDocumentsGenerated, false);
  assert.equal(demo.result.status, "partial_success");
  assert.ok(demo.result.confirmations.every((confirmation) => confirmation.providerReference));
  assert.ok(demo.notification.shouldNotify);
});

test("results page and cache key reference the current results milestone", () => {
  const resultsHtml = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  const resultsEntry = readFileSync(new URL("../results.js", import.meta.url), "utf8");
  assert.match(resultsHtml, /20260730-investor-demo-mode/);
  assert.match(resultsEntry, /20260730-investor-demo-mode/);
});
