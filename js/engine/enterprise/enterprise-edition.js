export const ENTERPRISE_EDITION_VERSION = "20260730-enterprise-edition-v1";

export const ORGANIZATION_TYPES = Object.freeze([
  "company",
  "team",
  "department",
  "executive_office",
  "travel_management",
  "family_account",
  "university",
  "government_organization"
]);

export const ENTERPRISE_ROLES = Object.freeze([
  "owner",
  "administrator",
  "manager",
  "executive_assistant",
  "traveler",
  "finance",
  "auditor",
  "guest"
]);

export const ENTERPRISE_PERMISSIONS = Object.freeze([
  "organization.manage",
  "member.invite",
  "member.manage",
  "department.manage",
  "project.manage",
  "mission.request",
  "mission.prepare",
  "travel.request",
  "approval.manager_review",
  "approval.finance_review",
  "approval.final_approve",
  "approval.audit",
  "budget.view",
  "budget.manage",
  "policy.manage",
  "report.view",
  "audit.view",
  "sso.configure"
]);

const ALL_PERMISSIONS = [...ENTERPRISE_PERMISSIONS];

export const ROLE_PERMISSION_MATRIX = Object.freeze({
  owner: Object.freeze(ALL_PERMISSIONS),
  administrator: Object.freeze(ALL_PERMISSIONS.filter(permission => permission !== "approval.final_approve")),
  manager: Object.freeze([
    "member.invite",
    "project.manage",
    "mission.request",
    "mission.prepare",
    "travel.request",
    "approval.manager_review",
    "budget.view",
    "report.view"
  ]),
  executive_assistant: Object.freeze([
    "mission.request",
    "mission.prepare",
    "travel.request",
    "budget.view"
  ]),
  traveler: Object.freeze([
    "mission.request",
    "travel.request"
  ]),
  finance: Object.freeze([
    "mission.prepare",
    "approval.finance_review",
    "budget.view",
    "budget.manage",
    "policy.manage",
    "report.view",
    "audit.view"
  ]),
  auditor: Object.freeze([
    "approval.audit",
    "budget.view",
    "report.view",
    "audit.view"
  ]),
  guest: Object.freeze([
    "mission.request"
  ])
});

export const APPROVAL_STEP_TYPES = Object.freeze({
  MANAGER_REVIEW: "manager_review",
  FINANCE_REVIEW: "finance_review",
  ONE_PREPARES_RESERVATION: "one_prepares_reservation",
  FINAL_APPROVAL: "final_approval",
  EXECUTION_READY: "execution_ready"
});

export const APPROVAL_STEP_STATUSES = Object.freeze([
  "pending",
  "approved",
  "rejected",
  "changes_requested",
  "system_prepared",
  "blocked"
]);

const SYSTEM_ACTOR = "ONE";
const isoNow = (now = new Date()) => new Date(now).toISOString();
const freezeArray = value => Object.freeze((Array.isArray(value) ? value : []).map(item => Object.freeze({ ...item })));
const normalizeCurrency = currency => String(currency || "USD").trim().toUpperCase();
const normalizeRole = role => ENTERPRISE_ROLES.includes(role) ? role : "guest";
const normalizeOrgType = type => ORGANIZATION_TYPES.includes(type) ? type : "company";
const includesIgnoreCase = (list = [], value) => list.map(item => String(item).toLowerCase()).includes(String(value || "").toLowerCase());
const sum = values => values.reduce((total, value) => total + (Number(value) || 0), 0);

export function createAuditEvent({
  organizationId,
  actorId = SYSTEM_ACTOR,
  action,
  result = "recorded",
  targetId = null,
  metadata = {},
  at = isoNow()
} = {}) {
  if (!organizationId) throw new Error("audit_requires_organization_id");
  if (!action) throw new Error("audit_requires_action");
  return Object.freeze({
    auditId: `audit:${organizationId}:${at}:${action}`,
    organizationId,
    actorId,
    action,
    result,
    targetId,
    metadata: Object.freeze({ ...metadata }),
    timestamp: at
  });
}

