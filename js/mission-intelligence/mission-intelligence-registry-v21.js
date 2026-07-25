import { loadMissionIntelligencePlaybooks } from "./mission-intelligence-loader-v21.js";
import { validateMissionPlaybookCollection, MISSION_INTELLIGENCE_VERSION } from "./mission-intelligence-validator-v21.js";

const clean = (value) => String(value ?? "").normalize("NFKC").toLowerCase().trim();
const list = (value) => Array.isArray(value) ? value : value ? [value] : [];
const rxMatch = (patterns, text) => patterns.some((pattern) => new RegExp(pattern, "i").test(text));

function domainAliases(value = "") {
  const key = clean(value).replaceAll("_", "-");
  const map = {
    travel: ["travel"],
    education: ["education"],
    healthcare: ["healthcare"],
    "home-services": ["home-services", "repair", "home_services"],
    immigration: ["government", "immigration", "foreigner_korea"],
    business: ["business", "government", "professional-service"],
    career: ["career"],
    "professional-services": ["professional-service", "professionals", "legal", "professional-services"],
    events: ["events", "entertainment"]
  };
  return map[key] || [key];
}

function domainsCompatible(left = "", right = "") {
  const leftAliases = domainAliases(left);
  const rightAliases = domainAliases(right);
  return leftAliases.some((alias) => rightAliases.includes(alias));
}

function scorePlaybook(playbook, input = {}) {
  const text = clean([
    input.mission,
    input.classification?.mission,
    input.humanReasoning?.userGoal,
    input.contextObject?.currentMission?.text
  ].filter(Boolean).join(" "));
  const providerType = clean(input.humanReasoning?.selectedMission?.type || input.classification?.providerType || input.missionObject?.providerType || "");
  const topInterpretation = clean(input.humanReasoning?.possibleInterpretations?.[0]?.type || "");
  let score = 0;
  const reasons = [];
  if (domainAliases(playbook.domain).includes(providerType)) { score += 24; reasons.push("domain fit"); }
  if (topInterpretation && domainAliases(playbook.domain).includes(topInterpretation)) { score += 18; reasons.push("reasoning domain fit"); }
  if (providerType && !domainsCompatible(playbook.domain, providerType)) { score -= 18; reasons.push("domain mismatch penalty"); }
  if (rxMatch(playbook.problemPatterns, text)) { score += 34; reasons.push("problem pattern fit"); }
  if (playbook.supportedIntents.some((intent) => text.includes(clean(intent)))) { score += 16; reasons.push("intent fit"); }
  if (playbook.supportedLanguages.includes(input.language || input.contextObject?.currentMission?.language || "en")) { score += 8; reasons.push("language supported"); }
  if (playbook.regionScope?.countries?.includes("*")) { score += 4; reasons.push("region compatible"); }
  if (input.contextObject?.understandingSignals?.length) { score += 4; reasons.push("context available"); }
  if (input.lifeMemoryContext?.entriesUsed?.length) { score += 4; reasons.push("memory available"); }
  const confidence = Math.max(0.05, Math.min(0.99, score / 90));
  return Object.freeze({ playbook, score, confidence, reasons: Object.freeze(reasons) });
}

export function createMissionIntelligenceRegistry({ playbooks = loadMissionIntelligencePlaybooks() } = {}) {
  const validation = validateMissionPlaybookCollection(playbooks);
  const byId = new Map(playbooks.map((playbook) => [playbook.playbookId, playbook]));
  return Object.freeze({
    version: MISSION_INTELLIGENCE_VERSION,
    validation,
    listPlaybooks: () => Object.freeze([...playbooks]),
    getPlaybook: (id) => byId.get(id) || null,
    select(input = {}) {
      const ranked = playbooks.map((playbook) => scorePlaybook(playbook, input)).sort((a, b) => b.score - a.score);
      const primary = ranked[0]?.score >= 30 ? ranked[0] : null;
      const compatible = primary ? ranked.filter((item) => item.score >= Math.max(30, primary.score - 12)).slice(0, 3) : [];
      const ambiguous = compatible.length > 1 && compatible[1].score >= primary.score - 4;
      return Object.freeze({
        version: MISSION_INTELLIGENCE_VERSION,
        selectedPlaybook: primary?.playbook || null,
        selectedPlaybookId: primary?.playbook.playbookId || null,
        confidence: primary?.confidence || 0,
        ambiguous,
        reasons: Object.freeze(primary?.reasons || []),
        compatiblePlaybooks: Object.freeze(compatible.map(({ playbook, score, confidence, reasons }) => Object.freeze({
          playbookId: playbook.playbookId,
          domain: playbook.domain,
          missionType: playbook.missionType,
          score,
          confidence,
          reasons
        }))),
        rejectedPlaybooks: Object.freeze(ranked.slice(compatible.length).map(({ playbook, score }) => Object.freeze({
          playbookId: playbook.playbookId,
          score,
          reason: "Lower intent/domain/region fit"
        }))),
        validation
      });
    }
  });
}

