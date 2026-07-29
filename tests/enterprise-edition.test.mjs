import test from "node:test";
import assert from "node:assert/strict";

import {
  ORGANIZATION_TYPES,
  ENTERPRISE_ROLES,
  ENTERPRISE_PERMISSIONS,
  ROLE_PERMISSION_MATRIX,
  addMember,
  advanceApproval,
  assignRole,
  canAccessOrganizationObject,
  createApprovalChain,
  createDepartment,
  createEnterpriseReport,
  createEnterpriseTripRequest,
  createOrganization,
  createProject,
  createSsoPreparation,
  evaluatePolicyCompliance,
  hasPermission,
  setCorporatePolicy
} from "../js/engine/enterprise/enterprise-edition.js";

function sampleOrganization() {
  let organization = createOrganization({
    organizationId: "org-kastiz",
    name: "Kastiz Global",
    type: "company",
    ownerId: "ceo",
    currency: "KRW",
    members: [
      { memberId: "manager-1", role: "manager", displayName: "Manager" },
      { memberId: "finance-1", role: "finance", displayName: "Finance" },
      { memberId: "assistant-1", role: "executive_assistant", displayName: "Assistant" },
      { memberId: "traveler-1", role: "traveler", displayName: "Traveler" },
      { memberId: "auditor-1", role: "auditor", displayName: "Auditor" }
    ]
  });
  organization = createDepartment(organization, { departmentId: "sales", name: "Sales", managerId: "manager-1" });
  organization = createProject(organization, { projectId: "jp-expansion", name: "Japan Expansion", departmentId: "sales" });
  organization = setCorporatePolicy(organization, {
    preferredAirlines: ["Korean Air", "Asiana"],
    preferredHotels: ["Hilton", "Marriott"],
    maxTravelBudget: 5000000,
    mealLimit: 80000,
    allowedCabins: ["economy", "premium_economy"]
  });
  return organization;
}

test("Enterprise Edition supports all requested organization types", () => {
  for (const type of ORGANIZATION_TYPES) {
    const organization = createOrganization({
      organizationId: `org-${type}`,
      name: `Organization ${type}`,
      type,
      ownerId: "owner"
    });
    assert.equal(organization.type, type);
    assert.equal(organization.isolationKey, `org:org-${type}`);
    assert.equal(organization.members[0].role, "owner");
    assert.equal(organization.auditLog[0].action, "organization.created");
  }
});

test("role permission matrix covers every enterprise role without granting guests admin powers", () => {
  const organization = sampleOrganization();
  for (const role of ENTERPRISE_ROLES) {
    assert.ok(Array.isArray(ROLE_PERMISSION_MATRIX[role]), `${role} must have permissions`);
  }
  for (const permission of ENTERPRISE_PERMISSIONS) {
    assert.ok(ROLE_PERMISSION_MATRIX.owner.includes(permission), `owner should include ${permission}`);
  }
  assert.equal(hasPermission(organization, "ceo", "organization.manage"), true);
  assert.equal(hasPermission(organization, "manager-1", "approval.manager_review"), true);
  assert.equal(hasPermission(organization, "finance-1", "approval.finance_review"), true);
  assert.equal(hasPermission(organization, "assistant-1", "mission.prepare"), true);
  assert.equal(hasPermission(organization, "traveler-1", "approval.final_approve"), false);

  const withGuest = addMember(organization, { memberId: "guest-1", role: "guest" });
  assert.equal(hasPermission(withGuest, "guest-1", "mission.request"), true);
  assert.equal(hasPermission(withGuest, "guest-1", "budget.manage"), false);
});

test("approval workflow follows manager, finance, ONE preparation, final approval, execution order", () => {
  const organization = sampleOrganization();
  const request = createEnterpriseTripRequest({
    requestId: "trip-001",
    organizationId: organization.organizationId,
    departmentId: "sales",
    projectId: "jp-expansion",
    travelerId: "traveler-1",
    managerId: "manager-1",
    financeReviewerId: "finance-1",
    finalApproverId: "ceo",
    estimatedCost: 4200000,
    estimatedSavings: 350000,
    currency: "KRW",
    airline: "Korean Air",
    hotel: "Hilton",
    cabin: "economy",
    mealEstimate: 50000,
    startsAt: "2026-09-01T00:00:00.000Z",
    endsAt: "2026-09-06T00:00:00.000Z",
    destination: "Tokyo"
  });
  let chain = createApprovalChain(request, organization);

  assert.deepEqual(chain.steps.map(step => step.type), [
    "manager_review",
    "finance_review",
    "one_prepares_reservation",
    "final_approval",
    "execution_ready"
  ]);

  assert.throws(
    () => advanceApproval(chain, { stepId: "trip-001:finance_review", actorId: "finance-1", decision: "approve" }, organization),
    /approval_steps_must_be_completed_in_order/
  );

  chain = advanceApproval(chain, { stepId: "trip-001:manager_review", actorId: "manager-1", decision: "approve" }, organization);
  assert.equal(chain.currentStepId, "trip-001:finance_review");
  chain = advanceApproval(chain, { stepId: "trip-001:finance_review", actorId: "finance-1", decision: "approve" }, organization);
  assert.equal(chain.currentStepId, "trip-001:one_prepares_reservation");
  chain = advanceApproval(chain, { stepId: "trip-001:one_prepares_reservation", actorId: "ONE", decision: "prepared" }, organization);
  assert.equal(chain.currentStepId, "trip-001:final_approval");
  chain = advanceApproval(chain, { stepId: "trip-001:final_approval", actorId: "ceo", decision: "approve" }, organization);
  assert.equal(chain.currentStepId, "trip-001:execution_ready");
  chain = advanceApproval(chain, { stepId: "trip-001:execution_ready", actorId: "ONE", decision: "prepared" }, organization);
  assert.equal(chain.status, "ready_for_execution");
  assert.equal(chain.currentStepId, null);
});