export function createOrganization({
  organizationId,
  name,
  type = "company",
  ownerId,
  country = null,
  currency = "USD",
  members = [],
  departments = [],
  projects = [],
  budgets = {},
  policies = {},
  sso = {}
} = {}) {
  if (!organizationId) throw new Error("organization_requires_id");
  if (!name) throw new Error("organization_requires_name");
  if (!ownerId) throw new Error("organization_requires_owner");

  const owner = {
    memberId: ownerId,
    userId: ownerId,
    displayName: "Owner",
    role: "owner",
    status: "active",
    departmentId: null
  };
  const normalizedMembers = [
    owner,
    ...members
      .filter(member => (member.memberId || member.userId) !== ownerId)
      .map(member => ({
        memberId: member.memberId || member.userId,
        userId: member.userId || member.memberId,
        displayName: member.displayName || member.name || member.userId || member.memberId,
        role: normalizeRole(member.role),
        status: member.status || "active",
        departmentId: member.departmentId || null
      }))
  ];

  const organization = {
    version: ENTERPRISE_EDITION_VERSION,
    organizationId,
    isolationKey: `org:${organizationId}`,
    name,
    type: normalizeOrgType(type),
    ownerId,
    country,
    currency: normalizeCurrency(currency),
    members: freezeArray(normalizedMembers),
    departments: freezeArray(departments),
    projects: freezeArray(projects),
    budgets: Object.freeze({ ...budgets }),
    policies: Object.freeze({
      preferredAirlines: Object.freeze(policies.preferredAirlines || []),
      preferredHotels: Object.freeze(policies.preferredHotels || []),
      maxTravelBudget: policies.maxTravelBudget ?? null,
      mealLimit: policies.mealLimit ?? null,
      allowedCabins: Object.freeze(policies.allowedCabins || ["economy", "premium_economy", "business"]),
      complianceRules: Object.freeze(policies.complianceRules || [])
    }),
    sso: Object.freeze({
      status: sso.status || "not_configured",
      providerType: sso.providerType || null,
      setupRequired: sso.status !== "connected",
      live: sso.status === "connected" && sso.authenticated === true,
      metadata: Object.freeze({ ...(sso.metadata || {}) })
    }),
    auditLog: Object.freeze([
      createAuditEvent({
        organizationId,
        actorId: ownerId,
        action: "organization.created",
        result: "success",
        targetId: organizationId
      })
    ])
  };

  return Object.freeze(organization);
}

function withAudit(organization, auditEvent, changes = {}) {
  return Object.freeze({
    ...organization,
    ...changes,
    auditLog: Object.freeze([
      ...organization.auditLog,
      auditEvent
    ])
  });
}

export function addMember(organization, member = {}, { actorId = organization.ownerId } = {}) {
  if (!hasPermission(organization, actorId, "member.invite")) throw new Error("permission_denied:member.invite");
  const memberId = member.memberId || member.userId;
  if (!memberId) throw new Error("member_requires_id");
  if (organization.members.some(existing => existing.memberId === memberId)) throw new Error("member_already_exists");
  const nextMember = Object.freeze({
    memberId,
    userId: member.userId || memberId,
    displayName: member.displayName || member.name || memberId,
    role: normalizeRole(member.role),
    status: member.status || "active",
    departmentId: member.departmentId || null
  });
  return withAudit(
    organization,
    createAuditEvent({ organizationId: organization.organizationId, actorId, action: "member.added", result: "success", targetId: memberId }),
    { members: Object.freeze([...organization.members, nextMember]) }
  );
}

export function assignRole(organization, memberId, role, { actorId = organization.ownerId } = {}) {
  if (!hasPermission(organization, actorId, "member.manage")) throw new Error("permission_denied:member.manage");
  if (!ENTERPRISE_ROLES.includes(role)) throw new Error("unknown_enterprise_role");
  let found = false;
  const members = organization.members.map(member => {
    if (member.memberId !== memberId) return member;
    found = true;
    return Object.freeze({ ...member, role });
  });
  if (!found) throw new Error("member_not_found");
  return withAudit(
    organization,
    createAuditEvent({ organizationId: organization.organizationId, actorId, action: "member.role_assigned", result: "success", targetId: memberId, metadata: { role } }),
    { members: Object.freeze(members) }
  );
}

