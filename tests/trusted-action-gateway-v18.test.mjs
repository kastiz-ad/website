import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTrustedActionGatewayPackage,
  createActionRequest,
  reviewActionRequest,
  selectFallbackProvider,
  simulateProviderExecution
} from "../js/engine/action/trusted-action-gateway-v18.js";
import { createHOSKernel } from "../js/engine/kernel/hos-kernel-v16.js";

const resolutionPlan = Object.freeze({
  resolutionId: "resolution-test",
  missionId: "mission-test",
  domain: "travel",
  approvalRequiredActions: ["pay", "book", "contact", "submit", "apply", "cancel"],
  missingEssentialInformation: [],
  alternativePaths: [{ title: "Fallback A" }, { title: "Fallback B" }]
});

test("payment action requires external authentication and stores no raw financial credentials", () => {
  const action = createActionRequest({ resolutionPlan, actionType: "pay", preparedInputs: { amount: "10000 KRW" } });
  assert.equal(action.authenticationMethod, "external_payment_authentication");
  assert.deepEqual(action.sensitiveInputsRequired, ["payment authentication handled externally"]);
  assert.equal(action.providerRedirectState.carriesSensitiveCredentials, false);
  assert.equal(action.liveIntegration, false);
});

test("sensitive fields are rejected before ActionRequest creation", () => {
  assert.throws(() => createActionRequest({
    resolutionPlan,
    actionType: "pay",
    preparedInputs: { cardNumber: "4111111111111111", cvv: "123" }
  }), /sensitive_input_rejected/);
});

test("appointment booking and provider contact require approval before execution", () => {
  const book = createActionRequest({ resolutionPlan: { ...resolutionPlan, domain: "healthcare" }, actionType: "schedule" });
  const contact = createActionRequest({ resolutionPlan, actionType: "contact" });
  assert.equal(book.userConsentRequired, true);
  assert.equal(contact.userConsentRequired, true);
  assert.equal(simulateProviderExecution(book).executionStatus, "blocked_approval_required");
});

test("government submission and job application use external provider auth surfaces", () => {
  const submit = createActionRequest({ resolutionPlan: { ...resolutionPlan, domain: "government" }, actionType: "submit" });
  const apply = createActionRequest({ resolutionPlan: { ...resolutionPlan, domain: "career" }, actionType: "apply" });
  assert.match(submit.authenticationMethod, /official|provider/);
  assert.match(apply.authenticationMethod, /provider|oauth/i);
  assert.ok(submit.minimumReturnedData.includes("submission reference"));
  assert.ok(apply.minimumReturnedData.includes("application reference"));
});

test("approval decisions support approve reject modify alternative and cancel", () => {
  const action = createActionRequest({ resolutionPlan, actionType: "book", now: "2026-07-26T00:00:00Z" });
  assert.equal(reviewActionRequest(action, "approve", { now: "2026-07-26T00:05:00Z" }).approvalStatus, "approved");
  assert.equal(reviewActionRequest(action, "reject").approvalStatus, "rejected");
  assert.equal(reviewActionRequest(action, "modify").approvalStatus, "needs_modification");
  assert.equal(reviewActionRequest(action, "selectAlternative").approvalStatus, "alternative_selected");
  assert.equal(reviewActionRequest(action, "cancel").approvalStatus, "cancelled");
});

test("expired approval blocks execution", () => {
  const action = createActionRequest({ resolutionPlan, actionType: "book", now: "2026-07-26T00:00:00Z", expirationMinutes: 1 });
  const approved = reviewActionRequest(action, "approve", { now: "2026-07-26T00:00:30Z" });
  const result = simulateProviderExecution(approved, { now: "2026-07-26T00:02:00Z" });
  assert.equal(result.executionStatus, "blocked_expired");
});

test("idempotency prevents duplicate execution", () => {
  const consumed = new Set();
  const action = reviewActionRequest(createActionRequest({ resolutionPlan, actionType: "book", now: "2026-07-26T00:00:00Z" }), "approve", { now: "2026-07-26T00:01:00Z" });
  assert.equal(simulateProviderExecution(action, { now: "2026-07-26T00:02:00Z", consumedKeys: consumed }).executionStatus, "provider_completed_mock");
  assert.equal(simulateProviderExecution(action, { now: "2026-07-26T00:03:00Z", consumedKeys: consumed }).executionStatus, "blocked_duplicate");
});

test("provider failure is visible and fallback provider can be selected", () => {
  const action = reviewActionRequest(createActionRequest({ resolutionPlan, actionType: "book" }), "approve");
  const failed = simulateProviderExecution(action, { providerResult: "failure", reference: "FAIL-1" });
  assert.equal(failed.executionStatus, "provider_failed");
  const fallback = selectFallbackProvider(failed, "fallback-2");
  assert.equal(fallback.providerId, "fallback-2");
  assert.equal(fallback.approvalStatus, "pending_review");
});

test("kernel exposes trusted action gateway package after approval stage", () => {
  const result = createHOSKernel().run({ mission: "Book a Japan trip", language: "en" });
  assert.ok(result.trustedActionGateway);
  assert.equal(result.trustedActionGateway.securityBoundaries.rawFinancialCredentialsStored, false);
  const stages = result.kernelTrace.filter((event) => event.event === "stage_started").map((event) => event.stage);
  assert.ok(stages.indexOf("trusted-action-gateway") > stages.indexOf("approval"));
  assert.ok(stages.indexOf("execution-preparation") > stages.indexOf("trusted-action-gateway"));
});

test("gateway package labels all adapters as mock/future unless live integration exists", () => {
  const pkg = buildTrustedActionGatewayPackage({ resolutionPlan });
  assert.ok(pkg.actionRequests.length);
  assert.equal(pkg.securityBoundaries.liveIntegrationsClaimed, false);
  assert.ok(pkg.actionRequests.every((action) => action.dataState === "mock" && action.liveIntegration === false));
});
