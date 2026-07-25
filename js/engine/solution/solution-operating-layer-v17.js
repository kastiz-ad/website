import { classifyUniversalMission } from "../universal-mission-engine-v4.js";
import { applyPlaybookGuidanceToResolutionPlan } from "../../mission-intelligence/mission-intelligence-registry-v21.js";

export const SOLUTION_OPERATING_LAYER_VERSION = "V17";

const SAFE_FLAGS = Object.freeze({
  approvalRequired: true,
  executionEnabled: false,
  externalCallsEnabled: false,
  providerContactEnabled: false,
  paymentsEnabled: false
});

const clean = (value) => String(value ?? "").normalize("NFKC").replace(/[<>]/g, "").trim().slice(0, 500);
const list = (value) => Array.isArray(value) ? value.map(clean).filter(Boolean) : value ? [clean(value)].filter(Boolean) : [];
const idText = (value) => clean(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 42) || "mission";
const includesAny = (text, patterns) => patterns.some((pattern) => pattern.test(text));

const DOMAIN_RULES = Object.freeze([
  { domain: "home-services", missionType: "plumbing", patterns: [/sink|leak|water.*leak|plumb|싱크|누수|물이\s*새|배관|수도/i] },
  { domain: "education", missionType: "education-support", patterns: [/grade|english score|academy|tutor|study|성적|영어|학원|과외|공부/i] },
  { domain: "business", missionType: "company-formation", patterns: [/company|incorporat|business registration|startup|회사|법인|사업자|창업|설립/i] },
  { domain: "healthcare", missionType: "dental-care", patterns: [/tooth|dentist|dental|이가|치과|치료|아픈데|통증/i] },
  { domain: "travel", missionType: "travel-preparation", patterns: [/trip|travel|flight|hotel|여행|출장|항공|호텔/i] },
  { domain: "career", missionType: "job-search", patterns: [/job|resume|cv|interview|career|일자리|취업|이력서|면접/i] },
  { domain: "government", missionType: "government-admin", patterns: [/passport|visa|license|permit|immigration|여권|비자|면허|민원|이민/i] },
  { domain: "professional-services", missionType: "professional-service", patterns: [/lawyer|tax|accountant|translator|interpreter|변호사|세무|회계|통역|번역/i] },
  { domain: "sports-wellness", missionType: "wellness", patterns: [/gym|pilates|yoga|swim|pt|헬스|필라테스|요가|수영|운동/i] },
  { domain: "beauty", missionType: "beauty-care", patterns: [/hair|skin|laser|beauty|salon|미용|피부|레이저|헤어|네일/i] }
]);

const DOMAIN_COPY = Object.freeze({
  "home-services": {
    outcome: "Stop damage, prepare a plumber or home-service path, and protect approval before contact.",
    target: "Leak contained and repair provider ready for approval.",
    safety: ["Turn off the nearby water valve if safe.", "Move electronics and valuables away from the leak.", "Photograph the leak for repair explanation and insurance reference."],
    paths: ["Damage-control then plumber shortlist", "Building manager or landlord escalation", "Temporary containment until approved repair"],
    required: ["Exact address can be deferred until provider approval.", "Photos help but are not required to begin."]
  },
  education: {
    outcome: "Improve the child's result through diagnosis-free study support, academy/tutor options, and a practical study plan.",
    target: "A realistic learning support plan with academy, tutor, and home-study alternatives.",
    safety: [],
    paths: ["Academy comparison", "Private tutor plan", "Four-week study routine and parent checkpoint"],
    required: ["Student grade level", "School exam goal or weak area if known"]
  },
  business: {
    outcome: "Prepare a staged company-formation path with official channels and professional help separated.",
    target: "Required documents, official channels, provider support, and approval checkpoints are clear.",
    safety: [],
    paths: ["Official registration checklist", "Tax/accounting provider preparation", "Immigration or foreign-founder document path"],
    required: ["Founder nationality or residency status may be legally material.", "Business type may change required documents."]
  },
  healthcare: {
    outcome: "Navigate care safely without diagnosis and prepare same-day provider search steps.",
    target: "Urgency level, department, documents, and provider-search preparation are clear.",
    safety: ["If pain is severe, swelling spreads, fever appears, breathing/swallowing is difficult, or bleeding cannot stop, seek emergency care immediately."],
    paths: ["Same-day clinic or dental search preparation", "Emergency escalation if red flags appear", "Pharmacy or after-hours guidance where appropriate"],
    required: ["Symptoms can be summarized at approval; ONE does not diagnose.", "Location and language preference affect provider search."]
  },
  travel: {
    outcome: "Prepare a complete travel path with flights, stays, requirements, local movement, weather, and budget dependencies.",
    target: "Trip plan ready for approval before booking or payment.",
    safety: [],
    paths: ["Balanced flight/hotel itinerary", "Budget-first alternative", "Comfort-first alternative"],
    required: ["Travel dates can be estimated if not provided.", "Passport/visa checks remain verification items."]
  },
  career: {
    outcome: "Prepare job-search execution without submitting applications before approval.",
    target: "Skills, location, visa/language constraints, resume path, and application sequence are ready.",
    safety: [],
    paths: ["Resume and profile preparation", "Job platform shortlist", "Interview and application sequence"],
    required: ["Work authorization, target role, language level, and salary range may materially change the plan."]
  },
  default: {
    outcome: "Prepare the strongest safe solution path with approval before external commitment.",
    target: "Resolution plan ready for user review.",
    safety: [],
    paths: ["Recommended prepared path", "Lower-cost alternative", "Faster alternative"],
    required: ["Only information that materially changes the solution should be asked."]
  }
});

