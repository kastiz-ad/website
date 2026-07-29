import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  APPROVAL_ENGINE_VERSION,
  APPROVAL_SCOPES,
  APPROVAL_STATUS,
  MISSION_STATES,
  applyMissionVersionChange,
  approveMissionScope,
  assertProviderActionAllowed,
  buildExecutionChecklist,
  createApprovalDemo,
  createExecutionPreview,
  createMissionLifecycle,
  detectExecutionConflicts,
  getCurrentApproval,
  hasCurrentApproval,
  markProviderResultsRetrieved,
  providerResultAgeLabel
} from "../js/engine/approval/approval-engine-v1.js";

import { ProviderManager } from "../js/engine/providers/live/provider-manager.js";
import { createProviderResult } from "../js/engine/providers/live/provider-result.js";
import { FlightProvider } from "../js/engine/providers/live/flight-provider.js";
import { AccommodationProvider } from "../js/engine/providers/live/accommodation-provider.js";
import { searchAndCompareProviders as searchProviders } from "../js/engine/providers/live/provider-orchestration.js";

const mission = () => ({
  id: "approval-demo",
  missionId: "approval-demo",
  type: "travel",
  version: 4,
  origin: "Seoul",
  destination: { city: "Tokyo", country: "Japan" },
  schedule: { startDate: "2026-08-01", endDate: "2026-08-07" },
  selectedFlight: { airline: "Korean Air", available: true },
  selectedHotel: { name: "Station Hotel", available: true },
  budget: { max: 5000000, estimatedTotal: 4300000 }
});

class ApprovedFlightProvider extends FlightProvider {
  constructor() {
    super({ providerId: "approved-flight" });
  }
  async searchFlights() {
    return createProviderResult({ ok: true, provider: this.providerId, sourceState: "cached_public", data: [{ airline: "Korean Air", estimatedPrice: { currency: "KRW", min: 400000 } }] });
  }
}

class ApprovedHotelProvider extends AccommodationProvider {
  constructor() {
    super({ providerId: "approved-hotel" });
  }
  async searchAccommodations() {
    return createProviderResult({ ok: true, provider: this.providerId, sourceState: "cached_public", data: [{ name: "Station Hotel", rating: 4.6, estimatedNightlyPrice: { currency: "KRW", min: 180000 } }] });
  }
}

test("Approval Engine V1 creates the required mission lifecycle states", () => {
  const lifecycle = createMissionLifecycle(mission(), { state: MISSION_STATES.PLANNING, now: "2026-07-30T00:00:00Z" });
  assert.equal(lifecycle.version, APPROVAL_ENGINE_VERSION);
  assert.equal(lifecycle.state, MISSION_STATES.PLANNING);
  assert.equal(lifecycle.missionVersion, 4);
  assert.equal(lifecycle.bookingEnabled, false);
  assert.equal(lifecycle.paymentEnabled, false);
  assert.ok(Object.values(MISSION_STATES).includes(MISSION_STATES.READY_TO_EXECUTE));
  assert.ok(lifecycle.auditLog.every((entry) => entry.internalOnly));
});

test("approvals are permanent scoped records and partial scopes stay independent", () => {
  const base = createMissionLifecycle(mission(), { state: MISSION_STATES.READY_FOR_APPROVAL, now: "2026-07-30T00:00:00Z" });
  const flights = approveMissionScope(base, APPROVAL_SCOPES.SEARCH_FLIGHTS, { approvedBy: "CEO", now: "2026-07-30T00:01:00Z" });
  const hotels = approveMissionScope(flights, APPROVAL_SCOPES.SEARCH_HOTELS, { approvedBy: "CEO", now: "2026-07-30T00:02:00Z" });
  assert.equal(hotels.approvals.length, 2);
  assert.equal(hotels.approvals[0].approvedScope, APPROVAL_SCOPES.SEARCH_FLIGHTS);
  assert.equal(hotels.approvals[1].approvedScope, APPROVAL_SCOPES.SEARCH_HOTELS);
  assert.equal(hasCurrentApproval(hotels, APPROVAL_SCOPES.SEARCH_FLIGHTS, { now: "2026-07-30T00:03:00Z" }), true);
  assert.equal(hasCurrentApproval(hotels, APPROVAL_SCOPES.SEARCH_RESTAURANTS, { now: "2026-07-30T00:03:00Z" }), false);
});

test("mission version changes invalidate prior approvals and show review language", () => {
  const approved = approveMissionScope(createMissionLifecycle(mission(), { state: MISSION_STATES.READY_FOR_APPROVAL }), APPROVAL_SCOPES.SEARCH_HOTELS, { now: "2026-07-30T00:00:00Z" });
  const changed = applyMissionVersionChange(approved, { changedFields: ["selectedHotel"], reason: "hotel_changed", now: "2026-07-30T00:04:00Z" });
  assert.equal(changed.missionVersion, 5);
  assert.equal(changed.approvals[0].status, APPROVAL_STATUS.INVALIDATED);
  assert.equal(getCurrentApproval(changed, APPROVAL_SCOPES.SEARCH_HOTELS, { now: "2026-07-30T00:05:00Z" }), null);
  assert.match(changed.userMessage, /changed.*review/i);
});

