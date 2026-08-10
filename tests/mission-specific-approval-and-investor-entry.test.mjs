import test from "node:test";
import assert from "node:assert/strict";
import {
  APPROVAL_DEMO_CONFIRMATIONS,
  auditPreparationTranslations,
  buildApprovalContract,
  buildPreparationStepIds
} from "../js/engine/approval/mission-specific-approval.js";
import {
  INVESTOR_VISIBILITY,
  isDedicatedInvestorRoute,
  shouldShowInvestorPanel
} from "../js/config/investor-visibility.js";

test("medical preparation never falls back to travel work", () => {
  const contract = buildApprovalContract({ result: { id: "med-1", type: "medical_appointment", mission: "Dentist in Gangnam" }, language: "ko" });
  assert.equal(contract.missionType, "medical_appointment");
  assert.equal(contract.preparationSteps.length, 8);
  assert.ok(contract.preparationSteps.every((step) => step.id.startsWith("medical.")));
  assert.equal(contract.executionCapabilities.providerSubmission, false);
  assert.equal(contract.executionCapabilities.booking, false);
  assert.match(APPROVAL_DEMO_CONFIRMATIONS.medical_appointment.ko, /전송되지 않았으며/);
});

test("restaurant preparation is restaurant-specific", () => {
  const ids = buildPreparationStepIds({ type: "restaurant_reservation" });
  assert.equal(ids.length, 7);
  assert.ok(ids.every((id) => id.startsWith("restaurant.")));
});

test("travel preparation includes only selected components", () => {
  const hotelOnly = buildPreparationStepIds({ type: "travel", selectedHotel: { id: "h1" } });
  assert.ok(hotelOnly.includes("travel.review_hotel"));
  assert.ok(!hotelOnly.includes("travel.review_flight"));
  const flightOnly = buildPreparationStepIds({ type: "travel", selectedFlight: { id: "f1" } });
  assert.ok(flightOnly.includes("travel.review_flight"));
  assert.ok(!flightOnly.includes("travel.review_hotel"));
});

test("generic preparation remains neutral", () => {
  const ids = buildPreparationStepIds({ type: "shopping" });
  assert.ok(ids.every((id) => id.startsWith("generic.")));
  assert.ok(ids.every((id) => !/flight|hotel|restaurant|medical/.test(id)));
});

test("all preparation translations are complete in EN KO ES FR", () => {
  assert.deepEqual(auditPreparationTranslations(), { valid: true, missing: [] });
});

test("investor panel is private by default and visible only on shared-code route", () => {
  assert.equal(INVESTOR_VISIBILITY.showOnHomepage, false);
  assert.equal(INVESTOR_VISIBILITY.routePath, "/investor");
  assert.equal(shouldShowInvestorPanel({ pathname: "/" }), false);
  assert.equal(shouldShowInvestorPanel({ pathname: "/", search: "?demo=1" }), false);
  assert.equal(isDedicatedInvestorRoute({ pathname: "/investor/" }), true);
  assert.equal(shouldShowInvestorPanel({ pathname: "/investor" }), true);
});

test("dedicated investor middleware serves shared homepage and blocks indexing", async () => {
  const { onRequest } = await import("../functions/_middleware.js");
  let requestedPath = "";
  const response = await onRequest({
    request: new Request("https://example.com/investor"),
    env: { ASSETS: { fetch: async (request) => { requestedPath = new URL(request.url).pathname; return new Response("shared-home"); } } },
    next: async () => new Response("ordinary-home")
  });
  assert.equal(requestedPath, "/");
  assert.equal(await response.text(), "shared-home");
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow, noarchive");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});