function inferDomain({ userProblem, classification = {}, mission = {} }) {
  const text = `${userProblem} ${classification.providerType || ""} ${mission.providerType || ""}`.normalize("NFKC");
  const matched = DOMAIN_RULES.find((rule) => includesAny(text, rule.patterns));
  if (matched) return matched;
  const providerType = classification.providerType || mission.providerType || "professional-service";
  const providerMap = {
    "home-services": "home-services",
    home_services: "home-services",
    repair: "home-services",
    education: "education",
    healthcare: "healthcare",
    travel: "travel",
    government: "government",
    career: "career",
    beauty: "beauty",
    sports: "sports-wellness",
    sports_wellness: "sports-wellness",
    "professional-service": "professional-services",
    professionals: "professional-services"
  };
  const domain = providerMap[providerType] || "default";
  return { domain, missionType: providerType, patterns: [] };
}

function inferUrgency(userProblem, domain) {
  if (includesAny(userProblem, [/emergency|urgent|today|tonight|severe|pain|leak|응급|오늘|지금|너무\s*아픈|물이\s*새|누수/i])) return domain === "healthcare" ? "urgent_or_emergency_check" : "urgent";
  if (includesAny(userProblem, [/next month|deadline|renewal|다음\s*달|마감|갱신/i])) return "time_sensitive";
  return "normal";
}

function essentialMissing({ domain, contextObject = {}, userProblem }) {
  const missing = [];
  const destination = contextObject.location?.destination?.city || contextObject.travelState?.destination;
  const current = contextObject.location?.current;
  if (["home-services", "healthcare", "education", "career"].includes(domain) && !current) {
    missing.push("Location or service area");
  }
  if (domain === "travel" && !destination && !/여행|trip|travel/i.test(userProblem)) {
    missing.push("Destination");
  }
  if (domain === "business") missing.push("Founder status and business type, if available");
  if (domain === "healthcare") missing.push("Emergency red flags and preferred care area");
  return Object.freeze([...new Set(missing)].slice(0, 4));
}

function evidenceFor(domain, state = {}) {
  return Object.freeze([
    { label: "Mission classification", state: "estimated", source: state.classification?.confidence || "rule-supported" },
    { label: "Context object", state: state.contextObject?.version ? "cached" : "unavailable", source: state.contextObject?.version || null },
    { label: "Life memory", state: state.lifeMemoryContext?.enabled ? "cached" : "unavailable", source: state.lifeMemoryContext?.version || null },
    { label: "Provider availability", state: "unavailable", source: "No live provider call in prototype" },
    { label: `${domain} domain policy`, state: "fallback", source: SOLUTION_OPERATING_LAYER_VERSION }
  ]);
}

