export const MISSION_INTELLIGENCE_VERSION = "V21";

export const REQUIRED_PLAYBOOK_FIELDS = Object.freeze([
  "playbookId","version","domain","missionType","supportedIntents","supportedLanguages","regionScope",
  "problemPatterns","outcomePatterns","prerequisites","knownContextFields","optionalContextFields",
  "essentialQuestions","questionsToAvoid","urgencyRules","safetyRules","officialSourceRequirements",
  "providerRequirements","providerCapabilityRequirements","solutionPaths","recommendedDefaultPath",
  "alternativePaths","dependencies","actionTemplates","approvalBoundaries","authenticationBoundaries",
  "evidenceRequirements","dataFreshnessRequirements","fallbackRules","recoveryRules","completionCriteria",
  "userEffortReductionRules","responseCompressionRules","forbiddenClaims","benchmarkScenarios","maintenanceMetadata"
]);

const UNSAFE_FIELD = /(full.?card|cvv|cvc|bank.?password|brokerage|account.?password|provider.?password|otp|one.?time|raw.?authentication|unrestricted.?token|resident.?registration|secret|private.?key)/i;
const BEST_CLAIM = /\bbest\b|최고|가장\s*좋은|mejor/i;

const arr = (value) => Array.isArray(value) ? value : [];
const text = (value) => JSON.stringify(value ?? "");

export function validateMissionPlaybook(playbook = {}) {
  const errors = [];
  for (const field of REQUIRED_PLAYBOOK_FIELDS) {
    if (!(field in playbook)) errors.push(`missing:${field}`);
  }
  if (!arr(playbook.completionCriteria).length) errors.push("missing_completion_criteria");
  if (!arr(playbook.approvalBoundaries).length) errors.push("missing_approval_boundaries");
  if (!arr(playbook.fallbackRules).length) errors.push("missing_fallback_rules");
  if (!arr(playbook.providerCapabilityRequirements).length) errors.push("missing_provider_capability_requirements");
  if (!arr(playbook.evidenceRequirements).length) errors.push("missing_evidence_rules");
  if (!arr(playbook.dataFreshnessRequirements).length) errors.push("missing_data_freshness_labels");
  if (!arr(playbook.recoveryRules).length) errors.push("missing_recovery_logic");
  if (!playbook.regionScope || !arr(playbook.regionScope.levels).length) errors.push("missing_region_scope");
  if (arr(playbook.essentialQuestions).length > 4) errors.push("excessive_required_questions");
  if (UNSAFE_FIELD.test(text(playbook.essentialQuestions)) || UNSAFE_FIELD.test(text(playbook.actionTemplates))) errors.push("unsafe_credential_request");
  if (BEST_CLAIM.test(text(playbook.solutionPaths)) && !/evidence|verified|source/i.test(text(playbook.evidenceRequirements))) errors.push("unsupported_best_claim");
  const forbidden = text(playbook.forbiddenClaims);
  if (!/availability|price|ranking|requirement|diagnosis|legal/i.test(forbidden)) errors.push("weak_forbidden_claims");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), playbookId: playbook.playbookId || null });
}

export function validateMissionPlaybookCollection(playbooks = []) {
  const seen = new Set();
  const duplicateIds = [];
  const results = playbooks.map((playbook) => {
    if (seen.has(playbook.playbookId)) duplicateIds.push(playbook.playbookId);
    seen.add(playbook.playbookId);
    return validateMissionPlaybook(playbook);
  });
  const errors = [
    ...results.flatMap((result) => result.errors.map((error) => `${result.playbookId}:${error}`)),
    ...duplicateIds.map((id) => `duplicate_playbook_id:${id}`)
  ];
  return Object.freeze({
    valid: errors.length === 0,
    count: playbooks.length,
    duplicateIds: Object.freeze(duplicateIds),
    errors: Object.freeze(errors),
    results: Object.freeze(results)
  });
}

export function assertValidMissionPlaybooks(playbooks = []) {
  const validation = validateMissionPlaybookCollection(playbooks);
  if (!validation.valid) throw new Error(`invalid_mission_playbooks:${validation.errors.join(",")}`);
  return validation;
}