test("provider search can be explicitly blocked until scoped approvals exist", async () => {
  const manager = new ProviderManager({
    flightProvider: new ApprovedFlightProvider(),
    accommodationProvider: new ApprovedHotelProvider()
  });
  const base = createMissionLifecycle(mission(), { state: MISSION_STATES.READY_FOR_APPROVAL });
  const blocked = await searchProviders(mission(), { manager, approvalLifecycle: base, requireApproval: true });
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.mode, "provider_search_blocked");

  const flightApproved = approveMissionScope(base, APPROVAL_SCOPES.SEARCH_FLIGHTS);
  const bothApproved = approveMissionScope(flightApproved, APPROVAL_SCOPES.SEARCH_HOTELS);
  const searched = await searchProviders(mission(), { manager, approvalLifecycle: bothApproved, requireApproval: true });
  assert.equal(searched.blocked, undefined);
  assert.equal(searched.providerStatuses.flights.state, "success");
  assert.equal(searched.bookingEnabled, false);
  assert.equal(searched.paymentEnabled, false);
});

test("execution checklist verifies fields, providers, selections, conflicts, prices and current approval", () => {
  const approved = approveMissionScope(createMissionLifecycle(mission(), { state: MISSION_STATES.READY_FOR_APPROVAL, now: "2026-07-30T00:00:00Z" }), APPROVAL_SCOPES.SEARCH_FLIGHTS, { now: "2026-07-30T00:00:00Z" });
  const withResults = markProviderResultsRetrieved(approved, { provider: "flight-provider", scope: APPROVAL_SCOPES.SEARCH_FLIGHTS, now: "2026-07-30T00:01:00Z", ttlMinutes: 10 });
  const checklist = buildExecutionChecklist({
    mission: mission(),
    lifecycle: withResults,
    scope: APPROVAL_SCOPES.SEARCH_FLIGHTS,
    requiredFields: ["destination.city", "schedule.startDate", "schedule.endDate"],
    providerStatuses: { flights: { state: "success" } },
    selectedItems: { flight: { provider: "flight-provider", available: true } },
    now: "2026-07-30T00:04:00Z"
  });
  assert.equal(checklist.ready, true);
  assert.equal(checklist.checks.approvalCurrent, true);
  assert.match(checklist.providerResultAge, /Retrieved 3 minutes ago/);
});

test("expired provider prices are never reused silently", () => {
  const approved = approveMissionScope(createMissionLifecycle(mission()), APPROVAL_SCOPES.SEARCH_FLIGHTS, { now: "2026-07-30T00:00:00Z" });
  const withResults = markProviderResultsRetrieved(approved, { provider: "flight-provider", scope: APPROVAL_SCOPES.SEARCH_FLIGHTS, now: "2026-07-30T00:00:00Z", ttlMinutes: 2 });
  const checklist = buildExecutionChecklist({
    mission: mission(),
    lifecycle: withResults,
    scope: APPROVAL_SCOPES.SEARCH_FLIGHTS,
    providerStatuses: { flights: { state: "success" } },
    now: "2026-07-30T00:03:00Z"
  });
  assert.equal(checklist.ready, false);
  assert.equal(checklist.checks.pricesNotExpired, false);
  assert.equal(checklist.refreshRecommended, true);
});

test("conflict detection explains failures and suggests recovery actions", () => {
  const conflicts = detectExecutionConflicts({
    providerStatuses: { hotels: { state: "unavailable" }, restaurants: { state: "retry" } },
    selectedItems: { hotel: { available: false, provider: "hotel-provider" }, flight: { expiresAt: "2026-07-30T00:00:00Z" } },
    budget: { max: 100, estimatedTotal: 200 },
    now: "2026-07-30T00:05:00Z"
  });
  assert.ok(conflicts.length >= 4);
  assert.ok(conflicts.every((item) => item.explanation && item.recoveryActions.length));
});

test("execution preview replaces technical approval language with user confidence language", () => {
  const preview = createExecutionPreview([APPROVAL_SCOPES.SEARCH_FLIGHTS, APPROVAL_SCOPES.SEARCH_HOTELS], { language: "en" });
  assert.match(preview.title, /ready to search live providers/i);
  assert.match(preview.consequence, /No reservations.*No payments/i);
  const ko = providerResultAgeLabel("2026-07-30T00:00:00Z", { now: "2026-07-30T00:04:00Z", language: "ko" });
  assert.match(ko, /4분 전에 조회/);
});

test("founder demo shows protected transition from trip to provider results without booking", () => {
  const demo = createApprovalDemo(mission());
  assert.deepEqual(demo.story, ["Trip generated", "Approval requested", "Approval granted", "Providers searched", "Results returned", "Nothing booked", "Mission ready"]);
  assert.equal(demo.bookingEnabled, false);
  assert.equal(demo.paymentEnabled, false);
  assert.equal(demo.lifecycle.state, MISSION_STATES.RESULTS_READY);
});

test("results and provider orchestration are wired to Approval Engine V1 cache key", () => {
  const resultsPage = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const providerOrchestration = readFileSync(new URL("../js/engine/providers/live/provider-orchestration.js", import.meta.url), "utf8");
  const resultsHtml = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  assert.match(providerOrchestration, /approvalWorkflow/);
  assert.match(providerOrchestration, /assertProviderActionAllowed/);
  assert.match(resultsPage, /providerOrchestration/);
  assert.match(resultsHtml, /20260730-universal-execution/);
});