function buildSolutionPath({ id, title, domain, outcome, steps, priority = 1, evidenceState = "estimated" }) {
  return Object.freeze({
    id,
    title,
    expectedOutcome: outcome,
    requiredSteps: Object.freeze(steps.map(clean)),
    timeSensitivity: priority === 1 ? "highest" : "normal",
    expectedCostRange: "estimated_or_unavailable",
    providerOrOfficialChannelRequirements: domain === "business" || domain === "government"
      ? "Official channel required for regulated steps; professionals may support preparation."
      : "Provider required only after explicit approval.",
    userEffort: priority === 1 ? "low_to_medium" : "medium",
    confidence: priority === 1 ? 0.82 : 0.68,
    evidenceSource: evidenceState,
    constraintsSatisfied: Object.freeze(["approval-first", "no external execution", "fallback available"]),
    constraintsNotSatisfied: Object.freeze(["live provider availability not verified", "final prices not verified"]),
    risks: Object.freeze(["Availability, eligibility, price, and official requirements must be verified before execution."]),
    approvalBoundaries: Object.freeze(["No booking", "No payment", "No provider contact", "No submission", "No signature"]),
    fallbackRoute: "Use fallback provider/category path or ask one essential decision at approval review."
  });
}

function solutionPathsFor(domain, copy) {
  const baseSteps = {
    "home-services": ["Contain damage", "Prepare repair request", "Compare safe provider routes", "Wait for approval before contact"],
    education: ["Clarify target outcome", "Compare academy/tutor/study-plan paths", "Prepare shortlist", "Ask only essential learning constraints"],
    business: ["Separate official requirements from provider help", "Prepare document checklist", "Stage approvals by commitment level", "Verify through official channel"],
    healthcare: ["Check urgency and red flags", "Prepare same-day provider search", "List documents/insurance/language needs", "Escalate to emergency if warranted"],
    travel: ["Confirm dates and destination", "Prepare flights/stays/local movement", "Check requirements/weather/budget", "Wait for approval before booking"],
    career: ["Map skills and constraints", "Prepare resume/profile path", "Shortlist job channels", "Approval before applications"],
    default: ["Understand outcome", "Prepare safest path", "Identify essential decisions", "Approval before external action"]
  };
  return Object.freeze(copy.paths.map((path, index) => buildSolutionPath({
    id: `${domain}-path-${index + 1}`,
    title: path,
    domain,
    outcome: index === 0 ? copy.outcome : `Alternative route: ${path}`,
    steps: baseSteps[domain] || baseSteps.default,
    priority: index + 1,
    evidenceState: index === 0 ? "estimated" : "fallback"
  })));
}

function completionCriteriaFor(domain) {
  const common = ["User reviewed the prepared solution", "All approval-required actions are explicit", "No external commitment happened before approval"];
  const domainSpecific = {
    "home-services": ["Damage-control step completed or provider repair path approved"],
    education: ["Learning support path selected and next study action prepared"],
    business: ["Official checklist and provider-support path are separated"],
    healthcare: ["Urgency route selected without diagnosis"],
    travel: ["Trip components ready for final provider verification"],
    career: ["Resume/application path ready for approval"]
  };
  return Object.freeze([...(domainSpecific[domain] || ["Resolution path selected"]), ...common]);
}