export function hasPermission(organization, memberId, permission) {
  if (!ENTERPRISE_PERMISSIONS.includes(permission)) return false;
  const member = organization.members.find(item => item.memberId === memberId && item.status === "active");
  if (!member) return false;
  return ROLE_PERMISSION_MATRIX[member.role]?.includes(permission) === true;
}

export function createDepartment(organization, { departmentId, name, managerId = null, budgetId = null } = {}, { actorId = organization.ownerId } = {}) {
  if (!hasPermission(organization, actorId, "department.manage")) throw new Error("permission_denied:department.manage");
  if (!departmentId || !name) throw new Error("department_requires_id_and_name");
  const department = Object.freeze({ departmentId, organizationId: organization.organizationId, name, managerId, budgetId });
  return withAudit(
    organization,
    createAuditEvent({ organizationId: organization.organizationId, actorId, action: "department.created", result: "success", targetId: departmentId }),
    { departments: Object.freeze([...organization.departments, department]) }
  );
}

export function createProject(organization, { projectId, name, departmentId = null, budgetId = null, startsAt = null, endsAt = null } = {}, { actorId = organization.ownerId } = {}) {
  if (!hasPermission(organization, actorId, "project.manage")) throw new Error("permission_denied:project.manage");
  if (!projectId || !name) throw new Error("project_requires_id_and_name");
  const project = Object.freeze({ projectId, organizationId: organization.organizationId, name, departmentId, budgetId, startsAt, endsAt });
  return withAudit(
    organization,
    createAuditEvent({ organizationId: organization.organizationId, actorId, action: "project.created", result: "success", targetId: projectId }),
    { projects: Object.freeze([...organization.projects, project]) }
  );
}

export function setCorporatePolicy(organization, policyPatch = {}, { actorId = organization.ownerId } = {}) {
  if (!hasPermission(organization, actorId, "policy.manage")) throw new Error("permission_denied:policy.manage");
  const policies = Object.freeze({
    ...organization.policies,
    ...policyPatch,
    preferredAirlines: Object.freeze(policyPatch.preferredAirlines || organization.policies.preferredAirlines || []),
    preferredHotels: Object.freeze(policyPatch.preferredHotels || organization.policies.preferredHotels || []),
    allowedCabins: Object.freeze(policyPatch.allowedCabins || organization.policies.allowedCabins || []),
    complianceRules: Object.freeze(policyPatch.complianceRules || organization.policies.complianceRules || [])
  });
  return withAudit(
    organization,
    createAuditEvent({ organizationId: organization.organizationId, actorId, action: "policy.updated", result: "success", targetId: organization.organizationId }),
    { policies }
  );
}

export function createEnterpriseTripRequest({
  requestId,
  organizationId,
  departmentId = null,
  projectId = null,
  travelerId,
  managerId,
  financeReviewerId,
  finalApproverId,
  estimatedCost = 0,
  estimatedSavings = 0,
  currency = "USD",
  airline = null,
  hotel = null,
  cabin = "economy",
  mealEstimate = 0,
  startsAt = null,
  endsAt = null,
  destination = null,
  purpose = "business_travel"
} = {}) {
  if (!requestId || !organizationId || !travelerId) throw new Error("trip_request_requires_core_ids");
  return Object.freeze({
    requestId,
    organizationId,
    isolationKey: `org:${organizationId}`,
    departmentId,
    projectId,
    travelerId,
    managerId,
    financeReviewerId,
    finalApproverId,
    estimatedCost: Number(estimatedCost) || 0,
    estimatedSavings: Number(estimatedSavings) || 0,
    currency: normalizeCurrency(currency),
    airline,
    hotel,
    cabin,
    mealEstimate: Number(mealEstimate) || 0,
    startsAt,
    endsAt,
    destination,
    purpose,
    status: "requested"
  });
}