export function selectMissionPlaybook(input = {}) {
  return createMissionIntelligenceRegistry().select(input);
}

export function filterEssentialQuestions(playbook = {}, context = {}) {
  const known = new Set([
    ...Object.keys(context.knownContext || {}),
    ...Object.keys(context.contextObject || {}),
    ...list(context.lifeMemoryContext?.entriesUsed).map((entry) => entry.field)
  ].map(clean));
  const questions = list(playbook.essentialQuestions).filter((question) => {
    const q = clean(question);
    return ![...known].some((field) => field && q.includes(field));
  });
  return Object.freeze(questions.slice(0, 3));
}

export function applyPlaybookGuidanceToResolutionPlan(plan = {}, playbookSelection = {}) {
  const playbook = playbookSelection.selectedPlaybook;
  if (!playbook) return plan;
  if (plan.domain && playbook.domain && !domainsCompatible(plan.domain, playbook.domain)) {
    return Object.freeze({
      ...plan,
      missionIntelligence: Object.freeze({
        version: MISSION_INTELLIGENCE_VERSION,
        selectedPlaybookId: null,
        rejectedPlaybookId: playbook.playbookId,
        rejectionReason: "domain_mismatch",
        confidence: playbookSelection.confidence || 0,
        reasons: Object.freeze([...(playbookSelection.reasons || []), `Rejected ${playbook.domain} playbook for ${plan.domain} mission`])
      })
    });
  }
  const solutionPaths = playbook.solutionPaths.length ? playbook.solutionPaths.map((title, index) => Object.freeze({
    id: `${playbook.playbookId}-path-${index + 1}`,
    title,
    expectedOutcome: index === 0 ? playbook.outcomePatterns[0] || plan.desiredOutcome : `Alternative: ${title}`,
    requiredSteps: Object.freeze([...(playbook.actionTemplates || []), "approval review"]),
    timeSensitivity: plan.urgency || "normal",
    expectedCostRange: "estimated_or_unavailable",
    providerOrOfficialChannelRequirements: playbook.providerRequirements.join("; "),
    userEffort: index === 0 ? "low" : "medium",
    confidence: index === 0 ? 0.88 : 0.72,
    evidenceSource: "mission-intelligence-playbook",
    constraintsSatisfied: Object.freeze(["playbook-selected", "approval-first", "fallback-defined"]),
    constraintsNotSatisfied: Object.freeze(["live provider verification unavailable"]),
    risks: Object.freeze(playbook.forbiddenClaims),
    approvalBoundaries: Object.freeze(playbook.approvalBoundaries),
    fallbackRoute: playbook.fallbackRules[0]
  })) : plan.solutionPaths;
  return Object.freeze({
    ...plan,
    missionIntelligence: Object.freeze({
      version: MISSION_INTELLIGENCE_VERSION,
      selectedPlaybookId: playbook.playbookId,
      confidence: playbookSelection.confidence,
      reasons: playbookSelection.reasons
    }),
    solutionPaths: Object.freeze(solutionPaths),
    recommendedPath: solutionPaths[0] || plan.recommendedPath,
    alternativePaths: Object.freeze(solutionPaths.slice(1)),
    missingEssentialInformation: filterEssentialQuestions(playbook, { contextObject: plan.contextObject, lifeMemoryContext: plan.lifeMemoryContext }),
    providerRequiredActions: Object.freeze([...new Set([...(plan.providerRequiredActions || []), ...playbook.providerCapabilityRequirements])]),
    approvalRequiredActions: Object.freeze([...new Set([...(plan.approvalRequiredActions || []), ...playbook.approvalBoundaries])]),
    evidence: Object.freeze([...(plan.evidence || []), ...playbook.evidenceRequirements.map((item) => Object.freeze({ label: item, state: "playbook-required", source: playbook.playbookId }))]),
    dataFreshness: Object.freeze({ ...(plan.dataFreshness || {}), playbook: playbook.version, labels: playbook.dataFreshnessRequirements }),
    fallbackPlan: playbook.fallbackRules[0] || plan.fallbackPlan,
    recoveryPlan: playbook.recoveryRules[0] || plan.recoveryPlan,
    completionCriteria: Object.freeze(playbook.completionCriteria),
    nextBestAction: "Present the playbook-guided prepared solution and ask only essential decisions."
  });
}