export function buildResolutionPlan(input = {}) {
  const userProblem = clean(input.userProblem || input.mission || input.classification?.mission || input.missionObject?.classification?.mission);
  const classification = input.classification || input.missionObject?.classification || classifyUniversalMission(userProblem);
  const domainInfo = inferDomain({ userProblem, classification, mission: input.missionObject });
  const domain = domainInfo.domain;
  const copy = DOMAIN_COPY[domain] || DOMAIN_COPY.default;
  const urgency = inferUrgency(userProblem, domain);
  const missingEssentialInformation = essentialMissing({ domain, contextObject: input.contextObject, userProblem });
  const solutionPaths = solutionPathsFor(domain, copy);
  const recommendedPath = solutionPaths[0];
  const alternativePaths = Object.freeze(solutionPaths.slice(1));
  const immediateSafetyActions = Object.freeze(copy.safety.map(clean));
  const preparedActions = Object.freeze([
    "Structured the desired outcome",
    "Prepared possible solution paths",
    "Separated provider/official/user-required actions",
    "Kept approval-required actions blocked"
  ]);
  const approvalRequiredActions = Object.freeze([
    "provider contact",
    "booking",
    "purchase",
    "payment",
    "application submission",
    "signature",
    "regulated transaction"
  ]);
  const providerRequiredActions = Object.freeze(domain === "travel"
    ? ["flight booking", "hotel booking", "transport booking"]
    : domain === "healthcare"
      ? ["appointment confirmation", "care-provider availability check"]
      : domain === "business" || domain === "government"
        ? ["official filing or certified professional support"]
        : ["provider availability confirmation"]);
  const authenticationRequiredActions = Object.freeze(domain === "government" || domain === "business"
    ? ["official portal login may be required after approval"]
    : []);
  const userRequiredActions = Object.freeze(missingEssentialInformation.length
    ? missingEssentialInformation
    : ["Review the recommended path", "Approve or revise before external action"]);
  const risks = Object.freeze([
    "Live availability is not verified in this prototype.",
    "Prices, eligibility, and regulated requirements must be confirmed through providers or official channels.",
    domain === "healthcare" ? "ONE does not diagnose or replace emergency care." : null,
    domain === "business" ? "ONE does not provide legal certainty; official or professional review may be required." : null
  ].filter(Boolean));

  const plan = Object.freeze({
    version: SOLUTION_OPERATING_LAYER_VERSION,
    resolutionId: `resolution-${idText(userProblem)}`,
    missionId: clean(input.missionObject?.id || input.missionId || `mission-${idText(userProblem)}`),
    userProblem,
    desiredOutcome: copy.outcome,
    currentState: "problem_understood_and_not_executed",
    targetState: copy.target,
    urgency,
    confidence: missingEssentialInformation.length ? 0.72 : 0.84,
    domain,
    missionType: domainInfo.missionType,
    knownConstraints: Object.freeze([
      ...(input.contextObject?.understandingSignals || []),
      ...(input.lifeMemoryContext?.entriesUsed || []).map((entry) => `${entry.domain}.${entry.field}: ${entry.value}`)
    ].map(clean).filter(Boolean).slice(0, 10)),
    inferredConstraints: Object.freeze([
      urgency !== "normal" ? `Urgency inferred: ${urgency}` : null,
      `Domain inferred: ${domain}`,
      "Conversation should remain minimal"
    ].filter(Boolean)),
    missingEssentialInformation,
    solutionPaths,
    recommendedPath,
    alternativePaths,
    rejectedPaths: Object.freeze([
      "Direct external execution before approval",
      "Unverified live provider claims",
      "Generic answer-only response"
    ]),
    rejectionReasons: Object.freeze({
      "Direct external execution before approval": "Approval-first architecture forbids commitment before explicit approval.",
      "Unverified live provider claims": "Prototype cannot fabricate availability, price, or ranking.",
      "Generic answer-only response": "ONE must prepare a resolution plan, not merely answer."
    }),
    immediateSafetyActions,
    preparedActions,
    approvalRequiredActions,
    authenticationRequiredActions,
    providerRequiredActions,
    userRequiredActions,
    estimatedSequence: Object.freeze([
      "Understand desired outcome",
      "Apply memory/context/prior mission signals",
      "Prepare resolution paths",
      "Verify missing essential decisions",
      "Review approval-required actions",
      "Prepare provider/official handoff only after approval",
      "Monitor and recover if a provider/path fails"
    ]),
    dependencies: Object.freeze([
      "Mission classification",
      "Context object",
      "Provider or official verification before commitment",
      "Explicit user approval"
    ]),
    risks,
    evidence: evidenceFor(domain, input),
    dataFreshness: Object.freeze({
      classification: "current-request",
      context: input.contextObject?.time?.iso || "unknown",
      providerAvailability: "unavailable",
      prices: "unavailable",
      officialRequirements: "unavailable"
    }),
    fallbackPlan: "If the recommended path fails, use the highest-confidence alternative path and re-check approval boundaries.",
    recoveryPlan: "If provider, official channel, price, or eligibility verification fails, return to approval review with alternatives instead of executing.",
    completionCriteria: completionCriteriaFor(domain),
    currentStatus: "prepared_for_review",
    nextBestAction: missingEssentialInformation.length
      ? `Ask only essential bundled decision(s): ${missingEssentialInformation.join("; ")}`
      : "Show prepared solution and request approval or revision.",
    ...SAFE_FLAGS
  });
  return input.missionIntelligence?.selectedPlaybook
    ? applyPlaybookGuidanceToResolutionPlan(plan, input.missionIntelligence)
    : plan;
}

export function summarizeResolutionPlan(plan = {}) {
  return Object.freeze({
    version: plan.version || SOLUTION_OPERATING_LAYER_VERSION,
    resolutionId: plan.resolutionId,
    domain: plan.domain,
    desiredOutcome: plan.desiredOutcome,
    recommendedPath: plan.recommendedPath?.title || "",
    approvalRequiredActions: list(plan.approvalRequiredActions),
    nextBestAction: plan.nextBestAction,
    executionEnabled: false
  });
}