export function evaluatePolicyCompliance(request = {}, organization = {}) {
  const policies = organization.policies || {};
  const violations = [];
  const warnings = [];

  if (policies.maxTravelBudget !== null && policies.maxTravelBudget !== undefined && Number(request.estimatedCost) > Number(policies.maxTravelBudget)) {
    violations.push({ code: "travel_budget_exceeded", message: "Estimated trip cost exceeds organization travel budget." });
  }
  if (policies.mealLimit !== null && policies.mealLimit !== undefined && Number(request.mealEstimate) > Number(policies.mealLimit)) {
    violations.push({ code: "meal_limit_exceeded", message: "Estimated meal cost exceeds organization meal limit." });
  }
  if (request.cabin && policies.allowedCabins?.length && !includesIgnoreCase(policies.allowedCabins, request.cabin)) {
    violations.push({ code: "cabin_not_allowed", message: "Selected cabin is outside corporate policy." });
  }
  if (request.airline && policies.preferredAirlines?.length && !includesIgnoreCase(policies.preferredAirlines, request.airline)) {
    warnings.push({ code: "non_preferred_airline", message: "Airline is not in the preferred airline policy." });
  }
  if (request.hotel && policies.preferredHotels?.length && !includesIgnoreCase(policies.preferredHotels, request.hotel)) {
    warnings.push({ code: "non_preferred_hotel", message: "Hotel is not in the preferred hotel policy." });
  }

  return Object.freeze({
    compliant: violations.length === 0,
    violations: freezeArray(violations),
    warnings: freezeArray(warnings),
    evaluatedAt: isoNow()
  });
}

export function createApprovalChain(request = {}, organization = {}) {
  if (!request.requestId || !request.organizationId) throw new Error("approval_chain_requires_request");
  if (request.organizationId !== organization.organizationId) throw new Error("cross_organization_approval_chain_blocked");
  const compliance = evaluatePolicyCompliance(request, organization);
  const steps = [
    {
      stepId: `${request.requestId}:manager_review`,
      type: APPROVAL_STEP_TYPES.MANAGER_REVIEW,
      label: "Manager review",
      assignedTo: request.managerId,
      requiredPermission: "approval.manager_review",
      status: "pending"
    },
    {
      stepId: `${request.requestId}:finance_review`,
      type: APPROVAL_STEP_TYPES.FINANCE_REVIEW,
      label: "Finance review",
      assignedTo: request.financeReviewerId,
      requiredPermission: "approval.finance_review",
      status: "pending"
    },
    {
      stepId: `${request.requestId}:one_prepares_reservation`,
      type: APPROVAL_STEP_TYPES.ONE_PREPARES_RESERVATION,
      label: "ONE prepares reservation",
      assignedTo: SYSTEM_ACTOR,
      requiredPermission: null,
      status: "pending"
    },
    {
      stepId: `${request.requestId}:final_approval`,
      type: APPROVAL_STEP_TYPES.FINAL_APPROVAL,
      label: "Final approval",
      assignedTo: request.finalApproverId,
      requiredPermission: "approval.final_approve",
      status: "pending"
    },
    {
      stepId: `${request.requestId}:execution_ready`,
      type: APPROVAL_STEP_TYPES.EXECUTION_READY,
      label: "Execution ready",
      assignedTo: SYSTEM_ACTOR,
      requiredPermission: null,
      status: "pending"
    }
  ];

  return Object.freeze({
    chainId: `chain:${request.requestId}`,
    organizationId: request.organizationId,
    isolationKey: request.isolationKey,
    requestId: request.requestId,
    currentStepId: steps[0].stepId,
    status: compliance.compliant ? "waiting_for_manager" : "policy_exception_review_required",
    policyCompliance: compliance,
    steps: freezeArray(steps),
    auditLog: Object.freeze([
      createAuditEvent({
        organizationId: request.organizationId,
        actorId: request.travelerId,
        action: "approval_chain.created",
        result: "success",
        targetId: request.requestId,
        metadata: { compliant: compliance.compliant }
      })
    ])
  });
}

const decisionToStatus = decision => {
  if (decision === "approve" || decision === "approved") return "approved";
  if (decision === "reject" || decision === "rejected") return "rejected";
  if (decision === "request_changes" || decision === "changes_requested") return "changes_requested";
  if (decision === "prepared" || decision === "system_prepared") return "system_prepared";
  throw new Error("unknown_approval_decision");
};

