import assert from "node:assert/strict";
import { test } from "node:test";

import {
  RESERVATION_ACTIONS,
  RESERVATION_STATES,
  ReservationProvider,
  UniversalReservationEngine,
  approvalAllowsReservation,
  createReservationFounderDemo,
  createReservationPreparation,
  normalizeReservationRequest
} from "../js/engine/providers/live/reservation-provider.js";

const approval = { status: "approved", exactAction: "reservation", payloadHash: "hash", expiresAt: "2099-01-01T00:00:00Z" };

test("universal reservation request normalizes all supported categories", () => {
  const request = normalizeReservationRequest({ missionId: "m1", category: "flight", providerId: "airline", action: "confirm" });

  assert.equal(request.category, "flight");
  assert.equal(request.providerId, "airline");
  assert.equal(request.idempotencyKey, "m1:flight:airline:confirm");
});

test("reservation preparation does not execute and waits for user approval", () => {
  const prep = createReservationPreparation({ missionId: "m1", category: "hotel", providerId: "hotel-provider" });

  assert.equal(prep.ok, true);
  assert.equal(prep.state, RESERVATION_STATES.AWAITING_USER_APPROVAL);
  assert.equal(prep.providerConfirmationNumber, "");
  assert.match(prep.message, /approval/i);
});

test("approval gate requires exact approved reservation action", () => {
  assert.equal(approvalAllowsReservation(approval), true);
  assert.equal(approvalAllowsReservation({ ...approval, status: "pending" }), false);
  assert.equal(approvalAllowsReservation({ ...approval, exactAction: "payment" }), false);
  assert.equal(approvalAllowsReservation({ ...approval, payloadHash: "" }), false);
});

test("confirmReservation blocks without explicit approval", async () => {
  const provider = new ReservationProvider({ providerId: "restaurant-provider", enabled: true, capabilities: [RESERVATION_ACTIONS.CONFIRM] });
  const result = await provider.confirmReservation({ missionId: "m1", category: "restaurant", approval: { status: "missing" } });

  assert.equal(result.state, RESERVATION_STATES.AWAITING_USER_APPROVAL);
  assert.equal(result.error.code, "approval_required");
});

test("configured interface still refuses to fake confirmation without live execution adapter", async () => {
  const provider = new ReservationProvider({ providerId: "museum-provider", enabled: true, capabilities: [RESERVATION_ACTIONS.CONFIRM] });
  const result = await provider.confirmReservation({ missionId: "m1", category: "museum", approval, idempotencyKey: "once" });

  assert.equal(result.state, RESERVATION_STATES.PROVIDER_UNAVAILABLE);
  assert.equal(result.providerConfirmationNumber, "");
  assert.equal(result.error.code, "provider_unavailable");
});

test("duplicate reservation execution is prevented by idempotency key", async () => {
  const provider = new ReservationProvider({ providerId: "tour-provider", enabled: true, capabilities: [RESERVATION_ACTIONS.CONFIRM] });
  await provider.confirmReservation({ missionId: "m1", category: "tour", approval, idempotencyKey: "duplicate" });
  const duplicate = await provider.confirmReservation({ missionId: "m1", category: "tour", approval, idempotencyKey: "duplicate" });

  assert.equal(duplicate.state, RESERVATION_STATES.FAILED);
  assert.equal(duplicate.error.code, "duplicate_execution_prevented");
});

test("modification and cancellation are prepared but not executed", async () => {
  const provider = new ReservationProvider({ providerId: "hotel-provider" });
  const modification = await provider.modifyReservation({ missionId: "m1", category: "hotel" });
  const cancellation = await provider.cancelReservation({ missionId: "m1", category: "hotel" });

  assert.equal(modification.state, RESERVATION_STATES.MODIFICATION_PREPARED);
  assert.equal(cancellation.state, RESERVATION_STATES.CANCELLATION_PREPARED);
});

test("universal reservation engine exposes support matrix and routes operations", async () => {
  const engine = new UniversalReservationEngine({
    providers: [new ReservationProvider({ providerId: "government-provider", enabled: false })]
  });
  const matrix = engine.supportMatrix();
  const confirm = await engine.confirm({ missionId: "m1", category: "government_appointment", providerId: "government-provider", approval });

  assert.equal(matrix[0].truthfulStatus, "setup_required");
  assert.equal(confirm.state, RESERVATION_STATES.SETUP_REQUIRED);
});

test("founder demo shows approval to setup-required reservation flow without fake bookings", () => {
  const demo = createReservationFounderDemo();

  assert.equal(demo.approvalRequired, true);
  assert.equal(demo.fakeBookingImplemented, false);
  assert.equal(demo.preparation.state, RESERVATION_STATES.AWAITING_USER_APPROVAL);
  assert.equal(demo.preparation.providerConfirmationNumber, "");
});