test("corporate policies identify violations and non-blocking preference warnings", () => {
  const organization = sampleOrganization();
  const request = createEnterpriseTripRequest({
    requestId: "trip-policy",
    organizationId: organization.organizationId,
    travelerId: "traveler-1",
    managerId: "manager-1",
    financeReviewerId: "finance-1",
    finalApproverId: "ceo",
    estimatedCost: 9000000,
    airline: "Unknown Air",
    hotel: "Independent Ryokan",
    cabin: "first",
    mealEstimate: 140000
  });
  const compliance = evaluatePolicyCompliance(request, organization);
  assert.equal(compliance.compliant, false);
  assert.deepEqual(compliance.violations.map(item => item.code).sort(), [
    "cabin_not_allowed",
    "meal_limit_exceeded",
    "travel_budget_exceeded"
  ]);
  assert.deepEqual(compliance.warnings.map(item => item.code).sort(), [
    "non_preferred_airline",
    "non_preferred_hotel"
  ]);
});

test("enterprise report summarizes travel spend, department spend, upcoming trips, savings and approval history", () => {
  const organization = sampleOrganization();
  const requestOne = createEnterpriseTripRequest({
    requestId: "trip-r1",
    organizationId: organization.organizationId,
    departmentId: "sales",
    travelerId: "traveler-1",
    managerId: "manager-1",
    financeReviewerId: "finance-1",
    finalApproverId: "ceo",
    estimatedCost: 3000000,
    estimatedSavings: 220000,
    startsAt: "2026-09-01T00:00:00.000Z"
  });
  const requestTwo = createEnterpriseTripRequest({
    requestId: "trip-r2",
    organizationId: organization.organizationId,
    departmentId: "sales",
    travelerId: "traveler-1",
    managerId: "manager-1",
    financeReviewerId: "finance-1",
    finalApproverId: "ceo",
    estimatedCost: 1500000,
    estimatedSavings: 80000,
    startsAt: "2026-08-12T00:00:00.000Z"
  });
  const chain = advanceApproval(
    createApprovalChain(requestOne, organization),
    { stepId: "trip-r1:manager_review", actorId: "manager-1", decision: "approve" },
    organization
  );
  const report = createEnterpriseReport(organization, [requestOne, requestTwo], [chain], { now: new Date("2026-08-01T00:00:00.000Z") });

  assert.equal(report.travelSpend, 4500000);
  assert.equal(report.departmentSpend.sales, 4500000);
  assert.equal(report.upcomingTrips.length, 2);
  assert.equal(report.savingsGeneratedByOne, 300000);
  assert.equal(report.approvalSummary.approved, 1);
  assert.equal(report.approvalSummary.pending, 4);
});

test("organization isolation blocks cross-organization objects", () => {
  const organization = sampleOrganization();
  const request = createEnterpriseTripRequest({
    requestId: "trip-private",
    organizationId: organization.organizationId,
    travelerId: "traveler-1",
    managerId: "manager-1",
    financeReviewerId: "finance-1",
    finalApproverId: "ceo"
  });
  assert.equal(canAccessOrganizationObject(organization, request), true);
  assert.equal(canAccessOrganizationObject(organization, { ...request, organizationId: "org-other" }), false);
  assert.equal(canAccessOrganizationObject(organization, { ...request, isolationKey: "org:other" }), false);
});

test("SSO preparation is honest and never claims live without real configuration", () => {
  const sso = createSsoPreparation({ providerType: "oidc", callbackUrl: "https://example.com/sso/callback" });
  assert.equal(sso.status, "setup_required");
  assert.equal(sso.live, false);
  assert.equal(sso.founderActionRequired, true);
  assert.ok(sso.requiredMetadata.includes("entity_id"));
});

test("member role assignment requires administrative permission", () => {
  const organization = sampleOrganization();
  assert.throws(
    () => assignRole(organization, "traveler-1", "manager", { actorId: "traveler-1" }),
    /permission_denied:member.manage/
  );
  const updated = assignRole(organization, "traveler-1", "manager", { actorId: "ceo" });
  assert.equal(updated.members.find(member => member.memberId === "traveler-1").role, "manager");
});