export function advanceApproval(chain = {}, { stepId, actorId, decision = "approve", note = null, at = isoNow() } = {}, organization = {}) {
  const activeStepId = chain.currentStepId;
  if (stepId !== activeStepId) throw new Error("approval_steps_must_be_completed_in_order");
  const step = chain.steps.find(item => item.stepId === stepId);
  if (!step) throw new Error("approval_step_not_found");

  const status = decisionToStatus(decision);
  if (step.assignedTo === SYSTEM_ACTOR) {
    if (actorId !== SYSTEM_ACTOR) throw new Error("system_step_requires_one_actor");
  } else if (!hasPermission(organization, actorId, step.requiredPermission)) {
    throw new Error(`permission_denied:${step.requiredPermission}`);
  }

  const updatedSteps = chain.steps.map(item => item.stepId === stepId ? Object.freeze({
    ...item,
    status,
    decidedBy: actorId,
    decidedAt: at,
    note
  }) : item);
  const currentIndex = chain.steps.findIndex(item => item.stepId === stepId);
  const terminal = ["rejected", "changes_requested"].includes(status);
  const nextStep = terminal ? null : updatedSteps[currentIndex + 1] || null;
  const nextStatus = terminal
    ? status
    : nextStep
      ? `waiting_for_${nextStep.type}`
      : "ready_for_execution";

  return Object.freeze({
    ...chain,
    status: nextStatus,
    currentStepId: nextStep?.stepId || null,
    steps: Object.freeze(updatedSteps),
    auditLog: Object.freeze([
      ...chain.auditLog,
      createAuditEvent({
        organizationId: chain.organizationId,
        actorId,
        action: `approval.${step.type}`,
        result: status,
        targetId: stepId,
        metadata: { note }
      })
    ])
  });
}

export function createEnterpriseReport(organization = {}, requests = [], approvalChains = [], { now = new Date() } = {}) {
  const scopedRequests = requests.filter(request => request.organizationId === organization.organizationId);
  const scopedChains = approvalChains.filter(chain => chain.organizationId === organization.organizationId);
  const upcomingTrips = scopedRequests.filter(request => request.startsAt && new Date(request.startsAt).getTime() >= new Date(now).getTime());
  const departmentSpend = scopedRequests.reduce((all, request) => {
    const key = request.departmentId || "unassigned";
    all[key] = (all[key] || 0) + (Number(request.estimatedCost) || 0);
    return all;
  }, {});
  const approvalHistory = scopedChains.flatMap(chain => chain.steps.map(step => ({
    chainId: chain.chainId,
    requestId: chain.requestId,
    stepType: step.type,
    status: step.status,
    decidedBy: step.decidedBy || null,
    decidedAt: step.decidedAt || null
  })));

  return Object.freeze({
    organizationId: organization.organizationId,
    currency: organization.currency || "USD",
    travelSpend: sum(scopedRequests.map(request => request.estimatedCost)),
    departmentSpend: Object.freeze(departmentSpend),
    upcomingTrips: freezeArray(upcomingTrips),
    savingsGeneratedByOne: sum(scopedRequests.map(request => request.estimatedSavings)),
    approvalHistory: freezeArray(approvalHistory),
    approvalSummary: Object.freeze(approvalHistory.reduce((all, item) => {
      all[item.status] = (all[item.status] || 0) + 1;
      return all;
    }, {})),
    generatedAt: isoNow(now)
  });
}

export function canAccessOrganizationObject(organization = {}, object = {}) {
  return Boolean(
    organization.organizationId &&
    object.organizationId === organization.organizationId &&
    (!object.isolationKey || object.isolationKey === organization.isolationKey)
  );
}

export function createSsoPreparation({
  providerType = "saml",
  requiredMetadata = ["entity_id", "sso_url", "x509_certificate"],
  callbackUrl = null,
  domainVerification = "required"
} = {}) {
  return Object.freeze({
    status: "setup_required",
    live: false,
    providerType,
    requiredMetadata: Object.freeze([...requiredMetadata]),
    callbackUrl,
    domainVerification,
    founderActionRequired: true,
    message: "SSO is prepared architecturally, but not connected until the organization configures and verifies its identity provider."
  });
}

export function enterpriseRoadmap() {
  return Object.freeze([
    "Connect verified identity providers for SAML/OIDC SSO.",
    "Add SCIM provisioning after SSO metadata is configured.",
    "Connect live expense, HRIS, travel, and procurement providers through the Provider SDK.",
    "Add region-specific compliance policy packs.",
    "Expose organization admin UI after founder approval."
  ]);
}
