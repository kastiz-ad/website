import test from "node:test";
import assert from "node:assert/strict";
import { createHOSKernel } from "../js/engine/kernel/hos-kernel-v16.js";
import { createActionRequest, reviewActionRequest, simulateProviderExecution } from "../js/engine/action/trusted-action-gateway-v18.js";
import { buildMissionProgress, buildMonitoringAdapterDescriptor, ingestMissionStatus, isMissionComplete } from "../js/engine/completion/mission-completion-loop-v19.js";

const resolutionPlan = Object.freeze({
  version: "V17",
  resolutionId: "resolution-loop",
  missionId: "mission-loop",
  domain: "healthcare",
  completionCriteria: ["appointment accepted", "user confirms completion"],
  recoveryPlan: "Use fallback provider and request the minimum decision."
});

test("successful appointment booking becomes completed unverified before verification", () => {
  const action = reviewActionRequest(createActionRequest({ resolutionPlan, actionType: "schedule" }), "approve");
  const completed = simulateProviderExecution(action, { reference: "APT-1" });
  const progress = buildMissionProgress({ resolutionPlan, actionRequests: [completed], events: [{ type: "success", source: "provider" }] });
  assert.equal(progress.currentState, "completed_unverified");
  assert.equal(progress.userDecisionRequired, true);
  assert.equal(isMissionComplete(progress), false);
});

test("completion verification is required before mission is truly complete", () => {
  const progress = buildMissionProgress({ resolutionPlan, events: [{ type: "verified", source: "user", at: "2026-07-26T00:00:00Z" }] });
  assert.equal(progress.currentState, "completed_verified");
  assert.equal(isMissionComplete(progress), true);
  assert.equal(progress.finalOutcome, "User intended outcome verified.");
});

test("provider rejection creates recoverable fallback path", () => {
  const progress = buildMissionProgress({ resolutionPlan, events: [{ type: "provider_rejection", reason: "No appointment available" }] });
  assert.equal(progress.currentState, "failed_recoverable");
  assert.ok(progress.recoveryOptions.some((item) => /fallback provider/i.test(item.label)));
  assert.equal(progress.userDecisionRequired, true);
});

test("payment failure never asks for raw card details", () => {
  const progress = buildMissionProgress({ resolutionPlan, events: [{ type: "payment_failure", reason: "External provider authentication failed" }] });
  assert.equal(progress.currentState, "failed_recoverable");
  assert.ok(progress.recommendedRecovery.label.includes("external payment authentication"));
  assert.ok(!progress.recommendedRecovery.label.match(/card number|CVV/i));
});

test("price change requires renewed approval", () => {
  const progress = buildMissionProgress({ resolutionPlan, events: [{ type: "price_change", reason: "Flight price changed materially" }] });
  assert.equal(progress.currentState, "waiting_for_approval");
  assert.ok(progress.recommendedRecovery.label.includes("renewed approval"));
});

test("missing government document prepares correction instead of terminal failure", () => {
  const progress = buildMissionProgress({ resolutionPlan: { ...resolutionPlan, domain: "government" }, events: [{ type: "missing_document", reason: "Missing certificate" }] });
  assert.equal(progress.currentState, "failed_recoverable");
  assert.ok(progress.recommendedRecovery.label.includes("missing document"));
});

test("job listing expiry moves to prepared alternatives", () => {
  const progress = buildMissionProgress({ resolutionPlan: { ...resolutionPlan, domain: "career" }, events: [{ type: "job_expired", reason: "Listing closed" }] });
  assert.equal(progress.currentState, "failed_recoverable");
  assert.ok(progress.recommendedRecovery.label.includes("equivalent prepared job alternatives"));
});

test("partial travel booking keeps completed components and recovers failed part", () => {
  const progress = buildMissionProgress({ resolutionPlan: { ...resolutionPlan, domain: "travel" }, events: [{ type: "partial_travel_booking", reason: "Hotel accepted, flight failed" }] });
  assert.equal(progress.currentState, "failed_recoverable");
  assert.ok(progress.recoveryOptions.some((item) => /completed components/i.test(item.label)));
});

test("user cancellation closes mission without pretending success", () => {
  const progress = buildMissionProgress({ resolutionPlan, events: [{ type: "cancelled", source: "user" }] });
  assert.equal(progress.currentState, "cancelled");
  assert.equal(isMissionComplete(progress), true);
  assert.equal(progress.finalOutcome, "Mission closed by user.");
});

test("duplicate callback is ignored", () => {
  const first = ingestMissionStatus({ missionId: "m1", resolutionId: "r1", seenEventIds: [] }, { id: "evt-1", type: "success" });
  const second = ingestMissionStatus(first, { id: "evt-1", type: "success" });
  assert.equal(second.duplicateIgnored, true);
  assert.equal(second.evidence.at(-1).state, "ignored");
});

test("stale or expired status does not silently continue", () => {
  const action = createActionRequest({ resolutionPlan, actionType: "book", now: "2026-07-26T00:00:00Z", expirationMinutes: 1 });
  const progress = buildMissionProgress({ resolutionPlan, actionRequests: [action], now: "2026-07-26T00:02:00Z" });
  assert.equal(progress.currentState, "expired");
  assert.equal(progress.userDecisionRequired, true);
});

test("terminal failure remains terminal and visible", () => {
  const progress = buildMissionProgress({ resolutionPlan, events: [{ type: "terminal_failure", reason: "Officially ineligible" }] });
  assert.equal(progress.currentState, "failed_terminal");
  assert.equal(progress.failureReason, "Officially ineligible");
  assert.equal(progress.completionConfidence, 0.9);
});

test("monitoring adapters are webhook-ready without claiming real-time support", () => {
  const adapter = buildMonitoringAdapterDescriptor({ provider: "future-airline", supportsWebhooks: true });
  assert.equal(adapter.webhookReady, true);
  assert.equal(adapter.realtimeClaimed, false);
});

test("kernel exposes MissionProgress after Trusted Action Gateway", () => {
  const result = createHOSKernel().run({ mission: "Book dentist today", language: "en", currentLocation: "Seoul" });
  assert.ok(result.missionProgress);
  assert.equal(result.missionProgress.currentState, "waiting_for_approval");
  const stages = result.kernelTrace.filter((event) => event.event === "stage_started").map((event) => event.stage);
  assert.ok(stages.indexOf("mission-completion-loop") > stages.indexOf("trusted-action-gateway"));
});
